"""
Evidence Vault & Provenance DAG Engine.
Manages RFC-8785 canonical hashing, dual-layer DAG binding, Redis persistence,
and tamper-evident integrity verification under Section 63 BSA.
"""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from redis.asyncio import Redis

from app.blockchain.models import EvidenceItem, EvidenceTier, IntegrityVerificationResult, TraceResult
from app.core.canonical_hasher import (
    compute_content_hash,
    compute_chain_hash,
    compute_genesis_hash,
    canonicalize_rfc8785,
)
from app.core.redis_keys import (
    evidence_key,
    evidence_list_key,
    evidence_head_key,
    evidence_dag_key,
)

logger = logging.getLogger(__name__)


class EvidenceVault:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def append_evidence(
        self,
        case_id: str,
        tier: EvidenceTier,
        title: str,
        description: str,
        payload: Dict[str, Any],
        trace_id: Optional[str] = None,
        parent_evidence_ids: Optional[List[str]] = None,
        actor_id: str = "SYSTEM",
        timestamp: Optional[datetime] = None,
    ) -> EvidenceItem:
        """
        Append a new evidence item to the case's dual-layer hash chain.
        1. Resolves parent evidence hashes to bind the causal DAG.
        2. Computes content_hash = SHA256(canonical(payload + parent_hashes)).
        3. Computes chain_hash = SHA256(prev_chain_hash + content_hash + ts + actor).
        4. Persists atomically to Redis.
        """
        ts = timestamp or datetime.utcnow()
        parents = parent_evidence_ids or []

        # 1. Resolve parent hashes
        parent_hashes: List[str] = []
        for pid in parents:
            parent_raw = await self.redis.get(evidence_key(case_id, pid))
            if parent_raw:
                p_item = EvidenceItem.model_validate_json(parent_raw)
                parent_hashes.append(p_item.content_hash)

        # 2. Get current list length to assign sequence number
        list_k = evidence_list_key(case_id)
        current_count = await self.redis.llen(list_k)
        seq_num = current_count + 1
        evidence_id = f"EVID-{seq_num:04d}"

        # 3. Retrieve current head of chain (or compute genesis if first record)
        head_k = evidence_head_key(case_id)
        current_head = await self.redis.get(head_k)
        if not current_head:
            prev_hash = compute_genesis_hash(case_id)
        else:
            prev_hash = current_head.decode("utf-8") if isinstance(current_head, bytes) else str(current_head)

        # 4. Compute dual-layer hashes
        content_hash = compute_content_hash(payload, parent_hashes)
        chain_hash = compute_chain_hash(prev_hash, content_hash, ts, actor_id)

        evidence_item = EvidenceItem(
            id=evidence_id,
            case_id=case_id,
            trace_id=trace_id,
            sequence_number=seq_num,
            tier=tier,
            title=title,
            description=description,
            payload=payload,
            content_hash=content_hash,
            chain_hash=chain_hash,
            parent_evidence_ids=parents,
            parent_evidence_hashes=parent_hashes,
            created_at=ts,
            created_by=actor_id,
        )

        # 5. Persist to Redis
        item_json = evidence_item.model_dump_json()
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.set(evidence_key(case_id, evidence_id), item_json)
            pipe.rpush(list_k, evidence_id)
            pipe.set(head_k, chain_hash)
            for pid in parents:
                pipe.sadd(evidence_dag_key(case_id), f"{pid}:{evidence_id}")
            await pipe.execute()

        # Dual-write to SQLite database
        try:
            from app.persistence.repository import SQLiteRepository
            await SQLiteRepository.add_evidence_item({
                "id": evidence_item.id,
                "case_id": evidence_item.case_id,
                "trace_id": evidence_item.trace_id,
                "sequence_number": evidence_item.sequence_number,
                "tier": evidence_item.tier.value if hasattr(evidence_item.tier, "value") else str(evidence_item.tier),
                "title": evidence_item.title,
                "description": evidence_item.description,
                "payload": evidence_item.payload,
                "content_hash": evidence_item.content_hash,
                "chain_hash": evidence_item.chain_hash,
                "parent_evidence_ids": evidence_item.parent_evidence_ids,
                "parent_evidence_hashes": evidence_item.parent_evidence_hashes,
                "created_at": evidence_item.created_at.isoformat() if hasattr(evidence_item.created_at, "isoformat") else str(evidence_item.created_at),
                "created_by": evidence_item.created_by,
            })
        except Exception as exc:
            logger.warning("Failed to dual-write evidence item to SQLite: %s", exc)

        logger.info(
            "Appended evidence %s (Seq %d, Tier %s) for Case %s. ChainHash: %s",
            evidence_id, seq_num, tier.value, case_id, chain_hash[:16]
        )
        return evidence_item

    async def get_evidence_list(self, case_id: str) -> List[EvidenceItem]:
        """Fetch all evidence items for a case in sequential ledger order."""
        ids = await self.redis.lrange(evidence_list_key(case_id), 0, -1)
        if not ids:
            # Fallback to SQLite
            try:
                from app.persistence.repository import SQLiteRepository
                from app.blockchain.models import EvidenceTier
                sql_items = await SQLiteRepository.get_case_evidence(case_id)
                if sql_items:
                    items: List[EvidenceItem] = []
                    for si in sql_items:
                        item = EvidenceItem(
                            id=si.id,
                            case_id=si.case_id,
                            trace_id=si.trace_id,
                            sequence_number=si.sequence_number,
                            tier=EvidenceTier(si.tier) if si.tier in EvidenceTier.__members__.values() else EvidenceTier.OBSERVED,
                            title=si.title,
                            description=si.description,
                            payload=si.payload or {},
                            content_hash=si.content_hash,
                            chain_hash=si.chain_hash,
                            parent_evidence_ids=si.parent_evidence_ids or [],
                            parent_evidence_hashes=si.parent_evidence_hashes or [],
                            created_at=datetime.fromisoformat(si.created_at) if "T" in str(si.created_at) else datetime.utcnow(),
                            created_by=si.created_by,
                        )
                        items.append(item)
                    return items
            except Exception as exc:
                logger.warning("Error fetching evidence from SQLite fallback: %s", exc)
            return []

        clean_ids = [i.decode("utf-8") if isinstance(i, bytes) else str(i) for i in ids]
        keys = [evidence_key(case_id, eid) for eid in clean_ids]
        raw_items = await self.redis.mget(keys)

        items: List[EvidenceItem] = []
        for raw in raw_items:
            if raw:
                items.append(EvidenceItem.model_validate_json(raw))
        return items

    async def verify_case_integrity(self, case_id: str) -> IntegrityVerificationResult:
        """
        Verify the entire evidence ledger from genesis to head:
        1. Recalculates ContentHash for every record using canonical payload and parent hashes.
        2. Recalculates ChainHash sequentially.
        3. Identifies exact sequence number of any single-byte corruption.
        """
        items = await self.get_evidence_list(case_id)
        genesis = compute_genesis_hash(case_id)

        if not items:
            return IntegrityVerificationResult(
                case_id=case_id,
                is_valid=True,
                total_records=0,
                genesis_hash=genesis,
                latest_chain_hash=genesis,
                corrupted_sequence_number=None,
                audit_notes="Empty evidence ledger; genesis hash verified.",
            )

        prev_hash = genesis
        for idx, item in enumerate(items):
            expected_seq = idx + 1
            if item.sequence_number != expected_seq:
                return IntegrityVerificationResult(
                    case_id=case_id,
                    is_valid=False,
                    total_records=len(items),
                    genesis_hash=genesis,
                    latest_chain_hash=items[-1].chain_hash,
                    corrupted_sequence_number=item.sequence_number,
                    audit_notes=f"Sequence number mismatch: expected {expected_seq}, found {item.sequence_number}.",
                )

            # Re-verify ContentHash (binding payload and parent DAG hashes)
            computed_content_hash = compute_content_hash(item.payload, item.parent_evidence_hashes)
            if computed_content_hash != item.content_hash:
                return IntegrityVerificationResult(
                    case_id=case_id,
                    is_valid=False,
                    total_records=len(items),
                    genesis_hash=genesis,
                    latest_chain_hash=items[-1].chain_hash,
                    corrupted_sequence_number=item.sequence_number,
                    audit_notes=(
                        f"Content tampering detected at Seq {item.sequence_number} ({item.id}). "
                        f"Expected {computed_content_hash}, stored {item.content_hash}."
                    ),
                )

            # Re-verify sequential ChainHash
            computed_chain_hash = compute_chain_hash(
                prev_hash,
                computed_content_hash,
                item.created_at,
                item.created_by,
            )
            if computed_chain_hash != item.chain_hash:
                return IntegrityVerificationResult(
                    case_id=case_id,
                    is_valid=False,
                    total_records=len(items),
                    genesis_hash=genesis,
                    latest_chain_hash=items[-1].chain_hash,
                    corrupted_sequence_number=item.sequence_number,
                    audit_notes=(
                        f"Ledger sequence integrity broken at Seq {item.sequence_number} ({item.id}). "
                        f"Calculated chain hash {computed_chain_hash} does not match {item.chain_hash}."
                    ),
                )

            prev_hash = computed_chain_hash

        return IntegrityVerificationResult(
            case_id=case_id,
            is_valid=True,
            total_records=len(items),
            genesis_hash=genesis,
            latest_chain_hash=items[-1].chain_hash,
            corrupted_sequence_number=None,
            audit_notes=(
                f"Cryptographic integrity certified under Section 63 BSA. "
                f"All {len(items)} evidence nodes and hash chains validated successfully."
            ),
        )

    async def ingest_trace_result(self, case_id: str, trace_result: TraceResult) -> List[EvidenceItem]:
        """
        Automatically ingest a completed trace into the Evidence DAG:
        1. OBSERVED tier items for all on-chain transactions in path.
        2. DERIVED tier items for sweep ratios and graph metrics.
        3. INFERRED tier item for the final VASP Attribution.
        """
        created_items: List[EvidenceItem] = []
        observed_ids: List[str] = []

        # 1. Ingest OBSERVED on-chain transactions
        for tx in trace_result.path:
            obs = await self.append_evidence(
                case_id=case_id,
                tier=EvidenceTier.OBSERVED,
                title=f"On-Chain Transfer: {tx.from_address[:10]}... -> {str(tx.to_address)[:10]}...",
                description=f"Confirmed transfer of {tx.value} {tx.asset} at block {tx.block_number}.",
                payload={
                    "tx_hash": tx.tx_hash,
                    "from_address": tx.from_address,
                    "to_address": tx.to_address,
                    "value": tx.value,
                    "asset": tx.asset,
                    "block_number": tx.block_number,
                    "chain": tx.chain,
                    "timestamp": tx.timestamp.isoformat(),
                },
                trace_id=trace_result.trace_id,
                parent_evidence_ids=None,
                actor_id="CONSENSUS_INGESTION",
            )
            created_items.append(obs)
            observed_ids.append(obs.id)

        # 2. Ingest DERIVED metrics
        if len(trace_result.path) >= 2:
            derived = await self.append_evidence(
                case_id=case_id,
                tier=EvidenceTier.DERIVED,
                title="Consolidation Sweep Metric & Velocity",
                description=f"Calculated sweep ratio across {len(trace_result.path)} hops with decayed risk.",
                payload={
                    "hop_count": len(trace_result.path),
                    "risk_score": trace_result.risk_score,
                    "confidence_score": trace_result.confidence_score,
                    "source_address": trace_result.suspect_address,
                    "chain": trace_result.chain,
                },
                trace_id=trace_result.trace_id,
                parent_evidence_ids=observed_ids,
                actor_id="FORENSIC_ENGINE",
            )
            created_items.append(derived)

        # 3. Ingest INFERRED VASP Attribution
        if trace_result.vasp:
            inf = await self.append_evidence(
                case_id=case_id,
                tier=EvidenceTier.INFERRED,
                title=f"VASP Attribution: {trace_result.vasp.vasp_name}",
                description=(
                    f"Candidate deposit wallet {trace_result.vasp.deposit_address} attributed to "
                    f"{trace_result.vasp.vasp_name} with {trace_result.vasp.confidence * 100:.1f}% confidence."
                ),
                payload={
                    "vasp_name": trace_result.vasp.vasp_name,
                    "deposit_address": trace_result.vasp.deposit_address,
                    "hot_wallet": trace_result.vasp.hot_wallet,
                    "confidence": trace_result.vasp.confidence,
                    "gnn_prediction": trace_result.gnn_prediction,
                },
                trace_id=trace_result.trace_id,
                parent_evidence_ids=[created_items[-1].id] if created_items else None,
                actor_id="ATTRIBUTION_ENGINE",
            )
            created_items.append(inf)

        return created_items

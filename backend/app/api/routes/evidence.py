"""
Evidence Vault API Routes.
Enables listing evidence DAG records, manual investigator evidence injection,
and cryptographic Section 63 BSA integrity verification.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis

from app.api.deps import get_redis
from app.blockchain.models import EvidenceItem, EvidenceTier, IntegrityVerificationResult, AuditEventType
from app.core.redis_keys import case_key
from app.domain.evidence_vault import EvidenceVault
from app.domain.audit_logger import AuditLogger

router = APIRouter(prefix="/cases/{case_id}/evidence", tags=["evidence"])


@router.get("/", response_model=List[EvidenceItem])
async def list_case_evidence(
    case_id: str,
    redis: Redis = Depends(get_redis),
):
    """Retrieve full chronological evidence DAG for a case."""
    vault = EvidenceVault(redis)
    return await vault.get_evidence_list(case_id)


@router.get("/verify-integrity", response_model=IntegrityVerificationResult)
async def verify_evidence_integrity(
    case_id: str,
    redis: Redis = Depends(get_redis),
):
    """
    Cryptographically verify the evidence ledger from genesis to head:
    1. Recalculates ContentHash for every record using canonical RFC-8785 JSON and parent hashes.
    2. Recalculates ChainHash sequentially.
    3. Pinpoints corrupted sequence number if tampering is detected.
    """
    vault = EvidenceVault(redis)
    result = await vault.verify_case_integrity(case_id)

    # Log verification check in audit trail
    audit = AuditLogger(redis)
    await audit.log_event(
        case_id=case_id,
        event_type=AuditEventType.EVIDENCE_VERIFIED if result.is_valid else AuditEventType.TAMPER_DETECTED,
        action_summary=(
            f"Evidence integrity verified: {'VALID' if result.is_valid else 'CORRUPTED'}. "
            f"Total records: {result.total_records}."
        ),
        metadata={
            "is_valid": result.is_valid,
            "corrupted_seq": result.corrupted_sequence_number,
            "latest_chain_hash": result.latest_chain_hash,
        },
    )

    return result


@router.post("/", response_model=EvidenceItem, status_code=201)
async def append_manual_evidence(
    case_id: str,
    title: str,
    description: str,
    payload: Dict[str, Any],
    tier: EvidenceTier = EvidenceTier.HUMAN_ACTION,
    redis: Redis = Depends(get_redis),
):
    """Append a manual evidentiary finding or investigator statement."""
    # Ensure case exists
    raw = await redis.get(case_key(case_id))
    if not raw:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    vault = EvidenceVault(redis)
    item = await vault.append_evidence(
        case_id=case_id,
        tier=tier,
        title=title,
        description=description,
        payload=payload,
        actor_id="INVESTIGATING_OFFICER",
    )
    return item

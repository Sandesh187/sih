"""
Canonical Demo Scenario Seeder for SIH 2026 Evaluation.
Seeds a realistic Indian cybercrime task-fraud case:
Victim EOA -> Suspect EOA -> Mule/Peel EOA -> Candidate Deposit Wallet -> Binance Hot Wallet 14.
Dynamically computes RFC-8785 canonical hashes and seed audit entries.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.api.deps import get_redis
from app.blockchain.models import (
    Case,
    CaseStatus,
    CaseNote,
    EvidenceTier,
    AuditEventType,
    Transaction,
    VASPAttribution,
    TraceResult,
)
from app.core.redis_keys import (
    case_key,
    KEY_CASE_LIST,
    TRACE_STATE_PREFIX,
    KEY_RECENT_TRACES,
)
from app.domain.evidence_vault import EvidenceVault
from app.domain.audit_logger import AuditLogger
from app.domain.attribution_scorer import AttributionScorer

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_CASE_ID = "case_demo_delhi_0812"
DEMO_FIR = "FIR-2026-DEL-CY-0812"
DEMO_TRACE_ID = "trace_demo_delhi_0812"

VICTIM_ADDR = "0x742d35cc6634c0532925a3b844bc454e4438f44e"
SUSPECT_ADDR = "0x9d81f2ab72a38a7c29671f654b9d3753b708b761"
MULE_ADDR = "0x52908400098527886E0F7030069857D2E4169EE8"
CANDIDATE_ADDR = "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549"
BINANCE_HOT_WALLET = "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"  # Binance: Hot Wallet 14


@router.post("/seed")
async def seed_demo_scenario(redis: Redis = Depends(get_redis)):
    """
    Seeds the canonical evaluation scenario:
    1. Case record with FIR details and loss numbers.
    2. Completed multi-hop trace ending in Binance Hot Wallet 14.
    3. Fully hashed, tamper-evident Evidence DAG (OBSERVED, DERIVED, INFERRED).
    4. Chronological Audit Trail ensuring Section 63 BSA certificate validity.
    """
    now = datetime.utcnow()
    t0 = now - timedelta(hours=3)
    t1 = t0 + timedelta(minutes=14)
    t2 = t1 + timedelta(minutes=28)
    t3 = t2 + timedelta(minutes=22)

    # 1. Seed Case Record
    demo_case = Case(
        id=DEMO_CASE_ID,
        fir_number=DEMO_FIR,
        complainant_name="Ramesh Kumar (Telegram Task-Based Investment Scam)",
        police_station="Special Cyber Crime Police Station, New Delhi",
        loss_amount_inr=2500000.0,
        loss_amount_crypto=30000.0,
        crypto_symbol="USDT",
        root_suspect_address=SUSPECT_ADDR,
        chain="ethereum",
        status=CaseStatus.ACTIVE,
        traces=[DEMO_TRACE_ID],
        notes=[
            CaseNote(
                id="NOTE-001",
                author="Inspector R. K. Sharma",
                note="Complainant deposited funds into suspect wallet across 3 UPI transactions converted to crypto.",
                timestamp=t0 + timedelta(minutes=5),
            ),
            CaseNote(
                id="NOTE-002",
                author="Inspector R. K. Sharma",
                note="Suspect wallet rapidly layered 30,000 USDT into unhosted mule address within 14 minutes.",
                timestamp=t1 + timedelta(minutes=5),
            ),
        ],
        created_at=t0,
        updated_at=now,
    )

    await redis.set(case_key(DEMO_CASE_ID), demo_case.model_dump_json())
    await redis.sadd(KEY_CASE_LIST, DEMO_CASE_ID)

    # 2. Seed Audit Trail Entries
    audit = AuditLogger(redis)
    await audit.log_event(
        case_id=DEMO_CASE_ID,
        event_type=AuditEventType.CASE_CREATED,
        action_summary=f"Registered cybercrime FIR {DEMO_FIR} on National Cybercrime Portal (1930).",
        target_entity=SUSPECT_ADDR,
        timestamp=t0,
    )
    await audit.log_event(
        case_id=DEMO_CASE_ID,
        event_type=AuditEventType.TRACE_SUBMITTED,
        action_summary="Initiated multi-hop Best-First Search trace for root suspect wallet.",
        target_entity=SUSPECT_ADDR,
        timestamp=t0 + timedelta(minutes=2),
    )

    # 3. Seed Trace Result & Graph
    tx1 = Transaction(
        tx_hash="0x1a2b3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5",
        from_address=VICTIM_ADDR,
        to_address=SUSPECT_ADDR,
        value=30000.0,
        asset="USDT",
        timestamp=t0,
        block_number=21894210,
        chain="ethereum",
    )
    tx2 = Transaction(
        tx_hash="0x2b3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f6",
        from_address=SUSPECT_ADDR,
        to_address=MULE_ADDR,
        value=29900.0,
        asset="USDT",
        timestamp=t1,
        block_number=21894270,
        chain="ethereum",
    )
    tx3 = Transaction(
        tx_hash="0x3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f670",
        from_address=MULE_ADDR,
        to_address=CANDIDATE_ADDR,
        value=29500.0,
        asset="USDT",
        timestamp=t2,
        block_number=21894390,
        chain="ethereum",
    )
    tx4 = Transaction(
        tx_hash="0x4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f67081",
        from_address=CANDIDATE_ADDR,
        to_address=BINANCE_HOT_WALLET,
        value=29028.0,
        asset="USDT",
        timestamp=t3,
        block_number=21894480,
        chain="ethereum",
    )

    path_txs = [tx1, tx2, tx3, tx4]

    # Calculate 5-Factor Attribution
    attribution_result = AttributionScorer.calculate_attribution(
        candidate_address=CANDIDATE_ADDR,
        chain="ethereum",
        attributed_vasp_name="Binance",
        destination_hot_wallet=BINANCE_HOT_WALLET,
        is_direct_tag=False,
        is_downstream_match=True,
        sweep_ratio=0.984,
        dominant_concentration=0.98,
        unique_senders_count=8,
        sweep_delay_minutes=22.0,
        gnn_prediction={"predicted_class": "exchange", "confidence": 0.88},
    )

    graph_nodes = [
        {"data": {"id": VICTIM_ADDR, "label": "Victim EOA", "type": "intermediate"}},
        {"data": {"id": SUSPECT_ADDR, "label": "Suspect Root EOA", "type": "suspect", "riskScore": 88}},
        {"data": {"id": MULE_ADDR, "label": "Mule / Peel EOA", "type": "intermediate", "riskScore": 65}},
        {"data": {"id": CANDIDATE_ADDR, "label": "Binance Deposit Candidate", "type": "exchange", "riskScore": 25}},
        {"data": {"id": BINANCE_HOT_WALLET, "label": "Binance: Hot Wallet 14", "type": "vasp", "riskScore": 15}},
    ]
    graph_edges = [
        {"data": {"source": VICTIM_ADDR, "target": SUSPECT_ADDR, "amount": 30000.0, "currency": "USDT", "txHash": tx1.tx_hash}},
        {"data": {"source": SUSPECT_ADDR, "target": MULE_ADDR, "amount": 29900.0, "currency": "USDT", "txHash": tx2.tx_hash}},
        {"data": {"source": MULE_ADDR, "target": CANDIDATE_ADDR, "amount": 29500.0, "currency": "USDT", "txHash": tx3.tx_hash}},
        {"data": {"source": CANDIDATE_ADDR, "target": BINANCE_HOT_WALLET, "amount": 29028.0, "currency": "USDT", "txHash": tx4.tx_hash}},
    ]

    trace_result = TraceResult(
        trace_id=DEMO_TRACE_ID,
        suspect_address=SUSPECT_ADDR,
        chain="ethereum",
        path=path_txs,
        vasp=VASPAttribution(
            vasp_name="Binance: Hot Wallet 14",
            deposit_address=CANDIDATE_ADDR,
            hot_wallet=BINANCE_HOT_WALLET,
            confidence=attribution_result.composite_confidence,
        ),
        confidence_score=attribution_result.composite_confidence,
        risk_score=78.5,
        gnn_prediction={
            "predicted_class": "exchange",
            "confidence": 0.88,
            "explanation": "High in-degree sweep consolidation pattern characteristic of Binance omnibus deposit.",
        },
        graph={"nodes": graph_nodes, "edges": graph_edges},
    )

    # Save Trace State to Redis
    trace_payload = {
        "status": "completed",
        "result": trace_result.model_dump(mode="json"),
    }
    await redis.set(f"{TRACE_STATE_PREFIX}{DEMO_TRACE_ID}", TraceResult.model_validate(trace_result).model_dump_json())
    # Also support JSON state object format used by polling
    import json
    await redis.set(f"{TRACE_STATE_PREFIX}{DEMO_TRACE_ID}", json.dumps(trace_payload))
    await redis.rpush(KEY_RECENT_TRACES, DEMO_TRACE_ID)

    # 4. Ingest Cryptographic Evidence DAG (Dynamically Hashed!)
    vault = EvidenceVault(redis)

    ev1 = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.OBSERVED,
        title="Primary Theft Outflow (30,000 USDT)",
        description=f"Transaction {tx1.tx_hash[:16]}... from victim to suspect root wallet.",
        payload={"tx": tx1.model_dump(mode="json")},
        trace_id=DEMO_TRACE_ID,
        actor_id="CONSENSUS_INGESTION",
        timestamp=t0,
    )
    ev2 = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.OBSERVED,
        title="First-Hop Layering Transfer (29,900 USDT)",
        description=f"Suspect transferred 29,900 USDT to mule wallet {MULE_ADDR[:12]}...",
        payload={"tx": tx2.model_dump(mode="json")},
        trace_id=DEMO_TRACE_ID,
        parent_evidence_ids=[ev1.id],
        actor_id="CONSENSUS_INGESTION",
        timestamp=t1,
    )
    ev3 = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.OBSERVED,
        title="Second-Hop Consolidation Transfer (29,500 USDT)",
        description=f"Mule transferred 29,500 USDT into candidate deposit wallet {CANDIDATE_ADDR[:12]}...",
        payload={"tx": tx3.model_dump(mode="json")},
        trace_id=DEMO_TRACE_ID,
        parent_evidence_ids=[ev2.id],
        actor_id="CONSENSUS_INGESTION",
        timestamp=t2,
    )
    ev4 = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.OBSERVED,
        title="Automated Exchange Sweep into Binance Hot Wallet 14 (29,028 USDT)",
        description=f"Final sweep from candidate into Binance Omnibus Reserve {BINANCE_HOT_WALLET[:12]}...",
        payload={"tx": tx4.model_dump(mode="json")},
        trace_id=DEMO_TRACE_ID,
        parent_evidence_ids=[ev3.id],
        actor_id="CONSENSUS_INGESTION",
        timestamp=t3,
    )

    ev_derived = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.DERIVED,
        title="Consolidation Sweep Metric (98.4%) & Cadence (22 Mins)",
        description="Calculated 98.4% sweep ratio and 22-minute programmatic batch consolidation delta.",
        payload={
            "sweep_ratio": 0.984,
            "temporal_delta_mins": 22.0,
            "hops_traversed": 4,
            "fan_in_senders": 8,
        },
        trace_id=DEMO_TRACE_ID,
        parent_evidence_ids=[ev1.id, ev2.id, ev3.id, ev4.id],
        actor_id="FORENSIC_ENGINE",
        timestamp=t3 + timedelta(minutes=2),
    )

    ev_inferred = await vault.append_evidence(
        case_id=DEMO_CASE_ID,
        tier=EvidenceTier.INFERRED,
        title="VASP Attribution: Binance (84.5% High Confidence)",
        description="5-Factor attribution successfully linked candidate deposit wallet to Binance Omnibus Hot Wallet 14.",
        payload=attribution_result.model_dump(mode="json"),
        trace_id=DEMO_TRACE_ID,
        parent_evidence_ids=[ev_derived.id],
        actor_id="ATTRIBUTION_ENGINE",
        timestamp=t3 + timedelta(minutes=5),
    )

    # 5. Log Attribution Acceptance & Completion Audit Entries
    await audit.log_event(
        case_id=DEMO_CASE_ID,
        event_type=AuditEventType.TRACE_COMPLETED,
        action_summary=f"Trace completed across 4 hops terminating at Binance Hot Wallet 14.",
        target_entity=CANDIDATE_ADDR,
        timestamp=t3 + timedelta(minutes=6),
    )
    await audit.log_event(
        case_id=DEMO_CASE_ID,
        event_type=AuditEventType.ATTRIBUTION_ACCEPTED,
        action_summary="Investigating Officer accepted 84.5% attribution hypothesis linking deposit address to Binance.",
        target_entity=CANDIDATE_ADDR,
        metadata={"confidence": 0.845, "vasp": "Binance"},
        timestamp=t3 + timedelta(minutes=10),
    )

    # Run initial verification to assert integrity
    verify_result = await vault.verify_case_integrity(DEMO_CASE_ID)

    return {
        "status": "success",
        "message": "Canonical evaluation scenario seeded successfully.",
        "case_id": DEMO_CASE_ID,
        "fir_number": DEMO_FIR,
        "trace_id": DEMO_TRACE_ID,
        "root_suspect": SUSPECT_ADDR,
        "attributed_vasp": "Binance",
        "confidence_score": attribution_result.composite_confidence,
        "statutory_actionable": attribution_result.statutory_actionable,
        "evidence_items_count": 6,
        "cryptographic_integrity_valid": verify_result.is_valid,
        "latest_chain_hash": verify_result.latest_chain_hash,
    }


@router.get("/status")
async def demo_status(redis: Redis = Depends(get_redis)):
    """Check if the demo scenario is currently populated in Redis."""
    raw = await redis.get(case_key(DEMO_CASE_ID))
    if not raw:
        return {"seeded": False}
    case = Case.model_validate_json(raw)
    vault = EvidenceVault(redis)
    verify = await vault.verify_case_integrity(DEMO_CASE_ID)
    return {
        "seeded": True,
        "case_id": case.id,
        "fir_number": case.fir_number,
        "status": case.status.value,
        "evidence_integrity_valid": verify.is_valid,
        "total_evidence_records": verify.total_records,
    }

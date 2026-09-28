"""
Repository pattern for SQLite persistence.
Provides async queries and transactional operations.
"""
import json
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.persistence.db import AsyncSessionLocal
from app.persistence.models import (
    CaseModel,
    CaseNoteModel,
    EvidenceItemModel,
    FindingModel,
    AuditEventModel,
    TraceRecordModel,
)

logger = logging.getLogger(__name__)

class SQLiteRepository:
    """
    Asynchronous repository handling all SQLite database interactions.
    """

    @staticmethod
    async def upsert_case(case_data: Dict[str, Any]) -> CaseModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                case_id = case_data["id"]
                stmt = select(CaseModel).where(CaseModel.id == case_id)
                result = await session.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    for k, v in case_data.items():
                        if hasattr(existing, k) and k != "notes":
                            setattr(existing, k, v)
                    return existing
                else:
                    new_case = CaseModel(
                        id=case_data["id"],
                        fir_number=case_data.get("fir_number", ""),
                        complainant_name=case_data.get("complainant_name", ""),
                        police_station=case_data.get("police_station", "Cyber Crime Police Station"),
                        loss_amount_inr=case_data.get("loss_amount_inr", 0.0),
                        loss_amount_crypto=case_data.get("loss_amount_crypto", 0.0),
                        crypto_symbol=case_data.get("crypto_symbol", "USDT"),
                        root_suspect_address=case_data.get("root_suspect_address", ""),
                        chain=case_data.get("chain", "tron"),
                        status=case_data.get("status", "active"),
                        traces=case_data.get("traces", []),
                    )
                    session.add(new_case)
                    return new_case

    @staticmethod
    async def get_case(case_id: str) -> Optional[CaseModel]:
        async with AsyncSessionLocal() as session:
            stmt = select(CaseModel).where(CaseModel.id == case_id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    @staticmethod
    async def list_cases(status: Optional[str] = None) -> List[CaseModel]:
        async with AsyncSessionLocal() as session:
            stmt = select(CaseModel)
            if status:
                stmt = stmt.where(CaseModel.status == status)
            stmt = stmt.order_by(desc(CaseModel.created_at))
            result = await session.execute(stmt)
            return list(result.scalars().all())

    @staticmethod
    async def add_case_note(case_id: str, note_data: Dict[str, Any]) -> CaseNoteModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                note = CaseNoteModel(
                    id=note_data["id"],
                    case_id=case_id,
                    author=note_data.get("author", "Investigating Officer"),
                    note=note_data.get("note", ""),
                    timestamp=note_data.get("timestamp", ""),
                )
                session.add(note)
                return note

    @staticmethod
    async def add_evidence_item(item_data: Dict[str, Any]) -> EvidenceItemModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                item_id = item_data["id"]
                stmt = select(EvidenceItemModel).where(EvidenceItemModel.id == item_id)
                res = await session.execute(stmt)
                existing = res.scalar_one_or_none()

                if existing:
                    for k, v in item_data.items():
                        if hasattr(existing, k):
                            setattr(existing, k, v)
                    return existing
                else:
                    item = EvidenceItemModel(
                        id=item_id,
                        case_id=item_data["case_id"],
                        trace_id=item_data.get("trace_id"),
                        sequence_number=item_data.get("sequence_number", 1),
                        tier=item_data.get("tier", "OBSERVED"),
                        title=item_data.get("title", ""),
                        description=item_data.get("description", ""),
                        payload=item_data.get("payload", {}),
                        content_hash=item_data.get("content_hash", ""),
                        chain_hash=item_data.get("chain_hash", ""),
                        parent_evidence_ids=item_data.get("parent_evidence_ids", []),
                        parent_evidence_hashes=item_data.get("parent_evidence_hashes", []),
                        created_at=item_data.get("created_at", ""),
                        created_by=item_data.get("created_by", "system"),
                    )
                    session.add(item)
                    return item

    @staticmethod
    async def get_case_evidence(case_id: str) -> List[EvidenceItemModel]:
        async with AsyncSessionLocal() as session:
            stmt = select(EvidenceItemModel).where(EvidenceItemModel.case_id == case_id).order_by(EvidenceItemModel.sequence_number)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    @staticmethod
    async def add_finding(finding_data: Dict[str, Any]) -> FindingModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                fid = finding_data["id"]
                stmt = select(FindingModel).where(FindingModel.id == fid)
                res = await session.execute(stmt)
                existing = res.scalar_one_or_none()

                if existing:
                    for k, v in finding_data.items():
                        if hasattr(existing, k):
                            setattr(existing, k, v)
                    return existing
                else:
                    finding = FindingModel(
                        id=fid,
                        case_id=finding_data.get("case_id"),
                        trace_id=finding_data.get("trace_id"),
                        type=finding_data.get("type", "SUSPICIOUS_TRANSFER"),
                        severity=finding_data.get("severity", "medium"),
                        title=finding_data.get("title", ""),
                        description=finding_data.get("description", ""),
                        affected_addresses=finding_data.get("affected_addresses", []),
                        evidence_ids=finding_data.get("evidence_ids", []),
                        status=finding_data.get("status", "new"),
                        created_at=finding_data.get("created_at", ""),
                    )
                    session.add(finding)
                    return finding

    @staticmethod
    async def list_findings(case_id: Optional[str] = None) -> List[FindingModel]:
        async with AsyncSessionLocal() as session:
            stmt = select(FindingModel)
            if case_id:
                stmt = stmt.where(FindingModel.case_id == case_id)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    @staticmethod
    async def update_finding_status(finding_id: str, new_status: str, reviewer: str = "Investigating Officer") -> Optional[FindingModel]:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                stmt = select(FindingModel).where(FindingModel.id == finding_id)
                res = await session.execute(stmt)
                finding = res.scalar_one_or_none()
                if finding:
                    finding.status = new_status
                    finding.reviewed_by = reviewer
                    from datetime import datetime, timezone
                    finding.reviewed_at = datetime.now(timezone.utc).isoformat()
                    return finding
                return None

    @staticmethod
    async def add_audit_event(event_data: Dict[str, Any]) -> AuditEventModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                event = AuditEventModel(
                    id=event_data["id"],
                    case_id=event_data["case_id"],
                    actor_id=event_data.get("actor_id", "IO-Vikram-742"),
                    actor_role=event_data.get("actor_role", "INVESTIGATING_OFFICER"),
                    event_type=event_data.get("event_type", "CASE_ACTION"),
                    action_summary=event_data.get("action_summary", ""),
                    target_entity=event_data.get("target_entity"),
                    metadata_json=event_data.get("metadata", {}),
                    timestamp=event_data.get("timestamp", ""),
                    client_ip=event_data.get("client_ip", "127.0.0.1"),
                )
                session.add(event)
                return event

    @staticmethod
    async def get_case_audit_trail(case_id: str) -> List[AuditEventModel]:
        async with AsyncSessionLocal() as session:
            stmt = select(AuditEventModel).where(AuditEventModel.case_id == case_id).order_by(AuditEventModel.timestamp)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    @staticmethod
    async def save_trace(trace_data: Dict[str, Any]) -> TraceRecordModel:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                tid = trace_data["trace_id"]
                stmt = select(TraceRecordModel).where(TraceRecordModel.trace_id == tid)
                res = await session.execute(stmt)
                existing = res.scalar_one_or_none()

                if existing:
                    existing.status = trace_data.get("status", existing.status)
                    existing.risk_score = trace_data.get("risk_score", existing.risk_score)
                    existing.confidence_score = trace_data.get("confidence_score", existing.confidence_score)
                    existing.vasp = trace_data.get("vasp", existing.vasp)
                    existing.path = trace_data.get("path", existing.path)
                    existing.graph = trace_data.get("graph", existing.graph)
                    return existing
                else:
                    record = TraceRecordModel(
                        trace_id=tid,
                        suspect_address=trace_data.get("suspect_address", ""),
                        chain=trace_data.get("chain", "ethereum"),
                        status=trace_data.get("status", "completed"),
                        risk_score=trace_data.get("risk_score"),
                        confidence_score=trace_data.get("confidence_score"),
                        vasp=trace_data.get("vasp"),
                        path=trace_data.get("path", []),
                        graph=trace_data.get("graph", {}),
                    )
                    session.add(record)
                    return record

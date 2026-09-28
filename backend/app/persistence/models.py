"""
SQLAlchemy ORM models for SQLite persistence.
Covers Cases, Notes, Evidence DAG (Section 63 BSA), Findings, Audit Trail, and Traces.
"""
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Column, 
    String, 
    Integer, 
    Float, 
    Text, 
    DateTime, 
    ForeignKey,
    JSON,
    Boolean
)
from sqlalchemy.orm import DeclarativeBase, relationship

class Base(DeclarativeBase):
    pass

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True, index=True)
    fir_number = Column(String(128), index=True, nullable=False)
    complainant_name = Column(String(256), nullable=False)
    police_station = Column(String(256), default="Cyber Crime Police Station")
    loss_amount_inr = Column(Float, default=0.0)
    loss_amount_crypto = Column(Float, default=0.0)
    crypto_symbol = Column(String(32), default="USDT")
    root_suspect_address = Column(String(128), index=True, nullable=False)
    chain = Column(String(32), default="tron")
    status = Column(String(32), default="active", index=True)
    traces = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    notes = relationship("CaseNoteModel", back_populates="case", cascade="all, delete-orphan", lazy="selectin")
    evidence_items = relationship("EvidenceItemModel", back_populates="case", cascade="all, delete-orphan", lazy="selectin")
    findings = relationship("FindingModel", back_populates="case", cascade="all, delete-orphan", lazy="selectin")

class CaseNoteModel(Base):
    __tablename__ = "case_notes"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    author = Column(String(128), default="Investigating Officer")
    note = Column(Text, nullable=False)
    timestamp = Column(String(64), nullable=False)

    case = relationship("CaseModel", back_populates="notes")

class EvidenceItemModel(Base):
    __tablename__ = "evidence_items"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=False)
    trace_id = Column(String(64), index=True, nullable=True)
    sequence_number = Column(Integer, default=1)
    tier = Column(String(32), default="OBSERVED")
    title = Column(String(256), nullable=False)
    description = Column(Text, default="")
    payload = Column(JSON, default=dict)
    content_hash = Column(String(64), nullable=False)
    chain_hash = Column(String(64), nullable=False)
    parent_evidence_ids = Column(JSON, default=list)
    parent_evidence_hashes = Column(JSON, default=list)
    created_at = Column(String(64), nullable=False)
    created_by = Column(String(128), default="system:automated_harvester")

    case = relationship("CaseModel", back_populates="evidence_items")

class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), index=True, nullable=True)
    trace_id = Column(String(64), index=True, nullable=True)
    type = Column(String(64), nullable=False)
    severity = Column(String(32), default="medium")
    title = Column(String(256), nullable=False)
    description = Column(Text, default="")
    affected_addresses = Column(JSON, default=list)
    evidence_ids = Column(JSON, default=list)
    status = Column(String(32), default="new", index=True)
    reviewed_by = Column(String(128), nullable=True)
    reviewed_at = Column(String(64), nullable=True)
    created_at = Column(String(64), nullable=False)

    case = relationship("CaseModel", back_populates="findings")

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), index=True, nullable=False)
    actor_id = Column(String(128), default="IO-Vikram-742")
    actor_role = Column(String(64), default="INVESTIGATING_OFFICER")
    event_type = Column(String(64), index=True, nullable=False)
    action_summary = Column(Text, nullable=False)
    target_entity = Column(String(256), nullable=True)
    metadata_json = Column(JSON, default=dict)
    timestamp = Column(String(64), nullable=False)
    client_ip = Column(String(64), default="127.0.0.1")

class TraceRecordModel(Base):
    __tablename__ = "traces"

    trace_id = Column(String(64), primary_key=True, index=True)
    suspect_address = Column(String(128), index=True, nullable=False)
    chain = Column(String(32), default="ethereum")
    status = Column(String(32), default="completed")
    risk_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    vasp = Column(JSON, nullable=True)
    path = Column(JSON, default=list)
    graph = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Legacy & Base Blockchain Models (Retained for 100% Backwards Compatibility)
# ---------------------------------------------------------------------------

class Transaction(BaseModel):
    tx_hash: str
    from_address: str
    to_address: Optional[str] = None
    value: float
    asset: str = "ETH"
    timestamp: datetime
    block_number: int
    chain: str

class WalletInfo(BaseModel):
    address: str
    chain: str
    balance: float
    asset: str = "ETH"
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None

class TransferRecord(BaseModel):
    tx_hash: str
    from_address: str
    to_address: str
    amount: float
    token_symbol: str
    timestamp: datetime

class ClusterInfo(BaseModel):
    cluster_id: str
    addresses: List[str]
    category: Optional[str] = None
    confidence: float

class TraceRequest(BaseModel):
    address: str
    chain: str
    max_depth: int = Field(default=10, ge=1, le=15)
    case_id: Optional[str] = None

class VASPAttribution(BaseModel):
    vasp_name: str
    deposit_address: str
    hot_wallet: Optional[str] = None
    confidence: float

class TraceResult(BaseModel):
    trace_id: str
    suspect_address: str
    chain: str
    path: List[Transaction]
    vasp: Optional[VASPAttribution] = None
    confidence_score: float
    risk_score: Optional[float] = None
    gnn_prediction: Optional[Dict[str, Any]] = None
    graph: Optional[Dict[str, Any]] = None

class RiskScore(BaseModel):
    address: str
    chain: str
    score: float = Field(..., ge=0, le=100)
    factors: List[str]
    breakdown: Dict[str, float]

class InvestigationReport(BaseModel):
    trace_id: str
    suspect_wallet: str
    identified_vasp: Optional[str] = None
    risk_score: Optional[float] = None
    traced_path_summary: str
    methodology_notes: str
    generated_at: datetime
    confidence: float


# ---------------------------------------------------------------------------
# Case Management Models (Section 94 BNSS & Statutory Compliance)
# ---------------------------------------------------------------------------

class CaseStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    CLOSED = "closed"

class CaseNote(BaseModel):
    id: str
    author: str
    note: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Case(BaseModel):
    id: str
    fir_number: str
    complainant_name: str
    police_station: str = "Cyber Crime Police Station"
    loss_amount_inr: float = 0.0
    loss_amount_crypto: float = 0.0
    crypto_symbol: str = "USDT"
    root_suspect_address: str
    chain: str = "ethereum"
    status: CaseStatus = CaseStatus.ACTIVE
    traces: List[str] = Field(default_factory=list)
    notes: List[CaseNote] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CaseCreate(BaseModel):
    fir_number: str
    complainant_name: str
    police_station: str = "Cyber Crime Police Station"
    loss_amount_inr: float = 0.0
    loss_amount_crypto: float = 0.0
    crypto_symbol: str = "USDT"
    root_suspect_address: str
    chain: str = "ethereum"

class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    complainant_name: Optional[str] = None
    police_station: Optional[str] = None
    loss_amount_inr: Optional[float] = None
    loss_amount_crypto: Optional[float] = None


# ---------------------------------------------------------------------------
# Cryptographic Evidence DAG Models (Section 63 BSA Compliance)
# ---------------------------------------------------------------------------

class EvidenceTier(str, Enum):
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    INFERRED = "INFERRED"
    HUMAN_ACTION = "HUMAN_ACTION"

class EvidenceItem(BaseModel):
    id: str
    case_id: str
    trace_id: Optional[str] = None
    sequence_number: int
    tier: EvidenceTier
    title: str
    description: str
    payload: Dict[str, Any]
    content_hash: str
    chain_hash: str
    parent_evidence_ids: List[str] = Field(default_factory=list)
    parent_evidence_hashes: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = "SYSTEM"

class IntegrityVerificationResult(BaseModel):
    case_id: str
    is_valid: bool
    total_records: int
    genesis_hash: str
    latest_chain_hash: str
    corrupted_sequence_number: Optional[int] = None
    verification_timestamp: datetime = Field(default_factory=datetime.utcnow)
    audit_notes: str


# ---------------------------------------------------------------------------
# Forensic Findings & Anomaly Detection Models
# ---------------------------------------------------------------------------

class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class FindingStatus(str, Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    ESCALATED = "escalated"
    DISMISSED = "dismissed"

class Finding(BaseModel):
    id: str
    case_id: str
    trace_id: Optional[str] = None
    type: str  # mixer_detected, rapid_sweep, peel_chain, large_transfer
    severity: FindingSeverity
    title: str
    description: str
    affected_addresses: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    status: FindingStatus = FindingStatus.NEW
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Immutable Audit Trail Models (Section 63(4) BSA Court Admissibility)
# ---------------------------------------------------------------------------

class AuditEventType(str, Enum):
    CASE_CREATED = "CASE_CREATED"
    CASE_UPDATED = "CASE_UPDATED"
    TRACE_SUBMITTED = "TRACE_SUBMITTED"
    TRACE_COMPLETED = "TRACE_COMPLETED"
    ATTRIBUTION_ACCEPTED = "ATTRIBUTION_ACCEPTED"
    ATTRIBUTION_REJECTED = "ATTRIBUTION_REJECTED"
    FINDING_REVIEWED = "FINDING_REVIEWED"
    DOSSIER_GENERATED = "DOSSIER_GENERATED"
    BNSS94_GENERATED = "BNSS94_GENERATED"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED"
    TAMPER_DETECTED = "TAMPER_DETECTED"

class AuditEvent(BaseModel):
    id: str
    case_id: str
    actor_id: str
    actor_role: str = "INVESTIGATING_OFFICER"
    event_type: AuditEventType
    action_summary: str
    target_entity: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    client_ip: Optional[str] = "127.0.0.1"


# ---------------------------------------------------------------------------
# 5-Factor Explainable Attribution Models
# ---------------------------------------------------------------------------

class FactorContribution(BaseModel):
    name: str
    raw_value: float = Field(..., ge=0.0, le=1.0)
    weight: float = Field(..., ge=0.0, le=1.0)
    weighted_score: float = Field(..., ge=0.0, le=1.0)
    description: str

class ExplainableAttributionResult(BaseModel):
    candidate_address: str
    chain: str
    attributed_vasp: Optional[str] = None
    destination_hot_wallet: Optional[str] = None
    composite_confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_band: str  # HIGH, MEDIUM, LOW
    statutory_actionable: bool
    factors: List[FactorContribution]
    methodology_notes: str

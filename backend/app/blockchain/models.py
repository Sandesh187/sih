from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

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

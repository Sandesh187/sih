export interface TraceResult { 
  traceId: string; 
  sourceAddress: string; 
  chain: string; 
  identifiedVasp: { name: string; type: string; confidence: number; jurisdiction?: string; } | null; 
  riskScore: number | null;
  riskFactors: RiskFactor[];
  path: TracePathStep[]; 
}

export interface TracePathStep { 
  from: string; 
  to: string; 
  amount: number; 
  currency: string; 
  timestamp: string; 
  txHash: string; 
  type: 'transfer' | 'exchange' | 'mixer' | 'unknown'; 
}

export interface GraphData {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      type: 'suspect' | 'vasp' | 'exchange' | 'intermediate';
      riskScore?: number;
    };
  }>;
  edges: Array<{
    data: {
      source: string;
      target: string;
      amount: number;
      currency: string;
      txHash?: string;
    };
  }>;
}

export interface InvestigationReport {
  traceId: string;
  suspectWallet: string;
  identifiedVasp: string | null;
  riskScore: number | null;
  tracedPathSummary: string;
  methodologyNotes: string;
  generatedAt: string;
  confidence: number;
}

export interface ClusterData {
  clusterId: string;
  label: string;
  type: 'exchange' | 'mixer' | 'mining_pool' | 'gambling' | 'darknet' | 'personal' | 'unknown';
  addressCount: number;
  totalVolume: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  addresses: string[];
  connectedClusters: string[];
}

export interface AlertData {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  description: string;
  walletAddress: string;
  chain: string;
  timestamp: string;
  status: 'new' | 'reviewed' | 'escalated' | 'dismissed';
  assignedTo?: string;
}

export interface CaseReport {
  id: string;
  title: string;
  status: 'draft' | 'generated' | 'submitted';
  createdAt: string;
  updatedAt: string;
  traceId: string;
  suspectAddress: string;
  identifiedVasp: string;
  riskScore: number;
  chain: string;
  findings: string[];
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Enterprise Case Management Types (Section 94 BNSS & Statutory Compliance)
// ---------------------------------------------------------------------------

export type CaseStatus = 'draft' | 'active' | 'under_review' | 'closed';

export interface CaseNote {
  id: string;
  author: string;
  note: string;
  timestamp: string;
}

export interface Case {
  id: string;
  fir_number: string;
  complainant_name: string;
  police_station: string;
  loss_amount_inr: number;
  loss_amount_crypto: number;
  crypto_symbol: string;
  root_suspect_address: string;
  chain: string;
  status: CaseStatus;
  traces: string[];
  notes: CaseNote[];
  created_at: string;
  updated_at: string;
}

export interface CaseCreate {
  fir_number: string;
  complainant_name: string;
  police_station?: string;
  loss_amount_inr?: number;
  loss_amount_crypto?: number;
  crypto_symbol?: string;
  root_suspect_address: string;
  chain: string;
}

// ---------------------------------------------------------------------------
// Cryptographic Evidence DAG & Hash Chaining Types (Section 63 BSA)
// ---------------------------------------------------------------------------

export type EvidenceTier = 'OBSERVED' | 'DERIVED' | 'INFERRED' | 'HUMAN_ACTION';

export interface EvidenceItem {
  id: string;
  case_id: string;
  trace_id?: string | null;
  sequence_number: number;
  tier: EvidenceTier;
  title: string;
  description: string;
  payload: Record<string, any>;
  content_hash: string;
  chain_hash: string;
  parent_evidence_ids: string[];
  parent_evidence_hashes: string[];
  created_at: string;
  created_by: string;
}

export interface IntegrityVerificationResult {
  case_id: string;
  is_valid: boolean;
  total_records: number;
  genesis_hash: string;
  latest_chain_hash: string;
  corrupted_sequence_number: number | null;
  verification_timestamp: string;
  audit_notes: string;
}

export interface AuditEvent {
  id: string;
  case_id: string;
  actor_id: string;
  actor_role: string;
  event_type: string;
  action_summary: string;
  target_entity?: string | null;
  metadata: Record<string, any>;
  timestamp: string;
  client_ip?: string;
}

export interface AuditTrailResponse {
  case_id: string;
  total_events: number;
  events: AuditEvent[];
}

export interface Finding {
  id: string;
  case_id: string;
  trace_id?: string | null;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_addresses: string[];
  evidence_ids: string[];
  status: 'new' | 'reviewed' | 'escalated' | 'dismissed';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

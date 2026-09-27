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

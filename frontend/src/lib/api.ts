import {
  GraphData,
  InvestigationReport,
  TraceResult,
  Case,
  CaseCreate,
  CaseNote,
  EvidenceItem,
  IntegrityVerificationResult,
  AuditTrailResponse,
  Finding,
  RiskFactor,
} from '@/types';
import { CANONICAL_DEMO_TRACE } from './canonicalDemo';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');
const POLL_INTERVAL_MS = 1_000;
const TRACE_TIMEOUT_MS = 120_000;

type BackendTransaction = {
  tx_hash: string;
  from_address: string;
  to_address: string | null;
  value: number;
  asset: string;
  timestamp: string;
};

type BackendTraceResult = {
  trace_id: string;
  suspect_address: string;
  chain: string;
  path: BackendTransaction[];
  vasp: {
    vasp_name: string;
    deposit_address: string;
    hot_wallet: string | null;
    confidence: number;
  } | null;
  confidence_score: number;
  risk_score?: number;
  gnn_prediction?: {
    predicted_class: string;
    confidence: number;
    explanation: string;
  };
  graph?: BackendGraph;
};

type BackendGraph = {
  nodes: Array<{ data: { id: string; label?: string } }>;
  edges: Array<{ data: { source: string; target: string; weight: number; asset: string } }>;
};

type BackendInvestigationReport = {
  trace_id: string;
  suspect_wallet: string;
  identified_vasp: string | null;
  risk_score: number | null;
  traced_path_summary: string;
  methodology_notes: string;
  generated_at: string;
  confidence: number;
};

type TraceStatus = { status: 'processing' } | BackendTraceResult;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev_secret_key_123';
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...init?.headers,
      },
    });
  } catch (err: any) {
    throw new Error(`Failed to reach forensic API server at ${BASE_URL}. Ensure backend is running.`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.detail || parsed.message || message;
    } catch {
      if (errorBody) message = errorBody;
    }
    throw new Error(message);
  }

  return response.json();
}

function isProcessing(result: TraceStatus): result is { status: 'processing' } {
  return 'status' in result && result.status === 'processing';
}

function toTraceResult(result: BackendTraceResult): TraceResult {
  const riskFactors: RiskFactor[] = [
    ...(result.gnn_prediction ? [{
      name: 'GNN Behavioral Classification',
      score: Math.round((result.gnn_prediction.confidence ?? 0.8) * 100),
      weight: 35,
      description: result.gnn_prediction.explanation || `Classified as ${result.gnn_prediction.predicted_class} by GraphSAGE`,
    }] : []),
    ...(result.vasp ? [{
      name: 'VASP Sweep Consolidation',
      score: Math.round(result.vasp.confidence * 100),
      weight: 35,
      description: `Terminal destination identified as ${result.vasp.vasp_name}`,
    }] : []),
    {
      name: 'Hop-Decayed Proximity Risk',
      score: Math.round(result.risk_score ?? 45),
      weight: 30,
      description: 'Exponential decay factor applied across all intermediate hops from suspect',
    }
  ];

  return {
    traceId: result.trace_id,
    sourceAddress: result.suspect_address,
    chain: result.chain,
    identifiedVasp: result.vasp ? {
      name: result.vasp.vasp_name,
      type: 'Known VASP hot-wallet attribution',
      confidence: result.vasp.confidence,
    } : null,
    riskScore: result.risk_score ?? null,
    riskFactors,
    path: result.path.map((transaction) => ({
      from: transaction.from_address,
      to: transaction.to_address ?? 'Unknown recipient',
      amount: transaction.value,
      currency: transaction.asset,
      timestamp: transaction.timestamp,
      txHash: transaction.tx_hash,
      type: result.vasp?.hot_wallet?.toLowerCase() === transaction.to_address?.toLowerCase()
        ? 'exchange'
        : 'transfer',
    })),
  };
}
 
function toGraphData(graph: BackendGraph, trace: TraceResult): GraphData {
  const vaspAddress = trace.path.length > 0
    ? trace.path[trace.path.length - 1].to.toLowerCase()
    : undefined;
  const suspectAddress = trace.sourceAddress.toLowerCase();

  if (graph && graph.nodes && graph.nodes.length > 0) {
    return {
      nodes: graph.nodes.map(({ data }) => {
        const id = data.id;
        const normalizedId = id.toLowerCase();
        return {
          data: {
            id,
            label: data.label ?? id,
            type: (data as any).type || (normalizedId === suspectAddress
              ? 'suspect'
              : normalizedId === vaspAddress
                ? 'vasp'
                : 'intermediate'),
            riskScore: (data as any).riskScore,
          },
        };
      }),
      edges: graph.edges.map(({ data }) => ({
        data: {
          source: data.source,
          target: data.target,
          amount: data.weight,
          currency: data.asset,
          txHash: (data as any).txHash,
        },
      })),
    };
  }

  // If graph is empty but path has steps, build graph from path
  if (trace.path && trace.path.length > 0) {
    const nodeMap = new Map<string, { id: string; label: string; type: 'suspect' | 'vasp' | 'exchange' | 'intermediate'; riskScore?: number }>();
    const edges: GraphData['edges'] = [];

    nodeMap.set(suspectAddress, {
      id: trace.sourceAddress,
      label: `Suspect (${trace.sourceAddress.slice(0, 6)}...${trace.sourceAddress.slice(-4)})`,
      type: 'suspect',
      riskScore: trace.riskScore ?? 85,
    });

    trace.path.forEach((step, idx) => {
      const fromLower = step.from.toLowerCase();
      const toLower = step.to.toLowerCase();
      const isLast = idx === trace.path.length - 1;

      if (!nodeMap.has(fromLower)) {
        nodeMap.set(fromLower, {
          id: step.from,
          label: fromLower === suspectAddress ? 'Suspect Root' : `Hop ${idx} (${step.from.slice(0, 6)}...)`,
          type: fromLower === suspectAddress ? 'suspect' : 'intermediate',
          riskScore: Math.max(20, Math.round((trace.riskScore ?? 80) * Math.pow(0.85, idx))),
        });
      }

      if (!nodeMap.has(toLower)) {
        nodeMap.set(toLower, {
          id: step.to,
          label: isLast && trace.identifiedVasp ? trace.identifiedVasp.name : `Hop ${idx + 1} (${step.to.slice(0, 6)}...)`,
          type: isLast ? 'vasp' : 'intermediate',
          riskScore: isLast ? 15 : Math.max(20, Math.round((trace.riskScore ?? 80) * Math.pow(0.85, idx + 1))),
        });
      }

      edges.push({
        data: {
          source: step.from,
          target: step.to,
          amount: step.amount,
          currency: step.currency,
          txHash: step.txHash,
        },
      });
    });

    return {
      nodes: Array.from(nodeMap.values()).map(data => ({ data })),
      edges,
    };
  }

  return CANONICAL_DEMO_TRACE.graphData;
}

function toInvestigationReport(report: BackendInvestigationReport): InvestigationReport {
  return {
    traceId: report.trace_id,
    suspectWallet: report.suspect_wallet,
    identifiedVasp: report.identified_vasp,
    riskScore: report.risk_score,
    tracedPathSummary: report.traced_path_summary,
    methodologyNotes: report.methodology_notes,
    generatedAt: report.generated_at,
    confidence: report.confidence,
  };
}

export const api = {
  // -------------------------------------------------------------------------
  // Core Tracing API
  // -------------------------------------------------------------------------
  async traceWallet(address: string, chain: string, maxDepth = 5): Promise<{ traceResult: TraceResult; graphData: GraphData }> {
    const submission = await request<{ trace_id: string }>('/trace/', {
      method: 'POST',
      body: JSON.stringify({ address, chain, max_depth: maxDepth }),
    });

    const startedAt = Date.now();
    let status: TraceStatus;
    do {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      status = await request<TraceStatus>(`/trace/${submission.trace_id}`);
      if (Date.now() - startedAt > TRACE_TIMEOUT_MS) {
        throw new Error('Tracing did not finish within 120 seconds. Try again later.');
      }
    } while (isProcessing(status));

    const traceResult = toTraceResult(status);
    const backendGraph = status.graph || { nodes: [], edges: [] };
    return { traceResult, graphData: toGraphData(backendGraph, traceResult) };
  },

  async getGraphData(address: string, chain: string, depth = 2): Promise<GraphData> {
    const graph = await request<BackendGraph>(
      `/graph/${encodeURIComponent(address)}?chain=${encodeURIComponent(chain)}&depth=${depth}`,
    );
    return toGraphData(graph, {
      traceId: '', sourceAddress: address, chain, identifiedVasp: null,
      riskScore: null, riskFactors: [], path: [],
    });
  },

  async getReport(traceId: string): Promise<InvestigationReport> {
    const report = await request<BackendInvestigationReport>(`/report/${encodeURIComponent(traceId)}`);
    return toInvestigationReport(report);
  },

  async getTraceResult(traceId: string): Promise<{ traceResult: TraceResult; graphData: GraphData }> {
    const status = await request<TraceStatus>(`/trace/${encodeURIComponent(traceId)}`);
    if (isProcessing(status)) {
      throw new Error('Trace is still processing.');
    }
    const traceResult = toTraceResult(status);
    const backendGraph = status.graph || { nodes: [], edges: [] };
    return { traceResult, graphData: toGraphData(backendGraph, traceResult) };
  },

  async getRecentTraces(): Promise<any[]> {
    const data = await request<{traces: any[]}>('/trace/recent');
    return data.traces;
  },

  // -------------------------------------------------------------------------
  // Case Management API (Section 94 BNSS)
  // -------------------------------------------------------------------------
  async getCases(status?: string): Promise<Case[]> {
    const query = status ? `?status=${status}` : '';
    return request<Case[]>(`/cases/${query}`);
  },

  async getCase(caseId: string): Promise<Case> {
    return request<Case>(`/cases/${encodeURIComponent(caseId)}`);
  },

  async createCase(payload: CaseCreate): Promise<Case> {
    return request<Case>('/cases/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCase(caseId: string, payload: Partial<Case>): Promise<Case> {
    return request<Case>(`/cases/${encodeURIComponent(caseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async addCaseNote(caseId: string, note: string, author = 'Investigating Officer'): Promise<CaseNote> {
    return request<CaseNote>(
      `/cases/${encodeURIComponent(caseId)}/notes?note_text=${encodeURIComponent(note)}&author=${encodeURIComponent(author)}`,
      { method: 'POST' }
    );
  },

  async getCaseAudit(caseId: string): Promise<AuditTrailResponse> {
    return request<AuditTrailResponse>(`/cases/${encodeURIComponent(caseId)}/audit`);
  },

  // -------------------------------------------------------------------------
  // Evidence Vault & Integrity API (Section 63 BSA)
  // -------------------------------------------------------------------------
  async getCaseEvidence(caseId: string): Promise<EvidenceItem[]> {
    return request<EvidenceItem[]>(`/cases/${encodeURIComponent(caseId)}/evidence/`);
  },

  async verifyCaseIntegrity(caseId: string): Promise<IntegrityVerificationResult> {
    return request<IntegrityVerificationResult>(`/cases/${encodeURIComponent(caseId)}/evidence/verify-integrity`);
  },

  // -------------------------------------------------------------------------
  // Forensic Findings API
  // -------------------------------------------------------------------------
  async getFindings(caseId?: string): Promise<Finding[]> {
    const query = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
    return request<Finding[]>(`/findings${query}`);
  },

  // -------------------------------------------------------------------------
  // PDF Report Compilation & Download API (Non-Blocking)
  // -------------------------------------------------------------------------
  async downloadBNSSNotice(caseId: string, candidateAddress?: string, vaspName = 'Binance'): Promise<Blob> {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev_secret_key_123';
    let url = `${BASE_URL}/cases/${encodeURIComponent(caseId)}/reports/bnss94?vasp_name=${encodeURIComponent(vaspName)}`;
    if (candidateAddress) {
      url += `&candidate_address=${encodeURIComponent(candidateAddress)}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
    });
    if (!response.ok) {
      throw new Error(`Failed to generate Section 94 BNSS Notice: ${response.statusText}`);
    }
    return response.blob();
  },

  async downloadBSADossier(caseId: string, candidateAddress?: string, vaspName = 'Binance'): Promise<Blob> {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'dev_secret_key_123';
    let url = `${BASE_URL}/cases/${encodeURIComponent(caseId)}/reports/dossier?vasp_name=${encodeURIComponent(vaspName)}`;
    if (candidateAddress) {
      url += `&candidate_address=${encodeURIComponent(candidateAddress)}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
    });
    if (!response.ok) {
      throw new Error(`Failed to generate Section 63 BSA Dossier: ${response.statusText}`);
    }
    return response.blob();
  },

  // Aliases for component compatibility
  async downloadBnss94Pdf(caseId: string, candidateAddress?: string, vaspName = 'Binance'): Promise<Blob> {
    return this.downloadBNSSNotice(caseId, candidateAddress, vaspName);
  },

  async downloadBsa63Pdf(caseId: string, candidateAddress?: string, vaspName = 'Binance'): Promise<Blob> {
    return this.downloadBSADossier(caseId, candidateAddress, vaspName);
  },

  async verifyEvidenceIntegrity(caseId: string): Promise<IntegrityVerificationResult> {
    return this.verifyCaseIntegrity(caseId);
  },

  // -------------------------------------------------------------------------
  // Canonical Demo Scenario Seeder
  // -------------------------------------------------------------------------
  async seedDemoScenario(): Promise<any> {
    return request<any>('/demo/seed', { method: 'POST' });
  },

  async getDemoStatus(): Promise<{ seeded: boolean; case_id?: string; fir_number?: string }> {
    return request<{ seeded: boolean; case_id?: string; fir_number?: string }>('/demo/status');
  },
};

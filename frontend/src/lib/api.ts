import { GraphData, InvestigationReport, TraceResult } from '@/types';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');
const POLL_INTERVAL_MS = 1_000;
const TRACE_TIMEOUT_MS = 45_000;

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
      cache: 'no-store',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...init?.headers 
      },
    });
  } catch {
    throw new Error(`Cannot reach the tracing API at ${BASE_URL}. Start the backend or set NEXT_PUBLIC_API_URL.`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Tracing API request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function isProcessing(result: TraceStatus): result is { status: 'processing' } {
  return 'status' in result && result.status === 'processing';
}

function toTraceResult(result: BackendTraceResult): TraceResult {
  return {
    traceId: result.trace_id,
    sourceAddress: result.suspect_address,
    chain: result.chain,
    identifiedVasp: result.vasp ? {
      name: result.vasp.vasp_name,
      type: 'Known VASP hot-wallet attribution',
      confidence: result.vasp.confidence,
    } : null,
    // Risk score is now computed by the backend GNN model
    riskScore: result.risk_score ?? null,
    riskFactors: result.gnn_prediction?.predicted_class 
      ? [`GNN classified as: ${result.gnn_prediction.predicted_class}`] 
      : [],
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

  return {
    nodes: graph.nodes.map(({ data }) => {
      const id = data.id;
      const normalizedId = id.toLowerCase();
      return {
        data: {
          id,
          label: data.label ?? id,
          type: normalizedId === suspectAddress
            ? 'suspect'
            : normalizedId === vaspAddress
              ? 'vasp'
              : 'intermediate',
        },
      };
    }),
    edges: graph.edges.map(({ data }) => ({
      data: {
        source: data.source,
        target: data.target,
        amount: data.weight,
        currency: data.asset,
      },
    })),
  };
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
        throw new Error('Tracing did not finish within 45 seconds. Try again later.');
      }
    } while (isProcessing(status));

    const traceResult = toTraceResult(status);
    const graph = await request<BackendGraph>(
      `/graph/${encodeURIComponent(address)}?chain=${encodeURIComponent(chain)}&depth=${maxDepth}`,
    );

    return { traceResult, graphData: toGraphData(graph, traceResult) };
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

  async getRecentTraces(): Promise<any[]> {
    const data = await request<{traces: any[]}>('/trace/recent');
    return data.traces;
  }
};

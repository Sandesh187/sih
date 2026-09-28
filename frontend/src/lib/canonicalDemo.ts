import { TraceResult, GraphData } from '@/types';

export const CANONICAL_SUSPECT_ADDRESS = '0x9d81f2ab72a38a7c29671f654b9d3753b708b761';
export const CANONICAL_VICTIM_ADDRESS = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
export const CANONICAL_MULE_ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE8';
export const CANONICAL_DEPOSIT_ADDRESS = '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549';
export const CANONICAL_BINANCE_HOT = '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be';

export const CANONICAL_DEMO_TRACE: { traceResult: TraceResult; graphData: GraphData } = {
  traceResult: {
    traceId: 'trace_demo_delhi_0812',
    sourceAddress: CANONICAL_SUSPECT_ADDRESS,
    chain: 'ethereum',
    identifiedVasp: {
      name: 'Binance: Hot Wallet 14',
      type: 'Known VASP hot-wallet attribution',
      confidence: 0.94,
      jurisdiction: 'International',
    },
    riskScore: 78.5,
    riskFactors: [
      {
        name: 'GNN Behavioral Classification',
        score: 88,
        weight: 35,
        description: 'High in-degree sweep consolidation pattern characteristic of Binance omnibus deposit.',
      },
      {
        name: 'VASP Sweep Consolidation',
        score: 94,
        weight: 35,
        description: 'Terminal destination identified as Binance: Hot Wallet 14 with 98.4% sweep ratio.',
      },
      {
        name: 'Hop-Decayed Proximity Risk',
        score: 79,
        weight: 30,
        description: 'Exponential decay factor applied across all intermediate hops from suspect.',
      },
    ],
    path: [
      {
        from: CANONICAL_VICTIM_ADDRESS,
        to: CANONICAL_SUSPECT_ADDRESS,
        amount: 30000.0,
        currency: 'USDT',
        timestamp: '2026-09-28T14:30:00Z',
        txHash: '0x1a2b3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5',
        type: 'transfer',
      },
      {
        from: CANONICAL_SUSPECT_ADDRESS,
        to: CANONICAL_MULE_ADDRESS,
        amount: 29900.0,
        currency: 'USDT',
        timestamp: '2026-09-28T14:44:00Z',
        txHash: '0x2b3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f6',
        type: 'transfer',
      },
      {
        from: CANONICAL_MULE_ADDRESS,
        to: CANONICAL_DEPOSIT_ADDRESS,
        amount: 29500.0,
        currency: 'USDT',
        timestamp: '2026-09-28T15:12:00Z',
        txHash: '0x3c4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f670',
        type: 'transfer',
      },
      {
        from: CANONICAL_DEPOSIT_ADDRESS,
        to: CANONICAL_BINANCE_HOT,
        amount: 29028.0,
        currency: 'USDT',
        timestamp: '2026-09-28T15:34:00Z',
        txHash: '0x4d5e6f708192a1b2c3d4e5f6708192a1b2c3d4e5f6708192a1b2c3d4e5f67081',
        type: 'exchange',
      },
    ],
  },
  graphData: {
    nodes: [
      {
        data: {
          id: CANONICAL_VICTIM_ADDRESS,
          label: 'Victim EOA',
          type: 'intermediate',
        },
      },
      {
        data: {
          id: CANONICAL_SUSPECT_ADDRESS,
          label: 'Suspect Root (0x9d81...b761)',
          type: 'suspect',
          riskScore: 88,
        },
      },
      {
        data: {
          id: CANONICAL_MULE_ADDRESS,
          label: 'Mule / Peel EOA',
          type: 'intermediate',
          riskScore: 65,
        },
      },
      {
        data: {
          id: CANONICAL_DEPOSIT_ADDRESS,
          label: 'Binance Deposit Candidate',
          type: 'exchange',
          riskScore: 25,
        },
      },
      {
        data: {
          id: CANONICAL_BINANCE_HOT,
          label: 'Binance: Hot Wallet 14',
          type: 'vasp',
          riskScore: 15,
        },
      },
    ],
    edges: [
      {
        data: {
          source: CANONICAL_VICTIM_ADDRESS,
          target: CANONICAL_SUSPECT_ADDRESS,
          amount: 30000.0,
          currency: 'USDT',
          txHash: '0x1a2b...d4e5',
        },
      },
      {
        data: {
          source: CANONICAL_SUSPECT_ADDRESS,
          target: CANONICAL_MULE_ADDRESS,
          amount: 29900.0,
          currency: 'USDT',
          txHash: '0x2b3c...e5f6',
        },
      },
      {
        data: {
          source: CANONICAL_MULE_ADDRESS,
          target: CANONICAL_DEPOSIT_ADDRESS,
          amount: 29500.0,
          currency: 'USDT',
          txHash: '0x3c4d...f670',
        },
      },
      {
        data: {
          source: CANONICAL_DEPOSIT_ADDRESS,
          target: CANONICAL_BINANCE_HOT,
          amount: 29028.0,
          currency: 'USDT',
          txHash: '0x4d5e...7081',
        },
      },
    ],
  },
};

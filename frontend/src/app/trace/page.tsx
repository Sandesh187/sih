'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import WalletInput from '@/components/WalletInput';
import FlowGraph from '@/components/FlowGraph';
import TimelineView from '@/components/TimelineView';
import WalletSidePanel from '@/components/WalletSidePanel';
import TraceDepthSlider from '@/components/TraceDepthSlider';
import TimeMachineSlider from '@/components/TimeMachineSlider';
import RiskAssessment from '@/components/RiskAssessment';
import TraceResults from '@/components/TraceResults';
import { api } from '@/lib/api';
import { TraceResult, GraphData } from '@/types';

import { Suspense } from 'react';

function TracePageContent() {
  const searchParams = useSearchParams();
  const traceIdFromUrl = searchParams.get('id');
  const addressFromUrl = searchParams.get('address');
  const chainFromUrl = searchParams.get('chain');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ traceResult: TraceResult, graphData: GraphData } | null>(null);
  const [traceDepth, setTraceDepth] = useState(5);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [chain, setChain] = useState<string>(chainFromUrl || 'ethereum');

  const [timeIndex, setTimeIndex] = useState<number>(-1);
  const [hideDust, setHideDust] = useState(false);

  // Auto-load trace when navigated from dashboard with ?id= or ?address=
  useEffect(() => {
    if (traceIdFromUrl && !result && !loading) {
      loadExistingTrace(traceIdFromUrl);
    } else if (addressFromUrl && !result && !loading) {
      const address = addressFromUrl;
      const selectedChain = chainFromUrl || 'ethereum';
      handleTrace(address, selectedChain);
    }
  }, [traceIdFromUrl, addressFromUrl]);

  const loadExistingTrace = async (traceId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedNode(null);
    setTimeIndex(-1);
    setHideDust(false);
    
    try {
      const data = await api.getTraceResult(traceId);
      setChain(data.traceResult.chain);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trace. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrace = async (address: string, selectedChain: string, depth = traceDepth) => {
    // Basic validation
    if (selectedChain === 'ethereum' && !address.startsWith('0x')) {
      setError('Invalid Ethereum address format. Must start with 0x.');
      return;
    }
    if (selectedChain === 'tron' && !address.startsWith('T')) {
      setError('Invalid Tron address format. Tron addresses must start with T (Base58Check).');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedNode(null);
    setChain(selectedChain);
    setTimeIndex(-1); // Reset time machine on new trace
    setHideDust(false); // Reset dust filter on new trace
    
    try {
      const data = await api.traceWallet(address, selectedChain, depth);
      setResult(data);
      window.history.replaceState(null, '', `/trace?id=${data.traceResult.traceId}&address=${address}&chain=${selectedChain}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trace wallet. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const getMaxHops = () => {
    if (!result) return 1;
    if (result.traceResult.path && result.traceResult.path.length > 0) {
      return result.traceResult.path.length;
    }
    // Fallback: calculate max BFS depth in graphData
    const sourceLower = result.traceResult.sourceAddress.toLowerCase();
    const depths: Record<string, number> = { [sourceLower]: 0 };
    const queue = [sourceLower];
    let maxD = 1;
    while (queue.length > 0) {
      const u = queue.shift()!;
      const d = depths[u];
      result.graphData.edges.forEach(e => {
        const s = e.data.source.toLowerCase();
        const t = e.data.target.toLowerCase();
        if (s === u && depths[t] === undefined) {
          depths[t] = d + 1;
          if (d + 1 > maxD) maxD = d + 1;
          queue.push(t);
        }
      });
    }
    return Math.max(maxD, 1);
  };

  const getVisibleGraphData = () => {
    if (!result) return { nodes: [], edges: [] };
    
    const path = result.traceResult.path;
    let baseEdges = [...result.graphData.edges];
    let baseNodes = [...result.graphData.nodes];
    const maxHops = getMaxHops();

    // If timeIndex is active (not -1 and not all hops), progressively filter nodes & edges
    if (timeIndex !== -1 && timeIndex < maxHops) {
      const sourceLower = result.traceResult.sourceAddress.toLowerCase();
      const visibleAddresses = new Set<string>([sourceLower]);

      if (path && path.length > 0) {
        // Step 0: Only suspect. Step 1: Hop 1. Step 2: Hop 2...
        for (let i = 0; i < timeIndex; i++) {
          if (path[i]) {
            visibleAddresses.add(path[i].from.toLowerCase());
            visibleAddresses.add(path[i].to.toLowerCase());
          }
        }
      } else {
        // Fallback BFS depth filtering
        const depths: Record<string, number> = { [sourceLower]: 0 };
        const queue = [sourceLower];
        while (queue.length > 0) {
          const u = queue.shift()!;
          const d = depths[u];
          result.graphData.edges.forEach(e => {
            const s = e.data.source.toLowerCase();
            const t = e.data.target.toLowerCase();
            if (s === u && depths[t] === undefined) {
              depths[t] = d + 1;
              queue.push(t);
            }
          });
        }
        Object.entries(depths).forEach(([addr, d]) => {
          if (d <= timeIndex) visibleAddresses.add(addr);
        });
      }

      baseNodes = baseNodes.filter(n => visibleAddresses.has(n.data.id.toLowerCase()));
      baseEdges = baseEdges.filter(e => 
        visibleAddresses.has(e.data.source.toLowerCase()) && 
        visibleAddresses.has(e.data.target.toLowerCase())
      );
    }

    // Apply Smart Noise Pruning (Dust Filter)
    if (hideDust) {
      const isEth = chain === 'ethereum';
      const dustThreshold = isEth ? 0.01 : 10;
      
      baseEdges = baseEdges.filter(e => e.data.amount >= dustThreshold);

      const connectedNodes = new Set<string>([result.traceResult.sourceAddress.toLowerCase()]);
      baseEdges.forEach(e => {
        connectedNodes.add(e.data.source.toLowerCase());
        connectedNodes.add(e.data.target.toLowerCase());
      });
      baseNodes = baseNodes.filter(n => connectedNodes.has(n.data.id.toLowerCase()));
    }

    return { nodes: baseNodes, edges: baseEdges };
  };

  const visibleGraphData = getVisibleGraphData();

  const highlightedPath = result?.traceResult?.path && result.traceResult.path.length > 0
    ? result.traceResult.path.map((step) => step.from).concat(result.traceResult.path[result.traceResult.path.length - 1].to)
    : [];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto">
      {!result && !loading && (
        <div className="mb-10 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gradient">VASP Attribution Engine</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Deep-trace cryptocurrency transactions to identify terminal Virtual Asset Service Providers and assess counterparty risk.
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto mb-8 relative z-10">
        <WalletInput 
          onSubmit={handleTrace} 
          isLoading={loading} 
          initialAddress={addressFromUrl || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'} 
          initialChain={chainFromUrl || 'ethereum'}
        />
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto mb-8 bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-xl p-4 flex items-start gap-3 text-[#ff4444]"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Trace Error</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-[#ff4444]/20 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {loading && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center px-4">
              <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="h-[500px] w-full glass-card rounded-xl animate-pulse bg-white/5" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[300px] glass-card rounded-xl animate-pulse bg-white/5" />
              <div className="h-[300px] glass-card rounded-xl animate-pulse bg-white/5" />
            </div>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-xl border border-white/5">
              <TraceDepthSlider
                value={traceDepth}
                onChange={setTraceDepth}
                onCommit={(depth) => handleTrace(result.traceResult.sourceAddress, chain, depth)}
                max={15}
              />
              
              <TimeMachineSlider 
                value={timeIndex}
                max={getMaxHops()}
                onChange={setTimeIndex}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHideDust(!hideDust)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${hideDust ? 'bg-[#00d4ff]/10 border-[#00d4ff]/50 text-[#00d4ff]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                  title="Hide transactions < 0.01 ETH or $10"
                >
                  <Filter className={`w-4 h-4 ${hideDust ? 'fill-current' : ''}`} />
                  Smart Noise Pruning
                </button>

                <button 
                  onClick={toggleBookmark}
                  className={`p-2.5 rounded-lg border transition-all duration-300 ${isBookmarked ? 'bg-[#ffaa00]/10 border-[#ffaa00]/50 text-[#ffaa00]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                  title="Bookmark this trace"
                >
                  <Star className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Graph Section */}
            <div className="h-[600px] w-full relative z-0">
              <FlowGraph 
                data={visibleGraphData} 
                onNodeClick={(id) => setSelectedNode(id)} 
                highlightedPath={highlightedPath}
              />
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <TimelineView path={result.traceResult.path} />
              </div>
              <div className="flex flex-col gap-6">
                <TraceResults result={result.traceResult} />
                <RiskAssessment 
                  riskScore={result.traceResult.riskScore}
                  riskFactors={result.traceResult.riskFactors}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WalletSidePanel 
        address={selectedNode} 
        isOpen={!!selectedNode} 
        onClose={() => setSelectedNode(null)} 
        chain={chain}
      />
    </div>
  );
}

export default function TracePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#00d4ff]">Loading trace engine...</div>}>
      <TracePageContent />
    </Suspense>
  );
}

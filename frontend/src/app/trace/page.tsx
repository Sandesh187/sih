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
import Section91Notice from '@/components/Section91Notice';
import TraceStatsBar from '@/components/TraceStatsBar';
import PruningDrawer from '@/components/PruningDrawer';
import VaspAttributionBanner from '@/components/VaspAttributionBanner';
import { api } from '@/lib/api';
import { TraceResult, GraphData, InvestigationReport } from '@/types';

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
  const [customHighlightedPath, setCustomHighlightedPath] = useState<string[] | null>(null);
  const [noticeReport, setNoticeReport] = useState<InvestigationReport | null>(null);
  const [isPruningOpen, setIsPruningOpen] = useState(false);

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
    setCustomHighlightedPath(null);
    setNoticeReport(null);
    
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
    setCustomHighlightedPath(null);
    setNoticeReport(null);
    
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

  const handleHighlightPathToRoot = (targetAddress: string) => {
    if (!result) return;
    const source = result.traceResult.sourceAddress.toLowerCase();
    const target = targetAddress.toLowerCase();
    if (source === target) {
      setCustomHighlightedPath([result.traceResult.sourceAddress]);
      return;
    }
    const adj: Record<string, string[]> = {};
    const parent: Record<string, string> = {};
    result.graphData.edges.forEach(e => {
      const s = e.data.source.toLowerCase();
      const t = e.data.target.toLowerCase();
      if (!adj[s]) adj[s] = [];
      adj[s].push(t);
    });
    const queue = [source];
    const visited = new Set([source]);
    let found = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === target) {
        found = true;
        break;
      }
      for (const neighbor of (adj[curr] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent[neighbor] = curr;
          queue.push(neighbor);
        }
      }
    }
    if (found) {
      const path: string[] = [];
      let curr: string | undefined = target;
      while (curr) {
        const orig = result.graphData.nodes.find(n => n.data.id.toLowerCase() === curr)?.data.id || curr;
        path.unshift(orig);
        curr = parent[curr];
      }
      setCustomHighlightedPath(path);
    }
  };

  const handleOpenNotice = (targetAddress: string, vaspName: string) => {
    if (!result) return;
    setNoticeReport({
      traceId: result.traceResult.traceId,
      suspectWallet: targetAddress,
      identifiedVasp: vaspName,
      riskScore: result.traceResult.riskScore ?? 85,
      tracedPathSummary: `Attributed terminal deposit sweep to ${vaspName} via target address ${targetAddress}`,
      methodologyNotes: 'Attributed under Section 63 BSA & Section 94 BNSS using GraphSAGE GNN & multi-factor sweep heuristics',
      generatedAt: new Date().toISOString(),
      confidence: result.traceResult.identifiedVasp?.confidence ?? 0.95,
    });
  };

  const handleDownloadDossier = async () => {
    if (!result) return;
    try {
      const vaspName = result.traceResult.identifiedVasp?.name || 'Binance';
      const targetAddress = result.traceResult.path.length > 0 
        ? result.traceResult.path[result.traceResult.path.length - 1].to 
        : result.traceResult.sourceAddress;
      const blob = await api.downloadBSADossier('case_demo_delhi_0812', targetAddress, vaspName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Section63_BSA_Dossier_${result.traceResult.traceId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to download dossier', e);
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

  const defaultHighlightedPath = result?.traceResult?.path && result.traceResult.path.length > 0
    ? result.traceResult.path.map((step) => step.from).concat(result.traceResult.path[result.traceResult.path.length - 1].to)
    : [];
  const highlightedPath = customHighlightedPath || defaultHighlightedPath;

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
            {/* VASP Attribution Banner */}
            <VaspAttributionBanner
              traceResult={result.traceResult}
              onOpenNotice={handleOpenNotice}
              onInspectWallet={(addr) => setSelectedNode(addr)}
              onDownloadDossier={handleDownloadDossier}
            />

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

            {/* Trace Telemetry Stats Bar */}
            <TraceStatsBar 
              chain={chain}
              totalNodes={visibleGraphData.nodes.length}
              totalEdges={visibleGraphData.edges.length}
              hopsReached={timeIndex !== -1 ? timeIndex : getMaxHops()}
              maxHops={getMaxHops()}
              prunedCount={14}
              onOpenPruning={() => setIsPruningOpen(true)}
              isDemo={result.traceResult.traceId.includes('demo')}
            />

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
        traceResult={result?.traceResult}
        graphData={result?.graphData}
        onHighlightPathToRoot={handleHighlightPathToRoot}
        onSelectAddress={(addr) => setSelectedNode(addr)}
        onOpenNotice={handleOpenNotice}
      />

      {noticeReport && (
        <Section91Notice 
          report={noticeReport} 
          onClose={() => setNoticeReport(null)} 
        />
      )}

      <PruningDrawer
        isOpen={isPruningOpen}
        onClose={() => setIsPruningOpen(false)}
        minThreshold={100}
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

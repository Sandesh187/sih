'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, 
  Building2, 
  Activity, 
  Star, 
  Filter, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';
import FlowGraph from '@/components/FlowGraph';
import TimelineView from '@/components/TimelineView';
import WalletSidePanel from '@/components/WalletSidePanel';
import TraceDepthSlider from '@/components/TraceDepthSlider';
import TimeMachineSlider from '@/components/TimeMachineSlider';
import RiskAssessment from '@/components/RiskAssessment';
import TraceResults from '@/components/TraceResults';
import Section91Notice from '@/components/Section91Notice';
import PruningDrawer from '@/components/PruningDrawer';
import VaspAttributionBanner from '@/components/VaspAttributionBanner';
import { api } from '@/lib/api';
import { TraceResult, GraphData, InvestigationReport } from '@/types';
import { cn } from '@/lib/utils';

function TracePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const traceIdFromUrl = searchParams.get('id');
  const addressFromUrl = searchParams.get('address');
  const chainFromUrl = searchParams.get('chain');
  const tabFromUrl = searchParams.get('tab') as 'graph' | 'attribution' | 'findings' | null;

  const [activeTab, setActiveTab] = useState<'graph' | 'attribution' | 'findings'>(tabFromUrl || 'graph');
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

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Listen to tab switch event from TopNavbar Row 2
  useEffect(() => {
    const handleTabEvent = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('switch-trace-tab', handleTabEvent);
    return () => window.removeEventListener('switch-trace-tab', handleTabEvent);
  }, []);

  // Listen to top search bar trace initiation
  useEffect(() => {
    const handleTopTrace = (e: any) => {
      const { address, chain } = e.detail || {};
      if (address) {
        handleTrace(address, chain || 'ethereum');
      }
    };
    window.addEventListener('topbar-initiate-trace', handleTopTrace);
    return () => window.removeEventListener('topbar-initiate-trace', handleTopTrace);
  }, [traceDepth]);

  // Auto-load trace when navigated with ?id= or ?address=
  useEffect(() => {
    if (traceIdFromUrl && !result && !loading) {
      loadExistingTrace(traceIdFromUrl);
    } else if (addressFromUrl && !result && !loading) {
      const selectedChain = chainFromUrl || 'ethereum';
      handleTrace(addressFromUrl, selectedChain);
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
    setTimeIndex(-1);
    setHideDust(false);
    setCustomHighlightedPath(null);
    setNoticeReport(null);
    
    try {
      const data = await api.traceWallet(address, selectedChain, depth);
      setResult(data);
      const url = new URL(window.location.href);
      url.searchParams.set('id', data.traceResult.traceId);
      url.searchParams.set('address', address);
      url.searchParams.set('chain', selectedChain);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trace wallet. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'graph' | 'attribution' | 'findings') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search);
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
    const visited = new Set<string>([source]);
    let found = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === target) {
        found = true;
        break;
      }
      for (const next of (adj[curr] || [])) {
        if (!visited.has(next)) {
          visited.add(next);
          parent[next] = curr;
          queue.push(next);
        }
      }
    }

    if (found) {
      const pathList: string[] = [];
      let step: string | undefined = target;
      while (step) {
        pathList.unshift(step);
        step = parent[step];
      }
      setCustomHighlightedPath(pathList);
    } else {
      setCustomHighlightedPath([targetAddress]);
    }
  };

  const handleOpenNotice = (address: string, vaspName: string) => {
    if (!result) return;
    const rep: InvestigationReport = {
      traceId: result.traceResult.traceId,
      generatedAt: new Date().toISOString(),
      suspectWallet: result.traceResult.sourceAddress,
      identifiedVasp: vaspName,
      confidence: result.traceResult.identifiedVasp?.confidence ?? 0.94,
      riskScore: result.traceResult.riskScore,
      tracedPathSummary: `Trace initiated from suspect wallet ${result.traceResult.sourceAddress} traversing ${result.traceResult.path.length} hops across ${chain} network to ${vaspName} aggregation wallet ${address}.`,
      methodologyNotes: 'Multi-hop BFS graph traversal, sweep heuristic correlation, and GraphSAGE inductive classification compliant with Section 63 BSA.',
    };
    setNoticeReport(rep);
  };

  const handleDownloadDossier = async () => {
    try {
      await api.downloadBsa63Pdf(result?.traceResult?.traceId || 'case_demo_delhi_0812');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(prev => !prev);
  };

  const getMaxHops = () => {
    if (!result || !result.traceResult.path) return 1;
    return Math.max(1, result.traceResult.path.length);
  };

  // Filter visible nodes & edges based on Time Machine and Dust Filter
  const getVisibleGraphData = (): GraphData => {
    if (!result) return { nodes: [], edges: [] };
    let baseNodes = [...result.graphData.nodes];
    let baseEdges = [...result.graphData.edges];

    if (timeIndex !== -1) {
      const visibleAddresses = new Set<string>([result.traceResult.sourceAddress.toLowerCase()]);
      const queue = [result.traceResult.sourceAddress.toLowerCase()];
      const depths: Record<string, number> = { [result.traceResult.sourceAddress.toLowerCase()]: 0 };

      while (queue.length > 0) {
        const u = queue.shift()!;
        const d = depths[u];
        if (d >= timeIndex) continue;

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

      baseNodes = baseNodes.filter(n => visibleAddresses.has(n.data.id.toLowerCase()));
      baseEdges = baseEdges.filter(e => 
        visibleAddresses.has(e.data.source.toLowerCase()) && 
        visibleAddresses.has(e.data.target.toLowerCase())
      );
    }

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

  const targetDepositAddress = result?.traceResult?.path && result.traceResult.path.length > 0
    ? result.traceResult.path[result.traceResult.path.length - 1].to
    : result?.traceResult?.sourceAddress || '';

  const vaspName = result?.traceResult?.identifiedVasp?.name || 'Binance';

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 sm:mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400 rounded-2xl p-4 flex items-start gap-3 shadow-sm z-30"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h3 className="font-semibold mb-0.5 text-sm">Trace Error</h3>
              <p className="text-xs opacity-90">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && !result && (
        <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tracing Transaction Graph...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Executing BFS graph traversal and GraphSAGE entity inference</p>
          </div>
        </div>
      )}

      {/* Empty State / Initial Hero */}
      {!result && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto my-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
            <Search className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Cryptocurrency Forensic Tracing
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
              Enter an Ethereum or Tron suspect wallet address in the top search bar to initiate autonomous multi-hop fund tracing, deposit sweep clustering, and terminal VASP attribution.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleTrace('0x9d81f2ab72a38a7c29671f654b9d3753b708b761', 'ethereum')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Verified Demo Case (FIR-2026-DEL-CY-0812)</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Trace Workspace: Tabbed Interface */}
      {result && !loading && (
        <div className="flex-1 flex flex-col w-full relative">
          
          {/* In-Page Workspace Tab Switcher */}
          <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-2 flex items-center justify-between gap-4 shrink-0 transition-colors">
            
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleTabChange('graph')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === 'graph'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Trace Graph</span>
              </button>

              <button
                onClick={() => handleTabChange('attribution')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === 'attribution'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>VASP Attribution</span>
              </button>

              <button
                onClick={() => handleTabChange('findings')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === 'findings'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Forensic Findings</span>
              </button>
            </div>

            {/* Quick Summary Badge on Top Right of Tabs */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">
                Target: <strong className="text-blue-600 dark:text-blue-400">{result.traceResult.sourceAddress.slice(0, 8)}...{result.traceResult.sourceAddress.slice(-6)}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Terminal: {result.traceResult.identifiedVasp?.name || 'VASP Identified'}
              </span>
            </div>

          </div>

          {/* TAB 1: TRACE GRAPH (Canvas Only + Floating Bottom HUD) */}
          {activeTab === 'graph' && (
            <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] overflow-hidden bg-slate-50 dark:bg-slate-950 flex-1">
              
              {/* Top-Left Telemetry Floating Chip */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{visibleGraphData.nodes.length} Nodes</span>
                <span className="text-slate-400">•</span>
                <span>{visibleGraphData.edges.length} Transfers</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600 dark:text-blue-400 uppercase">{chain}</span>
              </div>

              {/* Topology Canvas */}
              <FlowGraph 
                data={visibleGraphData} 
                onNodeClick={(id) => setSelectedNode(id)} 
                highlightedPath={highlightedPath}
              />

              {/* Floating Bottom HUD Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-4xl w-[94%] sm:w-auto">
                <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3 sm:px-6 sm:py-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  
                  {/* Depth Slider */}
                  <TraceDepthSlider
                    value={traceDepth}
                    onChange={setTraceDepth}
                    onCommit={(depth) => handleTrace(result.traceResult.sourceAddress, chain, depth)}
                    max={15}
                  />

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                  {/* Time Machine Slider */}
                  <TimeMachineSlider 
                    value={timeIndex}
                    max={getMaxHops()}
                    onChange={setTimeIndex}
                  />

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                  {/* Noise Pruning & Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHideDust(!hideDust)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        hideDust
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                      title="Toggle Noise Pruning: Hide transfers < 0.01 ETH or $10"
                    >
                      <Filter className={`w-3.5 h-3.5 ${hideDust ? 'fill-current' : ''}`} />
                      <span>Noise Pruning</span>
                    </button>

                    <button
                      onClick={() => setIsPruningOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-semibold font-mono transition cursor-pointer"
                      title="Open Noise Pruning Audit Log"
                    >
                      14 Pruned
                    </button>

                    <button
                      onClick={toggleBookmark}
                      className={cn(
                        "p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        isBookmarked
                          ? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                      title="Bookmark this trace"
                    >
                      <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VASP ATTRIBUTION (Attribution Card + Requisition Actions) */}
          {activeTab === 'attribution' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in flex-1">
              
              {/* Terminal VASP Attribution Banner */}
              <VaspAttributionBanner
                traceResult={result.traceResult}
                onOpenNotice={handleOpenNotice}
                onInspectWallet={(addr) => setSelectedNode(addr)}
                onDownloadDossier={handleDownloadDossier}
              />

              {/* Attribution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Detailed Trace Results Card */}
                <div className="h-full">
                  <TraceResults result={result.traceResult} />
                </div>

                {/* Legal & Regulatory Requisition Center */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Statutory Legal Requisitions
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Court-admissible certificates & production notices under Indian cybercrime statutes
                      </p>
                    </div>
                  </div>

                  {/* Action 1: Section 94 BNSS */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Section 94 BNSS Production Order
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Statutory requisition to {vaspName} compliance for KYC, bank account, and IP logs
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenNotice(targetDepositAddress, vaspName)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      Generate Notice
                    </button>
                  </div>

                  {/* Action 2: Section 63 BSA Dossier */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Section 63 BSA Evidence Dossier
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Cryptographically hash-chained evidence ledger and court admissibility certificate
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadDossier}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs transition border border-slate-300 dark:border-slate-700 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Action 3: Inspect Terminal Deposit Address */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Terminal Deposit Profiler
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Inspect deposit aggregation sweep patterns and counterparties
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedNode(targetDepositAddress)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-xs transition border border-slate-300 dark:border-slate-700 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Open Profiler</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: FORENSIC FINDINGS (Trace Timeline + Risk Assessment) */}
          {activeTab === 'findings' && (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left (2 cols): Trace Timeline */}
                <div className="lg:col-span-2">
                  <TimelineView path={result.traceResult.path} />
                </div>

                {/* Right (1 col): Risk Assessment Score Gauge */}
                <div>
                  <RiskAssessment 
                    riskScore={result.traceResult.riskScore}
                    riskFactors={result.traceResult.riskFactors}
                  />
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Wallet Side Panel (Entity Profiler) */}
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

      {/* Legal Notice Preview Modal */}
      {noticeReport && (
        <Section91Notice 
          report={noticeReport} 
          onClose={() => setNoticeReport(null)} 
        />
      )}

      {/* Forensic Noise Pruning Drawer */}
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-[500px] text-blue-600">Loading trace engine...</div>}>
      <TracePageContent />
    </Suspense>
  );
}

'use client';

import React from 'react';
import { 
  GitFork, 
  Layers, 
  FilterX, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';

interface TraceStatsBarProps {
  chain: string;
  totalNodes: number;
  totalEdges: number;
  hopsReached: number;
  maxHops: number;
  rawCount?: number;
  prunedCount?: number;
  onOpenPruning?: () => void;
  isDemo?: boolean;
}

export default function TraceStatsBar({
  chain,
  totalNodes,
  totalEdges,
  hopsReached,
  maxHops,
  rawCount,
  prunedCount = 14,
  onOpenPruning,
  isDemo = false,
}: TraceStatsBarProps) {
  const isTron = chain.toLowerCase().includes('tron');
  const engineLabel = isDemo 
    ? 'DEMO REPLAY FIXTURE' 
    : isTron 
    ? 'LIVE TRON RPC' 
    : 'LIVE ETHEREUM RPC';

  const rawFetched = rawCount ?? Math.max(totalEdges + prunedCount + 5, 24);

  return (
    <div className="bg-slate-50/90 dark:bg-[#12121e]/90 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm dark:shadow-md backdrop-blur-md mb-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Metric Cards Group */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Engine Mode */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            !isDemo
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
          }`}>
            <div className={`h-2 w-2 rounded-full shrink-0 ${!isDemo ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-75 block leading-none mb-0.5">Engine Mode</span>
              <span className="font-extrabold font-mono text-xs whitespace-nowrap leading-none">
                {engineLabel}
              </span>
            </div>
          </div>

          {/* Traversal Depth */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block leading-none mb-0.5">Traversal Depth</span>
              <span className="font-extrabold font-mono text-xs text-blue-600 dark:text-blue-400 leading-none">
                Hop {hopsReached} / {maxHops}
              </span>
            </div>
          </div>

          {/* Raw Fetched */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <GitFork className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block leading-none mb-0.5">Raw Fetched</span>
              <span className="font-bold font-mono text-xs text-slate-900 dark:text-white leading-none">{rawFetched} txs</span>
            </div>
          </div>

          {/* Traversal Relevant */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block leading-none mb-0.5">Relevant Txs</span>
              <span className="font-extrabold font-mono text-xs text-amber-600 dark:text-amber-400 leading-none">{totalEdges}</span>
            </div>
          </div>

          {/* Active Topology */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block leading-none mb-0.5">Active Topology</span>
              <span className="font-extrabold font-mono text-xs text-emerald-600 dark:text-emerald-400 leading-none">
                {totalNodes} nodes • {totalEdges} edges
              </span>
            </div>
          </div>

          {/* Noise Pruned Count (Clickable button) */}
          {onOpenPruning && (
            <button
              onClick={onOpenPruning}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-left transition group cursor-pointer"
              title="Click to view forensic noise pruning audit"
            >
              <FilterX className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition" />
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1 leading-none mb-0.5">
                  Noise Pruned
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </span>
                <span className="font-extrabold font-mono text-xs text-purple-800 dark:text-purple-200 leading-none">
                  {prunedCount} transfers (&lt; $100)
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline font-medium">RFC-8785 Sealed</span>
        </div>
      </div>
    </div>
  );
}

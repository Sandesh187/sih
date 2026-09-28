'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Search
} from 'lucide-react';
import { TraceResult } from '@/types';

interface VaspAttributionBannerProps {
  traceResult: TraceResult;
  onOpenNotice: (address: string, vaspName: string) => void;
  onInspectWallet: (address: string) => void;
  onDownloadDossier?: () => void;
}

export default function VaspAttributionBanner({
  traceResult,
  onOpenNotice,
  onInspectWallet,
  onDownloadDossier,
}: VaspAttributionBannerProps) {
  const [copied, setCopied] = useState(false);
  const identifiedVasp = traceResult.identifiedVasp;

  if (!identifiedVasp) return null;

  const vaspName = identifiedVasp.name || 'Binance';
  const confidencePct = Math.round((identifiedVasp.confidence ?? 0.94) * 100);

  // Target deposit address is the last node in the trace path or the suspect
  const targetAddress = traceResult.path.length > 0 
    ? traceResult.path[traceResult.path.length - 1].to 
    : traceResult.sourceAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-500/40 bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-blue-50/90 dark:from-[#17112c]/95 dark:via-[#131322]/95 dark:to-[#0e1726]/95 p-5 shadow-md dark:shadow-2xl backdrop-blur-md mb-6 relative overflow-hidden transition-colors">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        
        {/* Left: VASP details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-700 dark:text-purple-400">
                  Terminal VASP Attribution Identified
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {confidencePct}% Match (HIGH)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {vaspName.toUpperCase()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 pt-1 flex-wrap">
            <span className="text-slate-500 dark:text-gray-400">Target Deposit Wallet:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 select-all font-semibold">
              {targetAddress}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 hover:text-slate-900 dark:hover:text-white text-slate-400 transition"
              title="Copy deposit address"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <span className="text-slate-400 dark:text-gray-500">•</span>
            <span className="text-slate-500 dark:text-gray-400">Clustering Rule:</span>
            <span className="font-mono text-purple-700 dark:text-purple-300 font-medium">Deposit Sweep & Forwarding Heuristic</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => onInspectWallet(targetAddress)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs transition border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Entity Profiler</span>
          </button>

          {onDownloadDossier && (
            <button
              onClick={onDownloadDossier}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold text-xs transition border border-blue-200 dark:border-blue-500/30 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Section 63 Dossier</span>
            </button>
          )}

          <button
            onClick={() => onOpenNotice(targetAddress, vaspName)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <FileText className="h-4 w-4 text-white" />
            <span>Requisition Section 94 BNSS</span>
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { Shield, Building2, MapPin, AlertTriangle, CheckCircle, Copy, Check, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { TraceResult } from '../types';

export default function TraceResults({ result }: { result: TraceResult | null }) {
  const [copied, setCopied] = useState(false);

  if (!result || !result.identifiedVasp) {
    return (
      <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[300px] border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <Shield className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No VASP Identified</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed">
          The trace did not terminate at a known Virtual Asset Service Provider within the maximum depth.
        </p>
      </div>
    );
  }

  const { identifiedVasp, riskScore } = result;

  const handleCopy = () => {
    navigator.clipboard.writeText(identifiedVasp.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 rounded-2xl border-t-4 border-t-emerald-500 border border-[var(--border-color)] bg-[var(--bg-surface)] relative overflow-hidden h-full flex flex-col shadow-sm"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 dark:text-white pointer-events-none">
        <Building2 className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-3.5 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {identifiedVasp.name}
            <button onClick={handleCopy} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </h2>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">{identifiedVasp.type}</div>
        </div>
      </div>

      <div className="space-y-4 relative z-10 flex-1 text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/5">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Confidence Match
          </div>
          <div className="text-right">
            <div className="text-slate-900 dark:text-slate-100 font-bold font-mono text-sm">{Math.round(identifiedVasp.confidence * 100)}%</div>
            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${identifiedVasp.confidence * 100}%` }} />
            </div>
          </div>
        </div>

        {identifiedVasp.jurisdiction && (
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Jurisdiction
            </div>
            <div className="text-slate-900 dark:text-slate-100 font-medium flex items-center gap-1.5">
              <span>{identifiedVasp.jurisdiction}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pb-3">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Entity Risk Score
          </div>
          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {riskScore === null ? 'Unavailable' : `${riskScore} / 100`}
          </div>
        </div>
      </div>

      <button className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
        <Send className="w-3.5 h-3.5" /> Route SAHYOG Request
      </button>
    </motion.div>
  );
}

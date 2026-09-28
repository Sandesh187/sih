'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Clock } from 'lucide-react';
import { TracePathStep } from '../types';

export default function TimelineView({ path }: { path: TracePathStep[] }) {
  if (!path || path.length === 0) return null;

  const getDotColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-slate-400';
      case 'exchange': return 'bg-blue-500';
      case 'mixer': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startTime = new Date(path[0].timestamp).getTime();
  const endTime = new Date(path[path.length - 1].timestamp).getTime();
  const totalElapsedHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Trace Timeline & Hop Sequence
      </h3>
      
      <div className="relative border-l border-slate-200 dark:border-white/10 ml-4 pl-8 space-y-6">
        {path.map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-[#12121a] shadow-sm ${getDotColor(step.type)}`} />
            
            <div className="bg-slate-50 dark:bg-[#0a0a0f]/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Hop {idx + 1} • <span className="text-blue-600 dark:text-blue-400">{step.type}</span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{new Date(step.timestamp).toLocaleString()}</div>
              </div>
              
              <div className="flex items-center gap-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                <div className="flex-1 truncate hover:text-slate-900 dark:hover:text-white transition-colors" title={step.from}>
                  {step.from.substring(0, 8)}...{step.from.substring(step.from.length - 6)}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold text-sm px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full whitespace-nowrap">
                  {step.amount} {step.currency}
                </div>
                <div className="flex-1 truncate hover:text-slate-900 dark:hover:text-white transition-colors text-right" title={step.to}>
                  {step.to.substring(0, 8)}...{step.to.substring(step.to.length - 6)}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="text-slate-400 dark:text-slate-500 font-mono truncate flex-1 flex items-center gap-2">
                  Tx: {step.txHash}
                  <button onClick={() => copyToClipboard(step.txHash)} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <a href={`#tx-${step.txHash}`} className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline ml-4">
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400">
        Total elapsed movement window: <span className="text-slate-900 dark:text-white font-semibold font-mono">{totalElapsedHours} hours</span>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Clock } from 'lucide-react';
import { TracePathStep } from '../types';

export default function TimelineView({ path }: { path: TracePathStep[] }) {
  if (!path || path.length === 0) return null;

  const getDotColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-gray-400';
      case 'exchange': return 'bg-[#00d4ff]';
      case 'mixer': return 'bg-[#ff4444]';
      default: return 'bg-[#ffaa00]';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startTime = new Date(path[0].timestamp).getTime();
  const endTime = new Date(path[path.length - 1].timestamp).getTime();
  const totalElapsedHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="glass-card p-6 rounded-xl mt-6 relative overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#00d4ff]" /> Trace Timeline
      </h3>
      
      <div className="relative border-l border-white/10 ml-4 pl-8 space-y-8">
        {path.map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-2 w-4 h-4 rounded-full border-2 border-[#12121a] shadow-[0_0_8px_rgba(255,255,255,0.2)] ${getDotColor(step.type)}`} />
            
            <div className="bg-[#0a0a0f]/50 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                <div className="text-sm text-gray-400 font-medium">Hop {idx + 1} • <span className="uppercase text-[#00d4ff]">{step.type}</span></div>
                <div className="text-sm text-gray-500">{new Date(step.timestamp).toLocaleString()}</div>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-mono text-gray-300">
                <div className="flex-1 truncate hover:text-white transition-colors" title={step.from}>
                  {step.from.substring(0, 8)}...{step.from.substring(step.from.length - 6)}
                </div>
                <div className="text-[#00ff88] font-bold text-base px-3 py-1 bg-[#00ff88]/10 rounded-full whitespace-nowrap">
                  {step.amount} {step.currency}
                </div>
                <div className="flex-1 truncate hover:text-white transition-colors text-right" title={step.to}>
                  {step.to.substring(0, 8)}...{step.to.substring(step.to.length - 6)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-mono truncate flex-1 flex items-center gap-2">
                  Tx: {step.txHash}
                  <button onClick={() => copyToClipboard(step.txHash)} className="hover:text-white">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <a href={`#tx-${step.txHash}`} className="text-xs text-[#00d4ff] flex items-center gap-1 hover:underline ml-4">
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        Total elapsed time: <span className="text-white font-medium">{totalElapsedHours} hours</span>
      </div>
    </div>
  );
}

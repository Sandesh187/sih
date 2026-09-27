'use client';
import React, { useState } from 'react';
import { Shield, Building2, MapPin, AlertTriangle, CheckCircle, Copy, Check, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { TraceResult } from '../types';

export default function TraceResults({ result }: { result: TraceResult | null }) {
  const [copied, setCopied] = useState(false);

  if (!result || !result.identifiedVasp) {
    return (
      <div className="glass-card p-6 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Shield className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No VASP Identified</h3>
        <p className="text-gray-400 text-sm max-w-xs">
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
      className="glass-card p-6 rounded-xl border-t-4 border-t-[#00ff88] relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Building2 className="w-24 h-24" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[#00ff88]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {identifiedVasp.name}
            <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </h2>
          <div className="text-sm text-[#00d4ff] font-medium capitalize">{identifiedVasp.type}</div>
        </div>
      </div>

      <div className="space-y-4 relative z-10 flex-1">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="text-gray-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00ff88]" /> Confidence
          </div>
          <div className="text-right">
            <div className="text-white font-bold">{Math.round(identifiedVasp.confidence * 100)}%</div>
            <div className="w-24 h-1.5 bg-black/40 rounded-full mt-1">
              <div className="h-full bg-[#00ff88] rounded-full" style={{ width: `${identifiedVasp.confidence * 100}%` }} />
            </div>
          </div>
        </div>

        {identifiedVasp.jurisdiction && (
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00d4ff]" /> Jurisdiction
            </div>
            <div className="text-white font-medium flex items-center gap-2">
              {identifiedVasp.jurisdiction}
              <button className="text-gray-500 hover:text-white"><Copy className="w-3 h-3" /></button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pb-3">
          <div className="text-gray-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ffaa00]" /> Entity Risk
          </div>
          <div className="font-bold text-gray-400">
            {riskScore === null ? 'Unavailable' : `${riskScore} / 100`}
          </div>
        </div>
      </div>

      <button className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] hover:opacity-90 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,212,255,0.3)]">
        <Send className="w-4 h-4" /> Route SAHYOG Request
      </button>
    </motion.div>
  );
}

'use client';
import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

interface RiskAssessmentProps {
  riskScore: number | null;
  riskFactors: RiskFactor[];
}

export default function RiskAssessment({ riskScore, riskFactors }: RiskAssessmentProps) {
  if (riskScore === null) {
    return (
      <div className="glass-card p-6 rounded-xl w-full max-w-md h-full">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00d4ff]" /> Risk Assessment
        </h3>
        <div className="mt-6 text-sm text-gray-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#ffaa00] shrink-0" />
          <p>The tracing API has not supplied a risk assessment for this trace.</p>
        </div>
      </div>
    );
  }

  let riskLevel = 'Low';
  let riskColor = '#00ff88'; // green
  if (riskScore > 85) { riskLevel = 'Critical'; riskColor = '#ff4444'; }
  else if (riskScore > 65) { riskLevel = 'High'; riskColor = '#ffaa00'; }
  else if (riskScore > 30) { riskLevel = 'Medium'; riskColor = '#ffff00'; }

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col gap-6 w-full max-w-md h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00d4ff]" /> Risk Assessment
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="transparent"
              stroke="#1a1a24"
              strokeWidth="12"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="64"
              cy="64"
              r="45"
              fill="transparent"
              stroke={riskColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white leading-none">{riskScore}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">{riskLevel}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="text-sm text-gray-300">
            This trace exhibits <strong style={{ color: riskColor }}>{riskLevel.toLowerCase()} risk</strong> characteristics based on AI-driven entity behavior analysis.
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded border border-white/10">
            <AlertTriangle className="w-4 h-4 text-[#ffaa00]" /> Requires manual review
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Risk Factors Breakdown</h4>
        {riskFactors.map((factor, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white">{factor.name}</span>
              <span className="text-gray-400">{factor.weight}% wt</span>
            </div>
            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${factor.score}%` }}
                transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                className={`h-full ${factor.score > 70 ? 'bg-[#ff4444]' : factor.score > 40 ? 'bg-[#ffaa00]' : 'bg-[#00ff88]'}`}
              />
            </div>
            <div className="text-xs text-gray-500 truncate" title={factor.description}>{factor.description}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

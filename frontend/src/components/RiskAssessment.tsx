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
      <div className="glass-card p-6 rounded-2xl w-full max-w-md h-full border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Risk Assessment
        </h3>
        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>The tracing engine has not supplied a risk assessment for this target wallet.</p>
        </div>
      </div>
    );
  }

  let riskLevel = 'Low';
  let riskColor = '#10B981'; // emerald
  if (riskScore > 85) { riskLevel = 'Critical'; riskColor = '#EF4444'; }
  else if (riskScore > 65) { riskLevel = 'High'; riskColor = '#F59E0B'; }
  else if (riskScore > 30) { riskLevel = 'Medium'; riskColor = '#3B82F6'; }

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-6 w-full max-w-md h-full border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Counterparty Risk Score
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
              className="stroke-slate-200 dark:stroke-slate-800"
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
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-none font-mono">{riskScore}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{riskLevel}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This trace exhibits <strong style={{ color: riskColor }}>{riskLevel.toLowerCase()} risk</strong> characteristics based on AI-driven entity behavior analysis.
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Forensic Review Flagged</span>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 flex-1">
        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Risk Factors Breakdown
        </h4>
        {riskFactors.map((factor, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-800 dark:text-slate-200">{factor.name}</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">{factor.weight}% wt</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${factor.score}%` }}
                transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                className={`h-full ${factor.score > 70 ? 'bg-red-500' : factor.score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              />
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={factor.description}>{factor.description}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

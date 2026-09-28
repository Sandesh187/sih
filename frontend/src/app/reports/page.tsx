'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, FileText, Search, Scale } from 'lucide-react';
import { api } from '@/lib/api';
import { InvestigationReport } from '@/types';
import Section91Notice from '@/components/Section91Notice';

export default function ReportsPage() {
  const [traceId, setTraceId] = useState('');
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);

  const loadReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!traceId.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    try {
      setReport(await api.getReport(traceId.trim()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto text-[var(--text-main)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">Investigation Dossiers</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Load forensic reports for completed traces. Generate Section 94 BNSS notices and Section 63 BSA dossiers.
        </p>
      </header>

      <form onSubmit={loadReport} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row gap-3 mb-6 border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
        <label className="sr-only" htmlFor="trace-id">Trace ID</label>
        <input
          id="trace-id"
          value={traceId}
          onChange={(event) => setTraceId(event.target.value)}
          placeholder="Paste a completed trace ID (e.g. TRC-9823)"
          className="flex-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-50 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!traceId.trim() || loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Loading…' : 'Load Dossier'}
        </button>
      </form>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400 rounded-2xl p-4 flex gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {report && (
        <article className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
          <div className="flex items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Forensic Trace Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">Generated {new Date(report.generatedAt).toLocaleString()}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Trace ID</dt>
              <dd className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm break-all">{report.traceId}</dd>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Suspect Wallet</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-mono font-medium text-sm break-all">{report.suspectWallet}</dd>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Verified VASP</dt>
              <dd className="text-slate-900 dark:text-slate-100 font-bold text-sm">{report.identifiedVasp ?? 'No verified VASP identified'}</dd>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Attribution Confidence</dt>
              <dd className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">{Math.round(report.confidence * 100)}% Match</dd>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Risk Score</dt>
              <dd className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">{report.riskScore === null ? 'Unavailable' : `${report.riskScore} / 100`}</dd>
            </div>
          </dl>

          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Fund Flow Narrative</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {report.tracedPathSummary}
            </p>
          </section>
          
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Forensic Methodology & Legal Admissibility</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {report.methodologyNotes}
            </p>
          </section>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setShowLegalNotice(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Requisition Section 94 BNSS Notice
            </button>
          </div>
        </article>
      )}

      {showLegalNotice && report && (
        <Section91Notice report={report} onClose={() => setShowLegalNotice(false)} />
      )}
    </main>
  );
}

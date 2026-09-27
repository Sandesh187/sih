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
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Investigation Report</h1>
        <p className="text-gray-400">Load a report for a completed trace. Reports show only information returned by the tracing API.</p>
      </header>

      <form onSubmit={loadReport} className="glass-card p-5 rounded-xl flex flex-col sm:flex-row gap-3 mb-6">
        <label className="sr-only" htmlFor="trace-id">Trace ID</label>
        <input
          id="trace-id"
          value={traceId}
          onChange={(event) => setTraceId(event.target.value)}
          placeholder="Paste a completed trace ID"
          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!traceId.trim() || loading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-accent text-gray-900 font-semibold rounded-lg disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Loading…' : 'Load report'}
        </button>
      </form>

      {error && (
        <div className="mb-6 border border-danger/30 bg-danger/10 text-danger rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {report && (
        <article className="glass-card p-8 rounded-xl">
          <div className="flex items-start gap-4 border-b border-white/10 pb-6 mb-6">
            <div className="p-3 rounded-lg bg-accent/10 text-accent"><FileText className="w-6 h-6" /></div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trace report</h2>
              <p className="text-sm text-gray-400 mt-1">Generated {new Date(report.generatedAt).toLocaleString()}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Trace ID</dt>
              <dd className="text-accent font-mono break-all">{report.traceId}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Suspect wallet</dt>
              <dd className="text-white font-mono break-all">{report.suspectWallet}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Verified VASP</dt>
              <dd className="text-white">{report.identifiedVasp ?? 'No verified VASP identified'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Attribution confidence</dt>
              <dd className="text-white">{Math.round(report.confidence * 100)}%</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Risk score</dt>
              <dd className="text-white">{report.riskScore === null ? 'Unavailable' : `${report.riskScore} / 100`}</dd>
            </div>
          </dl>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Trace summary</h3>
            <p className="text-gray-300 leading-relaxed">{report.tracedPathSummary}</p>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Methodology</h3>
            <p className="text-gray-300 leading-relaxed">{report.methodologyNotes}</p>
          </section>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setShowLegalNotice(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:scale-[1.02]"
            >
              <Scale className="w-5 h-5" />
              Generate Section 91 CrPC Notice
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

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText, Shield, Activity, MessageSquare, Download,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, FileUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Case, EvidenceItem, IntegrityVerificationResult } from '@/types';

function truncateHash(hash: string) {
  if (!hash || hash.length <= 16) return hash;
  return `${hash.slice(0, 12)}...${hash.slice(-4)}`;
}

export default function CaseWorkspace() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'audit' | 'notes'>('overview');
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loadingCase, setLoadingCase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const [auditData, setAuditData] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [integrityResult, setIntegrityResult] = useState<IntegrityVerificationResult | null>(null);
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'evidence' && evidenceData.length === 0) fetchEvidence();
    if (activeTab === 'audit' && !auditData) fetchAudit();
    if (activeTab === 'notes') setNotes(caseData?.notes || []);
  }, [activeTab, id, caseData]);

  const fetchCase = async () => {
    setLoadingCase(true);
    setError(null);
    try {
      const data = await api.getCase(id);
      setCaseData(data);
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load case data');
    } finally {
      setLoadingCase(false);
    }
  };

  const fetchEvidence = async () => {
    setLoadingEvidence(true);
    try {
      const data = await api.getCaseEvidence(id);
      setEvidenceData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const fetchAudit = async () => {
    setLoadingAudit(true);
    try {
      const data = await api.getCaseAudit(id);
      setAuditData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!caseData) return;
    try {
      await api.updateCase(id, { status: newStatus as any });
      setCaseData({ ...caseData, status: newStatus as any });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDownloadNotice = async () => {
    try {
      await api.downloadBnss94Pdf(id);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleDownloadDossier = async () => {
    try {
      await api.downloadBsa63Pdf(id);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifyingIntegrity(true);
    try {
      const res = await api.verifyEvidenceIntegrity(id);
      setIntegrityResult(res);
    } catch (err: any) {
      console.error(err);
      setIntegrityResult({
        case_id: id,
        is_valid: false,
        total_records: 0,
        genesis_hash: '',
        latest_chain_hash: '',
        corrupted_sequence_number: null,
        verification_timestamp: new Date().toISOString(),
        audit_notes: 'Verification request failed'
      });
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await api.addCaseNote(id, newNote);
      await fetchCase();
      setNewNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  if (loadingCase) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 flex items-center justify-center flex-col text-red-600 dark:text-red-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Error Loading Case</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'OBSERVED': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'DERIVED': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
      case 'INFERRED': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
      case 'HUMAN_ACTION': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'under_review': return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'closed': return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getEventDotColor = (type: string) => {
    if (type.includes('CREATE') || type.includes('ADD')) return 'bg-emerald-500';
    if (type.includes('UPDATE') || type.includes('EDIT')) return 'bg-blue-500';
    if (type.includes('TAMPER') || type.includes('DELETE') || type.includes('CORRUPT')) return 'bg-red-500';
    return 'bg-slate-400';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] p-4 md:p-8 pb-20 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              Case Workspace
              <span className="text-blue-600 dark:text-blue-400 text-xl font-mono">#{id.substring(0, 8)}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-mono">
              FIR: {caseData.fir_number} • Complainant: {caseData.complainant_name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'evidence', label: 'Evidence Vault', icon: Shield },
            { id: 'audit', label: 'Audit Trail', icon: Activity },
            { id: 'notes', label: 'Notes', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3.5 flex items-center gap-2 font-medium text-sm transition-all duration-200 relative",
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 animate-fade-in">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">FIR Number</div>
                  <div className="font-mono font-semibold text-lg text-slate-900 dark:text-slate-100">{caseData.fir_number || 'N/A'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Police Station</div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">{caseData.police_station || 'N/A'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Status</div>
                  <select 
                    value={caseData.status} 
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className={cn("outline-none font-semibold px-2.5 py-1 rounded-lg text-xs mt-0.5 cursor-pointer", getStatusColor(caseData.status))}
                  >
                    <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">ACTIVE</option>
                    <option value="under_review" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">UNDER REVIEW</option>
                    <option value="draft" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">DRAFT</option>
                    <option value="closed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">CLOSED</option>
                  </select>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Complainant</div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">{caseData.complainant_name || 'N/A'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] lg:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Suspect Address</div>
                  <div className="font-mono text-blue-600 dark:text-blue-400 text-sm break-all font-semibold">{caseData.root_suspect_address || 'N/A'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Chain</div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-slate-100 capitalize">{caseData.chain || 'N/A'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Loss INR</div>
                  <div className="font-semibold text-lg text-amber-600 dark:text-amber-400 font-mono">₹{caseData.loss_amount_inr?.toLocaleString() || '0'}</div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Loss Crypto</div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-slate-100 font-mono">{caseData.loss_amount_crypto} {caseData.crypto_symbol}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={handleDownloadNotice}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-4 rounded-xl transition-all font-semibold shadow-sm hover:shadow"
                >
                  <FileUp className="w-5 h-5" />
                  <span>Download Section 94 BNSS Notice</span>
                </button>
                <button 
                  onClick={handleDownloadDossier}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 p-4 rounded-xl transition-all font-semibold shadow-sm hover:shadow"
                >
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Download Section 63 BSA Dossier</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: EVIDENCE VAULT */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Cryptographic Evidence Ledger</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Immutable SHA-256 hash-chained record for Section 63 BSA court admissibility.</p>
                </div>
                <button 
                  onClick={handleVerifyIntegrity}
                  disabled={verifyingIntegrity}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", verifyingIntegrity && "animate-spin")} />
                  {verifyingIntegrity ? 'Verifying...' : 'Verify Ledger Integrity'}
                </button>
              </div>

              {integrityResult && (
                <div className={cn(
                  "p-4 rounded-xl border flex items-start gap-3",
                  integrityResult.is_valid 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300" 
                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300"
                )}>
                  {integrityResult.is_valid ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                  <div>
                    <h4 className="font-bold text-sm">{integrityResult.is_valid ? 'Ledger Integrity Verified' : 'Integrity Compromised'}</h4>
                    {integrityResult.is_valid ? (
                      <p className="text-xs opacity-90 mt-1">
                        Genesis Hash: <span className="font-mono">{truncateHash(integrityResult.genesis_hash || '')}</span> • {integrityResult.total_records} records intact and cryptographically sound.
                      </p>
                    ) : (
                      <p className="text-xs opacity-90 mt-1">
                        Mismatch detected at Sequence #{integrityResult.corrupted_sequence_number}. Cryptographic chain is broken.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {loadingEvidence ? (
                <div className="text-center p-8 text-slate-500">Loading evidence ledger...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-100/90 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Seq #</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Content Hash</th>
                        <th className="p-4">Chain Hash</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                      {evidenceData.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">No evidence recorded yet.</td></tr>
                      ) : (
                        evidenceData.map((ev) => (
                          <tr key={ev.sequence_number} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-mono text-slate-500">{ev.sequence_number}</td>
                            <td className="p-4">
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", getTierColor(ev.tier))}>
                                {ev.tier}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{ev.title}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{ev.description}</td>
                            <td className="p-4 font-mono text-blue-600 dark:text-blue-400">{truncateHash(ev.content_hash)}</td>
                            <td className="p-4 font-mono text-slate-500">{truncateHash(ev.chain_hash)}</td>
                            <td className="p-4 text-slate-500 whitespace-nowrap">{ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  System Audit Trail
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-mono ml-2 border border-slate-200 dark:border-slate-700">
                    {auditData?.total_events || 0} Events
                  </span>
                </h3>

                {loadingAudit ? (
                   <div className="text-center p-8 text-slate-500">Loading audit trail...</div>
                ) : !auditData?.events?.length ? (
                  <div className="text-center p-8 text-slate-500">No events found.</div>
                ) : (
                  <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6 pb-4">
                    {auditData.events.map((event: any, idx: number) => (
                      <div key={idx} className="relative pl-8">
                        <div className={cn(
                          "absolute -left-2 top-1.5 w-4 h-4 rounded-full border-4 border-[var(--bg-app)]",
                          getEventDotColor(event.event_type)
                        )}></div>
                        <div className="glass-card p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] inline-block min-w-[320px]">
                          <div className="flex items-center justify-between gap-4 mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[10px] font-semibold">
                              {event.event_type}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{event.action_summary}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Actor: {event.actor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-6 max-w-3xl">
              
              <div className="glass-card p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <form onSubmit={handleAddNote}>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an investigation note, witness testimony reference, or case update..."
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[100px] resize-y"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {addingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center p-8 text-slate-500">No notes recorded yet.</div>
                ) : (
                  [...notes].reverse().map((note: any, idx: number) => (
                    <div key={idx} className="glass-card p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {note.author ? note.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{note.author || 'Unknown Officer'}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{note.timestamp ? new Date(note.timestamp).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{note.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

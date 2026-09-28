'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText, Shield, Activity, MessageSquare, Download,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, FileUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Case, EvidenceItem, AuditTrailResponse, IntegrityVerificationResult } from '@/types';

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

  const [auditData, setAuditData] = useState<any>(null); // { case_id, total_events, events }
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
      const updated = await api.updateCase(id, { status: newStatus });
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
      setIntegrityResult({ case_id: id, is_valid: false, total_records: 0, genesis_hash: '', latest_chain_hash: '', corrupted_sequence_number: null, verification_timestamp: new Date().toISOString(), audit_notes: 'Verification request failed' });
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const res = await api.addCaseNote(id, newNote);
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
        <div className="h-10 bg-white/5 rounded-lg w-1/4"></div>
        <div className="h-64 bg-white/5 rounded-xl w-full"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 flex items-center justify-center flex-col text-[#ff4444]">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Error Loading Case</h2>
        <p className="mt-2 text-gray-400">{error}</p>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'OBSERVED': return 'bg-cyan-900/50 text-[#00d4ff] border-[#00d4ff]/20';
      case 'DERIVED': return 'bg-blue-900/50 text-blue-400 border-blue-500/20';
      case 'INFERRED': return 'bg-purple-900/50 text-purple-400 border-purple-500/20';
      case 'HUMAN_ACTION': return 'bg-orange-900/50 text-[#ffaa00] border-[#ffaa00]/20';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-[#00ff88]/20 text-[#00ff88]';
      case 'IN_PROGRESS': return 'bg-[#ffaa00]/20 text-[#ffaa00]';
      case 'CLOSED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/10 text-white';
    }
  };

  const getEventDotColor = (type: string) => {
    if (type.includes('CREATE') || type.includes('ADD')) return 'bg-[#00ff88]';
    if (type.includes('UPDATE') || type.includes('EDIT')) return 'bg-[#00d4ff]';
    if (type.includes('TAMPER') || type.includes('DELETE') || type.includes('CORRUPT')) return 'bg-[#ff4444]';
    return 'bg-white/50';
  };

  return (
    <div className="min-h-screen bg-black/90 text-white p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Case Workspace
              <span className="text-[#00d4ff] text-xl font-mono">#{id}</span>
            </h1>
            <p className="text-gray-400 mt-1">{caseData.title}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 flex space-x-8">
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
                "pb-4 flex items-center gap-2 font-medium transition-all duration-300",
                activeTab === tab.id
                  ? "text-[#00d4ff] border-b-2 border-[#00d4ff]"
                  : "text-gray-400 hover:text-white"
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
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">FIR Number</div>
                  <div className="font-semibold text-lg">{caseData.fir_number || 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Police Station</div>
                  <div className="font-semibold text-lg">{caseData.police_station || 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <select 
                    value={caseData.status} 
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className={cn("bg-transparent outline-none font-semibold px-2 py-1 rounded text-sm -ml-2", getStatusColor(caseData.status))}
                  >
                    <option value="OPEN" className="bg-gray-900 text-white">OPEN</option>
                    <option value="IN_PROGRESS" className="bg-gray-900 text-white">IN PROGRESS</option>
                    <option value="CLOSED" className="bg-gray-900 text-white">CLOSED</option>
                  </select>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Complainant</div>
                  <div className="font-semibold text-lg">{caseData.complainant_name || 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10 lg:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Suspect Address</div>
                  <div className="font-mono text-[#00d4ff] text-sm break-all">{caseData.suspect_address || 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Chain</div>
                  <div className="font-semibold text-lg">{caseData.chain || 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Loss INR</div>
                  <div className="font-semibold text-lg text-[#ffaa00]">₹{caseData.loss_inr?.toLocaleString() || '0'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Loss Crypto</div>
                  <div className="font-semibold text-lg">{caseData.loss_crypto} {caseData.symbol}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Created</div>
                  <div className="font-semibold">{caseData.created_at ? new Date(caseData.created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-500 mb-1">Updated</div>
                  <div className="font-semibold">{caseData.updated_at ? new Date(caseData.updated_at).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={handleDownloadNotice}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/20 p-4 rounded-xl transition-all font-semibold"
                >
                  <FileUp className="w-5 h-5" />
                  Download Section 94 BNSS Notice
                </button>
                <button 
                  onClick={handleDownloadDossier}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 p-4 rounded-xl transition-all font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Download Section 63 BSA Dossier
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: EVIDENCE VAULT */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center glass-card p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h3 className="font-semibold text-lg">Cryptographic Evidence Ledger</h3>
                  <p className="text-sm text-gray-400">Immutable record of case evidence.</p>
                </div>
                <button 
                  onClick={handleVerifyIntegrity}
                  disabled={verifyingIntegrity}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                >
                  <RefreshCw className={cn("w-4 h-4", verifyingIntegrity && "animate-spin")} />
                  {verifyingIntegrity ? 'Verifying...' : 'Verify Ledger Integrity'}
                </button>
              </div>

              {integrityResult && (
                <div className={cn(
                  "p-4 rounded-xl border flex items-start gap-3",
                  integrityResult.is_valid ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]" : "bg-[#ff4444]/10 border-[#ff4444]/30 text-[#ff4444]"
                )}>
                  {integrityResult.is_valid ? <CheckCircle2 className="w-6 h-6 mt-0.5" /> : <XCircle className="w-6 h-6 mt-0.5" />}
                  <div>
                    <h4 className="font-bold text-lg">{integrityResult.is_valid ? 'Ledger Verified Successfully' : 'Integrity Compromised'}</h4>
                    {integrityResult.is_valid ? (
                      <p className="text-sm opacity-90 mt-1">
                        Genesis Hash: <span className="font-mono">{truncateHash(integrityResult.genesis_hash || '')}</span> • {integrityResult.total_records} records intact.
                      </p>
                    ) : (
                      <p className="text-sm opacity-90 mt-1">
                        Mismatch detected at Sequence #{integrityResult.corrupted_sequence_number}. Cryptographic chain is broken.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {loadingEvidence ? (
                <div className="text-center p-8 text-gray-500">Loading evidence...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-black/40 text-gray-400 text-sm">
                      <tr>
                        <th className="p-4 font-medium">Seq #</th>
                        <th className="p-4 font-medium">Tier</th>
                        <th className="p-4 font-medium">Title</th>
                        <th className="p-4 font-medium">Description</th>
                        <th className="p-4 font-medium">Content Hash</th>
                        <th className="p-4 font-medium">Chain Hash</th>
                        <th className="p-4 font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {evidenceData.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No evidence recorded yet.</td></tr>
                      ) : (
                        evidenceData.map((ev) => (
                          <tr key={ev.sequence_number} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-gray-500">{ev.sequence_number}</td>
                            <td className="p-4">
                              <span className={cn("px-2 py-1 rounded text-xs font-semibold border", getTierColor(ev.tier))}>
                                {ev.tier}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-white">{ev.title}</td>
                            <td className="p-4 text-gray-400 max-w-xs truncate">{ev.description}</td>
                            <td className="p-4 font-mono text-xs text-[#00d4ff]/80">{truncateHash(ev.content_hash)}</td>
                            <td className="p-4 font-mono text-xs text-gray-500">{truncateHash(ev.chain_hash)}</td>
                            <td className="p-4 text-gray-500 whitespace-nowrap">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}</td>
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
              <div className="glass-card p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#00d4ff]" />
                  System Audit Trail
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 ml-2">
                    {auditData?.total_events || 0} Events
                  </span>
                </h3>

                {loadingAudit ? (
                   <div className="text-center p-8 text-gray-500">Loading audit trail...</div>
                ) : !auditData?.events?.length ? (
                  <div className="text-center p-8 text-gray-500">No events found.</div>
                ) : (
                  <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
                    {auditData.events.map((event: any, idx: number) => (
                      <div key={idx} className="relative pl-8">
                        <div className={cn(
                          "absolute -left-2 top-1.5 w-4 h-4 rounded-full border-4 border-black",
                          getEventDotColor(event.event_type)
                        )}></div>
                        <div className="glass-card p-4 rounded-lg bg-black/40 border border-white/5 inline-block min-w-[300px]">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-semibold text-gray-200">
                              {event.event_type}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-white mb-1">{event.action_summary}</div>
                          <div className="text-xs text-gray-500">Actor: {event.actor}</div>
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
              
              <div className="glass-card p-4 rounded-xl bg-white/5 border border-white/10">
                <form onSubmit={handleAddNote}>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note or observation..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00d4ff]/50 min-h-[100px] resize-y"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={addingNote || !newNote.trim()}
                      className="bg-[#00d4ff] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#00d4ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">No notes yet.</div>
                ) : (
                  [...notes].reverse().map((note: any, idx: number) => (
                    <div key={idx} className="glass-card p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] font-bold shrink-0">
                        {note.author ? note.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-200">{note.author || 'Unknown User'}</span>
                          <span className="text-xs text-gray-500">{note.timestamp ? new Date(note.timestamp).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{note.text}</p>
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

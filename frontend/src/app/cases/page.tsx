'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, Search, AlertCircle, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Case, CaseCreate } from '@/types';
import { cn } from '@/lib/utils';

export default function CasesPage() {
  const router = useRouter();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CaseCreate>({
    fir_number: '',
    complainant_name: '',
    police_station: 'Cyber Crime Police Station',
    root_suspect_address: '',
    chain: 'ethereum',
    loss_amount_inr: 0,
    loss_amount_crypto: 0,
    crypto_symbol: 'USDT'
  });

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCases();
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.fir_number.toLowerCase().includes(query) || 
           c.complainant_name.toLowerCase().includes(query) ||
           c.root_suspect_address.toLowerCase().includes(query);
  });

  const truncateAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 14) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const parseComplainant = (raw: string) => {
    if (!raw) return { name: 'Unknown', scamType: null };
    const match = raw.match(/^(.*?)\s*[\(\[](.*?)[\)\]]$/);
    if (match) {
      return { name: match[1].trim(), scamType: match[2].trim() };
    }
    const lower = raw.toLowerCase();
    if (lower.includes('telegram') || lower.includes('investment') || lower.includes('task') || lower.includes('job')) {
      return { name: raw, scamType: 'Task-Based Investment Scam' };
    }
    return { name: raw, scamType: null };
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800">Active</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">Under Review</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">Closed</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700">Draft</span>;
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await api.createCase(formData);
      setIsModalOpen(false);
      setFormData({
        fir_number: '',
        complainant_name: '',
        police_station: 'Cyber Crime Police Station',
        root_suspect_address: '',
        chain: 'ethereum',
        loss_amount_inr: 0,
        loss_amount_crypto: 0,
        crypto_symbol: 'USDT'
      });
      await fetchCases();
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'loss_amount_inr' || name === 'loss_amount_crypto' 
        ? Number(value) 
        : value
    }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in text-[var(--text-main)]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              Case Registry
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Manage and track law enforcement investigation cases with legal dossier generation
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Case</span>
          </button>
        </div>

        {/* Error Banner with High-Contrast Semantic Tokens */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by FIR number, complainant, or wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
            />
          </div>
        </div>

        {/* Case Registry Table */}
        <div className="glass-card rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/90 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Case ID</th>
                  <th className="px-6 py-4">FIR Number</th>
                  <th className="px-6 py-4">Complainant / Scam Type</th>
                  <th className="px-6 py-4">Suspect Address</th>
                  <th className="px-6 py-4">Chain</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Loss (INR)</th>
                  <th className="px-6 py-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {isLoading ? (
                  // Skeleton Loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : filteredCases.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FileText className="w-12 h-12 opacity-40 text-slate-400" />
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300">No cases found</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search criteria or register a new case.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  filteredCases.map(caseItem => {
                    const parsedComplainant = parseComplainant(caseItem.complainant_name);
                    return (
                      <tr 
                        key={caseItem.id} 
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                        className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{caseItem.id.substring(0,8)}</td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-slate-100">{caseItem.fir_number}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{parsedComplainant.name}</span>
                            {parsedComplainant.scamType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                                {parsedComplainant.scamType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {truncateAddress(caseItem.root_suspect_address)}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 capitalize font-medium">{caseItem.chain}</td>
                        <td className="px-6 py-4">{getStatusBadge(caseItem.status)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{caseItem.loss_amount_inr.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(caseItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Register New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-2.5">
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              Register New Case
            </h2>

            <form onSubmit={handleCreateCase} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">FIR Number</label>
                  <input 
                    type="text" 
                    name="fir_number"
                    required
                    value={formData.fir_number}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    placeholder="e.g. FIR-2026-MH-CY-1234"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Complainant / Scam Type</label>
                  <input 
                    type="text" 
                    name="complainant_name"
                    required
                    value={formData.complainant_name}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    placeholder="Priya Sharma (Telegram Task Scam)"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Police Station</label>
                <input 
                  type="text" 
                  name="police_station"
                  value={formData.police_station}
                  onChange={handleChange}
                  className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Suspect Wallet Address</label>
                <input 
                  type="text" 
                  name="root_suspect_address"
                  required
                  value={formData.root_suspect_address}
                  onChange={handleChange}
                  className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  placeholder="0x... or T..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Blockchain Network</label>
                  <select
                    name="chain"
                    value={formData.chain}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ethereum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Ethereum</option>
                    <option value="tron" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tron</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Crypto Symbol</label>
                  <input 
                    type="text" 
                    name="crypto_symbol"
                    value={formData.crypto_symbol}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Loss Amount (INR)</label>
                  <input 
                    type="number" 
                    name="loss_amount_inr"
                    min="0"
                    step="0.01"
                    value={formData.loss_amount_inr}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Loss Amount (Crypto)</label>
                  <input 
                    type="number" 
                    name="loss_amount_crypto"
                    min="0"
                    step="0.000001"
                    value={formData.loss_amount_crypto}
                    onChange={handleChange}
                    className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-color)] mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold transition-all duration-200 text-sm shadow-sm",
                    isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 active:bg-blue-800"
                  )}
                >
                  {isSubmitting ? 'Registering...' : 'Register Case'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

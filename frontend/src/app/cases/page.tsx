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
           c.complainant_name.toLowerCase().includes(query);
  });

  const truncateAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-accent/10 text-accent border border-accent/20">Active</span>;
      case 'under_review':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/20">Under Review</span>;
      case 'closed':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Closed</span>;
      case 'draft':
      default:
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-white/5 text-gray-400 border border-white/10">Draft</span>;
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
    <div className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-accent" />
              Case Registry
            </h1>
            <p className="text-gray-400 mt-1">Manage and track law enforcement investigation cases</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 px-4 py-2 rounded-lg transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Register New Case
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 text-[#ff4444] p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by FIR number or complainant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 text-gray-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Case ID</th>
                  <th className="px-6 py-4 font-semibold">FIR Number</th>
                  <th className="px-6 py-4 font-semibold">Complainant</th>
                  <th className="px-6 py-4 font-semibold">Suspect Address</th>
                  <th className="px-6 py-4 font-semibold">Chain</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Loss (INR)</th>
                  <th className="px-6 py-4 font-semibold">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  // Skeleton Loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-28"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-white/10 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24 ml-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : filteredCases.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FileText className="w-12 h-12 opacity-50" />
                        <p className="text-lg">No cases found</p>
                        <p className="text-sm">Try adjusting your search criteria or register a new case.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  filteredCases.map(caseItem => (
                    <tr 
                      key={caseItem.id} 
                      onClick={() => router.push(`/cases/${caseItem.id}`)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-gray-400">{caseItem.id.substring(0,8)}</td>
                      <td className="px-6 py-4 text-white font-medium">{caseItem.fir_number}</td>
                      <td className="px-6 py-4 text-gray-300">{caseItem.complainant_name}</td>
                      <td className="px-6 py-4 font-mono text-accent">{truncateAddress(caseItem.root_suspect_address)}</td>
                      <td className="px-6 py-4 text-gray-300 capitalize">{caseItem.chain}</td>
                      <td className="px-6 py-4">{getStatusBadge(caseItem.status)}</td>
                      <td className="px-6 py-4 text-right font-mono text-[#00ff88]">
                        ₹{caseItem.loss_amount_inr.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Register New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-white/10 p-6 relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-accent" />
              Register New Case
            </h2>

            <form onSubmit={handleCreateCase} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">FIR Number</label>
                  <input 
                    type="text" 
                    name="fir_number"
                    required
                    value={formData.fir_number}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
                    placeholder="e.g. FIR/2024/001"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Complainant Name</label>
                  <input 
                    type="text" 
                    name="complainant_name"
                    required
                    value={formData.complainant_name}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-400">Police Station</label>
                <input 
                  type="text" 
                  name="police_station"
                  value={formData.police_station}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-400">Suspect Wallet Address</label>
                <input 
                  type="text" 
                  name="root_suspect_address"
                  required
                  value={formData.root_suspect_address}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
                  placeholder="0x..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Blockchain Network</label>
                  <select
                    name="chain"
                    value={formData.chain}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent appearance-none"
                  >
                    <option value="ethereum" className="bg-gray-900">Ethereum</option>
                    <option value="tron" className="bg-gray-900">Tron</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Crypto Symbol</label>
                  <input 
                    type="text" 
                    name="crypto_symbol"
                    value={formData.crypto_symbol}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Loss Amount (INR)</label>
                  <input 
                    type="number" 
                    name="loss_amount_inr"
                    min="0"
                    step="0.01"
                    value={formData.loss_amount_inr}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Loss Amount (Crypto)</label>
                  <input 
                    type="number" 
                    name="loss_amount_crypto"
                    min="0"
                    step="0.000001"
                    value={formData.loss_amount_crypto}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "px-6 py-2 rounded-lg bg-accent text-black font-semibold transition-all duration-300",
                    isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/90"
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

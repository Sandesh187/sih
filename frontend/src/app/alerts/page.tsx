"use client";

import { useState } from 'react';
import { Search, Filter, ShieldAlert, AlertTriangle, AlertCircle, Info, Copy, Check, Clock, MoreVertical, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertData } from '@/types';

const mockAlerts: AlertData[] = [
  { id: 'ALT-1001', severity: 'critical', type: 'Mixer Detected', title: 'Funds sent to Tornado Cash', description: 'Address 0x123...abc initiated a 150 ETH transfer to Tornado Cash router.', walletAddress: '0x1234567890abcdef1234567890abcdef12345678', chain: 'Ethereum', timestamp: '2 mins ago', status: 'new' },
  { id: 'ALT-1002', severity: 'high', type: 'Sanctioned Entity Interaction', title: 'OFAC Address Match', description: 'Incoming transfer from known Lazarus Group affiliated address.', walletAddress: '0xabc123def456abc123def456abc123def456abcd', chain: 'Ethereum', timestamp: '15 mins ago', status: 'new' },
  { id: 'ALT-1003', severity: 'high', type: 'Large Transfer', title: 'Unusual Volume Spike', description: 'Wallet moved $10M USDC in a single transaction after 6 months of inactivity.', walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'Bitcoin', timestamp: '1 hour ago', status: 'reviewed' },
  { id: 'ALT-1004', severity: 'medium', type: 'Peel Chain Pattern', title: 'Potential Peel Chain', description: 'Sequential small transfers detected indicating possible UTXO consolidation.', walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', chain: 'Bitcoin', timestamp: '2 hours ago', status: 'new' },
  { id: 'ALT-1005', severity: 'medium', type: 'Cross-Chain Bridge Usage', title: 'Rapid Cross-Chain Movement', description: 'Funds bridged from Ethereum to Polygon and swapped immediately.', walletAddress: '0x9876543210fedcba9876543210fedcba98765432', chain: 'Polygon', timestamp: '3 hours ago', status: 'new' },
  { id: 'ALT-1006', severity: 'low', type: 'Known Darknet Wallet', title: 'Hydra Market Interaction', description: 'Historical interaction with Hydra Market detected in 3rd degree connection.', walletAddress: '1CounterpartyXXXXXXXXXXXXXXXUWLpVr', chain: 'Bitcoin', timestamp: '5 hours ago', status: 'escalated' },
  { id: 'ALT-1007', severity: 'critical', type: 'Unusual Pattern', title: 'Flash Loan Attack Signature', description: 'Multiple complex contract calls mimicking flash loan arbitrage exploit.', walletAddress: '0x5555555555555555555555555555555555555555', chain: 'Ethereum', timestamp: '6 hours ago', status: 'dismissed' },
  { id: 'ALT-1008', severity: 'low', type: 'Large Transfer', title: 'Whale Exchange Deposit', description: 'Binance hot wallet received 500 BTC.', walletAddress: '34xp4vRoCGJym3xR7yCVPFHoJQvxvrCEcg', chain: 'Bitcoin', timestamp: '1 day ago', status: 'reviewed' },
];

export default function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = mockAlerts.filter(a => {
    const matchesSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-[var(--text-main)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            Threat Alerts
            <span className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Feed
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time monitoring and anomaly detection across monitored networks.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setSoundEnabled(!soundEnabled)}
             className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
           >
             <Bell className={cn("w-4 h-4", soundEnabled ? "text-blue-600 dark:text-blue-400" : "text-slate-400 opacity-50")} />
             {soundEnabled ? 'Alert Chime On' : 'Alert Chime Off'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: mockAlerts.filter(a => a.severity === 'critical').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', icon: ShieldAlert },
          { label: 'High', count: mockAlerts.filter(a => a.severity === 'high').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle },
          { label: 'Medium', count: mockAlerts.filter(a => a.severity === 'medium').length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', icon: AlertCircle },
          { label: 'Low', count: mockAlerts.filter(a => a.severity === 'low').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', icon: Info },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className={cn(
              "glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer border transition-all shadow-sm",
              filterSeverity === stat.label.toLowerCase() 
                ? `${stat.bg} ${stat.border} shadow-md` 
                : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-slate-300 dark:hover:border-slate-700"
            )} 
            onClick={() => setFilterSeverity(filterSeverity === stat.label.toLowerCase() ? 'all' : stat.label.toLowerCase())}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">{stat.label}</span>
            </div>
            <span className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.count}</span>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 rounded-2xl flex gap-4 items-center border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search alerts, addresses, or chains..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer">
          <Filter className="w-3.5 h-3.5" />
          Filter Priority
        </button>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex gap-4 items-start shadow-sm">
            <div className="pt-0.5">
              {alert.severity === 'critical' && <div className="p-2 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-xl relative border border-red-200 dark:border-red-800/60"><ShieldAlert className="w-5 h-5 relative z-10" /></div>}
              {alert.severity === 'high' && <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/60"><AlertTriangle className="w-5 h-5" /></div>}
              {alert.severity === 'medium' && <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/60"><AlertCircle className="w-5 h-5" /></div>}
              {alert.severity === 'low' && <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60"><Info className="w-5 h-5" /></div>}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{alert.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{alert.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {alert.timestamp}
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 text-xs pt-1 flex-wrap">
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-2 border border-slate-200 dark:border-slate-700 font-semibold">
                  {alert.walletAddress.slice(0,8)}...{alert.walletAddress.slice(-6)}
                  <Copy className="w-3 h-3 hover:text-blue-600 cursor-pointer text-slate-400" />
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 font-medium">
                  {alert.chain}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold", 
                  alert.status === 'new' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' : 
                  alert.status === 'reviewed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 
                  alert.status === 'escalated' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' : 
                  'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                )}>
                  {alert.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 rounded-xl text-slate-500 transition-colors cursor-pointer" title="Mark as Reviewed">
                <Check className="w-4 h-4" />
              </button>
              <button className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

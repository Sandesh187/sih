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

  const filteredAlerts = mockAlerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Threat Alerts
            <span className="flex items-center gap-2 text-sm font-normal bg-success/10 text-success px-3 py-1 rounded-full border border-success/20">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Live Feed
            </span>
          </h1>
          <p className="text-gray-400 mt-1">Real-time monitoring and anomaly detection.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setSoundEnabled(!soundEnabled)}
             className="glass-card px-4 py-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
           >
             <Bell className={cn("w-5 h-5", soundEnabled ? "text-accent" : "text-gray-500 opacity-50")} />
             {soundEnabled ? 'Sound On' : 'Sound Off'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critical', count: mockAlerts.filter(a => a.severity === 'critical').length, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', icon: ShieldAlert },
          { label: 'High', count: mockAlerts.filter(a => a.severity === 'high').length, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: AlertTriangle },
          { label: 'Medium', count: mockAlerts.filter(a => a.severity === 'medium').length, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: AlertCircle },
          { label: 'Low', count: mockAlerts.filter(a => a.severity === 'low').length, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: Info },
        ].map((stat) => (
          <div key={stat.label} className={cn("glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all", filterSeverity === stat.label.toLowerCase() ? `border border-[${stat.color}]` : "")} onClick={() => setFilterSeverity(filterSeverity === stat.label.toLowerCase() ? 'all' : stat.label.toLowerCase())}>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-gray-300 font-medium">{stat.label}</span>
            </div>
            <span className={cn("text-2xl font-bold", stat.color)}>{stat.count}</span>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search alerts, addresses, or chains..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 transition-colors">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="glass-card p-4 hover:border-white/20 transition-all group flex gap-4 items-start">
            <div className="pt-1">
              {alert.severity === 'critical' && <div className="p-2 bg-danger/10 text-danger rounded-full relative"><div className="absolute inset-0 bg-danger/20 rounded-full animate-ping" /><ShieldAlert className="w-5 h-5 relative z-10" /></div>}
              {alert.severity === 'high' && <div className="p-2 bg-warning/10 text-warning rounded-full"><AlertTriangle className="w-5 h-5" /></div>}
              {alert.severity === 'medium' && <div className="p-2 bg-yellow-400/10 text-yellow-400 rounded-full"><AlertCircle className="w-5 h-5" /></div>}
              {alert.severity === 'low' && <div className="p-2 bg-success/10 text-success rounded-full"><Info className="w-5 h-5" /></div>}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{alert.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {alert.timestamp}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <span className="bg-white/5 px-2 py-1 rounded text-gray-300 font-mono text-xs flex items-center gap-2">
                  {alert.walletAddress.slice(0,6)}...{alert.walletAddress.slice(-4)}
                  <Copy className="w-3 h-3 hover:text-white cursor-pointer" />
                </span>
                <span className="bg-white/5 px-2 py-1 rounded text-gray-300 text-xs">
                  {alert.chain}
                </span>
                <span className={cn("px-2 py-1 rounded text-xs uppercase tracking-wider font-semibold", 
                  alert.status === 'new' ? 'bg-accent/10 text-accent border border-accent/20' : 
                  alert.status === 'reviewed' ? 'bg-success/10 text-success border border-success/20' : 
                  alert.status === 'escalated' ? 'bg-danger/10 text-danger border border-danger/20' : 
                  'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                )}>
                  {alert.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-white/5 hover:bg-success/10 hover:text-success rounded-lg text-gray-400 transition-colors tooltip" title="Mark as Reviewed">
                <Check className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

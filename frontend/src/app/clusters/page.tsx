"use client";

import { useState } from 'react';
import { Network, Search, ShieldAlert, AlertTriangle, Users, Layers, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterData } from '@/types';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

const mockClusters: ClusterData[] = [
  { clusterId: 'CLS-001', label: 'Binance Hot Wallet 1', type: 'exchange', addressCount: 145000, totalVolume: 850000000, riskLevel: 'low', addresses: [], connectedClusters: ['CLS-002', 'CLS-005'] },
  { clusterId: 'CLS-002', label: 'Tornado Cash Router', type: 'mixer', addressCount: 3400, totalVolume: 120000000, riskLevel: 'critical', addresses: [], connectedClusters: ['CLS-001', 'CLS-008'] },
  { clusterId: 'CLS-003', label: 'Unknown Mining Pool', type: 'mining_pool', addressCount: 1250, totalVolume: 45000000, riskLevel: 'low', addresses: [], connectedClusters: ['CLS-001'] },
  { clusterId: 'CLS-004', label: 'Hydra Market Dep.', type: 'darknet', addressCount: 890, totalVolume: 78000000, riskLevel: 'critical', addresses: [], connectedClusters: ['CLS-002', 'CLS-006'] },
  { clusterId: 'CLS-005', label: 'Kraken Cold Storage', type: 'exchange', addressCount: 8, totalVolume: 2100000000, riskLevel: 'low', addresses: [], connectedClusters: ['CLS-001'] },
  { clusterId: 'CLS-006', label: 'Lazarus Group Ass.', type: 'unknown', addressCount: 45, totalVolume: 34000000, riskLevel: 'high', addresses: [], connectedClusters: ['CLS-002', 'CLS-004'] },
  { clusterId: 'CLS-007', label: 'Stake.com Vault', type: 'gambling', addressCount: 5600, totalVolume: 450000000, riskLevel: 'medium', addresses: [], connectedClusters: ['CLS-001'] },
  { clusterId: 'CLS-008', label: 'Wasabi Coordinator', type: 'mixer', addressCount: 12000, totalVolume: 89000000, riskLevel: 'high', addresses: [], connectedClusters: ['CLS-002'] },
];

const chartData = [
  { name: 'Mon', vol: 4000 },
  { name: 'Tue', vol: 3000 },
  { name: 'Wed', vol: 2000 },
  { name: 'Thu', vol: 2780 },
  { name: 'Fri', vol: 1890 },
  { name: 'Sat', vol: 2390 },
  { name: 'Sun', vol: 3490 },
];

export default function ClustersPage() {
  const [activeTab, setActiveTab] = useState<'patterns' | 'network' | 'table'>('patterns');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClusters = mockClusters.filter(c => 
    c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clusterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col text-[var(--text-main)]">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">Cluster Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Discover and analyze entity behavior across blockchain networks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clusters', val: '1,245', icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Exchange Clusters', val: '45', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Mixer Clusters', val: '12', icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Darknet Clusters', val: '8', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-2 rounded-2xl flex flex-wrap items-center gap-2 border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <button 
          onClick={() => setActiveTab('patterns')} 
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer", 
            activeTab === 'patterns' 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Behavior Patterns
        </button>
        <button 
          onClick={() => setActiveTab('network')} 
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer", 
            activeTab === 'network' 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Network Graph
        </button>
        <button 
          onClick={() => setActiveTab('table')} 
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer", 
            activeTab === 'table' 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          Table View
        </button>
        <div className="ml-auto relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clusters..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-sans" 
          />
        </div>
      </div>

      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {filteredClusters.map(cluster => (
            <div key={cluster.clusterId} className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", 
                    cluster.type === 'exchange' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    cluster.type === 'mixer' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                    cluster.type === 'darknet' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}>
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{cluster.label}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{cluster.type}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider",
                  cluster.riskLevel === 'critical' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' :
                  cluster.riskLevel === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' :
                  cluster.riskLevel === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                )}>{cluster.riskLevel} Risk</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-slate-100/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 font-semibold uppercase"><Users className="w-3 h-3"/> Addresses</p>
                  <p className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">{cluster.addressCount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-100/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 font-semibold uppercase"><Activity className="w-3 h-3"/> Volume</p>
                  <p className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">${(cluster.totalVolume / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="vol" fill="#2563EB" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'network' && (
        <div className="glass-card flex-1 min-h-[500px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-center relative overflow-hidden">
          <div className="text-center z-10 p-6">
            <Network className="w-14 h-14 text-blue-600 dark:text-blue-400 mx-auto mb-3 animate-pulse" />
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Cytoscape Network Clustering Visualization</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Force-directed Louvain community graph of multi-hop cluster interactions</p>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Cluster ID</th>
                  <th className="p-4">Label</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Addresses</th>
                  <th className="p-4">Volume</th>
                  <th className="p-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                {filteredClusters.map((cluster) => (
                  <tr key={cluster.clusterId} className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{cluster.clusterId}</td>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{cluster.label}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 capitalize">{cluster.type}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono">{cluster.addressCount.toLocaleString()}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono">${(cluster.totalVolume / 1000000).toFixed(1)}M</td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase", 
                        cluster.riskLevel === 'critical' ? 'text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800' :
                        cluster.riskLevel === 'high' ? 'text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800' :
                        cluster.riskLevel === 'medium' ? 'text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800' :
                        'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800'
                      )}>{cluster.riskLevel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

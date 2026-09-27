"use client";

import { useState } from 'react';
import { Network, Search, ArrowRight, ShieldAlert, AlertTriangle, Users, Layers, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterData } from '@/types';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
// For a real app, you would dynamically import Cytoscape
// import cytoscape from 'cytoscape';

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cluster Analysis</h1>
        <p className="text-gray-400">Discover and analyze entity behavior across networks.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Clusters', val: '1,245', icon: Layers, color: 'text-accent' },
          { label: 'Exchange Clusters', val: '45', icon: Activity, color: 'text-success' },
          { label: 'Mixer Clusters', val: '12', icon: ShieldAlert, color: 'text-warning' },
          { label: 'Darknet Clusters', val: '8', icon: AlertTriangle, color: 'text-danger' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-lg bg-white/5", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-2 flex items-center gap-2">
        <button onClick={() => setActiveTab('patterns')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'patterns' ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-white")}>Behavior Patterns</button>
        <button onClick={() => setActiveTab('network')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'network' ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-white")}>Network Graph</button>
        <button onClick={() => setActiveTab('table')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'table' ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-white")}>Table View</button>
        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search clusters..." className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-accent w-64" />
        </div>
      </div>

      {activeTab === 'patterns' && (
        <div className="grid grid-cols-3 gap-4 flex-1">
          {mockClusters.map(cluster => (
            <div key={cluster.clusterId} className="glass-card p-5 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", 
                    cluster.type === 'exchange' ? 'bg-success/10 text-success' :
                    cluster.type === 'mixer' ? 'bg-warning/10 text-warning' :
                    cluster.type === 'darknet' ? 'bg-danger/10 text-danger' :
                    'bg-gray-500/10 text-gray-400'
                  )}>
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{cluster.label}</h3>
                    <p className="text-xs text-gray-400 capitalize">{cluster.type}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider",
                  cluster.riskLevel === 'critical' ? 'bg-danger/10 text-danger' :
                  cluster.riskLevel === 'high' ? 'bg-warning/10 text-warning' :
                  cluster.riskLevel === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                  'bg-success/10 text-success'
                )}>{cluster.riskLevel} Risk</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Addresses</p>
                  <p className="text-lg font-mono text-white">{cluster.addressCount.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Volume</p>
                  <p className="text-lg font-mono text-white">${(cluster.totalVolume / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              <div className="h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="vol" fill="#00d4ff" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'network' && (
        <div className="glass-card flex-1 min-h-[500px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
          <div className="text-center z-10">
            <Network className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-pulse" />
            <p className="text-xl text-gray-300">Cytoscape Network Visualization</p>
            <p className="text-sm text-gray-500 mt-2">Force-directed graph of cluster relationships</p>
          </div>
        </div>
      )}

      {activeTab === 'table' && (
        <div className="glass-card flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-4 font-medium">Cluster ID</th>
                <th className="p-4 font-medium">Label</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Addresses</th>
                <th className="p-4 font-medium">Volume</th>
                <th className="p-4 font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {mockClusters.map((cluster) => (
                <tr key={cluster.clusterId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-sm text-accent">{cluster.clusterId}</td>
                  <td className="p-4 text-white">{cluster.label}</td>
                  <td className="p-4 text-gray-400 capitalize">{cluster.type}</td>
                  <td className="p-4 text-gray-300 font-mono">{cluster.addressCount.toLocaleString()}</td>
                  <td className="p-4 text-gray-300 font-mono">${(cluster.totalVolume / 1000000).toFixed(1)}M</td>
                  <td className="p-4">
                    <span className={cn("px-2 py-1 rounded text-xs", 
                      cluster.riskLevel === 'critical' ? 'text-danger bg-danger/10' :
                      cluster.riskLevel === 'high' ? 'text-warning bg-warning/10' :
                      cluster.riskLevel === 'medium' ? 'text-yellow-400 bg-yellow-400/10' :
                      'text-success bg-success/10'
                    )}>{cluster.riskLevel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

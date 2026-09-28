'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, ShieldCheck, Search, Download, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Mock Data
const sparklineData1 = [{ v: 10 }, { v: 15 }, { v: 13 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 30 }];
const sparklineData2 = [{ v: 5 }, { v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 18 }, { v: 22 }];
const sparklineData3 = [{ v: 20 }, { v: 15 }, { v: 18 }, { v: 12 }, { v: 10 }, { v: 8 }, { v: 5 }];
const sparklineData4 = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 8 }, { v: 7 }, { v: 10 }];

const pieData = [
  { name: 'Ethereum', value: 400, color: '#2563EB' },
  { name: 'Tron', value: 300, color: '#EF4444' },
  { name: 'BSC', value: 200, color: '#F59E0B' },
];

const barData = [
  { name: 'Critical', count: 45, color: '#EF4444' },
  { name: 'High', count: 85, color: '#F59E0B' },
  { name: 'Medium', count: 120, color: '#3B82F6' },
  { name: 'Low', count: 350, color: '#10B981' },
];

const mockTraces = [
  { id: 'TRC-9823', target: '0x28C6c06298d514Db089934071355E5743bf21d60', chain: 'ETH', vasp: 'Binance', risk: 'Low', confidence: 98, amount: '$45,230', time: '2 mins ago' },
  { id: 'TRC-9822', target: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', chain: 'TRON', vasp: 'Unknown', risk: 'Critical', confidence: 45, amount: '$1,205,000', time: '15 mins ago' },
  { id: 'TRC-9821', target: '0x4976a4a02F38326660D17bf34b431Dc6e2eb2327', chain: 'BSC', vasp: 'Kraken', risk: 'Medium', confidence: 85, amount: '$12,400', time: '1 hour ago' },
  { id: 'TRC-9820', target: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', chain: 'ETH', vasp: 'WazirX', risk: 'High', confidence: 76, amount: '$89,000', time: '3 hours ago' },
  { id: 'TRC-9819', target: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'TRON', vasp: 'CoinDCX', risk: 'Low', confidence: 92, amount: '$3,100', time: '5 hours ago' },
  { id: 'TRC-9818', target: '0x00000000219ab540356cBB839Cbe05303d7705Fa', chain: 'ETH', vasp: 'Huobi', risk: 'Medium', confidence: 60, amount: '$54,000', time: '1 day ago' },
  { id: 'TRC-9817', target: '0x1234567890123456789012345678901234567890', chain: 'TRON', vasp: 'Binance', risk: 'Low', confidence: 95, amount: '$21,500', time: '1 day ago' },
];

const StatCard = ({ title, value, change, isPositive, data, icon: Icon, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-card p-6 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group border border-[var(--border-color)] bg-[var(--bg-surface)]",
      active 
        ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-blue-500/5" 
        : "hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
      </div>
      <div className={cn(
        "p-2.5 rounded-xl transition-colors", 
        active 
          ? "bg-blue-600 text-white shadow-sm" 
          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className={cn("flex items-center text-xs font-bold", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
        {change}%
      </div>
      <div className="h-10 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={isPositive ? "#10B981" : "#EF4444"} fillOpacity={1} fill={`url(#color-${title})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [realTraces, setRealTraces] = useState<any[]>([]);

  const fetchRecent = async () => {
    try {
      const { api } = await import('@/lib/api');
      const data = await api.getRecentTraces();
      if (data && data.length > 0) setRealTraces(data);
    } catch (err) {
      console.error(err);
    }
  };

  const { secondsAgo, isRefreshing, refresh } = useAutoRefresh(async () => {
    await fetchRecent();
    await new Promise(r => setTimeout(r, 400));
  }, 30000);

  useEffect(() => {
    fetchRecent();
    const handleFocusSearch = () => searchInputRef.current?.focus();
    window.addEventListener('focus-search', handleFocusSearch);
    return () => window.removeEventListener('focus-search', handleFocusSearch);
  }, []);

  const displayTraces = realTraces.length > 0 ? realTraces : mockTraces;

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Target,Chain,VASP,Risk,Confidence,Amount\n" 
      + displayTraces.map(t => `${t.id},${t.target},${t.chain},${t.vasp},${t.risk},${t.confidence},${t.amount}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "traces_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (risk: string) => {
    switch(risk?.toLowerCase()) {
      case 'critical':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />Critical</span>;
      case 'high':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />High</span>;
      case 'medium':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />Medium</span>;
      case 'low':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />Low</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-12 text-[var(--text-main)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-1">
            Forensic Intelligence Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Live overview of cryptocurrency tracing activity, VASP identification, and counterparty risks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center">
            {isRefreshing ? (
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
              </span>
            ) : (
              `Last updated: ${secondsAgo}s ago`
            )}
          </div>
          <button 
            onClick={refresh}
            className="p-2 glass-card rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-600 dark:text-slate-300", isRefreshing && "animate-spin text-blue-600 dark:text-blue-400")} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Traces" 
          value="12,450" 
          change="12.5" 
          isPositive={true} 
          data={sparklineData1} 
          icon={Activity}
          active={activeFilter === 'traces'}
          onClick={() => setActiveFilter(activeFilter === 'traces' ? null : 'traces')}
        />
        <StatCard 
          title="VASPs Identified" 
          value="892" 
          change="5.2" 
          isPositive={true} 
          data={sparklineData2} 
          icon={ShieldCheck}
          active={activeFilter === 'vasps'}
          onClick={() => setActiveFilter(activeFilter === 'vasps' ? null : 'vasps')}
        />
        <StatCard 
          title="Risk Alerts" 
          value="156" 
          change="2.4" 
          isPositive={false} 
          data={sparklineData3} 
          icon={AlertTriangle}
          active={activeFilter === 'alerts'}
          onClick={() => setActiveFilter(activeFilter === 'alerts' ? null : 'alerts')}
        />
        <StatCard 
          title="Active Cases" 
          value="45" 
          change="8.1" 
          isPositive={true} 
          data={sparklineData4} 
          icon={Layers}
          active={activeFilter === 'cases'}
          onClick={() => setActiveFilter(activeFilter === 'cases' ? null : 'cases')}
        />
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search address, VASP, or ID... (Ctrl+K)" 
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <select className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-[120px] cursor-pointer">
            <option value="all">All VASPs</option>
            <option value="binance">Binance</option>
            <option value="kraken">Kraken</option>
            <option value="wazirx">WazirX</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-[120px] cursor-pointer">
            <option value="all">All Risks</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-[120px] cursor-pointer">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 text-xs font-semibold rounded-xl border border-blue-500/30 transition-colors whitespace-nowrap shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Traces Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Trace ID</th>
                <th className="p-4">Target Address</th>
                <th className="p-4">Chain</th>
                <th className="p-4">Identified VASP</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {displayTraces.map((trace, i) => (
                <tr 
                  key={i} 
                  onClick={() => router.push(`/trace?id=${trace.id}&address=${trace.target}&chain=${trace.chain.toLowerCase()}`)}
                  className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono font-semibold text-blue-600 dark:text-blue-400">{trace.id}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300 font-medium">{trace.target}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {trace.chain}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{trace.vasp}</td>
                  <td className="p-4">{getRiskBadge(trace.risk)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" 
                          style={{ width: `${trace.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-400">{trace.confidence}%</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{trace.amount}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{trace.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center bg-slate-50/50 dark:bg-slate-900/30">
          <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors py-1 px-3">
            Show More Records
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-6">Chain Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: '0.75rem',
                    color: 'var(--text-main)' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-6">Risk Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: '0.75rem',
                    color: 'var(--text-main)' 
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

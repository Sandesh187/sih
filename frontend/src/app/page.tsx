'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, ShieldCheck, Search, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Mock Data
const sparklineData1 = [{ v: 10 }, { v: 15 }, { v: 13 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 30 }];
const sparklineData2 = [{ v: 5 }, { v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 18 }, { v: 22 }];
const sparklineData3 = [{ v: 20 }, { v: 15 }, { v: 18 }, { v: 12 }, { v: 10 }, { v: 8 }, { v: 5 }];
const sparklineData4 = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 8 }, { v: 7 }, { v: 10 }];

const pieData = [
  { name: 'Ethereum', value: 400, color: '#627EEA' },
  { name: 'Tron', value: 300, color: '#FF0013' },
  { name: 'BSC', value: 200, color: '#F3BA2F' },
];

const barData = [
  { name: 'Critical', count: 45, color: '#ff4444' },
  { name: 'High', count: 85, color: '#ffaa00' },
  { name: 'Medium', count: 120, color: '#00d4ff' },
  { name: 'Low', count: 350, color: '#00ff88' },
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
      "glass-card p-6 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group",
      active ? "border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.2)]" : "hover:border-white/20 hover:bg-white/5"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={cn("p-2 rounded-lg", active ? "bg-[#00d4ff]/20 text-[#00d4ff]" : "bg-white/5 text-gray-400 group-hover:text-white transition-colors")}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className={cn("flex items-center text-sm font-medium", isPositive ? "text-[#00ff88]" : "text-[#ff4444]")}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {change}%
      </div>
      <div className="h-10 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#00ff88" : "#ff4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#00ff88" : "#ff4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={isPositive ? "#00ff88" : "#ff4444"} fillOpacity={1} fill={`url(#color-${title})`} strokeWidth={2} />
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
    await new Promise(r => setTimeout(r, 400)); // UI effect
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

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'Critical': return 'bg-[#ff4444] shadow-[#ff4444]/50 shadow-lg';
      case 'High': return 'bg-[#ffaa00] shadow-[#ffaa00]/50 shadow-lg';
      case 'Medium': return 'bg-[#00d4ff] shadow-[#00d4ff]/50 shadow-lg';
      case 'Low': return 'bg-[#00ff88] shadow-[#00ff88]/50 shadow-lg';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400">Overview of tracing activity and risks</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 flex items-center">
            {isRefreshing ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</span>
            ) : (
              `Last updated: ${secondsAgo}s ago`
            )}
          </div>
          <button 
            onClick={refresh}
            className="p-2 glass-card rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#00d4ff]")} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="glass-card p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search address, VASP, or ID... (Ctrl+K)" 
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <select className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none appearance-none min-w-[120px]">
            <option>All VASPs</option>
            <option>Binance</option>
            <option>Kraken</option>
            <option>WazirX</option>
            <option>Unknown</option>
          </select>
          <select className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none appearance-none min-w-[120px]">
            <option>All Risks</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:outline-none appearance-none min-w-[120px]">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#00d4ff]/10 text-[#00d4ff] rounded-lg hover:bg-[#00d4ff]/20 transition-colors border border-[#00d4ff]/30 whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-gray-400 text-sm">
                <th className="p-4 font-medium cursor-pointer hover:text-white">Trace ID</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Target Address</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Chain</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">VASP</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Risk Level</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Confidence</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Amount</th>
                <th className="p-4 font-medium cursor-pointer hover:text-white">Time</th>
              </tr>
            </thead>
            <tbody>
              {displayTraces.map((trace, i) => (
                <tr 
                  key={i} 
                  onClick={() => router.push(`/trace?id=${trace.id}&address=${trace.target}&chain=${trace.chain.toLowerCase()}`)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono text-[#00d4ff]">{trace.id}</td>
                  <td className="p-4 font-mono text-sm">{trace.target}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-white/10 text-xs font-semibold">{trace.chain}</span>
                  </td>
                  <td className="p-4">{trace.vasp}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", getRiskColor(trace.risk))} />
                      <span>{trace.risk}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00d4ff]" 
                          style={{ width: `${trace.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm">{trace.confidence}%</span>
                    </div>
                  </td>
                  <td className="p-4">{trace.amount}</td>
                  <td className="p-4 text-sm text-gray-400">{trace.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-center">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Show More</button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Chain Distribution</h3>
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
                  contentStyle={{ backgroundColor: '#12121a', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Risk Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                <YAxis stroke="#666" tick={{ fill: '#666' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#12121a', borderColor: 'rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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

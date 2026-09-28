'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldAlert, 
  Search, 
  ChevronDown, 
  Activity, 
  LayoutDashboard, 
  Briefcase, 
  Route, 
  Network, 
  FileText, 
  Bell,
  GitFork,
  Building2,
  Sliders
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: Briefcase },
  { name: 'Trace Funds', href: '/trace', icon: Route },
  { name: 'Clusters', href: '/clusters', icon: Network },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Alerts', href: '/alerts', icon: Bell, badge: 3 },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isTracePage = pathname.startsWith('/trace');

  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read initial address/chain from search params if available
  useEffect(() => {
    const addrParam = searchParams.get('address');
    const chainParam = searchParams.get('chain');
    if (addrParam) setAddress(addrParam);
    if (chainParam) setChain(chainParam.toLowerCase());
  }, [searchParams]);

  // Read active trace tab from query params or default to 'graph'
  const currentTab = searchParams.get('tab') || 'graph';

  const handleTraceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = address.trim();
    if (!cleanAddr) return;

    setIsSubmitting(true);
    // Dispatch custom event for immediate reaction if already on /trace
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('topbar-initiate-trace', {
          detail: { address: cleanAddr, chain }
        })
      );
    }

    // Always ensure we navigate or sync query params to /trace
    router.push(`/trace?address=${encodeURIComponent(cleanAddr)}&chain=${encodeURIComponent(chain)}&tab=${currentTab}`);
    setTimeout(() => setIsSubmitting(false), 400);
  };

  const handleSwitchTab = (tab: 'graph' | 'attribution' | 'findings') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('switch-trace-tab', { detail: { tab } })
      );
    }
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('tab', tab);
    router.push(`/trace?${currentParams.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* ========================================================================= */}
      {/* ROW 1: BRANDING, SEARCH BAR, STATUS, THEME SWITCH, USER PROFILE           */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Sahyog Branding */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <span className="text-xl font-black tracking-wider text-slate-900 dark:text-slate-50 flex items-center gap-1.5 leading-none">
              SAHYOG
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mt-0.5">
              VASP Attribution Engine
            </span>
          </div>
        </Link>

        {/* Center: Full-Width Trace Search Bar */}
        <form 
          onSubmit={handleTraceSubmit}
          className={cn(
            "flex-1 max-w-3xl mx-2 lg:mx-6 flex items-center gap-2 p-1 rounded-2xl border transition-all duration-200",
            "bg-slate-100 dark:bg-slate-900/90",
            isFocused 
              ? "border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-2 ring-blue-500/20" 
              : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
          )}
        >
          {/* Address Input */}
          <div className="relative flex-1 flex items-center">
            <Search className={cn("w-4 h-4 ml-3 shrink-0 transition-colors", isFocused ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
            <input
              type="text"
              className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none"
              placeholder={chain === 'tron' ? "Enter Tron address (T...) or TxHash" : "Enter Ethereum address (0x...) or TxHash"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>

          {/* Currency Dropdown */}
          <div className="relative shrink-0 border-l border-slate-200 dark:border-slate-800 pl-1.5">
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="appearance-none bg-transparent py-1.5 pl-2 pr-7 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ethereum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">ETH (ERC-20)</option>
              <option value="tron" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">TRX (TRC-20)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Initiate Trace Button */}
          <button
            type="submit"
            disabled={!address.trim() || isSubmitting}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Tracing...</span>
              </>
            ) : (
              <span>Initiate Trace</span>
            )}
          </button>
        </form>

        {/* Right Controls: Live Status, Theme Switch, Profile Chip */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Live Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold">Engine Online</span>
          </div>

          {/* Light/Dark Theme Switch */}
          <ThemeToggle />

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              IO
            </div>
            <div className="hidden xl:block min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                IO-Vikram-742
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight">
                Cyber Crime Unit
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 2: HORIZONTAL TAB NAVIGATION BAR                                      */}
      {/* ========================================================================= */}
      <div className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 transition-colors">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto">
          
          {/* Main App Navigation Tabs (Clean on left) */}
          <nav className="flex items-center space-x-1 py-1.5">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative whitespace-nowrap",
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Trace Workspace Views: Pushed to the right as an active segmented control pill */}
          {isTracePage && (
            <div className="ml-auto flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 shrink-0 shadow-inner">
              <button
                onClick={() => handleSwitchTab('graph')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  currentTab === 'graph'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Trace Graph</span>
              </button>

              <button
                onClick={() => handleSwitchTab('attribution')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  currentTab === 'attribution'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>VASP Attribution</span>
              </button>

              <button
                onClick={() => handleSwitchTab('findings')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  currentTab === 'findings'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Forensic Findings</span>
              </button>
            </div>
          )}

        </div>
      </div>

    </header>
  );
}

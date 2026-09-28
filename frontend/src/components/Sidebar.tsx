"use client";

import Link from 'next/link';
import { LayoutDashboard, Briefcase, Route, Network, FileText, ShieldAlert, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: Briefcase },
  { name: 'Trace Funds', href: '/trace', icon: Route },
  { name: 'Clusters', href: '/clusters', icon: Network },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Alerts', href: '/alerts', icon: Bell, badge: 3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 glass-card border-r border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col z-20 transition-colors">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--border-color)]">
        <h1 className="text-2xl font-bold tracking-wider text-gradient flex items-center gap-2.5">
          <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-500 shrink-0" />
          SAHYOG
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-wide">
          VASP Attribution Engine
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}`));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative group",
                isActive 
                  ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200")} />
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Status Widget */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-3">
        {/* Officer Profile Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
            IO
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              IO-Vikram-742
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              Cyber Crime Unit
            </div>
          </div>
        </div>

        {/* Engine Status & Theme Toggle Row */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              Engine Online
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

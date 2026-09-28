"use client";

import Link from 'next/link';
import { LayoutDashboard, Briefcase, Route, Network, FileText, ShieldAlert, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
    <div className="w-64 glass-card border-r border-white/10 flex flex-col z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-gradient flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-accent" />
          SAHYOG
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-mono uppercase">VASP Attribution Engine</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}`));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative",
                isActive 
                  ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(0,212,255,0.15)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.name}</span>
              {item.badge && (
                <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full absolute right-4">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-gray-400 font-mono">Engine Online</span>
        </div>
      </div>
    </div>
  );
}

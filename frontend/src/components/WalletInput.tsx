'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletInputProps {
  onSubmit: (address: string, chain: string) => void;
  isLoading: boolean;
  initialAddress?: string | null;
  initialChain?: string | null;
}

export default function WalletInput({ onSubmit, isLoading, initialAddress, initialChain }: WalletInputProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [chain, setChain] = useState(initialChain || 'ethereum');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialAddress) setAddress(initialAddress);
    if (initialChain) setChain(initialChain.toLowerCase());
  }, [initialAddress, initialChain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onSubmit(address.trim(), chain);
    }
  };

  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 md:p-6 transition-all duration-300 border border-[var(--border-color)] bg-[var(--bg-surface)]",
      isFocused ? "shadow-[0_0_25px_rgba(37,99,235,0.15)] border-blue-500/50" : ""
    )}>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3.5 relative z-10">
        
        {/* Address Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={cn("w-5 h-5 transition-colors", isFocused ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
          </div>
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            placeholder={chain === 'tron' ? "Enter Tron address (T...) or TxHash" : "Enter Ethereum address (0x...) or TxHash"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
          />
        </div>

        {/* Chain Selector */}
        <div className="relative w-full md:w-52">
          <select
            className="w-full appearance-none bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl py-3.5 pl-4 pr-10 text-slate-900 dark:text-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            disabled={isLoading}
          >
            <option value="ethereum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Ethereum (ETH)</option>
            <option value="tron" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tron (TRX)</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
        </div>

        {/* Initiate Trace Button */}
        <button
          type="submit"
          disabled={!address.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-700 dark:border-blue-500 rounded-xl py-3.5 px-7 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px] text-sm"
        >
          {isLoading ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>Tracing...</span>
            </>
          ) : (
            'Initiate Trace'
          )}
        </button>

      </form>
    </div>
  );
}

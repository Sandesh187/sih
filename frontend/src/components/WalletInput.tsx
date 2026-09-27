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
      "glass-card rounded-2xl p-6 transition-all duration-300",
      isFocused ? "shadow-[0_0_30px_rgba(0,212,255,0.2)] border-accent/40" : ""
    )}>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 relative z-10">
        
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={cn("w-5 h-5 transition-colors", isFocused ? "text-accent" : "text-gray-400")} />
          </div>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
            placeholder="Enter wallet address (0x...) or TxHash"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
          />
        </div>

        <div className="relative w-full md:w-48">
          <select
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            disabled={isLoading}
          >
            <option value="ethereum">Ethereum (ETH)</option>
            <option value="tron">Tron (TRX)</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!address.trim() || isLoading}
          className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 rounded-xl py-4 px-8 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Activity className="w-5 h-5 animate-pulse" />
              Tracing...
            </>
          ) : (
            'Initiate Trace'
          )}
        </button>

      </form>
    </div>
  );
}

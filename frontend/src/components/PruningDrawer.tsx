'use client';

import React, { useState } from 'react';
import { 
  X, 
  FilterX, 
  ShieldCheck, 
  Copy, 
  Check, 
  Search, 
  FileCheck
} from 'lucide-react';

interface PrunedRecord {
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  currency: string;
  reason: 'DUST' | 'BRANCH_LIMIT_EXCEEDED' | 'ASSET_MISMATCH';
}

interface PruningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records?: PrunedRecord[];
  minThreshold?: number;
}

const mockDefaultPrunedRecords: PrunedRecord[] = [
  {
    tx_hash: '0x8f2d1e4c9a8b7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e',
    from_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    to_address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    amount: 1.45,
    currency: 'USDT',
    reason: 'DUST',
  },
  {
    tx_hash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    from_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    to_address: '0x2222222254fb6c44bac0bed2854e76f90643097d',
    amount: 8.20,
    currency: 'USDT',
    reason: 'DUST',
  },
  {
    tx_hash: '0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff',
    from_address: '0x999999cf1046e68e36e1aA2E0E07105eDDD1f08E',
    to_address: '0x3333333354fb6c44bac0bed2854e76f90643097d',
    amount: 15.00,
    currency: 'USDT',
    reason: 'DUST',
  },
  {
    tx_hash: '0xbbbbccccddddeeeeffff0000111122223333444455556666777788889999aaaa',
    from_address: '0x999999cf1046e68e36e1aA2E0E07105eDDD1f08E',
    to_address: '0x4444444454fb6c44bac0bed2854e76f90643097d',
    amount: 1250.00,
    currency: 'SHIB',
    reason: 'ASSET_MISMATCH',
  },
  {
    tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to_address: '0x5555555554fb6c44bac0bed2854e76f90643097d',
    amount: 450.00,
    currency: 'USDT',
    reason: 'BRANCH_LIMIT_EXCEEDED',
  },
];

export default function PruningDrawer({
  isOpen,
  onClose,
  records = mockDefaultPrunedRecords,
  minThreshold = 100,
}: PruningDrawerProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const dustCount = records.filter(r => r.reason === 'DUST').length;
  const branchCount = records.filter(r => r.reason === 'BRANCH_LIMIT_EXCEEDED').length;
  const assetMismatchCount = records.filter(r => r.reason === 'ASSET_MISMATCH').length;

  const filteredRecords = records.filter(r => 
    r.tx_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.from_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.to_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0e0e17] text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#12121e]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <FilterX className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                Forensic Pruning Audit Log
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-mono">
                  {records.length} Filtered
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Transparent accounting of low-value and non-relevant blockchain noise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Close Pruning Log"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breakdown Stats */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 grid grid-cols-3 gap-3 bg-slate-50/70 dark:bg-[#13131f]">
          <div className="p-3 rounded-lg bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5">
            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold uppercase">Dust Filtered</div>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">{dustCount}</div>
            <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">&lt; ${minThreshold.toFixed(2)} USDT</div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5">
            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold uppercase">Branch Limit Hit</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-[#ffaa00] mt-0.5">{branchCount}</div>
            <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Ranked beyond max breadth</div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/5">
            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold uppercase">Asset Mismatch</div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-[#00d4ff] mt-0.5">{assetMismatchCount}</div>
            <div className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Non-target tokens</div>
          </div>
        </div>

        {/* Evidentiary Transparency Banner */}
        <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>All pruned records are preserved in Section 63 BSA audit log to prevent evidentiary omission.</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search by tx hash, wallet address, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-[#0a0a0f] border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-gray-500">
              No pruned records match your filter criteria.
            </div>
          ) : (
            filteredRecords.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#13131f] border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    r.reason === 'DUST' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' 
                      : r.reason === 'BRANCH_LIMIT_EXCEEDED'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                  }`}>
                    {r.reason}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {r.amount.toFixed(2)} {r.currency}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-gray-400 break-all flex items-center justify-between gap-2">
                  <span className="truncate">Tx: {r.tx_hash}</span>
                  <button
                    onClick={() => copyToClipboard(r.tx_hash, `tx-${idx}`)}
                    className="p-1 hover:text-slate-900 dark:hover:text-white shrink-0 text-slate-400"
                  >
                    {copiedHash === `tx-${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-[#00ff88]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-400">
                  <span className="truncate max-w-[45%]">From: {r.from_address.slice(0, 10)}...</span>
                  <span>&rarr;</span>
                  <span className="truncate max-w-[45%]">To: {r.to_address.slice(0, 10)}...</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#12121e] flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Audit Trail Preserved
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-medium text-xs transition cursor-pointer"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
}

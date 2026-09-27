'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, ShieldAlert, Users, Calendar } from 'lucide-react';

interface WalletSidePanelProps {
  address: string | null;
  isOpen: boolean;
  onClose: () => void;
  chain: string;
}

export default function WalletSidePanel({ address, isOpen, onClose, chain }: WalletSidePanelProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && address) {
      setLoading(true);
      // Simulate fetch
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, address]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#12121a] border-l border-white/10 z-50 shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">Address Details</h2>

              <div className="glass-card p-4 rounded-xl border border-white/5 mb-6">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Wallet Address</div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm text-[#00d4ff] break-all">{address}</div>
                  <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded shrink-0">
                    {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <div className="mt-3 inline-block px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10 capitalize">
                  {chain} Network
                </div>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 bg-white/5 rounded-xl"></div>
                  <div className="h-32 bg-white/5 rounded-xl"></div>
                  <div className="h-40 bg-white/5 rounded-xl"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Estimated Balance</div>
                      <div className="text-lg font-medium text-white">$1,245,600.00</div>
                    </div>
                    <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Tx Count</div>
                      <div className="text-lg font-medium text-white">3,492</div>
                    </div>
                  </div>

                  {/* Risk Section */}
                  <div className="bg-[#ff4444]/10 p-5 rounded-xl border border-[#ff4444]/20">
                    <div className="flex items-center gap-2 text-[#ff4444] font-medium mb-3">
                      <ShieldAlert className="w-5 h-5" /> Risk Assessment
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-3xl font-bold text-white">82</span>
                      <span className="text-sm text-gray-400 mb-1">/ 100</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 mb-3">
                      <div className="bg-gradient-to-r from-[#ffaa00] to-[#ff4444] h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                    <div className="text-sm text-gray-300">
                      High risk wallet. Associated with known mixer addresses and rapid fund dispersion patterns.
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-3 bg-[#0a0a0f] p-5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" /> First Seen
                      </div>
                      <div className="text-sm text-white">Oct 12, 2024</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" /> Last Active
                      </div>
                      <div className="text-sm text-white">2 hours ago</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" /> Cluster Size
                      </div>
                      <div className="text-sm text-white">45 addresses</div>
                    </div>
                  </div>

                  {/* Top Counterparties */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Top Counterparties</h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between bg-[#0a0a0f] p-3 rounded-lg border border-white/5">
                          <div className="font-mono text-xs text-gray-400">0x{(Math.random()*1e16).toString(16).substring(0,8)}...</div>
                          <div className="text-xs text-[#00ff88]">+ ${(Math.random()*50000).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    View in Explorer <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

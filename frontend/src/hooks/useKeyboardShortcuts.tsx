'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'lucide-react';

export function useKeyboardShortcuts() {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('focus-search'));
      }
      
      // Cmd+N or Ctrl+N
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/trace');
      }

      // Cmd+/ or Ctrl+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }

      // Escape
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        // Can add more escape logic here for other modals
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return { showShortcutsModal, setShowShortcutsModal };
}

export function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', description: 'Focus Search' },
    { key: 'Ctrl + N', description: 'New Trace' },
    { key: 'Ctrl + /', description: 'Show Shortcuts' },
    { key: 'Esc', description: 'Close Modals' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6 rounded-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Command className="w-5 h-5" /> Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-gray-300">{s.description}</span>
              <kbd className="px-2 py-1 bg-white/10 rounded text-sm font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

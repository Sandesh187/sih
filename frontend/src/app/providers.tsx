'use client';

import { useKeyboardShortcuts, KeyboardShortcutsModal } from '@/hooks/useKeyboardShortcuts';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Providers({ children }: { children: React.ReactNode }) {
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
    </>
  );
}

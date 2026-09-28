'use client';

import { useKeyboardShortcuts, KeyboardShortcutsModal } from '@/hooks/useKeyboardShortcuts';

export default function Providers({ children }: { children: React.ReactNode }) {
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
    </>
  );
}

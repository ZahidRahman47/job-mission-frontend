'use client';

import { createContext, useContext } from 'react';

// Global actions any screen can trigger: the command palette and the "New application" dialog.
export interface ShellActions {
  openPalette: () => void;
  openNewApplication: (defaults?: { companyName?: string }) => void;
}

export const ShellContext = createContext<ShellActions | null>(null);

export function useShell(): ShellActions {
  const actions = useContext(ShellContext);
  if (!actions) throw new Error('useShell must be used inside <AppShell>');
  return actions;
}

import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/app-shell';

// The authenticated area. src/proxy.ts sends visitors without a session cookie to /login; an
// expired session is caught by the 401 handler in providers.tsx.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ApiError } from '@/lib/api/errors';

// The session ended (expired, revoked, logged out in another tab): back to the login page, then
// back here after logging in. A wrong password is INVALID_CREDENTIALS and stays a form error.
function isSessionLost(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === 'UNAUTHENTICATED' || error.code === 'SESSION_EXPIRED')
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  // One client per browser tab, created once (not on every render).
  const [client] = useState(() => {
    const onError = (error: unknown) => {
      const { pathname, search } = window.location;
      if (!isSessionLost(error) || pathname === '/login') return;
      router.replace(`/login?next=${encodeURIComponent(pathname + search)}`);
    };
    const queryClient: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          // Don't retry answers that won't change (401, 404, 409, validation); do retry blips.
          retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
        },
      },
    });
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: 0,
            background: 'var(--panel)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </QueryClientProvider>
  );
}

'use client';

import { Button } from '@/components/ui/button';

// Catches render errors in any app screen; the shell (navigation) stays usable.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border border-line bg-panel p-8">
      <span className="eyebrow">Something broke</span>
      <h1 className="display m-0 text-3xl font-bold">This screen hit an error.</h1>
      <p className="m-0 max-w-lg text-muted">
        Your data is safe. Try again, and if it keeps happening, reload the page.
        {error.digest && (
          <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span>
        )}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

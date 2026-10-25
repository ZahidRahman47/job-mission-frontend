import type { ReactNode } from 'react';
import { Logo } from '@/components/shell/logo';

// Split screen: the brand statement on ink, the form on warm white. Stacks on small screens.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside
        data-theme="dark"
        className="flex flex-col justify-between gap-10 bg-bg px-6 py-8 text-text sm:px-12 lg:py-12"
      >
        <Logo href="/" className="text-text" />
        <div className="flex flex-col gap-6">
          <p className="display m-0 text-[clamp(36px,4.6vw,64px)] leading-[1.02] font-extrabold">
            Every application.
            <br />
            Every follow-up.
            <br />
            <span className="text-accent">One clear picture.</span>
          </p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-muted">
            <li>
              <span className="font-mono text-xs text-accent">01</span> &nbsp;Log a job in under a
              minute.
            </li>
            <li>
              <span className="font-mono text-xs text-accent">02</span> &nbsp;Never miss a
              follow-up.
            </li>
            <li>
              <span className="font-mono text-xs text-accent">03</span> &nbsp;See which channels
              actually work.
            </li>
          </ul>
        </div>
        <span className="font-mono text-xs text-muted">
          YOUR DATA STAYS PRIVATE. EXPORT IT ANY TIME.
        </span>
      </aside>
      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

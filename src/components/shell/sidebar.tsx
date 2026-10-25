'use client';

import { LogOut, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { useApplications, useLogout, useMe, useReminderCounts } from '@/lib/queries';
import { Logo } from './logo';
import { NAV } from './nav';
import { useShell } from './shell-context';
import { ThemeToggle } from './theme-toggle';

export function isActive(pathname: string, href: string): boolean {
  const base = href.startsWith('/settings') ? '/settings' : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const reminders = useReminderCounts();
  const applications = useApplications({ limit: 1 });
  const counts: Record<string, number | undefined> = {
    '/today': reminders.data ? reminders.data.overdue + reminders.data.today : undefined,
    '/applications': applications.data?.meta.total,
    '/reminders': reminders.data
      ? reminders.data.overdue + reminders.data.today + reminders.data.upcoming
      : undefined,
  };

  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        const count = counts[href];
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 px-3 text-sm no-underline transition',
                active
                  ? 'bg-side-active-bg font-bold text-side-active-fg'
                  : 'font-medium text-side-text hover:bg-side-line/60',
              )}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'font-mono text-xs',
                    active ? 'text-side-active-fg' : 'text-side-muted',
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const { openPalette, openNewApplication } = useShell();
  const me = useMe();
  const logout = useLogout();

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-side-line bg-side-bg px-4 py-6 text-side-text lg:flex"
    >
      <Logo className="px-1 text-side-text" />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={openPalette}
          className="flex h-11 items-center gap-2.5 border border-side-line bg-panel px-3 text-left text-sm text-side-muted hover:border-side-text"
        >
          <Search size={15} aria-hidden="true" />
          <span className="flex-1 truncate">Search…</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            openNewApplication();
          }}
          className="flex h-11 items-center justify-center gap-2 border border-accent bg-accent text-sm font-bold text-on-accent hover:brightness-95"
        >
          <Plus size={16} aria-hidden="true" strokeWidth={2.4} />
          New application
        </button>
      </div>

      <NavLinks />

      <div className="mt-auto flex items-center gap-3 border-t border-side-line pt-5">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center bg-side-line text-xs font-bold"
        >
          {me.data ? initials(me.data.name) : ''}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold">{me.data?.name ?? ' '}</span>
          <Link
            href="/settings/profile"
            className="text-xs text-side-muted no-underline hover:text-side-text"
          >
            Settings
          </Link>
        </div>
        <ThemeToggle />
        <button
          type="button"
          aria-label="Log out"
          title="Log out"
          disabled={logout.isPending}
          onClick={() => {
            logout.mutate();
          }}
          className="flex size-9 shrink-0 items-center justify-center text-side-muted hover:text-side-text disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

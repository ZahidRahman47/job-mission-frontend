'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/preferences', label: 'Job search' },
  { href: '/settings/capture', label: 'Gmail capture' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/data', label: 'Your data' },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="flex overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px flex h-12 shrink-0 items-center border-b-2 px-4 text-sm font-semibold no-underline',
              active ? 'border-text text-text' : 'border-transparent text-muted hover:text-text',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

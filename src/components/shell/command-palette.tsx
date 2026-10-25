'use client';

import { ArrowRight, Plus, Search } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState, type KeyboardEvent } from 'react';
import { StatusPill } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { useApplications } from '@/lib/queries';
import type { ApplicationStatus } from '@/lib/types';
import { NAV } from './nav';

interface Command {
  id: string;
  label: string;
  hint?: string;
  status?: ApplicationStatus;
  icon: 'go' | 'new' | 'app';
  run: () => void;
}

// Ctrl/Cmd+K: jump anywhere, create, or find an application by company or title. The slot where
// AI assistance can plug in later (v2), built from deterministic actions first.
export function CommandPalette({
  open,
  onOpenChange,
  onNewApplication,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewApplication: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(query.trim());
  const results = useApplications({ q: deferred, limit: 6, archived: 'include' });

  const close = () => {
    onOpenChange(false);
    setQuery('');
    setActive(0);
  };

  const commands = useMemo<Command[]>(() => {
    const needle = query.trim().toLowerCase();
    const base: Command[] = [
      {
        id: 'new',
        label: 'New application',
        hint: 'Create',
        icon: 'new' as const,
        run: onNewApplication,
      },
      ...NAV.map((item) => ({
        id: item.href,
        label: `Go to ${item.label}`,
        icon: 'go' as const,
        run: () => {
          router.push(item.href);
        },
      })),
    ].filter((c) => !needle || c.label.toLowerCase().includes(needle));
    const apps: Command[] = needle
      ? (results.data?.data ?? []).map((app) => ({
          id: app.id,
          label: `${app.companyName} · ${app.title}`,
          status: app.status,
          icon: 'app' as const,
          run: () => {
            router.push(`/applications/${app.id}`);
          },
        }))
      : [];
    return [...apps, ...base];
  }, [query, results.data, router, onNewApplication]);

  const select = (command: Command | undefined) => {
    if (!command) return;
    close();
    command.run();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(commands[active]);
    }
  };

  return (
    <D.Root
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 border border-line bg-panel text-text shadow-2xl">
          <D.Title className="sr-only">Command palette</D.Title>
          <D.Description className="sr-only">
            Search applications or jump to a page. Use arrow keys and Enter.
          </D.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search size={17} aria-hidden="true" className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search applications, or type a command…"
              aria-label="Search or run a command"
              aria-controls="palette-results"
              aria-activedescendant={commands[active] ? `cmd-${commands[active].id}` : undefined}
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
          </div>
          <ul
            id="palette-results"
            role="listbox"
            aria-label="Results"
            className="m-0 max-h-[50vh] list-none overflow-y-auto p-1.5"
          >
            {commands.length === 0 && (
              <li className="px-3 py-6 text-sm text-muted">No matches for “{query}”.</li>
            )}
            {commands.map((command, index) => (
              <li
                key={command.id}
                id={`cmd-${command.id}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onClick={() => {
                  select(command);
                }}
                className={cn(
                  'flex h-11 cursor-pointer items-center gap-3 px-3 text-sm',
                  index === active && 'bg-track',
                )}
              >
                {command.icon === 'new' ? (
                  <Plus size={15} aria-hidden="true" />
                ) : command.icon === 'go' ? (
                  <ArrowRight size={15} aria-hidden="true" className="text-muted" />
                ) : (
                  <span aria-hidden="true" className="size-[15px]" />
                )}
                <span className="flex-1 truncate">{command.label}</span>
                {command.status && <StatusPill status={command.status} />}
                {command.hint && <span className="eyebrow">{command.hint}</span>}
              </li>
            ))}
          </ul>
          <div className="flex gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
            <span>↑↓ to move</span>
            <span>Enter to open</span>
            <span>Esc to close</span>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

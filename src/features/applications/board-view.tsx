'use client';

import { CalendarClock, GripVertical, List, MoreHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/button';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/overlays';
import { PageHeader, Skeleton, StatusPill } from '@/components/ui/primitives';
import { useShell } from '@/components/shell/shell-context';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { allowedTransitions, STATUS_LABEL } from '@/lib/domain';
import { followUpLabel } from '@/lib/format';
import { useApplications, useMoveApplication } from '@/lib/queries';
import type { ApplicationListItem, ApplicationStatus } from '@/lib/types';

const COLUMNS: { key: string; statuses: ApplicationStatus[]; title: string }[] = [
  { key: 'saved', statuses: ['saved'], title: 'Saved' },
  { key: 'applied', statuses: ['applied'], title: 'Applied' },
  { key: 'screening', statuses: ['screening'], title: 'Screening' },
  { key: 'interview', statuses: ['interview'], title: 'Interview' },
  { key: 'offer', statuses: ['offer', 'accepted'], title: 'Offer' },
  { key: 'closed', statuses: ['rejected', 'withdrawn'], title: 'Closed' },
];

// Dropping onto a column means its first status that the rules allow from the card's status.
function targetFor(
  app: ApplicationListItem,
  column: (typeof COLUMNS)[number],
): ApplicationStatus | undefined {
  const allowed = allowedTransitions(app.status, app.previousStatus);
  return column.statuses.find((s) => allowed.includes(s));
}

function Card({
  app,
  onMove,
  onDragStart,
}: {
  app: ApplicationListItem;
  onMove: (app: ApplicationListItem, to: ApplicationStatus) => void;
  onDragStart: (app: ApplicationListItem) => void;
}) {
  const follow = followUpLabel(app.nextFollowUpAt);
  const targets = allowedTransitions(app.status, app.previousStatus);
  return (
    <li
      draggable={targets.length > 0}
      onDragStart={(e: DragEvent) => {
        e.dataTransfer.setData('text/plain', app.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(app);
      }}
      className="group flex flex-col gap-2 border border-line bg-panel p-3 hover:border-text"
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 cursor-grab text-muted opacity-40 group-hover:opacity-100"
        />
        <Link
          href={`/applications/${app.id}`}
          className="flex min-w-0 flex-1 flex-col no-underline"
        >
          <span className="truncate text-sm font-bold">{app.companyName}</span>
          <span className="truncate text-[13px] text-muted">{app.title}</span>
        </Link>
        <Menu
          trigger={
            <button
              type="button"
              aria-label={`Move ${app.companyName} · ${app.title}`}
              className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center text-muted hover:bg-track hover:text-text"
            >
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>
          }
        >
          <MenuLabel>Move to</MenuLabel>
          {targets.length === 0 && (
            <MenuItem disabled>No moves from {STATUS_LABEL[app.status]}</MenuItem>
          )}
          {targets.map((to) => (
            <MenuItem
              key={to}
              onSelect={() => {
                onMove(app, to);
              }}
            >
              <StatusPill status={to} />
            </MenuItem>
          ))}
        </Menu>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-5">
        {app.status !== 'saved' &&
          app.status !== 'applied' &&
          app.status !== 'screening' &&
          app.status !== 'interview' && <StatusPill status={app.status} />}
        {follow !== '—' && (
          <span
            className={cn(
              'font-mono text-[11px]',
              follow === 'OVERDUE' ? 'bg-flag-bg px-1 text-flag-fg' : 'text-muted',
            )}
          >
            {follow === 'OVERDUE' ? 'OVERDUE' : `FOLLOW-UP ${follow}`}
          </span>
        )}
        {app.interviewCount > 0 && (
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
            <CalendarClock size={11} aria-hidden="true" />
            {app.interviewCount}
          </span>
        )}
      </div>
    </li>
  );
}

function Column({
  column,
  dragging,
  onMove,
  onDragStart,
}: {
  column: (typeof COLUMNS)[number];
  dragging: ApplicationListItem | null;
  onMove: (app: ApplicationListItem, to: ApplicationStatus) => void;
  onDragStart: (app: ApplicationListItem) => void;
}) {
  const result = useApplications({
    status: column.statuses,
    sort: 'nextFollowUpAt',
    order: 'asc',
    limit: 50,
  });
  const [over, setOver] = useState(false);
  const target = dragging ? targetFor(dragging, column) : undefined;
  const isSource = dragging ? column.statuses.includes(dragging.status) : false;

  return (
    <section
      aria-label={`${column.title} column`}
      onDragOver={(e) => {
        if (target) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (dragging && target) onMove(dragging, target);
      }}
      className={cn(
        'flex w-72 shrink-0 flex-col border bg-bg transition',
        over ? 'border-text bg-soft' : 'border-line',
        dragging && !target && !isSource && 'opacity-40',
      )}
    >
      <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <h2 className="m-0 text-sm font-bold">{column.title}</h2>
        <span className="font-mono text-xs text-muted">{result.data?.meta.total ?? ''}</span>
      </header>
      <ol className="m-0 flex max-h-[calc(100dvh-280px)] min-h-32 list-none flex-col gap-2 overflow-y-auto p-2">
        {!result.data
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20" />)
          : result.data.data.map((app) => (
              <Card key={app.id} app={app} onMove={onMove} onDragStart={onDragStart} />
            ))}
        {result.data && result.data.meta.total > result.data.data.length && (
          <li className="px-2 py-1 text-center text-xs text-muted">
            + {result.data.meta.total - result.data.data.length} more in{' '}
            <Link
              href={`/applications?status=${column.statuses.join(',')}`}
              className="font-semibold text-accent-text"
            >
              the list
            </Link>
          </li>
        )}
      </ol>
    </section>
  );
}

export function BoardView() {
  const { openNewApplication } = useShell();
  const move = useMoveApplication();
  const [dragging, setDragging] = useState<ApplicationListItem | null>(null);

  const onMove = (app: ApplicationListItem, to: ApplicationStatus) => {
    setDragging(null);
    move
      .mutateAsync({ id: app.id, to, version: app.version })
      .then(() => toast.success(`${app.companyName} → ${STATUS_LABEL[to]}`))
      .catch((err: unknown) => toast.error(errorMessage(err)));
  };

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Board"
        description="Drag a card to move it. Only moves the rules allow light up."
        actions={
          <>
            <ButtonLink href="/applications" variant="secondary">
              <List size={15} aria-hidden="true" /> List
            </ButtonLink>
            <Button
              variant="primary"
              onClick={() => {
                openNewApplication();
              }}
            >
              <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> New application
            </Button>
          </>
        }
      />
      <div
        onDragEnd={() => {
          setDragging(null);
        }}
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
      >
        {COLUMNS.map((column) => (
          <Column
            key={column.key}
            column={column}
            dragging={dragging}
            onMove={onMove}
            onDragStart={setDragging}
          />
        ))}
      </div>
    </>
  );
}

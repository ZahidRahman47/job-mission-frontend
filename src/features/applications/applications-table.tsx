'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/primitives';
import type { SortField } from '@/lib/api/applications';
import { cn } from '@/lib/cn';
import { SOURCE_LABEL } from '@/lib/domain';
import { followUpLabel, shortDate } from '@/lib/format';
import type { ApplicationListItem } from '@/lib/types';

interface Sorting {
  field: SortField;
  order: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}

const COLUMNS: { label: string; field?: SortField; className?: string }[] = [
  { label: 'Company', field: 'companyName' },
  { label: 'Role' },
  { label: 'Status', field: 'status' },
  { label: 'Applied', field: 'appliedAt' },
  { label: 'Next follow-up', field: 'nextFollowUpAt' },
  { label: 'Source', className: 'hidden xl:table-cell' },
];

function SortHeader({
  label,
  field,
  sorting,
}: {
  label: string;
  field: SortField;
  sorting: Sorting;
}) {
  const active = sorting.field === field;
  const Icon = !active ? ArrowUpDown : sorting.order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => {
        sorting.onSort(field);
      }}
      className={cn(
        'inline-flex items-center gap-1.5 uppercase hover:text-text',
        active && 'text-text',
      )}
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}

export function ApplicationsTable({
  rows,
  sorting,
  dense = false,
  loading = false,
}: {
  rows: ApplicationListItem[];
  sorting?: Sorting;
  dense?: boolean;
  loading?: boolean;
}) {
  const cell = dense ? 'px-5 py-3' : 'px-5 py-3.5';
  return (
    <div className="overflow-x-auto">
      <table
        aria-busy={loading || undefined}
        className={cn(
          'w-full min-w-[760px] border-collapse text-sm transition-opacity',
          loading && 'opacity-60',
        )}
      >
        <thead>
          <tr className="text-left">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                scope="col"
                aria-sort={
                  sorting && col.field && sorting.field === col.field
                    ? sorting.order === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                className={cn('eyebrow border-b border-line px-5 py-3 font-medium', col.className)}
              >
                {sorting && col.field ? (
                  <SortHeader label={col.label} field={col.field} sorting={sorting} />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => {
            const follow = followUpLabel(app.nextFollowUpAt);
            return (
              <tr key={app.id} className="group border-b border-line last:border-b-0 hover:bg-bg">
                <td className={cn(cell, 'font-semibold')}>
                  <Link href={`/applications/${app.id}`} className="no-underline hover:underline">
                    {app.companyName}
                  </Link>
                </td>
                <td className={cell}>
                  <Link href={`/applications/${app.id}`} tabIndex={-1} className="no-underline">
                    {app.title}
                  </Link>
                  {app.archivedAt && <span className="eyebrow ml-2">Archived</span>}
                </td>
                <td className={cell}>
                  <StatusPill status={app.status} />
                </td>
                <td className={cn(cell, 'font-mono text-[13px]')}>{shortDate(app.appliedAt)}</td>
                <td
                  className={cn(
                    cell,
                    'font-mono text-[13px]',
                    (follow === 'OVERDUE' || follow === 'TODAY') && 'font-bold',
                  )}
                >
                  {follow === 'OVERDUE' ? (
                    <span className="bg-flag-bg px-1.5 py-0.5 text-flag-fg">OVERDUE</span>
                  ) : (
                    follow
                  )}
                </td>
                <td className={cn(cell, 'hidden text-muted xl:table-cell')}>
                  {SOURCE_LABEL[app.source]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-6 border-b border-line px-5 py-4 last:border-b-0">
          <div className="h-4 w-32 animate-pulse bg-track" />
          <div className="h-4 flex-1 animate-pulse bg-track" />
          <div className="h-4 w-20 animate-pulse bg-track" />
          <div className="h-4 w-16 animate-pulse bg-track" />
        </div>
      ))}
    </div>
  );
}

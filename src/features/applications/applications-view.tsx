'use client';

import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { EmptyState, ErrorState, PageHeader, Panel } from '@/components/ui/primitives';
import { useShell } from '@/components/shell/shell-context';
import { SORT_FIELDS, type ApplicationQuery, type SortField } from '@/lib/api/applications';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { APPLICATION_STATUSES, SOURCE_LABEL, SOURCES, STATUS_LABEL } from '@/lib/domain';
import { useApplications } from '@/lib/queries';
import type { ApplicationStatus, Source } from '@/lib/types';
import { ApplicationsTable, TableSkeleton } from './applications-table';

const PAGE_SIZE = 25;

function readQuery(params: URLSearchParams): ApplicationQuery {
  const list = <T extends string>(key: string, allowed: readonly T[]): T[] =>
    (params.get(key) ?? '')
      .split(',')
      .filter((v): v is T => (allowed as readonly string[]).includes(v));
  const sort = params.get('sort');
  const archived = params.get('archived');
  return {
    q: params.get('q') ?? '',
    status: list<ApplicationStatus>('status', APPLICATION_STATUSES),
    source: list<Source>('source', SOURCES),
    archived: archived === 'only' || archived === 'include' ? archived : 'exclude',
    sort: (SORT_FIELDS as readonly string[]).includes(sort ?? '')
      ? (sort as SortField)
      : 'appliedAt',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, Number(params.get('page')) || 1),
    limit: PAGE_SIZE,
  };
}

export function ApplicationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { openNewApplication } = useShell();
  const query = readQuery(new URLSearchParams(params.toString()));
  const result = useApplications(query);

  // The URL is the state: filters survive refresh, back/forward, and can be shared.
  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete('page');
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ''}`, { scroll: false });
  };

  // Debounced search (FR-064): the URL (and the request) updates 300 ms after typing stops.
  const [search, setSearch] = useState(query.q ?? '');
  useEffect(() => {
    const handle = setTimeout(() => {
      if (search.trim() !== (query.q ?? '')) update({ q: search.trim() });
    }, 300);
    return () => {
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed text changes
  }, [search]);

  const toggleStatus = (status: ApplicationStatus) => {
    const current = new Set(query.status);
    if (current.has(status)) current.delete(status);
    else current.add(status);
    update({ status: [...current].join(',') });
  };

  const onSort = (field: SortField) => {
    const order = query.sort === field && query.order === 'desc' ? 'asc' : 'desc';
    update({ sort: field, order });
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters =
    (query.status?.length ?? 0) +
    (query.source?.length ?? 0) +
    (query.archived === 'exclude' ? 0 : 1);

  const filtered =
    Boolean(query.q) ||
    (query.status?.length ?? 0) > 0 ||
    (query.source?.length ?? 0) > 0 ||
    query.archived !== 'exclude';
  const meta = result.data?.meta;

  return (
    <>
      <PageHeader
        eyebrow={
          meta ? `${String(meta.total)} ${filtered ? 'matching' : 'active'}` : 'Applications'
        }
        title="Applications"
        actions={
          <>
            <ButtonLink href="/board" variant="secondary">
              <Columns3 size={15} aria-hidden="true" /> Board
            </ButtonLink>
            <ButtonLink href="/settings/data" variant="secondary" className="max-sm:hidden">
              <Download size={15} aria-hidden="true" /> Export
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

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[180px] flex-1">
            <span className="sr-only">Search company or job title</span>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search company or job title"
              className="h-11 w-full border border-line bg-panel pr-3 pl-9 text-[15px] outline-none placeholder:text-muted focus:border-text"
            />
          </label>
          {/* Phones: source, archive and status filters fold behind one button. */}
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="application-filters"
            onClick={() => {
              setFiltersOpen((open) => !open);
            }}
            className={cn(
              'flex h-11 items-center gap-2 border px-3.5 text-[13px] font-semibold md:hidden',
              activeFilters > 0 ? 'border-strong-bg bg-strong-bg text-strong-fg' : 'border-line',
            )}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters{activeFilters > 0 && ` · ${String(activeFilters)}`}
          </button>
          <label className={cn('w-48', !filtersOpen && 'max-md:hidden')}>
            <span className="sr-only">Source</span>
            <Select
              value={query.source?.[0] ?? ''}
              onChange={(e) => {
                update({ source: e.target.value || null });
              }}
            >
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </Select>
          </label>
          <div
            role="group"
            aria-label="Archive"
            className={cn('flex border border-line', !filtersOpen && 'max-md:hidden')}
          >
            {(['exclude', 'only', 'include'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={query.archived === value}
                onClick={() => {
                  update({ archived: value === 'exclude' ? null : value });
                }}
                className={cn(
                  'h-11 px-3.5 text-[13px] font-semibold',
                  query.archived === value ? 'bg-strong-bg text-strong-fg' : 'hover:bg-track',
                )}
              >
                {value === 'exclude' ? 'Active' : value === 'only' ? 'Archived' : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div
          id="application-filters"
          role="group"
          aria-label="Filter by status"
          className={cn('flex flex-wrap gap-2', !filtersOpen && 'max-md:hidden')}
        >
          {APPLICATION_STATUSES.map((status) => {
            const on = query.status?.includes(status) ?? false;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  toggleStatus(status);
                }}
                className={cn(
                  'h-9 border px-3 text-[13px] font-semibold transition',
                  on
                    ? 'border-strong-bg bg-strong-bg text-strong-fg'
                    : 'border-line hover:border-text',
                )}
              >
                {STATUS_LABEL[status]}
              </button>
            );
          })}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                router.replace(pathname, { scroll: false });
              }}
              className="flex h-9 items-center gap-1 px-2 text-[13px] font-semibold text-muted hover:text-text"
            >
              <X size={14} aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <Panel>
        {result.isError ? (
          <ErrorState
            message={errorMessage(result.error)}
            onRetry={() => {
              void result.refetch();
            }}
          />
        ) : !result.data ? (
          <TableSkeleton rows={8} />
        ) : result.data.data.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No matches."
              description="Nothing fits these filters. Try fewer statuses or a shorter search."
            />
          ) : (
            <EmptyState
              title="Your pipeline fills itself."
              description="Connect Gmail once, and your LinkedIn and Indeed applications from the last 30 days appear here, with every new one after that."
              action={
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/settings/capture" variant="primary">
                    Connect Gmail
                  </ButtonLink>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      openNewApplication();
                    }}
                  >
                    Add one by hand
                  </Button>
                </div>
              }
            />
          )
        ) : (
          <ApplicationsTable
            rows={result.data.data}
            loading={result.isPlaceholderData}
            sorting={{ field: query.sort ?? 'appliedAt', order: query.order ?? 'desc', onSort }}
          />
        )}
      </Panel>

      {meta && meta.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          <span className="font-mono text-[13px] text-muted">
            {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of{' '}
            {meta.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={meta.page <= 1}
              onClick={() => {
                update({ page: String(meta.page - 1) }, false);
              }}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </Button>
            <Button
              variant="secondary"
              disabled={meta.page >= meta.totalPages}
              onClick={() => {
                update({ page: String(meta.page + 1) }, false);
              }}
            >
              Next <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}

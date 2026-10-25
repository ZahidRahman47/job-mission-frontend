'use client';

import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorState, Panel, Skeleton, Stat } from '@/components/ui/primitives';
import { useShell } from '@/components/shell/shell-context';
import { ApplicationsTable, TableSkeleton } from '@/features/applications/applications-table';
import { ReminderRow } from '@/features/reminders/reminder-row';
import { defaultRange } from '@/lib/api/analytics';
import { ACTIVE_STATUSES, INTERVIEW_TYPE_LABEL } from '@/lib/domain';
import { errorMessage } from '@/lib/api/errors';
import { percent, time } from '@/lib/format';
import {
  useApplicationLabels,
  useApplications,
  useSummary,
  useTimeseries,
  useUpcoming,
} from '@/lib/queries';
import { Funnel, isoWeek, Momentum } from './charts';

export function TodayView() {
  const { openNewApplication } = useShell();
  const range = useMemo(() => defaultRange(90), []);
  const momentumRange = useMemo(() => defaultRange(84), []);
  const summary = useSummary(range);
  const upcoming = useUpcoming();
  const series = useTimeseries('week', momentumRange);
  const nextUp = useApplications({
    status: [...ACTIVE_STATUSES],
    sort: 'nextFollowUpAt',
    order: 'asc',
    limit: 6,
  });
  const labels = useApplicationLabels();

  const now = new Date();
  const dueToday =
    (upcoming.data?.overdueReminders.length ?? 0) + (upcoming.data?.todayReminders.length ?? 0);
  const dateLine = `${now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · WEEK ${String(isoWeek(now))}`;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="eyebrow">{dateLine}</span>
          <h1 className="display m-0 text-[clamp(34px,5vw,56px)] leading-[1.02] font-extrabold">
            {upcoming.isPending ? (
              <Skeleton className="h-12 w-[min(560px,80vw)]" />
            ) : dueToday === 0 ? (
              <>You're clear for today.</>
            ) : (
              <>
                <span className="bg-hero-bg px-2 text-hero-fg">
                  {dueToday} follow-up{dueToday === 1 ? '' : 's'}
                </span>{' '}
                need{dueToday === 1 ? 's' : ''} you today.
              </>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/settings/data" variant="secondary">
            <Upload size={15} aria-hidden="true" /> Import CSV
          </ButtonLink>
          <Button
            variant="primary"
            onClick={() => {
              openNewApplication();
            }}
          >
            <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> New application
          </Button>
        </div>
      </header>

      <section
        aria-label="Last 90 days"
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px border border-line bg-line"
      >
        {summary.data ? (
          <>
            <Stat
              label="Applied · 90 days"
              value={summary.data.total}
              sub={`${String(summary.data.activePipeline)} still in play`}
            />
            <Stat
              label="Response rate"
              value={percent(summary.data.responseRate)}
              sub="Any employer reply, incl. rejections"
            />
            <Stat
              label="Interview rate"
              value={percent(summary.data.interviewRate)}
              sub="Reached at least one interview"
            />
            <Stat
              label="Offer rate"
              value={percent(summary.data.offerRate)}
              sub={`${String(summary.data.byStatus.offer + summary.data.byStatus.accepted)} offer(s) on the table`}
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 bg-panel p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))
        )}
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-6">
        <Panel
          id="today-h"
          title="Needs you today"
          actions={
            <Link href="/reminders" className="text-[13px] font-semibold text-accent-text">
              All reminders →
            </Link>
          }
        >
          {upcoming.isError ? (
            <ErrorState
              message={errorMessage(upcoming.error)}
              onRetry={() => {
                void upcoming.refetch();
              }}
            />
          ) : !upcoming.data ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : dueToday === 0 ? (
            <EmptyState
              title="Nothing due."
              description="No overdue or same-day follow-ups. Good time to send a few applications."
            />
          ) : (
            <ul className="m-0 list-none p-0">
              {[...upcoming.data.overdueReminders, ...upcoming.data.todayReminders].map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  application={
                    r.applicationId
                      ? { id: r.applicationId, label: labels.get(r.applicationId) ?? '' }
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="iv-h"
          title="Interviews · next 7 days"
          actions={
            <span className="font-mono text-xs text-muted">
              {upcoming.data ? `${String(upcoming.data.interviews.length)} scheduled` : ''}
            </span>
          }
        >
          {!upcoming.data ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : upcoming.data.interviews.length === 0 ? (
            <EmptyState
              title="No interviews this week."
              description="When you add a round with a date, it shows up here."
            />
          ) : (
            <ul className="m-0 list-none p-0">
              {upcoming.data.interviews.map(({ applicationId, title, companyName, interview }) => {
                const at = new Date(interview.scheduledAt ?? 0);
                return (
                  <li key={interview.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/applications/${applicationId}`}
                      className="flex items-center gap-5 px-5 py-3.5 no-underline hover:bg-bg"
                    >
                      <div className="flex w-12 flex-col">
                        <span className="eyebrow">
                          {at.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </span>
                        <span className="display text-[28px] leading-none font-bold">
                          {at.getDate()}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-semibold">
                          {INTERVIEW_TYPE_LABEL[interview.type]} · round {interview.round}
                        </span>
                        <span className="truncate text-[13px] text-muted">
                          {companyName} · {title}
                        </span>
                      </div>
                      <span className="font-mono text-[13px]">
                        {time(interview.scheduledAt ?? '')}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-6">
        <Panel
          id="funnel-h"
          title="Stage funnel"
          actions={<span className="eyebrow">Last 90 days</span>}
          bodyClassName="flex flex-col gap-4 p-5"
        >
          {summary.data ? <Funnel summary={summary.data} /> : <Skeleton className="h-40" />}
          <p className="m-0 text-[13px] text-muted">
            A rejection counts as a response. Withdrawals don't.
          </p>
        </Panel>
        <Panel
          id="mom-h"
          title="Weekly momentum"
          actions={
            <Link href="/analytics" className="text-[13px] font-semibold text-accent-text">
              Analytics →
            </Link>
          }
          bodyClassName="p-5"
        >
          {series.data ? <Momentum series={series.data} /> : <Skeleton className="h-48" />}
        </Panel>
      </div>

      <Panel
        id="next-h"
        title="Next up"
        actions={
          <Link
            href="/applications?sort=nextFollowUpAt&order=asc"
            className="text-[13px] font-semibold text-accent-text"
          >
            View all {nextUp.data ? nextUp.data.meta.total : ''} →
          </Link>
        }
      >
        {nextUp.data ? (
          nextUp.data.data.length === 0 ? (
            <EmptyState
              title="No active applications yet."
              description="Log your first one: company and title are enough."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    openNewApplication();
                  }}
                >
                  New application
                </Button>
              }
            />
          ) : (
            <ApplicationsTable rows={nextUp.data.data} dense />
          )
        ) : (
          <TableSkeleton />
        )}
      </Panel>
    </>
  );
}

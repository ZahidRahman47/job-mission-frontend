'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { PageHeader, Panel, Skeleton, Stat } from '@/components/ui/primitives';
import { Funnel, isoWeek } from '@/features/dashboard/charts';
import { defaultRange } from '@/lib/api/analytics';
import { cn } from '@/lib/cn';
import { APPLICATION_STATUSES, SOURCE_LABEL, STATUS_LABEL } from '@/lib/domain';
import { percent } from '@/lib/format';
import { useSources, useSummary, useTimeseries } from '@/lib/queries';
import { BarChart, HBars } from './bar-chart';

const RANGES = [
  { key: '30', label: '30 days', days: 30 },
  { key: '90', label: '90 days', days: 90 },
  { key: '180', label: '6 months', days: 182 },
  { key: '365', label: '12 months', days: 365 },
] as const;

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex border border-line">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.key === value}
          onClick={() => {
            onChange(o.key);
          }}
          className={cn(
            'h-11 px-3.5 text-[13px] font-semibold',
            o.key === value ? 'bg-strong-bg text-strong-fg' : 'hover:bg-track',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RateBar({ rate }: { rate: number | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 bg-track" aria-hidden="true">
        <div className="h-full bg-bar" style={{ width: `${String((rate ?? 0) * 100)}%` }} />
      </div>
      <span className="font-mono text-[13px]">{percent(rate)}</span>
    </div>
  );
}

export function AnalyticsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rangeKey = RANGES.find((r) => r.key === params.get('range'))?.key ?? '90';
  const interval = params.get('interval') === 'month' ? 'month' : 'week';
  const days = RANGES.find((r) => r.key === rangeKey)?.days ?? 90;
  const range = useMemo(() => defaultRange(days), [days]);

  const summary = useSummary(range);
  const series = useTimeseries(interval, range);
  const sources = useSources(range);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const bars = (series.data?.buckets ?? []).map((b) => {
    const start = new Date(b.start);
    return {
      key: b.start,
      label:
        interval === 'week'
          ? `W${String(isoWeek(start))}`
          : start.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      detail:
        interval === 'week'
          ? `Week of ${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
          : start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      value: b.count,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={
          summary.data ? `${summary.data.range.from} → ${summary.data.range.to}` : 'Analytics'
        }
        title="What's working"
        description="Every number is computed from your own records, with the definitions shown. Applications count in the period they were applied to."
        actions={
          <Segmented
            label="Date range"
            options={RANGES}
            value={rangeKey}
            onChange={(k) => {
              set('range', k);
            }}
          />
        }
      />

      <section
        aria-label="Headline metrics"
        className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-px border border-line bg-line"
      >
        {summary.data ? (
          <>
            <Stat
              label="Applied"
              value={summary.data.total}
              sub={`${String(summary.data.activePipeline)} still in play`}
            />
            <Stat
              label="Response rate"
              value={percent(summary.data.responseRate)}
              sub="Any reply, incl. rejections"
            />
            <Stat
              label="Interview rate"
              value={percent(summary.data.interviewRate)}
              sub="Reached an interview"
            />
            <Stat
              label="Offer rate"
              value={percent(summary.data.offerRate)}
              sub="Of everything applied"
            />
            <Stat
              label="Offer per interview"
              value={percent(summary.data.offerPerInterview)}
              sub="Interview → offer"
            />
          </>
        ) : (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="bg-panel p-5">
              <Skeleton className="h-16" />
            </div>
          ))
        )}
      </section>

      <Panel
        id="over-time-h"
        title={`Applications per ${interval}`}
        actions={
          <Segmented
            label="Interval"
            options={
              [
                { key: 'week', label: 'Weekly' },
                { key: 'month', label: 'Monthly' },
              ] as const
            }
            value={interval}
            onChange={(k) => {
              set('interval', k);
            }}
          />
        }
        bodyClassName="p-5"
      >
        {series.data ? (
          <BarChart
            bars={bars}
            goal={interval === 'week' ? series.data.weeklyGoal : undefined}
            valueLabel="Applications"
            title={`Applications per ${interval}`}
          />
        ) : (
          <Skeleton className="h-64" />
        )}
      </Panel>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-6">
        <Panel id="funnel-h2" title="Stage funnel" bodyClassName="flex flex-col gap-4 p-5">
          {summary.data ? <Funnel summary={summary.data} /> : <Skeleton className="h-40" />}
          <p className="m-0 text-[13px] text-muted">
            Each stage counts applications that ever reached it, so a later rejection still counts
            as an interview reached.
          </p>
        </Panel>
        <Panel id="status-h" title="Where they are now" bodyClassName="p-5">
          {summary.data ? (
            <HBars
              total={summary.data.total}
              rows={APPLICATION_STATUSES.filter((s) => s !== 'saved').map((s) => ({
                label: STATUS_LABEL[s],
                value: summary.data.byStatus[s],
              }))}
            />
          ) : (
            <Skeleton className="h-48" />
          )}
        </Panel>
      </div>

      <Panel
        id="sources-h"
        title="Source effectiveness"
        actions={<span className="eyebrow">Where to spend your time</span>}
      >
        {!sources.data ? (
          <div className="p-5">
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  {['Source', 'Applied', 'Responses', 'Response rate', 'Interview rate'].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="eyebrow border-b border-line px-5 py-3 font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sources.data.map((row) => (
                  <tr key={row.source} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-5 py-3 text-left font-semibold">
                      {SOURCE_LABEL[row.source]}
                    </th>
                    <td className="px-5 py-3 font-mono">{row.total}</td>
                    <td className="px-5 py-3 font-mono">{row.responded}</td>
                    <td className="px-5 py-3">
                      <RateBar rate={row.responseRate} />
                    </td>
                    <td className="px-5 py-3">
                      <RateBar rate={row.interviewRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

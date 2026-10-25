'use client';

// The two signature visuals: the stage funnel (honest, from milestone timestamps) and weekly
// momentum against the goal. Plain elements, not a chart library: crisp, themable, accessible.
import { cn } from '@/lib/cn';
import type { Summary, Timeseries } from '@/lib/types';

export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function Funnel({ summary }: { summary: Summary }) {
  const total = summary.total;
  const stages = [
    { label: 'Applied', n: total },
    { label: 'Responded', n: Math.round((summary.responseRate ?? 0) * total) },
    { label: 'Interviewed', n: Math.round((summary.interviewRate ?? 0) * total) },
    { label: 'Offer', n: Math.round((summary.offerRate ?? 0) * total) },
  ];
  return (
    <div className="flex flex-col gap-3.5">
      {stages.map((stage, index) => {
        const pct = total === 0 ? 0 : (stage.n / total) * 100;
        return (
          <div
            key={stage.label}
            className="grid grid-cols-[96px_minmax(0,1fr)_104px] items-center gap-3.5 sm:grid-cols-[110px_minmax(0,1fr)_120px]"
          >
            <span className="text-sm font-semibold">{stage.label}</span>
            <div className="h-[26px] bg-track">
              <div
                className={cn(
                  'h-full transition-[width] duration-500',
                  index === stages.length - 1 && stage.n > 0 ? 'bg-bar-on' : 'bg-bar',
                )}
                style={{ width: `${String(total === 0 ? 0 : Math.max(pct, 1.5))}%` }}
              />
            </div>
            <span className="text-right font-mono text-[13px]">
              {stage.n} · {total === 0 ? '—' : index === 0 ? '100%' : `${pct.toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Momentum({ series }: { series: Timeseries }) {
  const goal = series.weeklyGoal;
  const max = Math.max(goal, ...series.buckets.map((b) => b.count), 1) * 1.15;
  const onTarget = series.buckets.filter((b) => goal > 0 && b.count >= goal).length;
  const label = series.buckets
    .map((b) => `week ${String(isoWeek(new Date(b.start)))}: ${String(b.count)}`)
    .join(', ');

  return (
    <div className="flex flex-col gap-3">
      <span className="eyebrow">
        Goal {goal} / week · {onTarget} of {series.buckets.length} on target
      </span>
      <div
        role="img"
        aria-label={`Applications per week, goal ${String(goal)}. ${label}`}
        className="relative flex h-36 items-end gap-2 border-b border-line"
      >
        {goal > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 z-10 border-t border-dashed border-text"
            style={{ bottom: `${String((goal / max) * 100)}%` }}
          />
        )}
        {series.buckets.map((b) => (
          <div
            key={b.start}
            aria-hidden="true"
            className="group relative flex h-full flex-1 items-end"
          >
            <div
              className={cn(
                'w-full transition-[height] duration-500',
                goal > 0 && b.count >= goal ? 'bg-bar-on' : 'bg-bar-off',
              )}
              style={{ height: `${String((b.count / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 bg-strong-bg px-1.5 py-0.5 font-mono text-[11px] text-strong-fg group-hover:block">
              {b.count}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex gap-2">
        {series.buckets.map((b) => (
          <span key={b.start} className="flex-1 text-center font-mono text-[11px] text-muted">
            W{isoWeek(new Date(b.start))}
          </span>
        ))}
      </div>
    </div>
  );
}

'use client';

// Single-series column chart in plain HTML: theme tokens apply directly, every bar has a hover
// tooltip, and a table view is one click away (dataviz rules: one hue, recessive grid, hover by
// default, never colour alone).
import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface Bar {
  key: string;
  label: string; // axis label, e.g. "W43" or "OCT"
  detail: string; // tooltip/table label, e.g. "Week of 19 Oct"
  value: number;
}

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude / 2) * 2 * magnitude;
}

export function BarChart({
  bars,
  goal,
  valueLabel,
  title,
}: {
  bars: Bar[];
  goal?: number | undefined;
  valueLabel: string;
  title: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const top = niceMax(Math.max(goal ?? 0, ...bars.map((b) => b.value), 1));
  const ticks = [0, top / 2, top];
  const every = Math.ceil(bars.length / 14); // thin out axis labels when crowded

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The legend lives outside the plot, so it never collides with tall bars. */}
        <span className="flex items-center gap-2 text-[13px] text-muted">
          {goal !== undefined && goal > 0 && (
            <>
              <span aria-hidden="true" className="w-6 border-t-2 border-dashed border-text" />
              Weekly goal: {goal}
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            setAsTable((t) => !t);
          }}
          aria-pressed={asTable}
          className="text-[13px] font-semibold text-accent-text"
        >
          {asTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>
      {asTable ? (
        <div className="max-h-80 overflow-y-auto border border-line">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col" className="eyebrow border-b border-line px-4 py-2 text-left">
                  Period
                </th>
                <th scope="col" className="eyebrow border-b border-line px-4 py-2 text-right">
                  {valueLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.key}>
                  <td className="border-b border-line px-4 py-2">{b.detail}</td>
                  <td className="border-b border-line px-4 py-2 text-right font-mono">{b.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-2">
          <div aria-hidden="true" className="relative h-56 font-mono text-[11px] text-muted">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute right-0 -translate-y-1/2"
                style={{ bottom: `${String((t / top) * 100)}%`, transform: 'translateY(50%)' }}
              >
                {t}
              </span>
            ))}
          </div>
          <div>
            <div
              role="img"
              aria-label={`${title}. ${bars.map((b) => `${b.detail}: ${String(b.value)}`).join('; ')}`}
              className="relative flex h-56 items-end gap-[2px] border-b border-text"
            >
              {ticks.slice(1).map((t) => (
                <div
                  key={t}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-line"
                  style={{ bottom: `${String((t / top) * 100)}%` }}
                />
              ))}
              {goal !== undefined && goal > 0 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 z-10 border-t-2 border-dashed border-text"
                  style={{ bottom: `${String((goal / top) * 100)}%` }}
                />
              )}
              {bars.map((b) => (
                <div
                  key={b.key}
                  aria-hidden="true"
                  className="group relative flex h-full flex-1 items-end"
                >
                  <div
                    className={cn(
                      'w-full rounded-t-[2px] transition-[height] duration-500',
                      goal && b.value >= goal ? 'bg-bar-on' : 'bg-bar',
                    )}
                    style={{
                      height: `${String((b.value / top) * 100)}%`,
                      minHeight: b.value > 0 ? 2 : 0,
                    }}
                  />
                  {/* Hit target is the whole column, bigger than the bar itself. */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 border border-line bg-panel px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover:block">
                    <span className="block text-muted">{b.detail}</span>
                    <span className="font-mono font-bold">{b.value}</span>{' '}
                    {valueLabel.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="mt-1.5 flex gap-[2px]">
              {bars.map((b, i) => (
                <span
                  key={b.key}
                  className="flex-1 overflow-hidden text-center font-mono text-[11px] text-muted"
                >
                  {i % every === 0 ? b.label : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Horizontal bars for a ranked list (status breakdown). Labels and values are text, never colour.
export function HBars({
  rows,
  total,
}: {
  rows: { label: string; value: number }[];
  total: number;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[96px_minmax(0,1fr)_72px] items-center gap-3">
          <span className="text-sm">{r.label}</span>
          <div className="h-5 bg-track">
            <div className="h-full bg-bar" style={{ width: `${String((r.value / max) * 100)}%` }} />
          </div>
          <span className="text-right font-mono text-[13px]">
            {r.value}
            <span className="text-muted">
              {' '}
              · {total ? Math.round((r.value / total) * 100) : 0}%
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

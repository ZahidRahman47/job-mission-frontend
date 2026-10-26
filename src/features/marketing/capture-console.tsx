'use client';

// Hero instrument: a live capture log. Each new application glides in at the top while the list
// eases down one row (fixed row height, so the motion is one smooth translate, never a jump);
// the counter ticks and this week's bar grows. Pure structure: hairlines, tone, tabular mono
// figures. Reduced motion: the global rule stills every animation.
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from './capture-demo';

interface Entry {
  id: number;
  time: string;
  source: 'LinkedIn' | 'Indeed';
  company: string;
  role: string;
}

// Sample entries, cycled. Times advance as new ones arrive.
const FEED: Omit<Entry, 'id' | 'time'>[] = [
  { source: 'LinkedIn', company: 'TenX', role: 'Senior Software Engineer' },
  { source: 'Indeed', company: 'Python Technologies', role: 'Front-End Engineer' },
  { source: 'LinkedIn', company: 'Systems Limited', role: 'Senior Full-Stack Developer' },
  { source: 'LinkedIn', company: 'Devsinc', role: 'Associate Software Engineer' },
  { source: 'Indeed', company: 'ContentStudio', role: 'Front-end Developer' },
  { source: 'LinkedIn', company: 'NorthBay Solutions', role: 'Senior Full Stack Engineer' },
  { source: 'Indeed', company: 'Centriix', role: 'Senior Web Developer' },
  { source: 'LinkedIn', company: 'SkyLabs AI', role: 'Senior Full Stack Engineer' },
];

const VISIBLE = 5;
const ROW_PX = 62;
const EVERY_MS = 3200;
// Applications per week; the last bar is this week and grows with the log.
const WEEKS = [6, 9, 7, 11, 8, 13, 10, 12, 9, 14, 11];

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function entry(n: number): Entry {
  const base = FEED[n % FEED.length] ?? FEED[0];
  if (!base) throw new Error('empty feed');
  // 09:05 plus about ten minutes per application.
  return { ...base, id: n, time: clock(9 * 60 + 5 + n * 9 + (n % 3)) };
}

export function CaptureConsole() {
  const reduced = usePrefersReducedMotion();
  // How many applications have arrived; starts with a full log.
  const [count, setCount] = useState(VISIBLE);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setCount((c) => c + 1);
    }, EVERY_MS);
    return () => {
      clearInterval(id);
    };
  }, [reduced]);

  // One extra row below the visible window: it slides out of view as the list eases down.
  const rows = Array.from({ length: VISIBLE + 1 }, (_, i) => entry(count - 1 - i)).filter(
    (r) => r.id >= 0,
  );
  const tracked = 20 + count;
  const thisWeek = 2 + count;
  const peak = Math.max(...WEEKS, thisWeek);
  const animate = !reduced && count > VISIBLE;

  return (
    <figure
      aria-label="Example capture log: applications from LinkedIn and Indeed arriving and being tracked, with counters for this month"
      className="m-0 border border-line bg-panel"
    >
      <div
        aria-hidden="true"
        className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-[11px] tracking-[0.08em] text-muted uppercase"
      >
        <span>Capture log · Gmail</span>
        <span className="flex items-center gap-2 text-text">
          <span className="size-1.5 bg-accent motion-safe:animate-[console-pulse_2.4s_ease-in-out_infinite]" />
          Live
        </span>
      </div>

      <div aria-hidden="true" className="overflow-hidden" style={{ height: VISIBLE * ROW_PX }}>
        <ol
          key={count}
          className={cn(
            'm-0 list-none p-0',
            animate && 'animate-[console-slide_700ms_cubic-bezier(0.22,1,0.36,1)_both]',
          )}
          style={{ ['--row' as string]: `${String(ROW_PX)}px` }}
        >
          {rows.map((r, i) => (
            <li
              key={r.id}
              style={{ height: ROW_PX }}
              className={cn(
                'box-border grid grid-cols-[44px_68px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4',
                i === 0 && animate && 'animate-[console-fade_900ms_ease-out_both]',
              )}
            >
              <span className="font-mono text-[12px] text-muted">{r.time}</span>
              <span className="border border-line px-1.5 py-0.5 text-center font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                {r.source}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold">{r.company}</span>
                <span className="truncate text-[12px] text-muted">{r.role}</span>
              </span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-accent-text uppercase">
                Tracked
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div aria-hidden="true" className="grid grid-cols-3 border-t border-line">
        {[
          ['Tracked · Oct', String(tracked)],
          ['Follow-ups due', '4'],
          ['Response rate', '38.5%'],
        ].map(([label, value], i) => (
          <div key={label} className={cn('px-4 py-3.5', i > 0 && 'border-l border-line')}>
            <div className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
              {label}
            </div>
            <div className="display mt-1 text-[22px] leading-none font-extrabold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="border-t border-line px-4 pt-3 pb-4">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
          <span>Applications / week</span>
          <span>This week {thisWeek}</span>
        </div>
        <div className="mt-3 flex h-14 items-end gap-1.5">
          {[...WEEKS, thisWeek].map((v, i) => (
            <span
              key={i}
              className={cn(
                'flex-1 transition-[height] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]',
                i === WEEKS.length ? 'bg-accent' : 'bg-track',
              )}
              style={{ height: `${String(Math.round((v / peak) * 100))}%` }}
            />
          ))}
        </div>
      </div>

      <figcaption className="border-t border-line px-4 py-2 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
        Sample data
      </figcaption>
    </figure>
  );
}

'use client';

// "How it works": a self-playing, four-step walkthrough of the real product. It starts from step 1
// when it scrolls into view, shows its progress on a timeline, and has obvious player controls.
// Each screen carries annotations pointing at what matters, so nothing has to be discovered.
// Reduced motion: nothing plays on its own; every control still works.
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import appInsights from '../../../public/landing/app-insights.png';
import appPipeline from '../../../public/landing/app-pipeline.png';
import appToday from '../../../public/landing/app-today.png';
import { CaptureDemo, usePrefersReducedMotion } from './capture-demo';

interface Hotspot {
  // Position on the screenshot, in percent.
  x: number;
  y: number;
  label: string;
  // Where the label sits, so it covers empty space rather than what it points at. For top and
  // bottom, the label starts at the dot (start) or ends at it (end).
  side?: 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start';
}

interface Step {
  title: string;
  subtitle: string;
  text: string;
  ms: number;
  screen?: { src: StaticImageData; alt: string; hotspots: Hotspot[] };
}

const STEPS: Step[] = [
  {
    title: 'You apply',
    subtitle: 'on LinkedIn or Indeed',
    text: 'Click Apply like you always do. The confirmation lands in your Gmail, and Mission Control reads it within about five minutes. You don’t type a thing.',
    ms: 12_000,
  },
  {
    title: 'It’s tracked',
    subtitle: 'automatically',
    text: 'Company, role, city, status and the job link go straight into your pipeline. Every application in one place you can search, filter and sort.',
    ms: 9_000,
    screen: {
      src: appPipeline,
      alt: 'The applications list: company, role, status, applied date, next follow-up and source for each application',
      hotspots: [
        { x: 57.5, y: 37.2, label: 'Status at a glance', side: 'top-start' },
        { x: 75.8, y: 76.1, label: 'Next follow-up, set for you', side: 'bottom-start' },
        { x: 89.4, y: 56.3, label: 'Where the job came from', side: 'left' },
      ],
    },
  },
  {
    title: 'You follow up',
    subtitle: 'on time',
    text: 'A reminder lands a week after you apply. Today shows exactly who to chase and which interviews are coming, so nothing goes cold.',
    ms: 9_000,
    screen: {
      src: appToday,
      alt: 'The Today screen: four follow-ups due, two overdue, and this week’s interviews',
      hotspots: [
        { x: 53.6, y: 11.7, label: 'What needs you today', side: 'bottom-start' },
        { x: 26.4, y: 60.2, label: 'Overdue, flagged', side: 'left' },
        { x: 62.4, y: 54.1, label: 'Interviews this week', side: 'top-start' },
      ],
    },
  },
  {
    title: 'You see what works',
    subtitle: 'and improve',
    text: 'Response and interview rates and your weekly pace show which channels actually reply, so you spend your time where it pays off.',
    ms: 9_000,
    screen: {
      src: appInsights,
      alt: 'Analytics: response, interview and offer rates, and applications per week against a goal',
      hotspots: [
        { x: 39.8, y: 37.8, label: 'Replies, incl. rejections', side: 'top-start' },
        { x: 50.6, y: 27.4, label: 'Any time range' },
        { x: 93.5, y: 80, label: 'Weekly pace vs. goal', side: 'top-end' },
      ],
    },
  },
];

const TICK_MS = 100;

function HotspotMarker({ hotspot, index }: { hotspot: Hotspot; index: number }) {
  const side = hotspot.side ?? 'right';
  return (
    <span
      className="absolute z-10 motion-safe:animate-[demo-in_420ms_ease-out_both]"
      style={{
        left: `${String(hotspot.x)}%`,
        top: `${String(hotspot.y)}%`,
        animationDelay: `${String(500 + index * 450)}ms`,
      }}
    >
      <span className="relative block size-3.5 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-[hotspot-pulse_1.8s_ease-out_infinite]" />
        <span className="absolute inset-0 rounded-full border-2 border-[#0e0f0c] bg-accent" />
      </span>
      <span
        className={cn(
          'absolute hidden bg-[#0e0f0c] px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-[#f4f1ea] sm:block',
          side === 'right' && 'top-0 left-4 -translate-y-1/2',
          side === 'left' && 'top-0 right-4 -translate-y-1/2',
          side === 'top-start' && 'bottom-3 -left-2',
          side === 'top-end' && 'right-[-8px] bottom-3',
          side === 'bottom-start' && 'top-3 -left-2',
        )}
      >
        {hotspot.label}
      </span>
    </span>
  );
}

export function Walkthrough() {
  const reduced = usePrefersReducedMotion();
  const [{ step, elapsed }, setState] = useState({ step: 0, elapsed: 0 });
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);
  const seen = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  // Start from step 1 the first time it scrolls into view; pause whenever it's off screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!seen.current) {
            seen.current = true;
            setState({ step: 0, elapsed: 0 });
          }
          if (!userPaused.current && !reduced) setPlaying(true);
        } else {
          setPlaying(false);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [reduced]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setState((s) => {
        const next = s.elapsed + TICK_MS;
        const duration = STEPS[s.step]?.ms ?? 8_000;
        return next >= duration
          ? { step: (s.step + 1) % STEPS.length, elapsed: 0 }
          : { step: s.step, elapsed: next };
      });
    }, TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [playing]);

  const goTo = (i: number) => {
    setState({ step: (i + STEPS.length) % STEPS.length, elapsed: 0 });
  };
  const togglePlay = () => {
    userPaused.current = playing;
    setPlaying(!playing);
  };

  const current = STEPS[step] ?? STEPS[0];
  if (!current) return null;
  const progress = Math.min(1, elapsed / current.ms);

  return (
    <div ref={root} className="border border-line bg-panel">
      {/* Timeline: numbered steps joined by a bar that fills as the walkthrough plays */}
      <ol className="m-0 grid list-none grid-cols-4 border-b border-line p-0">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.title} className="min-w-0 border-r border-line last:border-r-0">
              <button
                type="button"
                onClick={() => {
                  goTo(i);
                }}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${String(i + 1)}: ${s.title} ${s.subtitle}`}
                className={cn(
                  'group flex w-full cursor-pointer flex-col gap-3 px-3 pt-0 pb-4 text-left transition-colors sm:px-5 sm:pb-5',
                  active ? 'bg-bg' : 'hover:bg-bg/60',
                )}
              >
                <span className="-mx-3 block h-1 bg-track sm:-mx-5">
                  <span
                    className="block h-full bg-accent"
                    style={{
                      width: done ? '100%' : active ? `${String(progress * 100)}%` : '0%',
                      transition:
                        active && elapsed === 0 ? 'none' : `width ${String(TICK_MS)}ms linear`,
                    }}
                  />
                </span>
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center border font-mono text-[12px] font-bold transition-colors',
                      active || done
                        ? 'border-strong-bg bg-strong-bg text-strong-fg'
                        : 'border-line text-muted group-hover:border-muted',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden min-w-0 flex-col md:flex">
                    <span
                      className={cn(
                        'truncate text-[15px] font-bold',
                        !active && !done && 'text-muted',
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="truncate text-[13px] text-muted">{s.subtitle}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)]">
        {/* Caption and controls */}
        <div className="flex flex-col gap-6 border-b border-line p-6 sm:p-8 lg:border-r lg:border-b-0">
          <div
            key={step}
            className="flex flex-col gap-3 motion-safe:animate-[demo-in_380ms_ease-out_both]"
            aria-live="polite"
          >
            <span className="eyebrow">
              Step {step + 1} of {STEPS.length}
            </span>
            <h3 className="display m-0 text-[clamp(26px,2.4vw,34px)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              {current.title} <span className="text-muted">{current.subtitle}</span>
            </h3>
            <p className="m-0 text-[16px] leading-relaxed text-muted">{current.text}</p>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                goTo(step - 1);
              }}
              aria-label="Previous step"
              className="flex size-11 items-center justify-center border border-line hover:bg-track"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}
              className="flex h-11 items-center gap-2 border border-strong-bg bg-strong-bg px-4 text-sm font-semibold text-strong-fg hover:opacity-90"
            >
              {playing ? (
                <Pause size={16} aria-hidden="true" />
              ) : (
                <Play size={16} aria-hidden="true" />
              )}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                goTo(step + 1);
              }}
              aria-label="Next step"
              className="flex h-11 items-center gap-1.5 border border-line px-4 text-sm font-semibold hover:bg-track"
            >
              Next <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* The screen for this step */}
        <div className="flex min-w-0 flex-col bg-bg bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:18px_18px]">
          <div
            key={step}
            className={cn(
              'flex flex-1 items-center justify-center motion-safe:animate-[demo-in_420ms_ease-out_both]',
              current.screen ? 'p-3 sm:p-6' : 'px-4 py-8 sm:p-8',
              'lg:aspect-[16/10]',
            )}
          >
            {current.screen ? (
              <div className="flex w-full flex-col gap-3">
                <div className="relative border border-line bg-panel">
                  <Image
                    src={current.screen.src}
                    alt={current.screen.alt}
                    sizes="(min-width: 1240px) 760px, (min-width: 1024px) 64vw, 100vw"
                    className="h-auto w-full"
                  />
                  {current.screen.hotspots.map((h, i) => (
                    <HotspotMarker key={h.label} hotspot={h} index={i} />
                  ))}
                </div>
                {/* Phones: the labels as a legend under the screen */}
                <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px] font-semibold sm:hidden">
                  {current.screen.hotspots.map((h) => (
                    <li key={h.label} className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" />
                      {h.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <CaptureDemo />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

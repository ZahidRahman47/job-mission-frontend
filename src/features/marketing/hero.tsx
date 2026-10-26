// Landing hero, "Night Ops". A mission-control console rather than a marketing banner: square
// corners, 1px hairlines and depth from tone (ink ground, darker panels), no shadows or
// gradients, lime only where it matters. Swiss editorial structure: a metadata strip, an
// asymmetric headline / live-console split, and a metrics rail.
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/shell/logo';
import { ButtonLink } from '@/components/ui/button';
import { CaptureConsole } from './capture-console';

const META = [
  ['System', 'Job search command center'],
  ['Works with', 'Gmail · LinkedIn · Indeed'],
  ['Built in', 'Islamabad, Pakistan'],
  ['Status', 'Operational'],
] as const;

const RAIL = [
  { value: '≈ 5 min', label: 'From clicking Apply to tracked' },
  { value: '7 days', label: 'Until your follow-up reminder' },
  { value: '0', label: 'Spreadsheets to keep up to date' },
  { value: 'Free', label: 'No ads, no paid plan' },
];

export function Hero() {
  return (
    <section data-theme="dark" className="relative isolate border-b border-line bg-bg text-text">
      {/* Column guides of the 12-column grid: structure you can feel, barely visible. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 mx-auto hidden max-w-[1240px] grid-cols-12 px-10 lg:grid"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="border-l border-line/40 last:border-r" />
        ))}
      </div>

      <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-5 py-5 sm:px-10">
        <Logo href="/" className="text-text" />
        <nav aria-label="Page sections" className="hidden items-center gap-7 md:flex">
          {[
            ['How it works', '#how-it-works'],
            ['Get started', '#get-started'],
            ['Privacy', '#privacy'],
            ['FAQ', '#faq'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-semibold text-muted no-underline transition-colors hover:text-text"
            >
              {label}
            </a>
          ))}
        </nav>
        <nav aria-label="Account" className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary" className="max-sm:hidden">
            Create account
          </ButtonLink>
        </nav>
      </header>

      <div className="border-y border-line">
        <div className="mx-auto max-w-[1240px] sm:px-10">
          <dl className="grid grid-cols-1 gap-px sm:grid-cols-2 border-x border-line bg-line lg:grid-cols-[1.15fr_1.35fr_1.15fr_0.85fr]">
            {META.map(([term, value], i) => (
              <div
                key={term}
                className={`flex min-w-0 items-center gap-2.5 bg-bg px-5 py-2.5 font-mono text-[11px] tracking-[0.08em] uppercase sm:px-4 ${i > 1 ? 'max-lg:hidden' : ''} ${i !== 1 ? 'max-sm:hidden' : ''}`}
              >
                <dt className="shrink-0 text-muted">{term}</dt>
                <dd className="m-0 flex min-w-0 items-center gap-1.5 truncate">
                  {term === 'Status' && (
                    <span aria-hidden="true" className="size-1.5 shrink-0 bg-accent" />
                  )}
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pt-14 pb-16 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-24">
        <div className="flex flex-col lg:col-span-7">
          <span className="eyebrow">01 — Automatic application tracking</span>
          <h1 className="display mt-6 mb-0 text-[clamp(34px,4.7vw,68px)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance">
            Every job you apply to.
            <span className="mt-1 block text-hero-fg whitespace-nowrap">Tracked for you.</span>
          </h1>
          <p className="mt-8 mb-0 max-w-[540px] text-[clamp(17px,1.4vw,19px)] leading-relaxed text-muted">
            Apply on LinkedIn or Indeed like you always do. Mission Control reads the confirmation
            in your Gmail, logs the job in your pipeline and reminds you to follow up a week later.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/register" variant="primary" className="h-12 px-7 text-base">
              Start free <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" className="h-12 px-6 text-base">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-5 mb-0 font-mono text-[12px] text-muted">
            Free · No credit card · Set up in five minutes
          </p>
          {/* A real person behind it: the strongest trust signal on a launch page. */}
          <a
            href="#story"
            className="group mt-10 flex max-w-[540px] items-center gap-3 border-t border-line pt-5 text-sm text-muted no-underline"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center border border-line font-mono text-[12px] font-bold text-text"
            >
              ZR
            </span>
            <span>
              Built by <b className="text-text">Zahid Rahman</b> to track his own 150+ applications.{' '}
              <span className="font-semibold whitespace-nowrap text-text underline-offset-4 group-hover:underline">
                Read the story →
              </span>
            </span>
          </a>
        </div>

        <div className="lg:col-span-5">
          <CaptureConsole />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1240px] sm:px-10">
          <dl className="grid grid-cols-2 gap-px border-x border-line bg-line lg:grid-cols-4">
            {RAIL.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1.5 bg-bg px-5 py-6 sm:px-6">
                <dt className="order-2 text-sm text-muted">{label}</dt>
                <dd className="display order-1 m-0 text-[clamp(24px,2.4vw,32px)] leading-none font-extrabold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

import { ArrowRight, Bell, BarChart3, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import { Logo } from '@/components/shell/logo';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Mission Control: a calm instrument for an ambitious job search',
};

const PILLARS = [
  {
    icon: Zap,
    n: '01',
    title: 'Capture',
    text: 'Log an application in under a minute. Company, role and source; the rest whenever you like. Bring your spreadsheet with a CSV import.',
  },
  {
    icon: Bell,
    n: '02',
    title: 'Act',
    text: 'Open the app to one question answered: what needs me today? Overdue follow-ups and this week’s interviews, in your time zone.',
  },
  {
    icon: BarChart3,
    n: '03',
    title: 'Learn',
    text: 'Honest numbers with their formulas shown: response rate, interview rate, and which sources actually get replies.',
  },
];

// Illustrative preview of the funnel visual (sample proportions, not real user data).
const PREVIEW = [
  { label: 'Applied', width: 100 },
  { label: 'Responded', width: 31 },
  { label: 'Interviewed', width: 13 },
  { label: 'Offer', width: 3 },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <Logo href="/" className="text-text" />
        <nav aria-label="Account" className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" variant="primary">
            Start free
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1240px] items-end gap-12 px-6 pt-12 pb-20 sm:px-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:pt-20">
          <div className="flex flex-col gap-8">
            <span className="eyebrow">Job search · command center</span>
            <h1 className="display m-0 text-[clamp(44px,7.5vw,104px)] leading-[0.95] font-extrabold">
              Run your search
              <br />
              like <span className="bg-hero-bg px-2 text-hero-fg">mission control.</span>
            </h1>
            <p className="m-0 max-w-xl text-lg text-muted">
              Every application, follow-up and interview in one calm place, and honest numbers on
              what's actually working.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/register" variant="primary" className="h-12 px-6 text-base">
                Start free <ArrowRight size={17} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/today" variant="secondary" className="h-12 px-6 text-base">
                See the app
              </ButtonLink>
            </div>
          </div>

          <figure
            aria-label="Preview of the stage funnel"
            className="m-0 border border-line bg-panel"
          >
            <figcaption className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="text-[15px] font-bold">Stage funnel</span>
              <span className="eyebrow">Sample</span>
            </figcaption>
            <div className="flex flex-col gap-3.5 p-5">
              {PREVIEW.map((row, i) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3"
                >
                  <span className="text-sm font-semibold">{row.label}</span>
                  <div className="h-6 bg-track">
                    <div
                      className={i === PREVIEW.length - 1 ? 'h-full bg-bar-on' : 'h-full bg-bar'}
                      style={{ width: `${String(row.width)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="m-0 text-[13px] text-muted">
                A rejection counts as a response. Withdrawals don't.
              </p>
            </div>
          </figure>
        </section>

        <section aria-label="What it does" className="border-y border-line bg-panel">
          <div className="mx-auto grid max-w-[1240px] gap-px bg-line sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, n, title, text }) => (
              <article key={title} className="flex flex-col gap-4 bg-panel px-6 py-10 sm:px-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{n}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h2 className="display m-0 text-3xl font-extrabold">{title}</h2>
                <p className="m-0 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 px-6 py-20 sm:px-10">
          <h2 className="display m-0 max-w-3xl text-[clamp(32px,4.5vw,56px)] leading-[1.02] font-extrabold">
            Private by default. Yours to export.
          </h2>
          <p className="m-0 max-w-2xl text-muted">
            No job board, no tracking, no selling your data. Download everything as CSV or JSON
            whenever you want, and delete your account in one step.
          </p>
          <ButtonLink href="/register" variant="primary">
            Create your account <ArrowRight size={16} aria-hidden="true" />
          </ButtonLink>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-xs text-muted sm:px-10">
          <span>MISSION CONTROL</span>
          <span>Built with Next.js, Express and MongoDB</span>
        </div>
      </footer>
    </div>
  );
}

import {
  ArrowRight,
  Check,
  UserPlus,
  ArrowUpRight,
  Download,
  Inbox,
  Lock,
  MailCheck,
  Send,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/shell/logo';
import { ButtonLink } from '@/components/ui/button';
import { Hero } from '@/features/marketing/hero';
import { Walkthrough } from '@/features/marketing/walkthrough';
import zahid from '../../../public/landing/zahid.jpg';

export const metadata: Metadata = {
  title: 'Mission Control: every job you apply to, tracked automatically',
  description:
    'Apply on LinkedIn or Indeed as usual. Mission Control reads the confirmation from your Gmail, adds the job to your pipeline and reminds you to follow up. Free, made in Pakistan.',
};

const LINKEDIN_URL = 'https://www.linkedin.com/in/xahidpg47';

// Getting started: what the visitor has to do (the walkthrough shows what the product does).
const STEPS = [
  {
    icon: UserPlus,
    n: '01',
    title: 'Create your free account',
    text: 'Name, email and a password. Thirty seconds, no credit card, nothing to install.',
  },
  {
    icon: MailCheck,
    n: '02',
    title: 'Connect Gmail once',
    text: 'A five-minute setup on a computer: copy a small private script into your own Google account. Settings walks you through it.',
  },
  {
    icon: Send,
    n: '03',
    title: 'Apply like you always do',
    text: 'From then on, every LinkedIn and Indeed application tracks itself, with a reminder to follow up. Works on your phone too.',
  },
];

const TRUST = [
  {
    icon: Inbox,
    title: 'Only job emails',
    text: 'The script searches for application emails from job sites and hiring tools. Nothing else leaves your inbox, and you can read every line of it.',
  },
  {
    icon: Lock,
    title: 'No password shared',
    text: 'You approve access on Google’s own screen, and you can revoke it any time from your Google account.',
  },
  {
    icon: Download,
    title: 'Your data, yours',
    text: 'Export everything as CSV or JSON whenever you like. Delete your account and every record goes with it.',
  },
];

const FAQ = [
  {
    q: 'Is it really free?',
    a: 'Yes. No ads, no paid plan, and your data is never sold. I built it for my own job search and opened it up.',
  },
  {
    q: 'Does it read all my emails?',
    a: 'No. The script searches Gmail for job emails only (confirmations from LinkedIn, Indeed and hiring tools, and replies about applications). Raw emails are deleted from our side after 30 days.',
  },
  {
    q: 'Why does Google say “this app isn’t verified”?',
    a: 'Because the script is yours: it runs in your own Google account, not as a published app. Google shows that warning for every personal script. Choose Advanced, then continue.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes, the whole app works on your phone. The one-time Gmail setup needs a computer, then everything updates on its own.',
  },
  {
    q: 'What about Rozee.pk and emailed CVs?',
    a: 'They’re next. Those emails are already saved for 30 days, so they’ll be picked up as soon as support ships. You can always add any application by hand.',
  },
  {
    q: 'Who’s behind this?',
    a: 'Me, Zahid Rahman, a software engineer in Islamabad. I built Mission Control during my own job search and use it every day. Message me on LinkedIn with any question or idea.',
  },
  {
    q: 'What if I stop using it?',
    a: 'Export everything as CSV or JSON from Settings, then delete your account in one step. Every application, contact and captured email goes with it.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-text">
      <Hero />

      <main>
        {/* Product tour -------------------------------------------------------------------------- */}
        <section
          id="how-it-works"
          aria-labelledby="tour-title"
          className="mx-auto max-w-[1240px] scroll-mt-6 px-5 pt-16 pb-20 sm:px-10 lg:pt-20 lg:pb-24"
        >
          <div className="flex max-w-3xl flex-col gap-4">
            <span className="eyebrow">02 — How it works</span>
            <h2
              id="tour-title"
              className="display m-0 text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold tracking-[-0.03em]"
            >
              From “application sent” to your next interview.
            </h2>
            <p className="m-0 text-lg text-muted">
              A 30-second walkthrough of the real app. It plays on its own: pause it any time, or
              jump straight to a step.
            </p>
          </div>

          <div className="mt-10">
            <Walkthrough />
          </div>
        </section>

        {/* How it works ------------------------------------------------------------------------ */}
        <section
          id="get-started"
          aria-labelledby="how-title"
          className="scroll-mt-6 border-y border-line bg-panel"
        >
          <div className="mx-auto max-w-[1240px] px-5 pt-14 sm:px-10">
            <span className="eyebrow">03 — Get started</span>
            <h2
              id="how-title"
              className="display m-0 mt-3 text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold"
            >
              Ready in five minutes.
            </h2>
          </div>
          <ol className="mx-auto mt-10 grid max-w-[1240px] list-none gap-px bg-line p-0 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, n, title, text }) => (
              <li key={n} className="flex flex-col gap-4 bg-panel px-5 py-10 sm:px-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted">{n}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="display m-0 text-2xl font-extrabold">{title}</h3>
                <p className="m-0 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Maker ------------------------------------------------------------------------------- */}
        {/* Always dark, like the sign-in side panel: the dark theme's tokens give white text. */}
        <section
          id="story"
          aria-labelledby="story-title"
          data-theme="dark"
          className="scroll-mt-6 bg-bg text-text"
        >
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 sm:px-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-14">
            <Image
              src={zahid}
              alt="Zahid Rahman"
              sizes="(min-width: 768px) 320px, 280px"
              className="h-auto w-full max-w-[280px] border-2 border-accent md:max-w-none"
            />
            <div className="flex max-w-3xl flex-col gap-5">
              <span className="eyebrow">04 — Why I built this</span>
              <h2
                id="story-title"
                className="display m-0 text-[clamp(28px,3.6vw,44px)] leading-[1.05] font-extrabold"
              >
                I applied to 150+ companies in one month. Then I lost track.
              </h2>
              <p className="m-0 text-lg text-muted">
                Who replied? Who did I forget to follow up with? Which ones were still waiting? My
                spreadsheet couldn’t keep up, so I built Mission Control to track it for me,
                straight from my Gmail. Now it’s free for everyone looking for work.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <span>
                  <strong>Zahid Rahman</strong>
                  <span className="text-muted"> · Software engineer, Islamabad</span>
                </span>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-accent no-underline hover:underline"
                >
                  Connect on LinkedIn <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust ------------------------------------------------------------------------------- */}
        <section
          id="privacy"
          aria-labelledby="trust-title"
          className="mx-auto flex max-w-[1240px] scroll-mt-6 flex-col gap-10 px-5 py-20 sm:px-10"
        >
          <div className="flex max-w-3xl flex-col gap-4">
            <span className="eyebrow">05 — Privacy</span>
            <h2
              id="trust-title"
              className="display m-0 text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold"
            >
              Your inbox stays yours.
            </h2>
          </div>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <article key={title} className="flex flex-col gap-3 bg-panel p-6 sm:p-8">
                <Icon size={20} aria-hidden="true" />
                <h3 className="m-0 text-lg font-bold">{title}</h3>
                <p className="m-0 text-muted">{text}</p>
              </article>
            ))}
          </div>
          <Link href="/privacy" className="w-fit font-semibold text-accent-text">
            Read the privacy notice →
          </Link>
        </section>

        {/* FAQ --------------------------------------------------------------------------------- */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="scroll-mt-6 border-t border-line bg-panel"
        >
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 sm:px-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
            <div className="flex flex-col gap-4">
              <span className="eyebrow">06 — Questions</span>
              <h2
                id="faq-title"
                className="display m-0 text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold"
              >
                Before you start.
              </h2>
            </div>
            <div className="border-t border-line">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden="true"
                      className="font-mono text-xl transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="m-0 pb-6 text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA --------------------------------------------------------------------------- */}
        <section className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 px-5 py-20 sm:px-10">
          <h2 className="display m-0 max-w-3xl text-[clamp(32px,4.5vw,56px)] leading-[1.02] font-extrabold">
            Stop tracking applications by hand.
          </h2>
          <p className="m-0 max-w-2xl text-lg text-muted">
            Create your account, connect Gmail once, and your next application tracks itself.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/register" variant="primary" className="h-12 px-6 text-base">
              Start free <ArrowRight size={17} aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" className="h-12 px-6 text-base">
              I have an account
            </ButtonLink>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-muted">
            {[
              'Free, no credit card',
              'Export or delete your data any time',
              'Works on your phone',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check size={15} aria-hidden="true" className="text-text" /> {item}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line bg-panel">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 pt-14 pb-10 sm:px-10 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo href="/" className="text-text" />
            <p className="m-0 text-sm text-muted">
              A free job-application tracker for job seekers in Pakistan. LinkedIn and Indeed
              applications tracked straight from your Gmail.
            </p>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow">Product</span>
            <a href="#how-it-works" className="text-muted no-underline hover:text-text">
              How it works
            </a>
            <a href="#get-started" className="text-muted no-underline hover:text-text">
              Get started
            </a>
            <a href="#faq" className="text-muted no-underline hover:text-text">
              FAQ
            </a>
            <Link href="/login" className="text-muted no-underline hover:text-text">
              Log in
            </Link>
          </nav>
          <nav aria-label="Trust" className="flex flex-col gap-3 text-sm">
            <span className="eyebrow">Trust</span>
            <Link href="/privacy" className="text-muted no-underline hover:text-text">
              Privacy notice
            </Link>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted no-underline hover:text-text"
            >
              Contact on LinkedIn
            </a>
          </nav>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-5 font-mono text-[11px] tracking-[0.08em] text-muted uppercase sm:px-10">
            <span>© 2026 Mission Control</span>
            <span>Made in Islamabad by Zahid Rahman</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/shell/logo';

export const metadata: Metadata = {
  title: 'Privacy · Mission Control',
  description:
    'What Mission Control stores, what it never does, and how to take your data with you.',
};

const LINKEDIN_URL = 'https://www.linkedin.com/in/xahidpg47';

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'What we store',
    body: (
      <ul>
        <li>
          <b>Your account:</b> name, email, time zone, and your password as a one-way hash (never
          the password itself).
        </li>
        <li>
          <b>What you track:</b> applications, companies, contacts, notes, interviews and reminders,
          whether you add them or Gmail capture does.
        </li>
        <li>
          <b>Sign-in sessions:</b> the device and browser, and only part of your IP address, so you
          can see and end sessions in Settings.
        </li>
        <li>
          <b>Visit counts:</b> anonymous page-view numbers (which pages are visited, and from which
          site visitors arrive) through Vercel Web Analytics. It uses no cookies and nothing that
          identifies you.
        </li>
      </ul>
    ),
  },
  {
    title: 'Gmail capture (optional)',
    body: (
      <>
        <p>
          If you turn it on, a script you install in your own Google account searches Gmail for job
          emails: confirmations from LinkedIn, Indeed and hiring tools, replies about applications,
          and CVs you sent. Every line of that script is visible to you.
        </p>
        <ul>
          <li>
            For each matching email it sends the sender, recipients, subject, date and text. Other
            emails are never read or sent.
          </li>
          <li>
            The full email is kept for at most 30 days so it can be processed; after that only what
            was extracted (company, role, location, dates) remains.
          </li>
          <li>
            Disconnect any time in Settings → Gmail capture, and remove the script’s access in your
            Google account.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'What we never do',
    body: (
      <ul>
        <li>No ads, and no selling or sharing your data with anyone.</li>
        <li>No sending email on your behalf, and no changing or deleting your Gmail.</li>
        <li>No advertising cookies, and no tracking you across other websites.</li>
      </ul>
    ),
  },
  {
    title: 'Where it lives',
    body: (
      <p>
        The app runs on Vercel and the data is stored in MongoDB Atlas, encrypted in transit. Access
        is limited to what running the service requires.
      </p>
    ),
  },
  {
    title: 'Your control',
    body: (
      <ul>
        <li>Export everything as CSV or JSON from Settings → Your data.</li>
        <li>
          Delete your account there too: every application, contact, note and captured email goes
          with it.
        </li>
      </ul>
    ),
  },
  {
    title: 'Questions',
    body: (
      <p>
        Message me on{' '}
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        . If this notice changes, the date below changes with it.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="mx-auto flex max-w-[860px] items-center justify-between px-5 py-6 sm:px-10">
        <Logo href="/" className="text-text" />
        <Link href="/" className="text-sm font-semibold no-underline">
          ← Home
        </Link>
      </header>
      <main className="mx-auto flex max-w-[860px] flex-col gap-10 px-5 pt-6 pb-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Privacy notice · Updated 27 October 2026</span>
          <h1 className="display m-0 text-[clamp(36px,5vw,60px)] leading-[1] font-extrabold">
            Your data, in plain words.
          </h1>
        </div>
        {SECTIONS.map(({ title, body }) => (
          <section
            key={title}
            className="flex flex-col gap-3 border-t border-line pt-6 text-[16px] leading-relaxed [&_li]:mb-2 [&_p]:m-0 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5"
          >
            <h2 className="m-0 text-xl font-bold">{title}</h2>
            {body}
          </section>
        ))}
      </main>
    </div>
  );
}

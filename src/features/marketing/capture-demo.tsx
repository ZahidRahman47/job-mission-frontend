'use client';

// Landing-page hero: the product in three seconds. A confirmation email arrives, Mission Control
// reads it, the application appears, a follow-up is set. Cycles through real-looking examples.
// With reduced motion the finished state is shown and nothing moves.
import { BellRing, Check, Mail } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { StatusPill } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

const EXAMPLES = [
  {
    sender: 'LinkedIn',
    address: 'jobs-noreply@linkedin.com',
    subject: 'zahid, your application was sent to TenX',
    company: 'TenX',
    role: 'Senior Software Engineer',
    place: 'Lahore · On-site',
    source: 'LinkedIn',
    followUp: 'Mon, 3 Nov',
  },
  {
    sender: 'Indeed Apply',
    address: 'indeedapply@indeed.com',
    subject: 'Indeed Application: Front-End Engineer',
    company: 'Python Technologies',
    role: 'Front-End Engineer',
    place: 'Islamabad',
    source: 'Indeed',
    followUp: 'Tue, 4 Nov',
  },
  {
    sender: 'LinkedIn',
    address: 'jobs-noreply@linkedin.com',
    subject: 'zahid, your application was sent to Systems Limited',
    company: 'Systems Limited',
    role: 'Senior Full-Stack Developer',
    place: 'Lahore',
    source: 'LinkedIn',
    followUp: 'Wed, 5 Nov',
  },
];

// How long each step stays on screen: email → reading → application → follow-up (hold).
const STEP_MS = [1100, 1000, 1000, 2600];

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Reads the OS "reduce motion" setting and follows changes. On the server: motion allowed.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener('change', onChange);
      return () => {
        query.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function CaptureDemo() {
  const reduced = usePrefersReducedMotion();
  const [example, setExample] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => {
      if (step < STEP_MS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(0);
        setExample((example + 1) % EXAMPLES.length);
      }
    }, STEP_MS[step]);
    return () => {
      clearTimeout(timer);
    };
  }, [step, example, reduced]);

  const shown = reduced ? STEP_MS.length - 1 : step;
  const e = EXAMPLES[reduced ? 0 : example] ?? EXAMPLES[0];
  if (!e) return null;

  return (
    <figure
      aria-label={`Example: a ${e.sender} confirmation email for ${e.role} at ${e.company} becomes a tracked application with a follow-up reminder.`}
      className="m-0 w-full max-w-[440px]"
    >
      <div aria-hidden="true" className="border border-line bg-panel">
        {/* 1. The email, as it lands in Gmail */}
        <div className="border-b border-line px-5 pt-4 pb-5">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <Mail size={13} /> Gmail · Inbox
          </div>
          <div
            key={`mail-${String(example)}`}
            className="flex gap-3 border border-line bg-bg p-3.5 motion-safe:animate-[demo-in_420ms_ease-out_both]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center bg-strong-bg font-mono text-[13px] font-bold text-strong-fg">
              {e.sender.slice(0, 2)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-baseline justify-between gap-2 text-[13px]">
                <b className="truncate">{e.sender}</b>
                <span className="shrink-0 font-mono text-[11px] text-muted">just now</span>
              </span>
              <span className="truncate text-[13px] font-semibold">{e.subject}</span>
              <span className="truncate font-mono text-[11px] text-muted">{e.address}</span>
            </span>
          </div>
        </div>

        {/* 2. Mission Control reads it */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center border transition-colors duration-300',
              shown >= 2
                ? 'border-strong-bg bg-strong-bg text-strong-fg'
                : 'border-line text-muted',
            )}
          >
            <Check size={13} strokeWidth={3} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
              {shown >= 2 ? 'Added to your pipeline' : 'Mission Control reads it…'}
            </span>
            <span className="h-1 bg-track">
              <span
                className="block h-full bg-bar-on transition-[width] ease-out"
                style={{
                  width: shown >= 1 ? '100%' : '0%',
                  transitionDuration: reduced || shown === 0 ? '0ms' : '900ms',
                }}
              />
            </span>
          </div>
        </div>

        {/* 3. The application, tracked */}
        <div className="px-5 pt-4 pb-5">
          <div className="eyebrow mb-3">Mission Control · Applications</div>
          <div
            className={cn(
              'border border-line bg-bg p-3.5 transition duration-500',
              shown >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 truncate font-semibold">{e.company}</span>
              <StatusPill status="applied" />
            </div>
            <div className="mt-1 truncate text-sm">{e.role}</div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-muted">
              <span>Applied today</span>
              <span>{e.place}</span>
              <span>{e.source}</span>
            </div>
          </div>
          <div
            className={cn(
              'mt-3 flex items-center gap-2.5 bg-hero-bg px-3 py-2 text-[13px] font-semibold text-hero-fg transition duration-500',
              shown >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            )}
          >
            <BellRing size={15} />
            Follow-up reminder · {e.followUp}
          </div>
        </div>
      </div>
    </figure>
  );
}

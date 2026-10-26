'use client';

// First-run checklist on Today: the three things that make Mission Control work for a new user.
// Every step's status is live (read from the API), so it ticks itself off as the user goes.
import { Check, MailCheck, Target, Send } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { useShell } from '@/components/shell/shell-context';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { useApplications, useCaptureToken, useMe } from '@/lib/queries';

const HIDDEN_KEY = 'mc-getting-started-hidden';

export interface Onboarding {
  loading: boolean;
  // No applications at all yet: Today shows the welcome layout instead of empty charts.
  isNew: boolean;
  complete: boolean;
  firstName: string;
}

export function useOnboarding(): Onboarding & {
  gmail: { done: boolean; status: string };
  firstApp: boolean;
  goal: boolean;
} {
  const me = useMe();
  const capture = useCaptureToken();
  const anyApp = useApplications({ archived: 'include', limit: 1 });

  const total = anyApp.data?.meta.total ?? 0;
  const token = capture.data;
  const gmailDone = token?.active === true && token.lastUsedAt !== null;
  const gmailStatus = !token?.active
    ? 'Not connected'
    : token.lastUsedAt
      ? `Connected · last sync ${timeAgo(token.lastUsedAt)}`
      : 'Script created · waiting for its first sync';
  const goal = (me.data?.preferences.weeklyGoal ?? 0) > 0;

  return {
    loading: me.isPending || capture.isPending || anyApp.isPending,
    isNew: total === 0,
    complete: gmailDone && total > 0 && goal,
    firstName: me.data?.name.split(' ')[0] ?? '',
    gmail: { done: gmailDone, status: gmailStatus },
    firstApp: total > 0,
    goal,
  };
}

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function GettingStarted({ onboarding }: { onboarding: ReturnType<typeof useOnboarding> }) {
  const { openNewApplication } = useShell();
  const [hidden, setHidden] = useState(readHidden);

  // A returning user can put it away; a brand-new one always sees it.
  if (onboarding.complete || (hidden && !onboarding.isNew)) return null;

  const steps = [
    {
      icon: MailCheck,
      title: 'Connect Gmail',
      done: onboarding.gmail.done,
      status: onboarding.gmail.status,
      text: 'A five-minute, one-time setup on a computer. After that, every LinkedIn and Indeed application tracks itself.',
      action: (
        <ButtonLink
          href="/settings/capture"
          variant={onboarding.gmail.done ? 'secondary' : 'primary'}
        >
          {onboarding.gmail.done ? 'View setup' : 'Connect Gmail'}
        </ButtonLink>
      ),
    },
    {
      icon: Send,
      title: 'Your first application tracked',
      done: onboarding.firstApp,
      status: onboarding.firstApp ? 'Done' : 'Waiting',
      text: 'Apply as usual, or just wait: the first sync brings in your last 30 days. You can also add one by hand.',
      action: (
        <Button
          variant="secondary"
          onClick={() => {
            openNewApplication();
          }}
        >
          Add by hand
        </Button>
      ),
    },
    {
      icon: Target,
      title: 'Set a weekly goal',
      done: onboarding.goal,
      status: onboarding.goal ? 'Done' : 'Not set',
      text: 'Pick a number you can keep up, like 10 a week. Today shows how you’re pacing against it.',
      action: (
        <ButtonLink href="/settings/preferences" variant="secondary">
          Set a goal
        </ButtonLink>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="getting-started-title" className="border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="getting-started-title" className="m-0 text-[15px] font-bold">
            Get set up
          </h2>
          <span className="eyebrow">
            {doneCount} of {steps.length} done
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="flex gap-1">
            {steps.map((s) => (
              <span key={s.title} className={cn('h-1.5 w-10', s.done ? 'bg-accent' : 'bg-track')} />
            ))}
          </div>
          {!onboarding.isNew && (
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(HIDDEN_KEY, '1');
                } catch {
                  // Private mode: hiding just won't persist.
                }
                setHidden(true);
              }}
              className="text-[13px] font-semibold text-muted hover:text-text"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      <ol className="m-0 list-none p-0">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 border-b border-line px-5 py-5 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6"
          >
            <span
              className={cn(
                'flex size-9 items-center justify-center border font-mono text-[13px] font-bold',
                s.done ? 'border-strong-bg bg-strong-bg text-strong-fg' : 'border-line',
              )}
            >
              {s.done ? (
                <Check size={16} strokeWidth={3} aria-label="Done" />
              ) : (
                <span aria-label={`Step ${String(i + 1)}`}>{i + 1}</span>
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn('font-semibold', s.done && 'text-muted')}>{s.title}</span>
                <span
                  className={cn(
                    'font-mono text-[11px] tracking-[0.06em] uppercase',
                    s.done ? 'text-accent-text' : 'text-muted',
                  )}
                >
                  {s.status}
                </span>
              </span>
              {!s.done && <span className="text-sm text-muted">{s.text}</span>}
            </div>
            {!s.done && (
              <div className="col-start-2 sm:col-start-auto sm:justify-self-end">{s.action}</div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

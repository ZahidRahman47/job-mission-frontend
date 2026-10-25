'use client';

import { Check, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Flag } from '@/components/ui/primitives';
import { errorMessage } from '@/lib/api/errors';
import { relativeDay } from '@/lib/format';
import { useCompleteReminder, useDeleteReminder, useReopenReminder } from '@/lib/queries';
import type { Reminder } from '@/lib/types';

export function ReminderRow({
  reminder,
  application,
  showDelete = false,
}: {
  reminder: Reminder;
  application?: { id: string; label: string } | undefined;
  showDelete?: boolean;
}) {
  const complete = useCompleteReminder();
  const reopen = useReopenReminder();
  const remove = useDeleteReminder();
  // Read the clock once per mount: render functions must stay pure (same props, same output).
  const [now] = useState(() => Date.now());
  const overdue = reminder.status === 'pending' && new Date(reminder.dueAt).getTime() < now;
  const done = reminder.status === 'completed';

  const onComplete = async () => {
    try {
      await complete.mutateAsync(reminder.id);
      toast.success('Marked done', {
        action: {
          label: 'Undo',
          onClick: () => {
            void reopen.mutateAsync(reminder.id);
          },
        },
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <li className="flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {overdue && <Flag>OVERDUE</Flag>}
          <span className="font-mono text-xs text-muted">
            {done && reminder.completedAt
              ? `DONE ${relativeDay(reminder.completedAt)}`
              : relativeDay(reminder.dueAt)}
          </span>
        </div>
        <span className={done ? 'font-semibold text-muted line-through' : 'font-semibold'}>
          {reminder.title}
        </span>
        {application && (
          <Link
            href={`/applications/${application.id}`}
            className="truncate text-[13px] text-muted no-underline hover:text-text hover:underline"
          >
            {application.label}
          </Link>
        )}
      </div>
      {done ? (
        <button
          type="button"
          onClick={() => {
            void reopen.mutateAsync(reminder.id);
          }}
          className="flex h-11 items-center gap-1.5 border border-line px-3 text-[13px] font-semibold hover:bg-track"
        >
          <RotateCcw size={14} aria-hidden="true" /> Reopen
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            void onComplete();
          }}
          disabled={complete.isPending}
          aria-label={`Mark "${reminder.title}" as done`}
          className="flex h-11 items-center gap-1.5 border border-line px-3 text-[13px] font-semibold hover:border-text hover:bg-track disabled:opacity-50"
        >
          <Check size={14} aria-hidden="true" /> Done
        </button>
      )}
      {showDelete && (
        <button
          type="button"
          onClick={() => {
            void remove.mutateAsync(reminder.id).then(() => toast('Reminder deleted'));
          }}
          aria-label={`Delete "${reminder.title}"`}
          className="flex size-11 items-center justify-center text-muted hover:bg-track hover:text-danger"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

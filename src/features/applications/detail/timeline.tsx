'use client';

import {
  Archive,
  ArrowRight,
  Bell,
  CalendarClock,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { EmptyState, Panel, Skeleton } from '@/components/ui/primitives';
import { errorMessage } from '@/lib/api/errors';
import { STATUS_LABEL } from '@/lib/domain';
import { longDate, timeAgo } from '@/lib/format';
import { useAddNote, useDeleteNote, useTimeline } from '@/lib/queries';
import type { Activity, ApplicationStatus } from '@/lib/types';

const str = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
// Activity data is free-form, so check the value really is a status before looking it up.
const statusLabel = (value: unknown): string =>
  typeof value === 'string' && value in STATUS_LABEL
    ? STATUS_LABEL[value as ApplicationStatus]
    : str(value);

// One sentence per event: the application's flight log.
export function describe(activity: Activity): {
  icon: typeof ArrowRight;
  text: string;
  body?: string;
} {
  const d = activity.data;
  switch (activity.type) {
    case 'created':
      return {
        icon: Plus,
        text: `Logged as ${statusLabel(d.status)}${d.via === 'csv_import' ? ' (CSV import)' : ''}`,
      };
    case 'status_changed':
      return { icon: ArrowRight, text: `${statusLabel(d.from)} → ${statusLabel(d.to)}` };
    case 'reopened':
      return { icon: RotateCcw, text: `Reopened: ${statusLabel(d.from)} → ${statusLabel(d.to)}` };
    case 'note':
      return { icon: StickyNote, text: 'Note', body: str(d.body) };
    case 'interview_added':
      return { icon: CalendarClock, text: `Interview round ${str(d.round)} added` };
    case 'interview_updated':
      return {
        icon: CalendarClock,
        text: `Interview round ${str(d.round)} updated${d.outcome ? `: ${str(d.outcome)}` : ''}`,
      };
    case 'reminder_completed':
      return { icon: Bell, text: `Done: ${str(d.reminderTitle)}` };
    case 'archived':
      return { icon: Archive, text: 'Archived' };
    case 'restored':
      return { icon: RotateCcw, text: 'Restored from archive' };
    case 'contact_interaction':
      return {
        icon: d.channel === 'call' ? Phone : MessageSquare,
        text: `${str(d.channel)} with ${str(d.contactName)}`,
        body: str(d.summary),
      };
  }
}

export function Timeline({ applicationId }: { applicationId: string }) {
  const timeline = useTimeline(applicationId);
  const addNote = useAddNote(applicationId);
  const deleteNote = useDeleteNote(applicationId);
  const [note, setNote] = useState('');

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    try {
      await addNote.mutateAsync(note.trim());
      setNote('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Panel id="timeline-h" title="Timeline" bodyClassName="flex flex-col">
      <form
        onSubmit={(e) => {
          void submit(e);
        }}
        className="flex flex-col gap-2 border-b border-line p-5"
      >
        <label htmlFor="note" className="sr-only">
          Add a note
        </label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
          }}
          placeholder="Add a note: questions to ask, what you learned, how it went…"
          className="min-h-20"
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="strong"
            size="sm"
            loading={addNote.isPending}
            disabled={!note.trim()}
          >
            Add note
          </Button>
        </div>
      </form>
      {!timeline.data ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : timeline.data.data.length === 0 ? (
        <EmptyState title="No history yet." />
      ) : (
        <ol className="m-0 list-none p-0">
          {timeline.data.data.map((activity) => {
            const { icon: Icon, text, body } = describe(activity);
            return (
              <li
                key={activity.id}
                className="group flex gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-line"
                >
                  <Icon size={14} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold first-letter:uppercase">{text}</span>
                    <time
                      dateTime={activity.occurredAt}
                      title={longDate(activity.occurredAt)}
                      className="font-mono text-xs text-muted"
                    >
                      {timeAgo(activity.occurredAt)}
                    </time>
                  </div>
                  {body && <p className="m-0 text-sm whitespace-pre-line text-muted">{body}</p>}
                </div>
                {activity.type === 'note' && (
                  <button
                    type="button"
                    aria-label="Delete note"
                    onClick={() => {
                      void deleteNote.mutateAsync(activity.id).then(() => toast('Note deleted'));
                    }}
                    className="flex size-9 shrink-0 items-center justify-center text-muted opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

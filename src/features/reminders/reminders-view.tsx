'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/primitives';
import type { ReminderView } from '@/lib/api/reminders';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { toLocalDate } from '@/lib/format';
import {
  useApplicationLabels,
  useCreateReminder,
  useReminderCounts,
  useReminders,
} from '@/lib/queries';
import { ReminderRow } from './reminder-row';

const VIEWS: { key: ReminderView; label: string; empty: string }[] = [
  { key: 'overdue', label: 'Overdue', empty: 'Nothing overdue. Nice.' },
  { key: 'today', label: 'Today', empty: 'Nothing else due today.' },
  { key: 'upcoming', label: 'Next 7 days', empty: 'Nothing scheduled this week.' },
  { key: 'completed', label: 'Completed', empty: 'Completed follow-ups show up here.' },
];

const schema = z.object({
  title: z.string().trim().min(1, 'What should you do?').max(200),
  dueAt: z.string().min(1, 'Pick a date and time.'),
  applicationId: z.string(),
  note: z.string().max(2000),
});
type Values = z.infer<typeof schema>;

export function NewReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateReminder();
  const labels = useApplicationLabels(open);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      dueAt: `${toLocalDate(tomorrow)}T10:00`,
      applicationId: '',
      note: '',
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await create.mutateAsync({
        title: v.title,
        dueAt: new Date(v.dueAt).toISOString(),
        applicationId: v.applicationId || null,
        note: v.note,
      });
      toast.success('Reminder scheduled');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New reminder">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field id="rm-title" label="What" error={errors.title?.message}>
          <Input
            {...describedBy('rm-title', errors.title?.message)}
            {...form.register('title')}
            placeholder="e.g. Follow up on the take-home"
            autoFocus
          />
        </Field>
        <Field id="rm-due" label="When" error={errors.dueAt?.message}>
          <Input
            {...describedBy('rm-due', errors.dueAt?.message)}
            type="datetime-local"
            {...form.register('dueAt')}
          />
        </Field>
        <Field
          id="rm-app"
          label="Application"
          optional
          hint="Linked reminders set the application's next follow-up date."
        >
          <Select id="rm-app" {...form.register('applicationId')}>
            <option value="">Not linked</option>
            {[...labels.entries()]
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
          </Select>
        </Field>
        <Field id="rm-note" label="Note" optional>
          <Textarea id="rm-note" {...form.register('note')} className="min-h-20" />
        </Field>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            Schedule
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export function RemindersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('view');
  const view: ReminderView = VIEWS.some((v) => v.key === requested)
    ? (requested as ReminderView)
    : 'overdue';
  const list = useReminders(view);
  const counts = useReminderCounts();
  const [creating, setCreating] = useState(false);
  const current = VIEWS.find((v) => v.key === view) ?? VIEWS[0];

  return (
    <>
      <PageHeader
        eyebrow="Follow-ups"
        title="Reminders"
        description="Every nudge in one place. Linked reminders keep each application's next follow-up date current."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> New reminder
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Reminder views"
        className="flex flex-wrap border-b border-line"
      >
        {VIEWS.map((v) => {
          const selected = v.key === view;
          const count = counts.data?.[v.key];
          return (
            <button
              key={v.key}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => {
                router.replace(`${pathname}?view=${v.key}`, { scroll: false });
              }}
              className={cn(
                '-mb-px flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-semibold',
                selected
                  ? 'border-text text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {v.label}
              {count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 font-mono text-xs',
                    v.key === 'overdue' && count > 0 ? 'bg-flag-bg text-flag-fg' : 'text-muted',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Panel>
        {list.isError ? (
          <ErrorState
            message={errorMessage(list.error)}
            onRetry={() => {
              void list.refetch();
            }}
          />
        ) : !list.data ? (
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.data.data.length === 0 ? (
          <EmptyState title={current?.empty ?? 'Nothing here.'} />
        ) : (
          <ul className="m-0 list-none p-0">
            {list.data.data.map((r) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                showDelete
                application={
                  r.applicationId
                    ? {
                        id: r.applicationId,
                        label: r.application
                          ? `${r.application.companyName} · ${r.application.title}`
                          : 'Application',
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </Panel>

      <NewReminderDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { EmptyState, Panel } from '@/components/ui/primitives';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { INTERVIEW_OUTCOMES, INTERVIEW_TYPE_LABEL, INTERVIEW_TYPES } from '@/lib/domain';
import { longDate, time } from '@/lib/format';
import { useAddInterview, useUpdateInterview } from '@/lib/queries';
import type { Interview } from '@/lib/types';

const schema = z.object({
  round: z.number({ message: 'Enter a round number.' }).int().min(1).max(50),
  type: z.enum(INTERVIEW_TYPES),
  scheduledAt: z.string(),
  durationMinutes: z.string().regex(/^\d*$/, 'Minutes as a number.'),
  interviewers: z.string().max(500),
  notes: z.string().max(5000),
});
type Values = z.infer<typeof schema>;

const OUTCOME_LABEL = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Not passed',
  cancelled: 'Cancelled',
} as const;

function AddInterviewDialog({
  applicationId,
  nextRound,
  open,
  onOpenChange,
}: {
  applicationId: string;
  nextRound: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddInterview(applicationId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      round: nextRound,
      type: 'technical',
      scheduledAt: '',
      durationMinutes: '60',
      interviewers: '',
      notes: '',
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await add.mutateAsync({
        round: v.round,
        type: v.type,
        scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : null,
        durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : null,
        interviewers: v.interviewers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        outcome: 'pending',
        notes: v.notes,
      });
      toast.success(`Round ${String(v.round)} added`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add interview round">
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-2 gap-4">
        <Field id="iv-round" label="Round" error={errors.round?.message}>
          <Input
            {...describedBy('iv-round', errors.round?.message)}
            type="number"
            min={1}
            max={50}
            {...form.register('round', { valueAsNumber: true })}
          />
        </Field>
        <Field id="iv-type" label="Type">
          <Select id="iv-type" {...form.register('type')}>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERVIEW_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="iv-when" label="Date and time" optional>
          <Input id="iv-when" type="datetime-local" {...form.register('scheduledAt')} />
        </Field>
        <Field id="iv-duration" label="Minutes" optional error={errors.durationMinutes?.message}>
          <Input
            {...describedBy('iv-duration', errors.durationMinutes?.message)}
            inputMode="numeric"
            {...form.register('durationMinutes')}
          />
        </Field>
        <Field
          id="iv-people"
          label="Interviewers"
          optional
          hint="Comma-separated"
          className="col-span-2"
        >
          <Input
            id="iv-people"
            {...form.register('interviewers')}
            placeholder="e.g. Jane Doe, Omar Haddad"
          />
        </Field>
        <Field id="iv-notes" label="Prep notes" optional className="col-span-2">
          <Textarea id="iv-notes" {...form.register('notes')} />
        </Field>
        <div className="col-span-2">
          <DialogFooter>
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={add.isPending}>
              Add round
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}

export function Interviews({
  applicationId,
  interviews,
}: {
  applicationId: string;
  interviews: Interview[];
}) {
  const [open, setOpen] = useState(false);
  const update = useUpdateInterview(applicationId);
  const sorted = [...interviews].sort((a, b) => a.round - b.round);

  return (
    <Panel
      id="interviews-h"
      title={`Interview rounds${interviews.length ? ` · ${String(interviews.length)}` : ''}`}
      actions={
        <Button
          size="sm"
          onClick={() => {
            setOpen(true);
          }}
          disabled={interviews.length >= 20}
        >
          <Plus size={14} aria-hidden="true" /> Add round
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No rounds yet."
          description="Add each round as it's scheduled; upcoming ones show on Today."
        />
      ) : (
        <ol className="m-0 list-none p-0">
          {sorted.map((interview) => (
            <li
              key={interview.id}
              className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
            >
              <span className="display w-10 text-2xl font-bold">
                {String(interview.round).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{INTERVIEW_TYPE_LABEL[interview.type]}</span>
                <span className="font-mono text-xs text-muted">
                  {interview.scheduledAt
                    ? `${longDate(interview.scheduledAt).toUpperCase()} · ${time(interview.scheduledAt)}`
                    : 'NOT SCHEDULED'}
                  {interview.durationMinutes ? ` · ${String(interview.durationMinutes)} MIN` : ''}
                </span>
                {interview.interviewers.length > 0 && (
                  <span className="text-[13px] text-muted">
                    With {interview.interviewers.join(', ')}
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2">
                <span className="sr-only">Outcome of round {interview.round}</span>
                <select
                  value={interview.outcome}
                  onChange={(e) => {
                    void update
                      .mutateAsync({
                        interviewId: interview.id,
                        patch: { outcome: e.target.value as Interview['outcome'] },
                      })
                      .then(() =>
                        toast.success(
                          `Round ${String(interview.round)}: ${OUTCOME_LABEL[e.target.value as Interview['outcome']]}`,
                        ),
                      )
                      .catch((err: unknown) => toast.error(errorMessage(err)));
                  }}
                  className={cn(
                    'h-9 cursor-pointer border px-2 text-[13px] font-semibold',
                    interview.outcome === 'passed'
                      ? 'border-accent bg-accent text-on-accent'
                      : interview.outcome === 'pending'
                        ? 'border-line bg-panel'
                        : 'border-line bg-panel text-muted',
                  )}
                >
                  {INTERVIEW_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {OUTCOME_LABEL[o]}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ol>
      )}
      <AddInterviewDialog
        applicationId={applicationId}
        nextRound={interviews.length + 1}
        open={open}
        onOpenChange={setOpen}
      />
    </Panel>
  );
}

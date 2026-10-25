'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select, Textarea } from '@/components/ui/field';
import {
  ConfirmDialog,
  Dialog,
  DialogFooter,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
} from '@/components/ui/overlays';
import { EmptyState, ErrorState, Panel, Skeleton, StatusPill } from '@/components/ui/primitives';
import { ReminderRow } from '@/features/reminders/reminder-row';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import {
  allowedTransitions,
  EMPLOYMENT_LABEL,
  EMPLOYMENT_TYPES,
  PRIORITIES,
  PRIORITY_LABEL,
  SALARY_PERIODS,
  SOURCE_LABEL,
  SOURCES,
  STATUS_LABEL,
  WORK_MODE_LABEL,
  WORK_MODES,
} from '@/lib/domain';
import { money, shortDate, toLocalDate } from '@/lib/format';
import {
  useApplication,
  useArchive,
  useChangeStatus,
  useContacts,
  useCreateReminder,
  useDeleteApplication,
  useSetContacts,
  useUpdateApplication,
} from '@/lib/queries';
import type { ApplicationDetail, ApplicationStatus } from '@/lib/types';
import { Interviews } from './interviews';
import { Timeline } from './timeline';

const STEPS: { status: ApplicationStatus; milestone?: keyof ApplicationDetail['milestones'] }[] = [
  { status: 'applied' },
  { status: 'screening', milestone: 'screeningAt' },
  { status: 'interview', milestone: 'interviewAt' },
  { status: 'offer', milestone: 'offerAt' },
];

function Stepper({ app }: { app: ApplicationDetail }) {
  const closed = app.status === 'rejected' || app.status === 'withdrawn';
  return (
    <ol
      aria-label="Progress"
      className="m-0 grid list-none grid-cols-2 gap-px border border-line bg-line p-0 sm:grid-cols-5"
    >
      {STEPS.map((step) => {
        const date = step.milestone ? app.milestones[step.milestone] : app.appliedAt;
        const current = app.status === step.status;
        const reached = Boolean(date);
        return (
          <li
            key={step.status}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'flex flex-col gap-1 px-4 py-3',
              current ? 'bg-accent text-on-accent' : 'bg-panel',
            )}
          >
            <span className={cn('eyebrow', current && 'text-on-accent')}>
              {STATUS_LABEL[step.status]}
            </span>
            <span className={cn('font-mono text-[13px]', !reached && 'opacity-50')}>
              {reached ? shortDate(date ?? null) : '—'}
            </span>
          </li>
        );
      })}
      <li
        className={cn(
          'flex flex-col gap-1 px-4 py-3',
          app.status === 'accepted' ? 'bg-strong-bg text-strong-fg' : 'bg-panel',
        )}
      >
        <span className={cn('eyebrow', app.status === 'accepted' && 'text-strong-fg')}>
          {closed ? STATUS_LABEL[app.status] : 'Outcome'}
        </span>
        <span className="font-mono text-[13px]">
          {app.milestones.closedAt ? shortDate(app.milestones.closedAt) : 'Open'}
        </span>
      </li>
    </ol>
  );
}

function StatusMenu({ app }: { app: ApplicationDetail }) {
  const change = useChangeStatus(app.id);
  const targets = allowedTransitions(app.status, app.previousStatus);

  const move = async (to: ApplicationStatus) => {
    try {
      await change.mutateAsync({ to, version: app.version });
      toast.success(`Moved to ${STATUS_LABEL[to]}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.code === 'CONFLICT'
          ? 'Someone changed this application. Showing the latest version.'
          : errorMessage(err),
      );
    }
  };

  return (
    <Menu
      align="start"
      trigger={
        <button
          type="button"
          disabled={targets.length === 0}
          className="flex h-11 items-center gap-2 border border-strong-bg bg-strong-bg px-4 text-sm font-semibold text-strong-fg hover:opacity-90 disabled:opacity-50"
        >
          Move to… <ChevronDown size={15} aria-hidden="true" />
        </button>
      }
    >
      <MenuLabel>From {STATUS_LABEL[app.status]}</MenuLabel>
      {targets.map((to) => (
        <MenuItem
          key={to}
          onSelect={() => {
            void move(to);
          }}
        >
          <StatusPill status={to} />
          {to === app.previousStatus &&
            (app.status === 'rejected' || app.status === 'withdrawn') && (
              <span className="text-xs text-muted">reopen</span>
            )}
        </MenuItem>
      ))}
    </Menu>
  );
}

const editSchema = z
  .object({
    title: z.string().trim().min(1, 'Required.').max(200),
    location: z.string().trim().max(200),
    workMode: z.union([z.literal(''), z.enum(WORK_MODES)]),
    employmentType: z.union([z.literal(''), z.enum(EMPLOYMENT_TYPES)]),
    source: z.enum(SOURCES),
    priority: z.enum(PRIORITIES),
    jobUrl: z.union([
      z.literal(''),
      z.url({ protocol: /^https?$/, message: 'Must start with http(s)://' }),
    ]),
    salaryMin: z.string().regex(/^\d*$/, 'Numbers only.'),
    salaryMax: z.string().regex(/^\d*$/, 'Numbers only.'),
    currency: z.string().regex(/^[A-Z]{3}$/, 'Three letters, e.g. EUR.'),
    period: z.enum(SALARY_PERIODS),
    jobDescription: z.string().max(20_000),
  })
  .refine((v) => !v.salaryMin || !v.salaryMax || Number(v.salaryMin) <= Number(v.salaryMax), {
    message: 'Min must be ≤ max.',
    path: ['salaryMin'],
  });
type EditValues = z.infer<typeof editSchema>;

function EditDialog({
  app,
  open,
  onOpenChange,
}: {
  app: ApplicationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateApplication(app.id);
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      title: app.title,
      location: app.location ?? '',
      workMode: app.workMode ?? '',
      employmentType: app.employmentType ?? '',
      source: app.source,
      priority: app.priority,
      jobUrl: app.jobUrl ?? '',
      salaryMin: app.salary?.min != null ? String(app.salary.min) : '',
      salaryMax: app.salary?.max != null ? String(app.salary.max) : '',
      currency: app.salary?.currency ?? 'EUR',
      period: app.salary?.period ?? 'year',
      jobDescription: app.jobDescription ?? '',
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await update.mutateAsync({
        version: app.version,
        patch: {
          title: v.title,
          location: v.location || null,
          workMode: v.workMode || null,
          employmentType: v.employmentType || null,
          source: v.source,
          priority: v.priority,
          jobUrl: v.jobUrl || null,
          jobDescription: v.jobDescription || null,
          salary:
            v.salaryMin || v.salaryMax
              ? {
                  min: v.salaryMin ? Number(v.salaryMin) : null,
                  max: v.salaryMax ? Number(v.salaryMax) : null,
                  currency: v.currency,
                  period: v.period,
                }
              : null,
        },
      });
      toast.success('Saved');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.code === 'CONFLICT'
          ? 'This changed elsewhere. Reopen the editor to see the latest.'
          : errorMessage(err),
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit application" wide>
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="ed-title"
          label="Job title"
          error={errors.title?.message}
          className="sm:col-span-2"
        >
          <Input {...describedBy('ed-title', errors.title?.message)} {...form.register('title')} />
        </Field>
        <Field id="ed-location" label="Location" optional>
          <Input id="ed-location" {...form.register('location')} />
        </Field>
        <Field id="ed-mode" label="Work mode" optional>
          <Select id="ed-mode" {...form.register('workMode')}>
            <option value="">Not specified</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABEL[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ed-employment" label="Employment" optional>
          <Select id="ed-employment" {...form.register('employmentType')}>
            <option value="">Not specified</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ed-source" label="Source">
          <Select id="ed-source" {...form.register('source')}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ed-priority" label="Priority">
          <Select id="ed-priority" {...form.register('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ed-url" label="Job posting URL" optional error={errors.jobUrl?.message}>
          <Input {...describedBy('ed-url', errors.jobUrl?.message)} {...form.register('jobUrl')} />
        </Field>
        <fieldset className="grid grid-cols-2 gap-3 border border-line p-4 sm:col-span-2 sm:grid-cols-4">
          <legend className="px-1 text-[13px] font-semibold">
            Salary <span className="font-normal text-muted">optional</span>
          </legend>
          <Field id="ed-min" label="Min" error={errors.salaryMin?.message}>
            <Input
              {...describedBy('ed-min', errors.salaryMin?.message)}
              inputMode="numeric"
              {...form.register('salaryMin')}
            />
          </Field>
          <Field id="ed-max" label="Max" error={errors.salaryMax?.message}>
            <Input
              {...describedBy('ed-max', errors.salaryMax?.message)}
              inputMode="numeric"
              {...form.register('salaryMax')}
            />
          </Field>
          <Field id="ed-cur" label="Currency" error={errors.currency?.message}>
            <Input
              {...describedBy('ed-cur', errors.currency?.message)}
              maxLength={3}
              {...form.register('currency', { setValueAs: (v: string) => v.toUpperCase() })}
            />
          </Field>
          <Field id="ed-per" label="Per">
            <Select id="ed-per" {...form.register('period')}>
              {SALARY_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </fieldset>
        <Field id="ed-desc" label="Job description" optional className="sm:col-span-2">
          <Textarea id="ed-desc" rows={6} {...form.register('jobDescription')} />
        </Field>
        <div className="sm:col-span-2">
          <DialogFooter>
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={update.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}

function FollowUps({ app }: { app: ApplicationDetail }) {
  const create = useCreateReminder();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(`${toLocalDate(tomorrow)}T10:00`);

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title,
        dueAt: new Date(due).toISOString(),
        applicationId: app.id,
      });
      setTitle('');
      toast.success('Follow-up scheduled');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Panel id="followups-h" title="Follow-ups">
      {app.pendingReminders.length === 0 ? (
        <p className="m-0 px-5 pt-4 text-sm text-muted">
          Nothing scheduled. Add the next nudge so this doesn't go cold.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {app.pendingReminders.map((r) => (
            <ReminderRow key={r.id} reminder={r} showDelete />
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          void submit(e);
        }}
        className="flex flex-col gap-2 p-5"
      >
        <label htmlFor="fu-title" className="sr-only">
          Follow-up
        </label>
        <Input
          id="fu-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          placeholder="e.g. Follow up with the recruiter"
          maxLength={200}
        />
        <div className="flex gap-2">
          <label htmlFor="fu-due" className="sr-only">
            Due
          </label>
          <Input
            id="fu-due"
            type="datetime-local"
            value={due}
            onChange={(e) => {
              setDue(e.target.value);
            }}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="strong"
            loading={create.isPending}
            disabled={!title.trim()}
          >
            <Plus size={14} aria-hidden="true" /> Add
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function ContactsPanel({ app }: { app: ApplicationDetail }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(app.contactIds);
  const [q, setQ] = useState('');
  const contacts = useContacts(q);
  const save = useSetContacts(app.id);

  return (
    <Panel
      id="contacts-h"
      title="Contacts"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setSelected(app.contactIds);
            setOpen(true);
          }}
        >
          <UserPlus size={14} aria-hidden="true" /> Link
        </Button>
      }
    >
      {app.contacts.length === 0 ? (
        <p className="m-0 px-5 py-4 text-sm text-muted">
          No one linked yet: add the recruiter or hiring manager.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {app.contacts.map((c) => (
            <li key={c.id} className="border-b border-line last:border-b-0">
              <Link
                href={`/contacts/${c.id}`}
                className="flex flex-col px-5 py-3 no-underline hover:bg-bg"
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-[13px] text-muted">{c.title ?? 'Contact'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Link contacts"
        description="Up to 10 people for this application."
      >
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          placeholder="Search contacts"
          aria-label="Search contacts"
        />
        <ul className="m-0 mt-3 max-h-72 list-none overflow-y-auto border border-line p-0">
          {contacts.data?.data.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <li key={c.id} className="border-b border-line last:border-b-0">
                <label className="flex h-12 cursor-pointer items-center gap-3 px-3 hover:bg-bg">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && selected.length >= 10}
                    onChange={() => {
                      setSelected((s) => (checked ? s.filter((id) => id !== c.id) : [...s, c.id]));
                    }}
                    className="size-4 accent-[var(--text)]"
                  />
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <span className="text-[13px] text-muted">{c.title}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => {
              void save.mutateAsync(selected).then(() => {
                setOpen(false);
                toast.success('Contacts updated');
              });
            }}
          >
            Save ({selected.length})
          </Button>
        </DialogFooter>
      </Dialog>
    </Panel>
  );
}

function Details({ app }: { app: ApplicationDetail }) {
  const rows: [string, string][] = [
    ['Applied', app.appliedAt ? shortDate(app.appliedAt) : 'Not yet'],
    ['Source', SOURCE_LABEL[app.source]],
    ['Priority', PRIORITY_LABEL[app.priority]],
    ['Location', app.location ?? '—'],
    ['Work mode', app.workMode ? WORK_MODE_LABEL[app.workMode] : '—'],
    ['Employment', app.employmentType ? EMPLOYMENT_LABEL[app.employmentType] : '—'],
    [
      'Salary',
      app.salary
        ? `${money(app.salary.min, app.salary.currency)}${app.salary.max != null ? `–${money(app.salary.max, app.salary.currency)}` : ''} / ${app.salary.period}`
        : '—',
    ],
  ];
  return (
    <Panel id="details-h" title="Details">
      <dl className="m-0 grid grid-cols-[110px_minmax(0,1fr)]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="eyebrow border-b border-line px-5 py-3">{label}</dt>
            <dd className="m-0 border-b border-line px-5 py-3 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      {app.jobUrl && (
        <a
          href={app.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-accent-text"
        >
          Job posting <ExternalLink size={13} aria-hidden="true" />
        </a>
      )}
    </Panel>
  );
}

export function ApplicationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const query = useApplication(id);
  const archive = useArchive(id);
  const remove = useDeleteApplication();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (query.isError) {
    return query.error instanceof ApiError && query.error.status === 404 ? (
      <EmptyState
        title="Application not found."
        description="It may have been deleted."
        action={
          <Link href="/applications" className="font-semibold text-accent-text">
            Back to applications →
          </Link>
        }
      />
    ) : (
      <ErrorState
        message={errorMessage(query.error)}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }
  if (!query.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-[min(520px,90%)]" />
        <Skeleton className="h-20" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const app = query.data;
  return (
    <>
      <Link
        href="/applications"
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-text"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Applications
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/companies/${app.companyId}`}
              className="eyebrow no-underline hover:text-text"
            >
              {app.companyName}
            </Link>
            <StatusPill status={app.status} />
            {app.archivedAt && <span className="eyebrow">Archived</span>}
          </div>
          <h1 className="display m-0 text-[clamp(30px,4.4vw,52px)] leading-[1.02] font-extrabold">
            {app.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusMenu app={app} />
          <Button
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil size={14} aria-hidden="true" /> Edit
          </Button>
          <Menu
            trigger={
              <button
                type="button"
                aria-label="More actions"
                className="flex size-11 items-center justify-center border border-line hover:bg-track"
              >
                <MoreHorizontal size={17} aria-hidden="true" />
              </button>
            }
          >
            <MenuItem
              onSelect={() => {
                void archive
                  .mutateAsync(!app.archivedAt)
                  .then(() =>
                    toast.success(
                      app.archivedAt ? 'Restored' : 'Archived. Still counted in analytics.',
                    ),
                  );
              }}
            >
              {app.archivedAt ? (
                <RotateCcw size={14} aria-hidden="true" />
              ) : (
                <Archive size={14} aria-hidden="true" />
              )}
              {app.archivedAt ? 'Restore' : 'Archive'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              danger
              onSelect={() => {
                setConfirmDelete(true);
              }}
            >
              <Trash2 size={14} aria-hidden="true" /> Delete permanently
            </MenuItem>
          </Menu>
        </div>
      </header>

      <Stepper app={app} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Interviews applicationId={app.id} interviews={app.interviews} />
          <Timeline applicationId={app.id} />
        </div>
        <div className="flex flex-col gap-6">
          <FollowUps app={app} />
          <Details app={app} />
          <ContactsPanel app={app} />
          {app.jobDescription && (
            <Panel id="jd-h" title="Job description" bodyClassName="px-5 py-4">
              <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-muted">
                {app.jobDescription}
              </p>
            </Panel>
          )}
        </div>
      </div>

      <EditDialog app={app} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this application?"
        description={`${app.companyName} · ${app.title}, with its timeline and follow-ups, will be gone for good. Archive it instead to keep it in your analytics.`}
        confirmLabel="Delete permanently"
        loading={remove.isPending}
        onConfirm={() => {
          void remove.mutateAsync(app.id).then(() => {
            toast.success('Application deleted');
            router.push('/applications');
          });
        }}
      />
    </>
  );
}

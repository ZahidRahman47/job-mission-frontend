'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { errorMessage } from '@/lib/api/errors';
import {
  PRIORITIES,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  SOURCES,
  STATUS_LABEL,
  WORK_MODE_LABEL,
  WORK_MODES,
} from '@/lib/domain';
import { toLocalDate } from '@/lib/format';
import { useCompanies, useCreateApplication } from '@/lib/queries';

const START_STATUSES = ['saved', 'applied', 'screening', 'interview', 'offer'] as const;

// Mirrors the API's rules for a quick start; the server re-validates everything.
const schema = z.object({
  companyName: z.string().trim().min(1, 'Company is required.').max(200),
  title: z.string().trim().min(1, 'Job title is required.').max(200),
  status: z.enum(START_STATUSES),
  source: z.enum(SOURCES),
  priority: z.enum(PRIORITIES),
  workMode: z.union([z.literal(''), z.enum(WORK_MODES)]),
  location: z.string().trim().max(200),
  jobUrl: z.union([
    z.literal(''),
    z.url({ protocol: /^https?$/, message: 'Must be a web address starting with http(s)://' }),
  ]),
  appliedAt: z.string(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function NewApplicationDialog({
  open,
  onOpenChange,
  defaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: { companyName?: string };
}) {
  const router = useRouter();
  const create = useCreateApplication();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      title: '',
      status: 'applied',
      source: 'linkedin',
      priority: 'medium',
      workMode: '',
      location: '',
      jobUrl: '',
      appliedAt: toLocalDate(new Date()),
    },
  });
  const { errors } = form.formState;
  // useWatch (not form.watch) subscribes in a way the React Compiler can memoize safely.
  const status = useWatch({ control: form.control, name: 'status' });
  const companyQuery = useWatch({ control: form.control, name: 'companyName' });
  const companies = useCompanies(companyQuery.trim());

  useEffect(() => {
    if (open)
      form.reset({ ...form.getValues(), companyName: defaults?.companyName ?? '', title: '' });
  }, [open, defaults?.companyName, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const app = await create.mutateAsync({
        companyName: values.companyName,
        title: values.title,
        status: values.status,
        source: values.source,
        priority: values.priority,
        workMode: values.workMode === '' ? null : values.workMode,
        location: values.location || null,
        jobUrl: values.jobUrl || null,
        appliedAt:
          values.status === 'saved' || !values.appliedAt
            ? null
            : new Date(`${values.appliedAt}T09:00:00`).toISOString(),
      });
      onOpenChange(false);
      toast.success(`Added ${app.companyName} · ${app.title}`, {
        action: {
          label: 'Open',
          onClick: () => {
            router.push(`/applications/${app.id}`);
          },
        },
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New application"
      description="Company and title are all you need. Add the rest later."
      wide
    >
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="na-company" label="Company" error={errors.companyName?.message}>
          <Input
            {...describedBy('na-company', errors.companyName?.message)}
            {...form.register('companyName')}
            list="na-company-options"
            autoComplete="off"
            placeholder="e.g. Northwind Labs"
            autoFocus
          />
          <datalist id="na-company-options">
            {companies.data?.data.slice(0, 8).map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </Field>
        <Field id="na-title" label="Job title" error={errors.title?.message}>
          <Input
            {...describedBy('na-title', errors.title?.message)}
            {...form.register('title')}
            placeholder="e.g. Senior Backend Engineer"
          />
        </Field>
        <Field id="na-status" label="Status">
          <Select id="na-status" {...form.register('status')}>
            {START_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="na-applied"
          label="Applied on"
          hint={status === 'saved' ? 'Saved jobs have no applied date yet.' : undefined}
        >
          <Input
            id="na-applied"
            type="date"
            disabled={status === 'saved'}
            {...form.register('appliedAt')}
          />
        </Field>
        <Field id="na-source" label="Source">
          <Select id="na-source" {...form.register('source')}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="na-priority" label="Priority">
          <Select id="na-priority" {...form.register('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="na-location" label="Location" optional>
          <Input id="na-location" {...form.register('location')} placeholder="e.g. Berlin" />
        </Field>
        <Field id="na-mode" label="Work mode" optional>
          <Select id="na-mode" {...form.register('workMode')}>
            <option value="">Not specified</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABEL[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="na-url"
          label="Job posting URL"
          optional
          error={errors.jobUrl?.message}
          className="sm:col-span-2"
        >
          <Input
            {...describedBy('na-url', errors.jobUrl?.message)}
            {...form.register('jobUrl')}
            placeholder="https://"
            inputMode="url"
          />
        </Field>
        <div className="sm:col-span-2">
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={create.isPending}>
              Add application
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}

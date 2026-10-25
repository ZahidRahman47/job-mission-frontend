'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Textarea } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { useCreateCompany, useUpdateCompany } from '@/lib/queries';
import type { Company } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(200),
  website: z.union([
    z.literal(''),
    z.url({ protocol: /^https?$/, message: 'Must start with http(s)://' }),
  ]),
  industry: z.string().trim().max(100),
  location: z.string().trim().max(200),
  notes: z.string().max(5000),
});
type Values = z.infer<typeof schema>;

export function CompanyDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
}) {
  const router = useRouter();
  const create = useCreateCompany();
  const update = useUpdateCompany(company?.id ?? '');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: company?.name ?? '',
      website: company?.website ?? '',
      industry: company?.industry ?? '',
      location: company?.location ?? '',
      notes: company?.notes ?? '',
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    const input = {
      name: v.name,
      website: v.website || null,
      industry: v.industry || null,
      location: v.location || null,
      notes: v.notes || null,
    };
    try {
      if (company) {
        await update.mutateAsync(input);
        toast.success('Company updated');
      } else {
        const created = await create.mutateAsync(input);
        toast.success(`${created.name} added`);
        router.push(`/companies/${created.id}`);
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_EXISTS') {
        form.setError('name', { message: 'You already have a company with this name.' });
      } else {
        toast.error(errorMessage(err));
      }
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={company ? 'Edit company' : 'New company'}
    >
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="co-name" label="Name" error={errors.name?.message} className="sm:col-span-2">
          <Input
            {...describedBy('co-name', errors.name?.message)}
            {...form.register('name')}
            autoFocus
          />
        </Field>
        <Field
          id="co-web"
          label="Website"
          optional
          error={errors.website?.message}
          className="sm:col-span-2"
        >
          <Input
            {...describedBy('co-web', errors.website?.message)}
            {...form.register('website')}
            placeholder="https://"
          />
        </Field>
        <Field id="co-industry" label="Industry" optional>
          <Input id="co-industry" {...form.register('industry')} />
        </Field>
        <Field id="co-location" label="Location" optional>
          <Input id="co-location" {...form.register('location')} />
        </Field>
        <Field id="co-notes" label="Notes" optional className="sm:col-span-2">
          <Textarea id="co-notes" {...form.register('notes')} className="min-h-20" />
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
            <Button type="submit" variant="primary" loading={create.isPending || update.isPending}>
              {company ? 'Save' : 'Add company'}
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}

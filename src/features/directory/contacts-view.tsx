'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useState, type SyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select, Textarea } from '@/components/ui/field';
import { ConfirmDialog, Dialog, DialogFooter } from '@/components/ui/overlays';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/primitives';
import { TableSkeleton } from '@/features/applications/applications-table';
import { describe } from '@/features/applications/detail/timeline';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { INTERACTION_CHANNELS } from '@/lib/domain';
import { longDate, timeAgo } from '@/lib/format';
import {
  useAddInteraction,
  useApplicationLabels,
  useCompanies,
  useContact,
  useContacts,
  useCreateContact,
  useDeleteContact,
  useInteractions,
  useUpdateContact,
} from '@/lib/queries';
import type { Contact } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(150),
  title: z.string().trim().max(150),
  companyId: z.string(),
  email: z.union([z.literal(''), z.email('Enter a valid email.')]),
  linkedinUrl: z.union([
    z.literal(''),
    z.url({ protocol: /^https$/, message: 'Must start with https://' }),
  ]),
  notes: z.string().max(5000),
});
type Values = z.infer<typeof schema>;

function ContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
}) {
  const router = useRouter();
  const companies = useCompanies('');
  const create = useCreateContact();
  const update = useUpdateContact(contact?.id ?? '');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: contact?.name ?? '',
      title: contact?.title ?? '',
      companyId: contact?.companyId ?? '',
      email: contact?.email ?? '',
      linkedinUrl: contact?.linkedinUrl ?? '',
      notes: contact?.notes ?? '',
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    const input = {
      name: v.name,
      title: v.title || null,
      companyId: v.companyId || null,
      email: v.email || null,
      linkedinUrl: v.linkedinUrl || null,
      notes: v.notes || null,
    };
    try {
      if (contact) {
        await update.mutateAsync(input);
        toast.success('Contact updated');
      } else {
        const created = await create.mutateAsync(input);
        toast.success(`${created.name} added`);
        router.push(`/contacts/${created.id}`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? 'Edit contact' : 'New contact'}
    >
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="ct-name" label="Name" error={errors.name?.message}>
          <Input
            {...describedBy('ct-name', errors.name?.message)}
            {...form.register('name')}
            autoFocus
          />
        </Field>
        <Field id="ct-title" label="Role" optional>
          <Input id="ct-title" {...form.register('title')} placeholder="e.g. Technical Recruiter" />
        </Field>
        <Field id="ct-company" label="Company" optional className="sm:col-span-2">
          <Select id="ct-company" {...form.register('companyId')}>
            <option value="">None</option>
            {companies.data?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="ct-email" label="Email" optional error={errors.email?.message}>
          <Input
            {...describedBy('ct-email', errors.email?.message)}
            type="email"
            {...form.register('email')}
          />
        </Field>
        <Field id="ct-li" label="LinkedIn" optional error={errors.linkedinUrl?.message}>
          <Input
            {...describedBy('ct-li', errors.linkedinUrl?.message)}
            {...form.register('linkedinUrl')}
            placeholder="https://www.linkedin.com/in/…"
          />
        </Field>
        <Field id="ct-notes" label="Notes" optional className="sm:col-span-2">
          <Textarea id="ct-notes" {...form.register('notes')} className="min-h-20" />
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
              {contact ? 'Save' : 'Add contact'}
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Dialog>
  );
}

export function ContactsView() {
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q.trim());
  const contacts = useContacts(deferred);
  const companies = useCompanies('');
  const companyName = new Map((companies.data?.data ?? []).map((c) => [c.id, c.name]));
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow={contacts.data ? `${String(contacts.data.meta.total)} people` : 'Directory'}
        title="Contacts"
        description="Recruiters, hiring managers and referrers, with every conversation logged."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> New contact
          </Button>
        }
      />
      <label className="relative max-w-md">
        <span className="sr-only">Search contacts</span>
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          placeholder="Search by name"
          className="h-11 w-full border border-line bg-panel pr-3 pl-9 outline-none placeholder:text-muted focus:border-text"
        />
      </label>
      <Panel>
        {contacts.isError ? (
          <ErrorState message={errorMessage(contacts.error)} />
        ) : !contacts.data ? (
          <TableSkeleton />
        ) : contacts.data.data.length === 0 ? (
          <EmptyState
            title={q ? 'No matches.' : 'No contacts yet.'}
            description="Add the people you talk to so their history is one click away."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  {['Name', 'Role', 'Company', 'Email'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="eyebrow border-b border-line px-5 py-3 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.data.data.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-bg">
                    <td className="px-5 py-3 font-semibold">
                      <Link href={`/contacts/${c.id}`} className="no-underline hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{c.title ?? '—'}</td>
                    <td className="px-5 py-3">
                      {c.companyId ? (
                        <Link
                          href={`/companies/${c.companyId}`}
                          className="no-underline hover:underline"
                        >
                          {companyName.get(c.companyId) ?? '—'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[13px] text-muted">{c.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <ContactDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

export function ContactDetailView({ id }: { id: string }) {
  const router = useRouter();
  const contact = useContact(id);
  const interactions = useInteractions(id);
  const add = useAddInteraction(id);
  const remove = useDeleteContact();
  const labels = useApplicationLabels();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [channel, setChannel] = useState<string>('email');
  const [summary, setSummary] = useState('');
  const [applicationId, setApplicationId] = useState('');

  if (contact.isError) {
    return contact.error instanceof ApiError && contact.error.status === 404 ? (
      <EmptyState
        title="Contact not found."
        action={
          <Link href="/contacts" className="font-semibold text-accent-text">
            Back to contacts →
          </Link>
        }
      />
    ) : (
      <ErrorState message={errorMessage(contact.error)} />
    );
  }
  if (!contact.data)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-80 max-w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  const c = contact.data;

  const log = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!summary.trim()) return;
    try {
      await add.mutateAsync({
        channel,
        summary: summary.trim(),
        applicationId: applicationId || null,
      });
      setSummary('');
      toast.success('Interaction logged');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <Link
        href="/contacts"
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-text"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Contacts
      </Link>
      <PageHeader
        eyebrow={c.title ?? 'Contact'}
        title={c.name}
        actions={
          <>
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="inline-flex h-11 items-center gap-2 border border-line px-4 text-sm font-semibold no-underline hover:bg-track"
              >
                <Mail size={15} aria-hidden="true" /> Email
              </a>
            )}
            <Button
              onClick={() => {
                setEditing(true);
              }}
            >
              <Pencil size={14} aria-hidden="true" /> Edit
            </Button>
            <Button
              variant="danger"
              size="icon"
              aria-label="Delete contact"
              onClick={() => {
                setConfirm(true);
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel id="ct-log-h" title="Conversation log">
          <form
            onSubmit={(e) => {
              void log(e);
            }}
            className="grid grid-cols-1 gap-3 border-b border-line p-5 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Channel
              <Select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value);
                }}
              >
                {INTERACTION_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch[0]?.toUpperCase()}
                    {ch.slice(1)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              About application <span className="sr-only">(optional)</span>
              <Select
                value={applicationId}
                onChange={(e) => {
                  setApplicationId(e.target.value);
                }}
              >
                <option value="">None</option>
                {[...labels.entries()]
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([appId, label]) => (
                    <option key={appId} value={appId}>
                      {label}
                    </option>
                  ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold sm:col-span-2">
              What happened
              <Textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                }}
                className="min-h-20"
                maxLength={2000}
                placeholder="e.g. Intro call, they're hiring two backend roles; sent CV."
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <Button
                type="submit"
                variant="strong"
                size="sm"
                loading={add.isPending}
                disabled={!summary.trim()}
              >
                Log it
              </Button>
            </div>
          </form>
          {!interactions.data ? (
            <div className="p-5">
              <Skeleton className="h-12" />
            </div>
          ) : interactions.data.data.length === 0 ? (
            <EmptyState title="No conversations yet." />
          ) : (
            <ol className="m-0 list-none p-0">
              {interactions.data.data.map((a) => {
                const { icon: Icon, text, body } = describe(a);
                return (
                  <li
                    key={a.id}
                    className="flex gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
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
                          dateTime={a.occurredAt}
                          title={longDate(a.occurredAt)}
                          className="font-mono text-xs text-muted"
                        >
                          {timeAgo(a.occurredAt)}
                        </time>
                      </div>
                      {body && <p className="m-0 text-sm text-muted">{body}</p>}
                      {a.applicationId && (
                        <Link
                          href={`/applications/${a.applicationId}`}
                          className="text-[13px] font-semibold text-accent-text"
                        >
                          {labels.get(a.applicationId) ?? 'Application'}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
        <Panel id="ct-info-h" title="Details">
          <dl className="m-0 grid grid-cols-[90px_minmax(0,1fr)]">
            {(
              [
                ['Email', c.email],
                ['Phone', c.phone],
                ['LinkedIn', c.linkedinUrl],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="eyebrow border-b border-line px-5 py-3">{label}</dt>
                <dd className="m-0 truncate border-b border-line px-5 py-3 text-sm">
                  {value ? (
                    label === 'LinkedIn' ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-text"
                      >
                        Profile
                      </a>
                    ) : (
                      value
                    )
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {c.notes && (
            <p className="m-0 px-5 py-4 text-sm whitespace-pre-line text-muted">{c.notes}</p>
          )}
        </Panel>
      </div>
      <ContactDialog open={editing} onOpenChange={setEditing} contact={c} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${c.name}?`}
        description="They'll be unlinked from applications. Logged conversations stay on application timelines."
        confirmLabel="Delete contact"
        loading={remove.isPending}
        onConfirm={() => {
          void remove.mutateAsync(c.id).then(() => {
            toast.success('Contact deleted');
            router.push('/contacts');
          });
        }}
      />
    </>
  );
}

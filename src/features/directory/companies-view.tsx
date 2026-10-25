'use client';

import { ArrowLeft, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/overlays';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/primitives';
import { useShell } from '@/components/shell/shell-context';
import { ApplicationsTable, TableSkeleton } from '@/features/applications/applications-table';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { useApplications, useCompanies, useCompany, useDeleteCompany } from '@/lib/queries';
import { CompanyDialog } from './company-dialog';

export function CompaniesView() {
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q.trim());
  const companies = useCompanies(deferred);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow={companies.data ? `${String(companies.data.meta.total)} companies` : 'Directory'}
        title="Companies"
        description="Each company is stored once and shared by all its applications and contacts."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> New company
          </Button>
        }
      />
      <label className="relative max-w-md">
        <span className="sr-only">Search companies</span>
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
          placeholder="Name starts with…"
          className="h-11 w-full border border-line bg-panel pr-3 pl-9 outline-none placeholder:text-muted focus:border-text"
        />
      </label>
      <Panel>
        {companies.isError ? (
          <ErrorState
            message={errorMessage(companies.error)}
            onRetry={() => {
              void companies.refetch();
            }}
          />
        ) : !companies.data ? (
          <TableSkeleton />
        ) : companies.data.data.length === 0 ? (
          <EmptyState
            title={q ? 'No matches.' : 'No companies yet.'}
            description="Companies are created automatically when you log an application."
          />
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-px bg-line p-0">
            {companies.data.data.map((c) => (
              <li key={c.id} className="bg-panel">
                <Link
                  href={`/companies/${c.id}`}
                  className="flex h-full flex-col gap-1 px-5 py-4 no-underline hover:bg-bg"
                >
                  <span className="font-bold">{c.name}</span>
                  <span className="text-[13px] text-muted">
                    {[c.industry, c.location].filter(Boolean).join(' · ') || '—'}
                  </span>
                  <span className="eyebrow mt-2">
                    {c.applicationCount} application{c.applicationCount === 1 ? '' : 's'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <CompanyDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

export function CompanyDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { openNewApplication } = useShell();
  const company = useCompany(id);
  const apps = useApplications({ companyId: id, archived: 'include', limit: 50 });
  const remove = useDeleteCompany();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (company.isError) {
    return company.error instanceof ApiError && company.error.status === 404 ? (
      <EmptyState
        title="Company not found."
        action={
          <Link href="/companies" className="font-semibold text-accent-text">
            Back to companies →
          </Link>
        }
      />
    ) : (
      <ErrorState message={errorMessage(company.error)} />
    );
  }
  if (!company.data)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-96 max-w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  const c = company.data;

  return (
    <>
      <Link
        href="/companies"
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted no-underline hover:text-text"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Companies
      </Link>
      <PageHeader
        eyebrow={[c.industry, c.location].filter(Boolean).join(' · ') || 'Company'}
        title={c.name}
        description={
          c.website ? (
            <a
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-accent-text"
            >
              {c.website.replace(/^https?:\/\//, '')} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="primary"
              onClick={() => {
                openNewApplication({ companyName: c.name });
              }}
            >
              <Plus size={16} aria-hidden="true" strokeWidth={2.4} /> Application here
            </Button>
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
              aria-label="Delete company"
              onClick={() => {
                setConfirm(true);
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel id="co-apps-h" title={`Applications · ${String(c.applicationCount)}`}>
          {!apps.data ? (
            <TableSkeleton rows={3} />
          ) : apps.data.data.length === 0 ? (
            <EmptyState title="No applications here yet." />
          ) : (
            <ApplicationsTable rows={apps.data.data} dense />
          )}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel id="co-people-h" title="People">
            {c.contacts.length === 0 ? (
              <p className="m-0 px-5 py-4 text-sm text-muted">No contacts at {c.name} yet.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {c.contacts.map((p) => (
                  <li key={p.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/contacts/${p.id}`}
                      className="flex flex-col px-5 py-3 no-underline hover:bg-bg"
                    >
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-[13px] text-muted">{p.title ?? 'Contact'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {c.notes && (
            <Panel id="co-notes-h" title="Notes" bodyClassName="px-5 py-4">
              <p className="m-0 text-sm whitespace-pre-line text-muted">{c.notes}</p>
            </Panel>
          )}
        </div>
      </div>
      <CompanyDialog open={editing} onOpenChange={setEditing} company={c} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${c.name}?`}
        description="Its contacts are kept and unlinked. Companies that still have applications can't be deleted."
        confirmLabel="Delete company"
        loading={remove.isPending}
        onConfirm={() => {
          remove
            .mutateAsync(c.id)
            .then(() => {
              toast.success('Company deleted');
              router.push('/companies');
            })
            .catch((err: unknown) => {
              setConfirm(false);
              toast.error(errorMessage(err));
            });
        }}
      />
    </>
  );
}

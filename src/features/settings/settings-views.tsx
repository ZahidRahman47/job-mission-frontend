'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Download, FileUp, LogOut, Monitor, Smartphone } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { describedBy, Field, Input, Select } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { Panel, Skeleton } from '@/components/ui/primitives';
import * as account from '@/lib/api/account';
import { errorMessage } from '@/lib/api/errors';
import { WORK_MODE_LABEL } from '@/lib/domain';
import { timeAgo } from '@/lib/format';
import { useAccountMutation, useLogout, useMe, useSessions } from '@/lib/queries';
import type { ImportReport, User } from '@/lib/types';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel bodyClassName="grid gap-6 p-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-[15px] font-bold">{title}</h2>
        {description && <p className="m-0 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex max-w-xl flex-col gap-4">{children}</div>
    </Panel>
  );
}

// --- profile ----------------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  timezone: z.string().min(1),
});

function ProfileForm({ user }: { user: User }) {
  const save = useAccountMutation(account.updateProfile);
  const zones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user.name, timezone: user.timezone },
  });
  const { errors, isDirty } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        await save.mutateAsync(v);
        toast.success('Profile saved');
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field id="pf-name" label="Name" error={errors.name?.message}>
        <Input {...describedBy('pf-name', errors.name?.message)} {...form.register('name')} />
      </Field>
      <Field
        id="pf-email"
        label="Email"
        hint={user.emailVerified ? 'Verified.' : 'Not verified yet: check your inbox.'}
      >
        <Input
          id="pf-email"
          value={user.email}
          readOnly
          disabled
          aria-describedby="pf-email-hint"
        />
      </Field>
      <Field
        id="pf-tz"
        label="Time zone"
        hint="“Today”, reminders and date filters follow this zone."
      >
        <Select id="pf-tz" aria-describedby="pf-tz-hint" {...form.register('timezone')}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <Button type="submit" variant="primary" disabled={!isDirty} loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

export function ProfileSettings() {
  const me = useMe();
  return (
    <Section
      title="Profile"
      description="How you appear, and the time zone every date is shown in."
    >
      {me.data ? <ProfileForm user={me.data} /> : <Skeleton className="h-52" />}
    </Section>
  );
}

// --- preferences ------------------------------------------------------------------------------

const prefsSchema = z.object({
  targetTitles: z.string().max(1000),
  targetLocations: z.string().max(1000),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'any']),
  weeklyGoal: z
    .number({ message: 'Enter a number.' })
    .int()
    .min(0, '0 to 200.')
    .max(200, '0 to 200.'),
});
const list = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

function PreferencesForm({ user }: { user: User }) {
  const save = useAccountMutation(account.setPreferences);
  const form = useForm<z.infer<typeof prefsSchema>>({
    resolver: zodResolver(prefsSchema),
    values: {
      targetTitles: user.preferences.targetTitles.join(', '),
      targetLocations: user.preferences.targetLocations.join(', '),
      workMode: user.preferences.workMode,
      weeklyGoal: user.preferences.weeklyGoal,
    },
  });
  const { errors, isDirty } = form.formState;
  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        await save.mutateAsync({
          targetTitles: list(v.targetTitles),
          targetLocations: list(v.targetLocations),
          workMode: v.workMode,
          weeklyGoal: v.weeklyGoal,
        });
        toast.success('Preferences saved');
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field id="pr-titles" label="Target roles" hint="Comma-separated, up to 10.">
        <Input
          id="pr-titles"
          aria-describedby="pr-titles-hint"
          {...form.register('targetTitles')}
        />
      </Field>
      <Field id="pr-locations" label="Target locations" hint="Comma-separated, up to 10.">
        <Input
          id="pr-locations"
          aria-describedby="pr-locations-hint"
          {...form.register('targetLocations')}
        />
      </Field>
      <Field id="pr-mode" label="Work mode">
        <Select id="pr-mode" {...form.register('workMode')}>
          <option value="any">Any</option>
          {(['remote', 'hybrid', 'onsite'] as const).map((m) => (
            <option key={m} value={m}>
              {WORK_MODE_LABEL[m]}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="pr-goal"
        label="Weekly goal"
        error={errors.weeklyGoal?.message}
        hint="Applications per week. Shown as the dashed line on your momentum chart."
      >
        <Input
          {...describedBy('pr-goal', errors.weeklyGoal?.message, 'x')}
          type="number"
          min={0}
          max={200}
          className="w-32"
          {...form.register('weeklyGoal', { valueAsNumber: true })}
        />
      </Field>
      <div>
        <Button type="submit" variant="primary" disabled={!isDirty} loading={save.isPending}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}

export function PreferenceSettings() {
  const me = useMe();
  return (
    <Section
      title="Job search"
      description="What you're aiming for. The weekly goal drives your momentum chart."
    >
      {me.data ? <PreferencesForm user={me.data} /> : <Skeleton className="h-64" />}
    </Section>
  );
}

// --- notifications ----------------------------------------------------------------------------

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line pb-4">
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="font-semibold">{label}</span>
        <span className="text-sm text-muted">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          onChange(!checked);
        }}
        className={`relative h-7 w-12 shrink-0 border transition ${checked ? 'border-accent bg-accent' : 'border-line bg-track'}`}
      >
        <span
          className={`absolute top-1/2 size-5 -translate-y-1/2 bg-text transition-all ${checked ? 'left-[24px] bg-on-accent' : 'left-[3px]'}`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings() {
  const me = useMe();
  const save = useAccountMutation(account.setNotifications);
  const n = me.data?.notifications;
  const update = (patch: Partial<NonNullable<typeof n>>) => {
    if (!n) return;
    void save.mutateAsync({ ...n, ...patch }).then(() => toast.success('Saved'));
  };
  return (
    <Section
      title="Notifications"
      description="Emails only go to a verified address. Delivery switches on when the app goes live."
    >
      {!n ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <Toggle
            id="nt-rem"
            label="Reminder emails"
            description="An email when a follow-up becomes due."
            checked={n.reminderEmails}
            onChange={(v) => {
              update({ reminderEmails: v });
            }}
          />
          <Toggle
            id="nt-dig"
            label="Daily digest"
            description="One morning email with today's follow-ups and interviews."
            checked={n.dailyDigest}
            onChange={(v) => {
              update({ dailyDigest: v });
            }}
          />
          <Field id="nt-hour" label="Digest time" hint="Your local time.">
            <Select
              id="nt-hour"
              value={n.digestHour}
              disabled={!n.dailyDigest}
              onChange={(e) => {
                update({ digestHour: Number(e.target.value) });
              }}
              className="w-40"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
    </Section>
  );
}

// --- security ---------------------------------------------------------------------------------

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z.string().min(12, 'At least 12 characters.').max(128),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords don't match.",
    path: ['confirm'],
  });

export function SecuritySettings() {
  const logout = useLogout();
  const sessions = useSessions();
  const change = useAccountMutation(account.changePassword);
  const revoke = useAccountMutation(account.revokeSession);
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });
  const { errors } = form.formState;

  return (
    <>
      <Section title="Password" description="Changing it signs out every other device.">
        <form
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await change.mutateAsync({
                currentPassword: v.currentPassword,
                newPassword: v.newPassword,
              });
              form.reset();
              toast.success('Password changed. Other devices were signed out.');
            } catch (err) {
              toast.error(errorMessage(err));
            }
          })}
          noValidate
          className="flex flex-col gap-4"
        >
          <Field id="pw-cur" label="Current password" error={errors.currentPassword?.message}>
            <Input
              {...describedBy('pw-cur', errors.currentPassword?.message)}
              type="password"
              autoComplete="current-password"
              {...form.register('currentPassword')}
            />
          </Field>
          <Field
            id="pw-new"
            label="New password"
            error={errors.newPassword?.message}
            hint="12+ characters. A short sentence works well."
          >
            <Input
              {...describedBy('pw-new', errors.newPassword?.message, 'x')}
              type="password"
              autoComplete="new-password"
              {...form.register('newPassword')}
            />
          </Field>
          <Field id="pw-conf" label="Confirm new password" error={errors.confirm?.message}>
            <Input
              {...describedBy('pw-conf', errors.confirm?.message)}
              type="password"
              autoComplete="new-password"
              {...form.register('confirm')}
            />
          </Field>
          <div>
            <Button type="submit" variant="primary" loading={change.isPending}>
              Change password
            </Button>
          </div>
        </form>
      </Section>
      <Section
        title="Active sessions"
        description="Everywhere you're signed in. Revoke anything you don't recognise."
      >
        {!sessions.data ? (
          <Skeleton className="h-32" />
        ) : (
          <ul className="m-0 flex list-none flex-col border border-line p-0">
            {sessions.data.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
              >
                {s.userAgent?.includes('iPhone') ? (
                  <Smartphone size={18} aria-hidden="true" />
                ) : (
                  <Monitor size={18} aria-hidden="true" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">
                    {s.userAgent ?? 'Unknown device'}{' '}
                    {s.current && (
                      <span className="ml-1.5 bg-accent px-1.5 py-0.5 text-[11px] font-bold text-on-accent">
                        THIS DEVICE
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {s.ipPrefix ?? ''} · active {timeAgo(s.lastSeenAt)}
                  </span>
                </div>
                {!s.current && (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={revoke.isPending}
                    onClick={() => {
                      void revoke.mutateAsync(s.id).then(() => toast.success('Session revoked'));
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button
            loading={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            <LogOut size={15} aria-hidden="true" /> Log out
          </Button>
        </div>
      </Section>
    </>
  );
}

// --- data -------------------------------------------------------------------------------------

// Downloads come from the API (CSV with formula-like cells escaped, full JSON export).
function useDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    fn()
      .catch((err: unknown) => toast.error(errorMessage(err)))
      .finally(() => {
        setBusy(null);
      });
  };
  return { busy, run };
}

export function DataSettings() {
  const router = useRouter();
  const client = useQueryClient();
  const downloads = useDownload();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [deletePending, setDeletePending] = useState(false);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('That file is over 5 MB. Split it into smaller files.');
      return;
    }
    setImporting(true);
    try {
      setReport(await account.importApplicationsCsv(file.name, await file.text()));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Section
        title="Import"
        description="Bring your spreadsheet. Bad rows are reported by row number; duplicates are skipped."
      >
        <label className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-line px-6 py-10 text-center hover:border-text">
          <FileUp size={22} aria-hidden="true" />
          <span className="font-semibold">{importing ? 'Importing…' : 'Choose a CSV file'}</span>
          <span className="text-sm text-muted">Up to 5 MB and 5,000 rows</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              void onFile(e);
            }}
            disabled={importing}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            downloads.run('template', account.downloadImportTemplate);
          }}
          className="w-fit text-[13px] font-semibold text-accent-text"
        >
          Download the template
        </button>
        {report && (
          <div role="status" className="border border-line">
            <div className="grid grid-cols-4 gap-px bg-line">
              {(['rows', 'created', 'skipped', 'failed'] as const).map((k) => (
                <div key={k} className="flex flex-col bg-panel px-4 py-3">
                  <span className="eyebrow">{k}</span>
                  <span className="display text-2xl font-bold">{report.totals[k]}</span>
                </div>
              ))}
            </div>
            {report.errors.length > 0 && (
              <ul className="m-0 list-none border-t border-line p-0">
                {report.errors.map((e) => (
                  <li key={`${String(e.row)}-${e.column}`} className="px-4 py-2 text-sm">
                    <span className="font-mono">Row {e.row}</span> · {e.column}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>
      <Section title="Export" description="Your data is yours. Take it anywhere.">
        <div className="flex flex-wrap gap-3">
          <Button
            loading={downloads.busy === 'csv'}
            onClick={() => {
              downloads.run('csv', account.exportApplicationsCsv);
            }}
          >
            <Download size={15} aria-hidden="true" /> Applications (CSV)
          </Button>
          <Button
            loading={downloads.busy === 'json'}
            onClick={() => {
              downloads.run('json', account.exportAccountJson);
            }}
          >
            <Download size={15} aria-hidden="true" /> Everything (JSON)
          </Button>
        </div>
      </Section>
      <Section
        title="Delete account"
        description="Permanently deletes your account and every application, contact and note. This can't be undone."
      >
        <div>
          <Button
            variant="danger"
            onClick={() => {
              setDeleting(true);
            }}
          >
            Delete my account…
          </Button>
        </div>
      </Section>
      <Dialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete your account?"
        description="Export your data first if you want a copy. Enter your password to confirm."
      >
        <Field id="del-pw" label="Password">
          <Input
            id="del-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </Field>
        <DialogFooter>
          <Button
            onClick={() => {
              setDeleting(false);
            }}
          >
            Cancel
          </Button>
          <button
            type="button"
            disabled={!password || deletePending}
            onClick={() => {
              setDeletePending(true);
              account
                .deleteAccount(password)
                .then(() => {
                  client.clear();
                  router.replace('/');
                })
                .catch((err: unknown) => {
                  toast.error(errorMessage(err));
                  setDeletePending(false);
                });
            }}
            className="h-11 border border-danger bg-danger px-4 text-sm font-bold text-panel disabled:opacity-50"
          >
            Delete everything
          </button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

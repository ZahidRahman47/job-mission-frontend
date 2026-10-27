'use client';

// Server-state hooks (TanStack Query). Screens only ever use these; lib/api/* underneath makes
// the HTTP calls.
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as account from './api/account.ts';
import * as analytics from './api/analytics.ts';
import * as applications from './api/applications.ts';
import * as directory from './api/directory.ts';
import * as reminders from './api/reminders.ts';
import type { Application, ApplicationDetail, ApplicationStatus } from './types.ts';

export const keys = {
  me: ['me'] as const,
  sessions: ['sessions'] as const,
  captureToken: ['capture-token'] as const,
  applications: ['applications'] as const,
  applicationList: (q: applications.ApplicationQuery) => ['applications', 'list', q] as const,
  application: (id: string) => ['applications', 'detail', id] as const,
  timeline: (id: string) => ['applications', 'timeline', id] as const,
  reminders: ['reminders'] as const,
  reminderList: (view: reminders.ReminderView, applicationId?: string) =>
    ['reminders', 'list', view, applicationId ?? null] as const,
  reminderCounts: ['reminders', 'counts'] as const,
  analytics: ['analytics'] as const,
  companies: ['companies'] as const,
  company: (id: string) => ['companies', 'detail', id] as const,
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contacts', 'detail', id] as const,
  interactions: (id: string) => ['contacts', 'interactions', id] as const,
};

// Most writes ripple into lists, counts and the dashboard: refresh the affected groups.
function useInvalidate() {
  const client = useQueryClient();
  return (...groups: QueryKey[]) =>
    Promise.all(groups.map((queryKey) => client.invalidateQueries({ queryKey })));
}

const productData = [
  keys.applications,
  keys.reminders,
  keys.analytics,
  keys.companies,
  keys.contacts,
];

// --- account ----------------------------------------------------------------------------------

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: account.getMe });

export const useCaptureToken = () =>
  useQuery({ queryKey: keys.captureToken, queryFn: account.getCaptureToken });

export const useSessions = () =>
  useQuery({ queryKey: keys.sessions, queryFn: account.listSessions });

export function useAccountMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => invalidate(keys.me, keys.sessions, keys.captureToken),
  });
}

// Ends the session. The login page then empties the cache (see LoginForm): clearing it here,
// while this screen is still mounted, would make its queries refetch without a session.
export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: account.logout,
    onSettled: () => {
      router.replace('/login');
    },
  });
}

// --- applications -----------------------------------------------------------------------------

export const useApplications = (query: applications.ApplicationQuery) =>
  useQuery({
    queryKey: keys.applicationList(query),
    queryFn: () => applications.listApplications(query),
    // Keep the current page on screen while the next one loads: no flicker when paging/filtering.
    placeholderData: keepPreviousData,
  });

export const useApplication = (id: string) =>
  useQuery({ queryKey: keys.application(id), queryFn: () => applications.getApplication(id) });

export const useTimeline = (id: string) =>
  useQuery({ queryKey: keys.timeline(id), queryFn: () => applications.listTimeline(id) });

export function useApplicationMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: fn, onSettled: () => invalidate(...productData) });
}

// Optimistic: the new status shows instantly and rolls back if the server refuses.
export function useChangeStatus(id: string) {
  const client = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ to, version }: { to: ApplicationStatus; version: number }) =>
      applications.changeStatus(id, to, version),
    onMutate: async ({ to }) => {
      await client.cancelQueries({ queryKey: keys.application(id) });
      const previous = client.getQueryData<ApplicationDetail>(keys.application(id));
      if (previous) client.setQueryData(keys.application(id), { ...previous, status: to });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) client.setQueryData(keys.application(id), context.previous);
    },
    onSettled: () => invalidate(...productData),
  });
}

// For views that move many applications (the board): id travels with the input.
export const useMoveApplication = () =>
  useApplicationMutation(
    ({ id, to, version }: { id: string; to: ApplicationStatus; version: number }) =>
      applications.changeStatus(id, to, version),
  );

export const useCreateApplication = () => useApplicationMutation(applications.createApplication);

export const useUpdateApplication = (id: string) =>
  useApplicationMutation(
    ({ version, patch }: { version: number; patch: applications.ApplicationPatch }) =>
      applications.updateApplication(id, version, patch),
  );

export const useArchive = (id: string) =>
  useApplicationMutation((archived: boolean) => applications.setArchived(id, archived));

export const useDeleteApplication = () => useApplicationMutation(applications.deleteApplication);

export const useAddNote = (id: string) =>
  useApplicationMutation((body: string) => applications.addNote(id, body));

export const useDeleteNote = (id: string) =>
  useApplicationMutation((noteId: string) => applications.deleteNote(id, noteId));

export const useAddInterview = (id: string) =>
  useApplicationMutation((input: applications.NewInterview) =>
    applications.addInterview(id, input),
  );

export const useUpdateInterview = (id: string) =>
  useApplicationMutation(
    ({ interviewId, patch }: { interviewId: string; patch: Partial<applications.NewInterview> }) =>
      applications.updateInterview(id, interviewId, patch),
  );

export const useSetContacts = (id: string) =>
  useApplicationMutation((contactIds: string[]) => applications.setContacts(id, contactIds));

// "Company · Role" labels by application id, for lists that only carry an applicationId
// (reminders, upcoming). Walks every page (the API caps a page at 100). Later the API could embed
// this summary in reminders to save the requests.
async function fetchApplicationLabels(): Promise<[string, string][]> {
  const labels: [string, string][] = [];
  for (let page = 1; ; page += 1) {
    const result = await applications.listApplications({ page, limit: 100, archived: 'include' });
    for (const a of result.data) labels.push([a.id, `${a.companyName} · ${a.title}`]);
    if (page >= result.meta.totalPages) return labels;
  }
}

// Every application's "Company · Role", for "link to an application" dropdowns. Fetches the whole
// list, so pass `enabled` to load it only while such a form is open. List rows don't need it:
// the API labels reminders itself (`reminder.application`).
export function useApplicationLabels(enabled = true): Map<string, string> {
  const all = useQuery({
    queryKey: [...keys.applications, 'labels'],
    queryFn: fetchApplicationLabels,
    staleTime: 60_000,
    enabled,
  });
  return new Map(all.data ?? []);
}

// --- reminders --------------------------------------------------------------------------------

export const useReminders = (view: reminders.ReminderView, applicationId?: string) =>
  useQuery({
    queryKey: keys.reminderList(view, applicationId),
    queryFn: () => reminders.listReminders(view, applicationId ? { applicationId } : {}),
  });

export const useReminderCounts = () =>
  useQuery({ queryKey: keys.reminderCounts, queryFn: reminders.reminderCounts });

export const useCreateReminder = () => useApplicationMutation(reminders.createReminder);
export const useCompleteReminder = () => useApplicationMutation(reminders.completeReminder);
export const useReopenReminder = () => useApplicationMutation(reminders.reopenReminder);
export const useDeleteReminder = () => useApplicationMutation(reminders.deleteReminder);

// --- analytics --------------------------------------------------------------------------------

export const useSummary = (range: analytics.Range) =>
  useQuery({
    queryKey: [...keys.analytics, 'summary', range],
    queryFn: () => analytics.getSummary(range),
  });

export const useTimeseries = (interval: 'week' | 'month', range: analytics.Range) =>
  useQuery({
    queryKey: [...keys.analytics, 'timeseries', interval, range],
    queryFn: () => analytics.getTimeseries(interval, range),
  });

export const useSources = (range: analytics.Range) =>
  useQuery({
    queryKey: [...keys.analytics, 'sources', range],
    queryFn: () => analytics.getSources(range),
  });

export const useUpcoming = () =>
  useQuery({ queryKey: [...keys.analytics, 'upcoming'], queryFn: analytics.getUpcoming });

export const useActivityFeed = (limit = 12) =>
  useQuery({
    queryKey: [...keys.analytics, 'feed', limit],
    queryFn: () => analytics.getActivityFeed(limit),
  });

// --- companies & contacts ---------------------------------------------------------------------

export const useCompanies = (q: string) =>
  useQuery({
    queryKey: [...keys.companies, 'list', q],
    queryFn: () => directory.listCompanies({ q, limit: 100 }),
    placeholderData: keepPreviousData,
  });

export const useCompany = (id: string) =>
  useQuery({ queryKey: keys.company(id), queryFn: () => directory.getCompany(id) });

export const useCreateCompany = () => useApplicationMutation(directory.createCompany);
export const useUpdateCompany = (id: string) =>
  useApplicationMutation((input: Partial<directory.CompanyInput>) =>
    directory.updateCompany(id, input),
  );
export const useDeleteCompany = () => useApplicationMutation(directory.deleteCompany);

export const useContacts = (q: string, companyId?: string) =>
  useQuery({
    queryKey: [...keys.contacts, 'list', q, companyId ?? null],
    queryFn: () => directory.listContacts({ q, limit: 100, ...(companyId && { companyId }) }),
    placeholderData: keepPreviousData,
  });

export const useContact = (id: string) =>
  useQuery({ queryKey: keys.contact(id), queryFn: () => directory.getContact(id) });

export const useInteractions = (id: string) =>
  useQuery({ queryKey: keys.interactions(id), queryFn: () => directory.listInteractions(id) });

export const useCreateContact = () => useApplicationMutation(directory.createContact);
export const useUpdateContact = (id: string) =>
  useApplicationMutation((input: Partial<directory.ContactInput>) =>
    directory.updateContact(id, input),
  );
export const useDeleteContact = () => useApplicationMutation(directory.deleteContact);
export const useAddInteraction = (contactId: string) =>
  useApplicationMutation(
    (input: { channel: string; summary: string; applicationId?: string | null }) =>
      directory.addInteraction(contactId, input),
  );

export type { Application };

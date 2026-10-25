// Reminders: /api/v1/reminders. The API keeps each application's nextFollowUpAt in sync (BR-012).
import type { Page, Reminder } from '../types.ts';
import { request, requestData } from './http.ts';

export type ReminderView = 'overdue' | 'today' | 'upcoming' | 'completed';
const VIEWS: readonly ReminderView[] = ['overdue', 'today', 'upcoming', 'completed'];

export interface NewReminder {
  title: string;
  note?: string;
  dueAt: string;
  applicationId?: string | null;
}

const base = (id: string) => `/reminders/${encodeURIComponent(id)}`;

export function listReminders(
  view: ReminderView,
  options: { applicationId?: string; page?: number; limit?: number } = {},
): Promise<Page<Reminder>> {
  return request('/reminders', { query: { view, limit: 50, ...options } });
}

// Tab badges: one tiny page per view, read from meta.total.
export async function reminderCounts(): Promise<Record<ReminderView, number>> {
  const totals = await Promise.all(
    VIEWS.map((view) => listReminders(view, { limit: 1 }).then((page) => page.meta.total)),
  );
  return Object.fromEntries(VIEWS.map((view, i) => [view, totals[i] ?? 0])) as Record<
    ReminderView,
    number
  >;
}

export function createReminder(input: NewReminder): Promise<Reminder> {
  const { applicationId, ...rest } = input;
  return requestData('/reminders', {
    method: 'POST',
    body: applicationId ? { ...rest, applicationId } : rest,
  });
}

export function completeReminder(id: string): Promise<Reminder> {
  return requestData(`${base(id)}/complete`, { method: 'POST' });
}

export function reopenReminder(id: string): Promise<Reminder> {
  return requestData(`${base(id)}/reopen`, { method: 'POST' });
}

export function deleteReminder(id: string): Promise<void> {
  return request(base(id), { method: 'DELETE' });
}

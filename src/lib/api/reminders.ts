// Reminders: /api/v1/reminders. The API keeps each application's nextFollowUpAt in sync (BR-012).
import type { Page, Reminder } from '../types.ts';
import { request, requestData } from './http.ts';

export type ReminderView = 'overdue' | 'today' | 'upcoming' | 'completed';

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
// One request for the badge and the view tabs (the API counts with the same rules as the lists).
export function reminderCounts(): Promise<Record<ReminderView, number>> {
  return requestData('/reminders/counts');
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

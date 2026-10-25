// Applications: /api/v1/applications (implementation-plan.md 4.4).
import type {
  Activity,
  Application,
  ApplicationDetail,
  ApplicationListItem,
  ApplicationStatus,
  CursorPage,
  Interview,
  Page,
  Source,
} from '../types.ts';
import { request, requestData } from './http.ts';

export const SORT_FIELDS = [
  'appliedAt',
  'companyName',
  'status',
  'nextFollowUpAt',
  'createdAt',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export interface ApplicationQuery {
  q?: string;
  status?: ApplicationStatus[];
  source?: Source[];
  priority?: Application['priority'][];
  companyId?: string;
  archived?: 'exclude' | 'only' | 'include';
  sort?: SortField;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface NewApplication {
  companyName: string;
  title: string;
  status: ApplicationStatus;
  source: Source;
  priority: Application['priority'];
  location?: string | null;
  workMode?: Application['workMode'];
  jobUrl?: string | null;
  appliedAt?: string | null;
}

export type ApplicationPatch = Partial<
  Pick<
    Application,
    | 'title'
    | 'location'
    | 'workMode'
    | 'employmentType'
    | 'jobUrl'
    | 'jobDescription'
    | 'source'
    | 'priority'
    | 'salary'
  >
>;

const base = (id: string) => `/applications/${encodeURIComponent(id)}`;

export function listApplications(query: ApplicationQuery = {}): Promise<Page<ApplicationListItem>> {
  return request('/applications', { query: { ...query } });
}

export function getApplication(id: string): Promise<ApplicationDetail> {
  return requestData(base(id));
}

export function createApplication(input: NewApplication): Promise<Application> {
  // Send only the fields the form filled in; the API applies its own defaults to the rest.
  const body = Object.fromEntries(Object.entries(input).filter(([, value]) => value != null));
  return requestData('/applications', { method: 'POST', body });
}

// `version` is the one the user saw; a stale version gets 409 CONFLICT (optimistic concurrency).
export function updateApplication(
  id: string,
  version: number,
  patch: ApplicationPatch,
): Promise<Application> {
  return requestData(base(id), { method: 'PATCH', body: { ...patch, version } });
}

export function changeStatus(
  id: string,
  to: ApplicationStatus,
  version: number,
): Promise<Application> {
  return requestData(`${base(id)}/status`, { method: 'POST', body: { to, version } });
}

export function setArchived(id: string, archived: boolean): Promise<Application> {
  return requestData(`${base(id)}/${archived ? 'archive' : 'restore'}`, { method: 'POST' });
}

export function deleteApplication(id: string): Promise<void> {
  return request(base(id), { method: 'DELETE' });
}

export function listTimeline(id: string): Promise<CursorPage<Activity>> {
  return request(`${base(id)}/activities`, { query: { limit: 50 } });
}

export function addNote(id: string, body: string): Promise<Activity> {
  return requestData(`${base(id)}/notes`, { method: 'POST', body: { body } });
}

export function deleteNote(id: string, noteId: string): Promise<void> {
  return request(`${base(id)}/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' });
}

export type NewInterview = Omit<Interview, 'id'>;

export function addInterview(id: string, input: NewInterview): Promise<Application> {
  return requestData(`${base(id)}/interviews`, { method: 'POST', body: input });
}

export function updateInterview(
  id: string,
  interviewId: string,
  patch: Partial<NewInterview>,
): Promise<Application> {
  return requestData(`${base(id)}/interviews/${encodeURIComponent(interviewId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function setContacts(id: string, contactIds: string[]): Promise<Application> {
  return requestData(`${base(id)}/contacts`, { method: 'PUT', body: { contactIds } });
}

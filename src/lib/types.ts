// Every data shape the UI renders, from the API contract. `schema.d.ts` is generated from the
// API's openapi.json (`pnpm gen:api`), so frontend and backend can live in separate repos and
// still share one source of truth. Never edit schema.d.ts by hand: regenerate it.
import type { components } from './api/schema';

type Schemas = components['schemas'];

export type Application = Schemas['Application'];
export type ApplicationListItem = Schemas['ApplicationListItem'];
export type ApplicationDetail = Schemas['ApplicationDetail'];
export type Interview = Schemas['Interview'];
export type Activity = Schemas['Activity'];
export type Reminder = Schemas['Reminder'];
export type Company = Schemas['Company'];
export type CompanyListItem = Schemas['CompanyListItem'];
export type CompanyDetail = Schemas['CompanyDetail'];
export type Contact = Schemas['Contact'];
export type User = Schemas['User'];
export type Preferences = Schemas['Preferences'];
export type NotificationSettings = Schemas['NotificationSettings'];
export type Session = Schemas['Session'];
export type Timeseries = Schemas['AnalyticsTimeseries'];
export type SourceStats = Schemas['AnalyticsSources'];
export type Upcoming = Schemas['AnalyticsUpcoming'];
export type ImportReport = Schemas['ImportReport'];
export type PageMeta = Schemas['PageMeta'];

export type ApplicationStatus = Application['status'];
export type Source = Application['source'];

// The generator renders `byStatus` as a loose string index; the API always returns every status.
export type Summary = Omit<Schemas['AnalyticsSummary'], 'byStatus'> & {
  byStatus: Record<ApplicationStatus, number>;
};

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface CursorPage<T> {
  data: T[];
  meta: { nextCursor: string | null };
}

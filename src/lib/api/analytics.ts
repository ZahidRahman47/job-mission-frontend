// Dashboard metrics: /api/v1/analytics (formulas in requirements.md 4) and the activity feed.
import { toLocalDate } from '../format.ts';
import type { Activity, CursorPage, SourceStats, Summary, Timeseries, Upcoming } from '../types.ts';
import { request, requestData } from './http.ts';

export interface Range {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

export function defaultRange(days = 90): Range {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - (days - 1));
  return { from: toLocalDate(from), to: toLocalDate(to) };
}

export function getSummary(range: Range = defaultRange()): Promise<Summary> {
  return requestData('/analytics/summary', { query: { ...range } });
}

export function getTimeseries(
  interval: 'week' | 'month' = 'week',
  range: Range = defaultRange(84),
): Promise<Timeseries> {
  return requestData('/analytics/timeseries', { query: { ...range, interval } });
}

export function getSources(range: Range = defaultRange()): Promise<SourceStats> {
  return requestData('/analytics/sources', { query: { ...range } });
}

export function getUpcoming(): Promise<Upcoming> {
  return requestData('/analytics/upcoming');
}

export function getActivityFeed(limit = 20): Promise<CursorPage<Activity>> {
  return request('/activities', { query: { limit } });
}

// Business rules the UI needs to offer the right options. A copy of the API's status machine:
// the API stays authoritative (an invalid move gets 409 with `details.allowed`), so if this copy
// ever drifts, the user sees a clear error instead of corrupted data.
import type { ApplicationStatus, Source } from './types';

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const satisfies readonly ApplicationStatus[];

export const SOURCES = [
  'linkedin',
  'indeed',
  'rozee',
  'mustakbil',
  'company_site',
  'referral',
  'job_board',
  'recruiter_outreach',
  'networking',
  'other',
] as const satisfies readonly Source[];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;
export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
] as const;
export const SALARY_PERIODS = ['year', 'month', 'hour'] as const;
export const INTERVIEW_TYPES = [
  'phone_screen',
  'technical',
  'behavioral',
  'system_design',
  'take_home',
  'onsite',
  'final',
  'other',
] as const;
export const INTERVIEW_OUTCOMES = ['pending', 'passed', 'failed', 'cancelled'] as const;
export const INTERACTION_CHANNELS = ['email', 'linkedin', 'call', 'meeting', 'other'] as const;

const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  saved: ['applied', 'withdrawn'],
  applied: ['screening', 'interview', 'offer', 'rejected', 'withdrawn'],
  screening: ['interview', 'offer', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const REOPENABLE: readonly ApplicationStatus[] = ['rejected', 'withdrawn'];

// Rejected/withdrawn may go back to the status held just before (BR-003).
export function allowedTransitions(
  from: ApplicationStatus,
  previousStatus: ApplicationStatus | null,
): ApplicationStatus[] {
  const allowed = [...TRANSITIONS[from]];
  if (REOPENABLE.includes(from) && previousStatus !== null && previousStatus !== from) {
    allowed.push(previousStatus);
  }
  return allowed;
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const SOURCE_LABEL: Record<Source, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  rozee: 'Rozee.pk',
  mustakbil: 'Mustakbil',
  company_site: 'Company site',
  referral: 'Referral',
  job_board: 'Job board',
  recruiter_outreach: 'Recruiter',
  networking: 'Networking',
  other: 'Other',
};

export const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;

export const WORK_MODE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' } as const;

export const EMPLOYMENT_LABEL = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
} as const;

export const INTERVIEW_TYPE_LABEL = {
  phone_screen: 'Phone screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  system_design: 'System design',
  take_home: 'Take-home',
  onsite: 'Onsite',
  final: 'Final',
  other: 'Other',
} as const;

export const ACTIVE_STATUSES: readonly ApplicationStatus[] = [
  'applied',
  'screening',
  'interview',
  'offer',
];

// Display formatting. Dates are shown in the user's timezone; data columns use short, fixed-width
// forms so tables line up (tabular figures are on globally).

const DAY_MS = 86_400_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// "25 OCT" style for table cells.
export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase();
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function dayDiff(iso: string, now = new Date()): number {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / DAY_MS);
}

// "TODAY 11:00", "YESTERDAY 17:00", "TUE 27 OCT 14:00".
export function relativeDay(iso: string, now = new Date()): string {
  const diff = dayDiff(iso, now);
  const label =
    diff === 0
      ? 'TODAY'
      : diff === -1
        ? 'YESTERDAY'
        : diff === 1
          ? 'TOMORROW'
          : new Date(iso)
              .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
              .toUpperCase();
  return `${label} ${time(iso)}`;
}

// Follow-up column: OVERDUE / TODAY / a date.
export function followUpLabel(iso: string | null, now = new Date()): string {
  if (!iso) return '—';
  if (new Date(iso).getTime() < now.getTime()) return 'OVERDUE';
  if (dayDiff(iso, now) === 0) return 'TODAY';
  return shortDate(iso);
}

export function timeAgo(iso: string, now = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return shortDate(iso);
}

// 0.3111 -> "31.1%"; null (nothing to divide by) -> "—".
export function percent(rate: number | null): string {
  return rate === null ? '—' : `${(rate * 100).toFixed(1)}%`;
}

export function money(amount: number | null, currency: string): string {
  if (amount === null) return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: amount >= 100_000 ? 'compact' : 'standard',
  }).format(amount);
}

export function toLocalDate(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

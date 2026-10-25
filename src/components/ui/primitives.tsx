// Small presentational pieces shared by every screen.
import type { ReactNode } from 'react';
import { STATUS_LABEL } from '@/lib/domain';
import { cn } from '@/lib/cn';
import type { ApplicationStatus } from '@/lib/types';

// Status is always a word, never colour alone (spec rule 03).
const statusStyle: Record<ApplicationStatus, string> = {
  saved: 'border-line text-muted bg-transparent',
  applied: 'border-line text-text bg-transparent',
  screening: 'border-transparent bg-soft text-soft-fg',
  interview: 'border-accent bg-accent text-on-accent',
  offer: 'border-strong-bg bg-strong-bg text-strong-fg',
  accepted: 'border-strong-bg bg-strong-bg text-strong-fg',
  rejected: 'border-line text-muted bg-transparent',
  withdrawn: 'border-line text-muted bg-transparent',
};

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center border px-2 text-xs font-semibold',
        statusStyle[status],
        className,
      )}
    >
      {status === 'accepted' && (
        <span aria-hidden="true" className="mr-1">
          ✓
        </span>
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={title && id ? id : undefined}
      className={cn('border border-line bg-panel', className)}
    >
      {(title ?? actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && (
            <h2 id={id} className="text-[15px] font-bold">
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-2.5">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="display m-0 text-[clamp(32px,4.5vw,52px)] leading-[1.02] font-extrabold">
          {title}
        </h1>
        {description && <p className="m-0 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 bg-panel px-5 py-5">
      <span className="eyebrow">{label}</span>
      <span className="display text-[44px] leading-none font-bold">{value}</span>
      {sub && <span className="text-[13px] text-muted">{sub}</span>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse bg-track', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-3 px-6 py-12', className)}>
      <span aria-hidden="true" className="block size-3 bg-accent" />
      <p className="display m-0 text-2xl font-bold">{title}</p>
      {description && <p className="m-0 max-w-md text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 px-6 py-10">
      <p className="m-0 font-semibold">Couldn't load this.</p>
      <p className="m-0 text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 border border-line px-3 text-[13px] font-semibold hover:bg-track"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  );
}

export function Flag({ children }: { children: ReactNode }) {
  return (
    <span className="bg-flag-bg px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.06em] text-flag-fg">
      {children}
    </span>
  );
}

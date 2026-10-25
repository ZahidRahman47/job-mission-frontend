import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full border border-line bg-panel px-3 text-[15px] text-text placeholder:text-muted outline-none transition focus:border-text aria-[invalid=true]:border-danger disabled:opacity-60';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, 'min-h-28 py-2.5 leading-relaxed', className)} {...props} />
  );
}

// Native select: accessible, keyboard- and mobile-friendly by default.
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        control,
        'h-11 cursor-pointer appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9',
        className,
      )}
      style={{ backgroundImage: 'var(--chevron)' }}
      {...props}
    >
      {children}
    </select>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

// Label + control + hint/error, wired with ids so screen readers announce the error.
export function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Props that connect a control to its Field's error/hint.
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

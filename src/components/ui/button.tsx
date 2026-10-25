import Link, { type LinkProps } from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'strong';
type Size = 'md' | 'sm' | 'icon';

const variants: Record<Variant, string> = {
  // Lime is a fill with ink text: the one action that matters on the screen.
  primary: 'bg-accent text-on-accent border-accent hover:brightness-95 font-bold',
  secondary: 'bg-transparent text-text border-line hover:bg-track font-semibold',
  ghost: 'bg-transparent text-text border-transparent hover:bg-track font-semibold',
  danger: 'bg-transparent text-danger border-line hover:bg-track font-semibold',
  strong: 'bg-strong-bg text-strong-fg border-strong-bg hover:opacity-90 font-semibold',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-sm gap-2',
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  icon: 'h-11 w-11 justify-center',
};

export function buttonClass(
  variant: Variant = 'secondary',
  size: Size = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex shrink-0 items-center whitespace-nowrap border transition disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

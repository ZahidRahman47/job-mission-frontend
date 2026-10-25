import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Logo({ href = '/today', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2.5 no-underline', className)}
      aria-label="Mission Control home"
    >
      <span aria-hidden="true" className="flex size-7 items-center justify-center bg-current">
        <span className="size-2.5 bg-accent" />
      </span>
      <span
        className="display text-[15px] font-extrabold tracking-tight whitespace-nowrap"
        style={{ fontStretch: '115%' }}
      >
        MISSION CONTROL
      </span>
    </Link>
  );
}

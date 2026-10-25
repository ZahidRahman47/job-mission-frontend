import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center gap-5 px-6 sm:px-16">
      <span className="eyebrow">404</span>
      <h1 className="display m-0 text-[clamp(40px,7vw,80px)] leading-none font-extrabold">
        Off the map.
      </h1>
      <p className="m-0 max-w-md text-muted">
        This page doesn't exist, or it moved. Your applications are where you left them.
      </p>
      <ButtonLink href="/today" variant="primary">
        Back to Today
      </ButtonLink>
    </main>
  );
}

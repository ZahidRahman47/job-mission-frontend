'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, ButtonLink } from '@/components/ui/button';
import { describedBy, Field, Input } from '@/components/ui/field';
import * as account from '@/lib/api/account';
import { errorMessage } from '@/lib/api/errors';

function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="display m-0 text-4xl leading-tight font-extrabold">{title}</h1>
      {children && <p className="m-0 text-muted">{children}</p>}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-2 border border-danger px-3 py-2.5 text-sm text-danger"
    >
      <CircleAlert size={16} aria-hidden="true" /> {message}
    </p>
  );
}

function Success({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role="status" className="flex flex-col items-start gap-4">
      <CheckCircle2 size={28} aria-hidden="true" />
      <h1 className="display m-0 text-4xl leading-tight font-extrabold">{title}</h1>
      <p className="m-0 text-muted">{children}</p>
      {action}
    </div>
  );
}

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email.')
  .pipe(z.email('Enter a valid email address.'));
// Same policy as the API (NIST 800-63B): length, not composition rules.
const newPassword = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Use at most 128 characters.');

// A fresh start for the cache: nothing from a previous account may linger on screen.
function useStartSession() {
  const router = useRouter();
  const client = useQueryClient();
  return (to: string) => {
    client.clear();
    router.push(to);
  };
}

export function LoginForm() {
  const startSession = useStartSession();
  const client = useQueryClient();
  const params = useSearchParams();
  // Reached after logout or an expired session: forget the previous account's data now that no
  // screen is subscribed to it any more.
  useEffect(() => {
    client.clear();
  }, [client]);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ email: string; password: string }>({
    resolver: zodResolver(z.object({ email, password: z.string().min(1, 'Enter your password.') })),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <Heading eyebrow="Welcome back" title="Log in" />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            await account.login(values);
            const next = params.get('next');
            startSession(next?.startsWith('/') && !next.startsWith('//') ? next : '/today');
          } catch (err) {
            setError(errorMessage(err));
          }
        })}
      >
        <FormError message={error} />
        <Field id="lg-email" label="Email" error={errors.email?.message}>
          <Input
            {...describedBy('lg-email', errors.email?.message)}
            type="email"
            autoComplete="email"
            {...form.register('email')}
            autoFocus
          />
        </Field>
        <Field id="lg-password" label="Password" error={errors.password?.message}>
          <Input
            {...describedBy('lg-password', errors.password?.message)}
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </Field>
        <Link href="/forgot-password" className="w-fit text-[13px] font-semibold text-accent-text">
          Forgot your password?
        </Link>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="mt-2 w-full justify-center"
        >
          Log in
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        New here?{' '}
        <Link href="/register" className="font-semibold text-text">
          Create an account
        </Link>
      </p>
    </>
  );
}

export function RegisterForm() {
  const startSession = useStartSession();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ name: string; email: string; password: string }>({
    resolver: zodResolver(
      z.object({
        name: z.string().trim().min(1, 'Enter your name.').max(100),
        email,
        password: newPassword,
      }),
    ),
    defaultValues: { name: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  if (done) {
    return (
      <Success
        title="Check your inbox."
        action={
          <ButtonLink href="/login" variant="primary">
            Go to log in
          </ButtonLink>
        }
      >
        {done} We sent the link to <strong className="text-text">{form.getValues('email')}</strong>.
      </Success>
    );
  }

  return (
    <>
      <Heading eyebrow="Start free" title="Create your account">
        Takes 30 seconds. Your data stays private.
      </Heading>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          try {
            const result = await account.register({
              ...values,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            // Log straight in; the verification email waits in the inbox meanwhile. If the email
            // was already registered, this login fails and the generic "check your inbox" shows.
            try {
              await account.login({ email: values.email, password: values.password });
              startSession('/today');
            } catch {
              setDone(result.message);
            }
          } catch (err) {
            setError(errorMessage(err));
          }
        })}
      >
        <FormError message={error} />
        <Field id="rg-name" label="Name" error={errors.name?.message}>
          <Input
            {...describedBy('rg-name', errors.name?.message)}
            autoComplete="name"
            {...form.register('name')}
            autoFocus
          />
        </Field>
        <Field id="rg-email" label="Email" error={errors.email?.message}>
          <Input
            {...describedBy('rg-email', errors.email?.message)}
            type="email"
            autoComplete="email"
            {...form.register('email')}
          />
        </Field>
        <Field
          id="rg-password"
          label="Password"
          error={errors.password?.message}
          hint="At least 12 characters. A short sentence is strong and easy to remember."
        >
          <Input
            {...describedBy('rg-password', errors.password?.message, 'x')}
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="mt-2 w-full justify-center"
        >
          Create account
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-text">
          Log in
        </Link>
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email })),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  if (done) {
    return (
      <Success
        title="Check your inbox."
        action={<ButtonLink href="/login">Back to log in</ButtonLink>}
      >
        {done} The link works once and expires after 30 minutes.
      </Success>
    );
  }
  return (
    <>
      <Heading eyebrow="Account recovery" title="Reset your password">
        Enter your email and we'll send a reset link.
      </Heading>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (v) => {
          setDone((await account.forgotPassword(v.email)).message);
        })}
      >
        <Field id="fp-email" label="Email" error={errors.email?.message}>
          <Input
            {...describedBy('fp-email', errors.email?.message)}
            type="email"
            autoComplete="email"
            {...form.register('email')}
            autoFocus
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="mt-2 w-full justify-center"
        >
          Send reset link
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        <Link href="/login" className="font-semibold text-text">
          Back to log in
        </Link>
      </p>
    </>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(
      z
        .object({ password: newPassword, confirm: z.string() })
        .refine((v) => v.password === v.confirm, {
          message: "Passwords don't match.",
          path: ['confirm'],
        }),
    ),
    defaultValues: { password: '', confirm: '' },
  });
  const { errors, isSubmitting } = form.formState;

  if (done) {
    return (
      <Success
        title="Password updated."
        action={
          <ButtonLink href="/login" variant="primary">
            Log in
          </ButtonLink>
        }
      >
        For your safety, every device was signed out. Log in with your new password.
      </Success>
    );
  }
  if (!token) {
    return (
      <Success
        title="This link is incomplete."
        action={<ButtonLink href="/forgot-password">Request a new link</ButtonLink>}
      >
        Open the link from your email again, or request a new one.
      </Success>
    );
  }
  return (
    <>
      <Heading eyebrow="Account recovery" title="Choose a new password" />
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (v) => {
          setError(null);
          try {
            await account.resetPassword({ token, password: v.password });
            setDone(true);
          } catch (err) {
            setError(errorMessage(err));
          }
        })}
      >
        <FormError message={error} />
        <Field
          id="rp-password"
          label="New password"
          error={errors.password?.message}
          hint="At least 12 characters."
        >
          <Input
            {...describedBy('rp-password', errors.password?.message, 'x')}
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
            autoFocus
          />
        </Field>
        <Field id="rp-confirm" label="Confirm password" error={errors.confirm?.message}>
          <Input
            {...describedBy('rp-confirm', errors.confirm?.message)}
            type="password"
            autoComplete="new-password"
            {...form.register('confirm')}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="mt-2 w-full justify-center"
        >
          Update password
        </Button>
      </form>
    </>
  );
}

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<{ status: 'pending' | 'done' | 'error'; message: string }>({
    status: 'pending',
    message: '',
  });

  useEffect(() => {
    let cancelled = false;
    account
      .verifyEmail(token)
      .then((r) => {
        if (!cancelled) setState({ status: 'done', message: r.message });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === 'pending')
    return <Heading eyebrow="One moment" title="Verifying your email…" />;
  if (state.status === 'error') {
    return (
      <Success
        title="Link not valid."
        action={<ButtonLink href="/login">Log in to send a new one</ButtonLink>}
      >
        {state.message} Links expire after 24 hours and work once.
      </Success>
    );
  }
  return (
    <Success
      title="You're verified."
      action={
        <ButtonLink href="/today" variant="primary">
          Open Mission Control
        </ButtonLink>
      }
    >
      {state.message} Reminder emails can now reach you.
    </Success>
  );
}

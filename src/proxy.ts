// Runs before each page request. Visitors with no session cookie go straight to /login, so the
// app shell never flashes for them. This is only a fast check: the API validates the session on
// every call, and an expired one still lands on /login via the 401 handler in providers.tsx.
// Works because the API's cookie belongs to this app's domain: the API is reached through this
// app's /api/v1 forwarding (next.config.ts), or via a shared COOKIE_DOMAIN in the custom-domain setup.
import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'mc_session';

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL('/login', request.url);
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

// The authenticated area only; marketing and auth pages stay public.
export const config = {
  matcher: [
    '/today/:path*',
    '/applications/:path*',
    '/board/:path*',
    '/reminders/:path*',
    '/companies/:path*',
    '/contacts/:path*',
    '/analytics/:path*',
    '/settings/:path*',
  ],
};

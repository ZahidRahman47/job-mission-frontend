// The only module that talks to the API over HTTP. Sends the session cookie (credentials:
// 'include') and the CSRF header on writes, and turns the API's error envelope into ApiError.
import { ApiError } from './errors.ts';

// Same-origin by default: next.config.ts forwards /api/v1 to the API (API_PROXY_URL).
// NEXT_PUBLIC_API_URL overrides it only for a custom-domain setup that calls the API directly.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '/api/v1').replace(/\/+$/, '');

type QueryValue = string | number | boolean | readonly string[] | null | undefined;
export type Query = Record<string, QueryValue>;

function url(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // The API takes lists as comma-separated values: ?status=applied,interview
      if (value.length) params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

function isEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorEnvelope).error.code === 'string'
  );
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  csv?: string; // raw text/csv body (CSV import)
}

async function send(path: string, options: RequestOptions, accept: string): Promise<Response> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: accept };
  // Every state-changing request carries this header; the API's CSRF guard rejects writes without it.
  if (method !== 'GET') headers['X-Requested-With'] = 'mission-control';

  let body: string | undefined;
  if (options.csv !== undefined) {
    headers['Content-Type'] = 'text/csv';
    body = options.csv;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url(path, options.query), {
      method,
      headers,
      body,
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    if (isEnvelope(payload)) {
      throw new ApiError(
        response.status,
        payload.error.code,
        payload.error.message,
        payload.error.details,
      );
    }
    throw new ApiError(
      response.status,
      `HTTP_${String(response.status)}`,
      `The server answered ${String(response.status)}.`,
    );
  }
  return response;
}

// JSON request. Returns the parsed body, or undefined for 204 No Content.
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options, 'application/json');
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// Most endpoints wrap their payload as { data }.
export async function requestData<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await request<{ data: T }>(path, options)).data;
}

// File download (CSV/JSON export): fetch with the session cookie, then save as a file.
export async function download(
  path: string,
  query: Query = {},
  fallbackName = 'download',
): Promise<void> {
  const response = await send(path, { query }, '*/*');
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const href = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  link.click();
  URL.revokeObjectURL(href);
}

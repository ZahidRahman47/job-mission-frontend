// The API's error envelope as a typed client error. http.ts parses
// `{ error: { code, message, details } }` into this class.

export interface FieldIssue {
  location: 'body' | 'query' | 'params';
  path: string[];
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  // Field-level messages for forms (VALIDATION_ERROR details).
  get fieldIssues(): FieldIssue[] {
    return this.code === 'VALIDATION_ERROR' && Array.isArray(this.details)
      ? (this.details as FieldIssue[])
      : [];
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

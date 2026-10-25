// Auth, profile, sessions, import/export: /auth, /users/me, /imports and /exports.
// The session lives in an HttpOnly cookie the browser sends on its own; JS never sees the token.
import type {
  CaptureTokenStatus,
  CreatedCaptureToken,
  ImportReport,
  NotificationSettings,
  Preferences,
  Session,
  User,
} from '../types.ts';
import { download, request, requestData } from './http.ts';

export function getMe(): Promise<User> {
  return requestData('/users/me');
}

export function updateProfile(input: { name?: string; timezone?: string }): Promise<User> {
  return requestData('/users/me', { method: 'PATCH', body: input });
}

export function setPreferences(preferences: Preferences): Promise<User> {
  return requestData('/users/me/preferences', { method: 'PUT', body: preferences });
}

export function setNotifications(notifications: NotificationSettings): Promise<User> {
  return requestData('/users/me/notifications', { method: 'PUT', body: notifications });
}

export function listSessions(): Promise<Session[]> {
  return requestData('/users/me/sessions');
}

export function revokeSession(id: string): Promise<void> {
  return request(`/users/me/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function login(input: { email: string; password: string }): Promise<User> {
  return requestData('/auth/login', { method: 'POST', body: input });
}

export function register(input: {
  name: string;
  email: string;
  password: string;
  timezone: string;
}): Promise<{ message: string }> {
  return requestData('/auth/register', { method: 'POST', body: input });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return requestData('/auth/password/forgot', { method: 'POST', body: { email } });
}

export function resetPassword(input: { token: string; password: string }): Promise<void> {
  return request('/auth/password/reset', { method: 'POST', body: input });
}

export function verifyEmail(token: string): Promise<{ message: string }> {
  return requestData('/auth/verify-email', { method: 'POST', body: { token } });
}

export function resendVerification(): Promise<{ message: string }> {
  return requestData('/auth/verify-email/resend', { method: 'POST' });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return request('/auth/password/change', { method: 'POST', body: input });
}

export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

export function logoutAll(): Promise<void> {
  return request('/auth/logout-all', { method: 'POST' });
}

export function deleteAccount(password: string): Promise<void> {
  return request('/users/me', { method: 'DELETE', body: { password } });
}

export function importApplicationsCsv(fileName: string, text: string): Promise<ImportReport> {
  return requestData('/imports/applications', { method: 'POST', query: { fileName }, csv: text });
}

export function downloadImportTemplate(): Promise<void> {
  return download('/imports/applications/template', {}, 'applications-template.csv');
}

export function exportApplicationsCsv(): Promise<void> {
  return download('/exports/applications.csv', { archived: 'include' }, 'applications.csv');
}

export function exportAccountJson(): Promise<void> {
  return download('/exports/account.json', {}, 'mission-control-export.json');
}

// --- Gmail capture (/capture/token): the token the Gmail script authenticates with ----------

export function getCaptureToken(): Promise<CaptureTokenStatus> {
  return requestData('/capture/token');
}

// Shown once; replaces (and so disconnects) any previous token.
export function createCaptureToken(): Promise<CreatedCaptureToken> {
  return requestData('/capture/token', { method: 'POST' });
}

export function revokeCaptureToken(): Promise<void> {
  return request('/capture/token', { method: 'DELETE' });
}

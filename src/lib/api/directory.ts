// Companies and contacts: /api/v1/companies and /api/v1/contacts.
import type {
  Activity,
  Company,
  CompanyDetail,
  CompanyListItem,
  Contact,
  CursorPage,
  Page,
} from '../types.ts';
import { request, requestData } from './http.ts';

export type CompanyInput = Pick<Company, 'name'> &
  Partial<Pick<Company, 'website' | 'industry' | 'location' | 'notes'>>;

const company = (id: string) => `/companies/${encodeURIComponent(id)}`;
const contact = (id: string) => `/contacts/${encodeURIComponent(id)}`;

export function listCompanies(
  options: { q?: string; page?: number; limit?: number } = {},
): Promise<Page<CompanyListItem>> {
  return request('/companies', { query: { limit: 50, ...options } });
}

export function getCompany(id: string): Promise<CompanyDetail> {
  return requestData(company(id));
}

export function createCompany(input: CompanyInput): Promise<Company> {
  return requestData('/companies', { method: 'POST', body: input });
}

export function updateCompany(id: string, input: Partial<CompanyInput>): Promise<Company> {
  return requestData(company(id), { method: 'PATCH', body: input });
}

export function deleteCompany(id: string): Promise<void> {
  return request(company(id), { method: 'DELETE' });
}

export type ContactInput = Pick<Contact, 'name'> &
  Partial<Pick<Contact, 'companyId' | 'title' | 'email' | 'phone' | 'linkedinUrl' | 'notes'>>;

export function listContacts(
  options: { q?: string; companyId?: string; page?: number; limit?: number } = {},
): Promise<Page<Contact>> {
  return request('/contacts', { query: { limit: 50, ...options } });
}

export function getContact(id: string): Promise<Contact> {
  return requestData(contact(id));
}

export function createContact(input: ContactInput): Promise<Contact> {
  return requestData('/contacts', { method: 'POST', body: input });
}

export function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  return requestData(contact(id), { method: 'PATCH', body: input });
}

export function deleteContact(id: string): Promise<void> {
  return request(contact(id), { method: 'DELETE' });
}

export function listInteractions(contactId: string): Promise<CursorPage<Activity>> {
  return request(`${contact(contactId)}/interactions`, { query: { limit: 50 } });
}

export function addInteraction(
  contactId: string,
  input: { channel: string; summary: string; applicationId?: string | null },
): Promise<Activity> {
  const { applicationId, ...rest } = input;
  return requestData(`${contact(contactId)}/interactions`, {
    method: 'POST',
    body: applicationId ? { ...rest, applicationId } : rest,
  });
}

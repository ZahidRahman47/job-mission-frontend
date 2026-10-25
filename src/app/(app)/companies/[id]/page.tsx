import type { Metadata } from 'next';
import { CompanyDetailView } from '@/features/directory/companies-view';

export const metadata: Metadata = { title: 'Company' };

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyDetailView id={id} />;
}

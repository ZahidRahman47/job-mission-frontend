import type { Metadata } from 'next';
import { ApplicationDetailView } from '@/features/applications/detail/detail-view';

export const metadata: Metadata = { title: 'Application' };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}

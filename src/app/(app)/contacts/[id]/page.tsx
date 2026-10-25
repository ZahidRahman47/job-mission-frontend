import type { Metadata } from 'next';
import { ContactDetailView } from '@/features/directory/contacts-view';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactDetailView id={id} />;
}

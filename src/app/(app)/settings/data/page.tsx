import type { Metadata } from 'next';
import { DataSettings } from '@/features/settings/settings-views';

export const metadata: Metadata = { title: 'Your data' };

export default function Page() {
  return <DataSettings />;
}

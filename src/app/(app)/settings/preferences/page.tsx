import type { Metadata } from 'next';
import { PreferenceSettings } from '@/features/settings/settings-views';

export const metadata: Metadata = { title: 'Job search' };

export default function Page() {
  return <PreferenceSettings />;
}

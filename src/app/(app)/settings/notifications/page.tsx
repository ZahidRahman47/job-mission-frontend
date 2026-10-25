import type { Metadata } from 'next';
import { NotificationSettings } from '@/features/settings/settings-views';

export const metadata: Metadata = { title: 'Notifications' };

export default function Page() {
  return <NotificationSettings />;
}

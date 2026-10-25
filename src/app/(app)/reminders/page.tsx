import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RemindersView } from '@/features/reminders/reminders-view';

export const metadata: Metadata = { title: 'Reminders' };

export default function RemindersPage() {
  return (
    <Suspense>
      <RemindersView />
    </Suspense>
  );
}

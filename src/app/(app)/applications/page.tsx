import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/features/applications/applications-table';
import { ApplicationsView } from '@/features/applications/applications-view';

export const metadata: Metadata = { title: 'Applications' };

// The view reads filters from the URL (useSearchParams), so it renders inside Suspense.
export default function ApplicationsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <ApplicationsView />
    </Suspense>
  );
}

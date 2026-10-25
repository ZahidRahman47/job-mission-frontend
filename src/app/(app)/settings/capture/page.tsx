import type { Metadata } from 'next';
import { CaptureSettings } from '@/features/settings/capture-settings';

export const metadata: Metadata = { title: 'Gmail capture' };

export default function Page() {
  return <CaptureSettings />;
}

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/primitives';
import { SettingsTabs } from './tabs';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <SettingsTabs />
      <div className="flex flex-col gap-6">{children}</div>
    </>
  );
}

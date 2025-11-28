'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';

export default function AppearanceSettingsContent() {
  return (
    <PermissionGate feature="settings">
      <AppearanceSettingsInner />
    </PermissionGate>
  );
}

function AppearanceSettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  if (!subdomain) {
    router.push('/tenant/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tampilan"
        description="Tema dan style landing page"
      />
      <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />
    </div>
  );
}

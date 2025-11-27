'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import LandingPageStyleSettings from '@/components/tenant/LandingPageStyleSettings';
import { PermissionGate } from '@/components/tenant/permission-gate';

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
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/tenant/admin/settings?subdomain=${subdomain}`)}
          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#35365f] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e4f6c] transition-colors"
        >
          <i className='bx bx-arrow-back text-xl text-txt-secondary dark:text-[#b2b2c4]'></i>
        </button>
        <div className="w-10 h-10 rounded-lg bg-primary-light dark:bg-[#35365f] flex items-center justify-center">
          <i className='bx bx-palette text-xl text-primary dark:text-[#a5a7ff]'></i>
        </div>
        <div>
          <h4 className="text-xl font-bold text-txt-primary dark:text-[#d5d5e2]">Tampilan</h4>
          <p className="text-sm text-txt-muted dark:text-[#7e7f96]">Tema dan style landing page</p>
        </div>
      </div>

      {/* Content */}
      <LandingPageStyleSettings subdomain={subdomain} currentTemplate="modern" />
    </div>
  );
}

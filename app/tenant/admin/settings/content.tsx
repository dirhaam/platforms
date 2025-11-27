'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionGate } from '@/components/tenant/permission-gate';

const RedirectLoader = () => (
  <div className="flex items-center justify-center py-20">
    <i className='bx bx-loader-alt text-2xl text-primary dark:text-[#a5a7ff] animate-spin'></i>
  </div>
);

function SettingsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    router.replace(`/tenant/admin/settings/appearance?${params.toString()}`);
  }, [router, searchParams]);

  return <RedirectLoader />;
}

export default function SettingsPageContent() {
  return (
    <PermissionGate feature="settings">
      <Suspense fallback={<RedirectLoader />}>
        <SettingsRedirect />
      </Suspense>
    </PermissionGate>
  );
}

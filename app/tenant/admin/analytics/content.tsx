'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPageHeader } from '@/components/tenant/AdminPageHeader';
import { TenantAnalyticsDashboard } from '@/components/analytics/TenantAnalyticsDashboard';
import { PermissionGate } from '@/components/tenant/permission-gate';

export default function AnalyticsPageContent() {
  return (
    <PermissionGate feature="analytics">
      <AnalyticsPageInner />
    </PermissionGate>
  );
}

function AnalyticsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomain = searchParams?.get('subdomain');

  useEffect(() => {
    if (!subdomain) {
      router.push('/tenant/login');
    }
  }, [subdomain, router]);

  if (!subdomain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        description="View your business performance and insights"
      />

      <TenantAnalyticsDashboard tenantId={subdomain} />
    </div>
  );
}

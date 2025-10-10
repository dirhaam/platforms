import { redirect } from 'next/navigation';
import { getTenantSession } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';

export default async function TenantAnalyticsPage() {
  const session = await getTenantSession();
  
  if (!session) {
    redirect('/login');
  }

  // Check if user has permission to view analytics
  if (!RBAC.hasPermission(session, 'view_analytics')) {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto py-6">
      <AnalyticsPage tenantId={session.tenantId} />
    </div>
  );
}
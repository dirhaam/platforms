export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { PlatformAnalyticsDashboard } from '@/components/analytics/PlatformAnalyticsDashboard';

export default async function PlatformAnalyticsPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600">
          Analytics and insights across all tenants on the platform
        </p>
      </div>
      
      <PlatformAnalyticsDashboard />
    </div>
  );
}
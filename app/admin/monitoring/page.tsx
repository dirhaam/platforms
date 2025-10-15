export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { SystemMonitoring } from '@/components/admin/SystemMonitoring';

export default async function MonitoringPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-600">
          Monitor system health and performance metrics
        </p>
      </div>
      
      <SystemMonitoring />
    </div>
  );
}
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/auth-middleware';
import TenantDashboard from '@/components/dashboard/TenantDashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {session.name}. Here's what's happening with your business today.
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <TenantDashboard session={session} />
      </Suspense>
    </div>
  );
}
export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import TenantDashboardLayout from '@/components/dashboard/TenantDashboardLayout';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication for all admin routes
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  // Use different layouts based on user role
  if (session.role === 'superadmin' && session.isSuperAdmin) {
    return (
      <SuperAdminLayout session={session}>
        {children}
      </SuperAdminLayout>
    );
  }

  return (
    <TenantDashboardLayout session={session}>
      {children}
    </TenantDashboardLayout>
  );
}
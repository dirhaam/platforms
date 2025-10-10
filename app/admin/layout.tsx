import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import TenantDashboardLayout from '@/components/dashboard/TenantDashboardLayout';

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

  return (
    <TenantDashboardLayout session={session}>
      {children}
    </TenantDashboardLayout>
  );
}
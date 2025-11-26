export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboard() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  // Fetch initial data server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [tenantsResult, securityLogsResult] = await Promise.all([
    supabase.from('tenants').select('id, subscription_status, subscription_plan'),
    supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const tenants = tenantsResult.data || [];
  const initialData = {
    tenants: {
      total: tenants.length,
      active: tenants.filter(t => t.subscription_status === 'active').length,
      suspended: tenants.filter(t => t.subscription_status === 'suspended').length,
      byPlan: {
        basic: tenants.filter(t => t.subscription_plan === 'basic').length,
        premium: tenants.filter(t => t.subscription_plan === 'premium').length,
        enterprise: tenants.filter(t => t.subscription_plan === 'enterprise').length,
      },
    },
    securityLogs: (securityLogsResult.data || []).map(log => ({
      id: log.id,
      tenantId: log.tenant_id,
      userId: log.user_id,
      action: log.action,
      success: log.success,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      resource: log.resource,
      details: log.details,
      createdAt: log.created_at,
    })),
  };

  return (
    <AdminDashboardClient 
      session={session} 
      initialData={initialData}
    />
  );
}

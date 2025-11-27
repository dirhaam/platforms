export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import { AnalyticsClient } from './analytics-client';

export default async function AnalyticsPage() {
  const session = await getServerSession();

  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch initial data
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    tenantsResult,
    securityLogsResult,
    recentLoginsResult,
    failedLoginsResult,
  ] = await Promise.all([
    // Tenant stats
    supabase.from('tenants').select('id, subscription_status, created_at, last_active_at'),
    // Security logs (last 7 days)
    supabase
      .from('security_audit_logs')
      .select('*')
      .gte('created_at', last7d.toISOString())
      .order('created_at', { ascending: false }),
    // Recent successful logins (24h)
    supabase
      .from('security_audit_logs')
      .select('id')
      .eq('action', 'login')
      .eq('success', true)
      .gte('created_at', last24h.toISOString()),
    // Failed logins (24h)
    supabase
      .from('security_audit_logs')
      .select('id, ip_address, details, created_at')
      .eq('action', 'login')
      .eq('success', false)
      .gte('created_at', last24h.toISOString()),
  ]);

  const tenants = tenantsResult.data || [];
  const securityLogs = securityLogsResult.data || [];
  const recentLogins = recentLoginsResult.data || [];
  const failedLogins = failedLoginsResult.data || [];

  // Calculate metrics
  const activeTenants = tenants.filter(t => 
    t.last_active_at && new Date(t.last_active_at) > last7d
  ).length;

  const newTenantsThisMonth = tenants.filter(t => 
    t.created_at && new Date(t.created_at) > last30d
  ).length;

  // Group logins by hour for chart
  const loginsByHour: Record<string, { success: number; failed: number }> = {};
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const key = hour.toISOString().slice(0, 13);
    loginsByHour[key] = { success: 0, failed: 0 };
  }

  securityLogs.forEach(log => {
    if (log.action === 'login') {
      const key = log.created_at.slice(0, 13);
      if (loginsByHour[key]) {
        if (log.success) {
          loginsByHour[key].success++;
        } else {
          loginsByHour[key].failed++;
        }
      }
    }
  });

  // Group by action type
  const actionCounts: Record<string, number> = {};
  securityLogs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  // Failed login IPs (potential threats)
  const failedLoginIPs: Record<string, number> = {};
  failedLogins.forEach(log => {
    if (log.ip_address) {
      failedLoginIPs[log.ip_address] = (failedLoginIPs[log.ip_address] || 0) + 1;
    }
  });

  const suspiciousIPs = Object.entries(failedLoginIPs)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const initialData = {
    overview: {
      totalTenants: tenants.length,
      activeTenants,
      suspendedTenants: tenants.filter(t => t.subscription_status === 'suspended').length,
      newTenantsThisMonth,
    },
    security: {
      totalLogins24h: recentLogins.length,
      failedLogins24h: failedLogins.length,
      loginsByHour: Object.entries(loginsByHour).map(([hour, data]) => ({
        hour: new Date(hour + ':00:00').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        success: data.success,
        failed: data.failed,
      })),
      actionCounts,
      suspiciousIPs,
    },
    recentLogs: securityLogs.slice(0, 50).map(log => ({
      id: log.id,
      action: log.action,
      success: log.success,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      tenantId: log.tenant_id,
      details: log.details,
      createdAt: log.created_at,
    })),
  };

  return <AnalyticsClient initialData={initialData} />;
}

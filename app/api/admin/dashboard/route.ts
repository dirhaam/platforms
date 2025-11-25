import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all stats in parallel
    const [
      tenantsResult,
      activeTenants,
      suspendedTenants,
      securityLogsResult,
      recentLoginsResult,
      failedLoginsResult,
    ] = await Promise.all([
      // Total tenants
      supabase.from('tenants').select('id, subscription_status, subscription_plan', { count: 'exact' }),
      // Active tenants
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      // Suspended tenants
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('subscription_status', 'suspended'),
      // Recent security logs (last 50)
      supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      // Recent successful logins (last 24h)
      supabase
        .from('security_audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login')
        .eq('success', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      // Failed logins (last 24h)
      supabase
        .from('security_audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'login')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Count by plan
    const tenants = tenantsResult.data || [];
    const planCounts = {
      basic: tenants.filter(t => t.subscription_plan === 'basic').length,
      premium: tenants.filter(t => t.subscription_plan === 'premium').length,
      enterprise: tenants.filter(t => t.subscription_plan === 'enterprise').length,
    };

    // Process security logs
    const securityLogs = (securityLogsResult.data || []).map(log => ({
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
    }));

    // Get login stats
    const loginStats = {
      successful24h: recentLoginsResult.count || 0,
      failed24h: failedLoginsResult.count || 0,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tenants: {
        total: tenantsResult.count || tenants.length,
        active: activeTenants.count || 0,
        suspended: suspendedTenants.count || 0,
        byPlan: planCounts,
      },
      security: {
        loginStats,
        recentLogs: securityLogs.slice(0, 20),
      },
      systemHealth: {
        database: !tenantsResult.error ? 'healthy' : 'degraded',
        api: 'healthy',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

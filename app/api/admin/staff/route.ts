export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';

// GET /api/admin/staff - Get staff members for a tenant
export async function GET(request: NextRequest) {
  try {
    // Get and verify session first
    const session = await TenantAuth.getSessionFromRequest(request);
    
    if (!session) {
      console.log('[GET /api/admin/staff] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!RBAC.hasPermission(session, 'manage_staff')) {
      console.log('[GET /api/admin/staff] Forbidden - insufficient permissions', {
        userId: session.userId,
        role: session.role,
        permissions: session.permissions
      });
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const queryTenantId = searchParams.get('tenantId');
    const tenantIdentifier = headerTenantId ?? queryTenantId ?? session.tenantId;

    console.log('[GET /api/admin/staff] Fetching staff', {
      sessionTenantId: session.tenantId,
      resolved: tenantIdentifier
    });

    if (!tenantIdentifier) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If tenantId is subdomain (not UUID), lookup the actual tenant ID
    let resolvedTenantId = tenantIdentifier;
    const isUUID = tenantIdentifier.length === 36;

    console.log('[GET /api/admin/staff] Is UUID:', isUUID, 'Identifier:', tenantIdentifier);

    if (!isUUID) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantIdentifier.toLowerCase())
        .single();

      console.log('[GET /api/admin/staff] Tenant lookup result:', { tenant, tenantError });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found', details: { subdomain: tenantIdentifier } }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    console.log('[GET /api/admin/staff] Resolved tenant ID:', resolvedTenantId);

    // Get staff members
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('tenant_id', resolvedTenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }

    return NextResponse.json({ staff: staff || [] });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

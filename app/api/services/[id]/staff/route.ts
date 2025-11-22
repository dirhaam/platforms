export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';

// Helper function to resolve tenant ID
async function resolveTenantId(tenantIdentifier: string, supabase: any): Promise<string | null> {
  const isUUID = tenantIdentifier.length === 36;
  
  if (isUUID) {
    return tenantIdentifier;
  }
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', tenantIdentifier)
    .single();
  
  return tenant?.id || null;
}

// GET /api/services/[id]/staff - Get staff assigned to service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get staff assigned to this service
    const { data: staffServices, error } = await supabase
      .from('staff_services')
      .select(`
        id,
        staff_id,
        can_perform,
        staff!inner(
          id,
          tenant_id,
          name,
          email,
          phone,
          role,
          is_active
        )
      `)
      .eq('service_id', id)
      .eq('staff.tenant_id', resolvedTenantId);

    if (error) {
      console.error('Error fetching service staff:', error);
      return NextResponse.json({ error: 'Failed to fetch service staff' }, { status: 500 });
    }

    return NextResponse.json({
      staff: staffServices?.map((ss: any) => ({
        ...ss.staff,
        canPerform: ss.can_perform,
        staffServiceId: ss.id
      })) || []
    });
  } catch (error) {
    console.error('Error fetching service staff:', error);
    return NextResponse.json({ error: 'Failed to fetch service staff' }, { status: 500 });
  }
}

// POST /api/services/[id]/staff - Add staff to service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { staffId, canPerform = true } = body;

    // Verify session and permission
    const session = await TenantAuth.getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RBAC.hasPermission(session, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify staff exists and belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, is_active')
      .eq('id', staffId)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (!staff.is_active) {
      return NextResponse.json({ error: 'Staff member is inactive' }, { status: 400 });
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('staff_services')
      .select('id')
      .eq('staff_id', staffId)
      .eq('service_id', id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Staff already assigned to this service' }, { status: 400 });
    }

    // Add staff to service
    const { data: staffService, error: insertError } = await supabase
      .from('staff_services')
      .insert({
        staff_id: staffId,
        service_id: id,
        can_perform: canPerform
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding staff to service:', insertError);
      return NextResponse.json({ error: 'Failed to add staff to service' }, { status: 500 });
    }

    return NextResponse.json(staffService, { status: 201 });
  } catch (error) {
    console.error('Error adding staff to service:', error);
    return NextResponse.json({ error: 'Failed to add staff to service' }, { status: 500 });
  }
}

// DELETE /api/services/[id]/staff/[staffId] - Remove staff from service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    // Verify session and permission
    const session = await TenantAuth.getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RBAC.hasPermission(session, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify service exists
    const { data: service } = await supabase
      .from('services')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify staff exists
    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('tenant_id', resolvedTenantId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Remove staff from service
    const { error: deleteError } = await supabase
      .from('staff_services')
      .delete()
      .eq('staff_id', staffId)
      .eq('service_id', id);

    if (deleteError) {
      console.error('Error removing staff from service:', deleteError);
      return NextResponse.json({ error: 'Failed to remove staff from service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing staff from service:', error);
    return NextResponse.json({ error: 'Failed to remove staff from service' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TenantAuth, getTenantSession } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/services/[id]/staff - Get staff members who can perform this service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { id: serviceId } = await params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Get staff services mapping for this service
    const { data: staffServices, error: servicesError } = await supabase
      .from('staff_services')
      .select('id, staff_id, can_perform, is_specialist, notes')
      .eq('service_id', serviceId)
      .eq('can_perform', true);

    if (servicesError) {
      console.error('Error fetching staff services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      );
    }

    if (!staffServices || staffServices.length === 0) {
      return NextResponse.json({
        serviceId,
        staff: [],
        total: 0
      });
    }

    // Get staff details for these staff members
    const staffIds = (staffServices || []).map((ss: any) => ss.staff_id);

    let staffQuery = supabase
      .from('staff')
      .select('id, tenant_id, name, email, phone, role, is_active, created_at')
      .eq('tenant_id', tenantId)
      .in('id', staffIds);

    if (!includeInactive) {
      staffQuery = staffQuery.eq('is_active', true);
    }

    const { data: staffList, error: staffError } = await staffQuery;

    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return NextResponse.json(
        { error: 'Failed to fetch staff details' },
        { status: 500 }
      );
    }

    // Merge staff details with service mapping
    const staffMap = new Map((staffList || []).map((s: any) => [s.id, s]));
    const staff = (staffServices || [])
      .map((ss: any) => {
        const staffMember = staffMap.get(ss.staff_id);
        if (!staffMember) return null;
        return {
          ...staffMember,
          staffServiceId: ss.id,
          canPerform: ss.can_perform,
          isSpecialist: ss.is_specialist,
          notes: ss.notes
        };
      })
      .filter((s: any) => s !== null);

    return NextResponse.json({
      serviceId,
      staff,
      total: staff.length
    });
  } catch (error) {
    console.error('Error in service staff endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/services/[id]/staff - Assign staff to service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Get session to check permissions
    const session = await getTenantSession(request);

    if (!session || !RBAC.hasPermission(session, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const { id: serviceId } = await params;
    const body = await request.json();
    const {
      staffId,
      canPerform = true,
      isSpecialist = false,
      notes
    } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId is required' },
        { status: 400 }
      );
    }

    // Verify service exists and belongs to tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify staff exists and belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('tenant_id', tenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Create or update staff-service mapping
    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from('staff_services')
      .select('id')
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
      .maybeSingle();

    let data, error;

    if (existingMapping) {
      // Update existing mapping
      const result = await supabase
        .from('staff_services')
        .update({
          can_perform: canPerform,
          is_specialist: isSpecialist,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMapping.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Create new mapping
      const result = await supabase
        .from('staff_services')
        .insert({
          staff_id: staffId,
          service_id: serviceId,
          can_perform: canPerform,
          is_specialist: isSpecialist,
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error assigning staff to service:', error);
      return NextResponse.json(
        { error: 'Failed to assign staff to service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staffService: data
    });
  } catch (error) {
    console.error('Error in assign staff endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/services/[id]/staff/[staffId] - Remove staff from service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Get session to check permissions
    const session = await getTenantSession(request);

    if (!session || !RBAC.hasPermission(session, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: serviceId, staffId } = await params;

    if (!serviceId || !staffId) {
      return NextResponse.json({ error: 'Service ID and Staff ID required' }, { status: 400 });
    }

    // Verify service exists and belongs to tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify staff exists and belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('id', staffId)
      .eq('tenant_id', tenantId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Delete the staff-service mapping
    const { error: deleteError } = await supabase
      .from('staff_services')
      .delete()
      .eq('staff_id', staffId)
      .eq('service_id', serviceId);

    if (deleteError) {
      console.error('Error removing staff from service:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove staff from service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Staff member removed from service`
    });
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]/staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

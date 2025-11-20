export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const tenantId = request.headers.get('x-tenant-id');
    
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
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
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
    const { data, error } = await supabase
      .from('staff_services')
      .upsert({
        staff_id: staffId,
        service_id: serviceId,
        can_perform: canPerform,
        is_specialist: isSpecialist,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'staff_id,service_id'
      })
      .select()
      .single();

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

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const serviceId = params.id;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Get staff members who can perform this service
    const query = supabase
      .from('staff_services')
      .select(`
        id,
        staff_id,
        can_perform,
        is_specialist,
        notes,
        staff:staff_id(
          id,
          tenant_id,
          name,
          email,
          phone,
          role,
          is_active,
          created_at
        )
      `)
      .eq('service_id', serviceId)
      .eq('staff:staff_id.tenant_id', tenantId)
      .eq('can_perform', true);

    if (!includeInactive) {
      query.eq('staff:staff_id.is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching service staff:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff' },
        { status: 500 }
      );
    }

    // Format response
    const staff = (data || []).map(record => ({
      ...record.staff,
      staffServiceId: record.id,
      canPerform: record.can_perform,
      isSpecialist: record.is_specialist,
      notes: record.notes
    }));

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const serviceId = params.id;
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

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// POST /api/services/[id]/home-visit-config - Update home visit configuration
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

    // Validate input
    const {
      serviceType = 'on_premise', // 'on_premise', 'home_visit', 'both'
      homeVisitFullDayBooking = false,
      homeVisitMinBufferMinutes = 30,
      dailyQuotaPerStaff,
      requiresStaffAssignment = false
    } = body;

    if (!['on_premise', 'home_visit', 'both'].includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid serviceType. Must be on_premise, home_visit, or both' },
        { status: 400 }
      );
    }

    // Update service with home visit configuration
    const { data, error } = await supabase
      .from('services')
      .update({
        service_type: serviceType,
        home_visit_full_day_booking: homeVisitFullDayBooking,
        home_visit_min_buffer_minutes: homeVisitMinBufferMinutes,
        daily_quota_per_staff: dailyQuotaPerStaff || null,
        requires_staff_assignment: requiresStaffAssignment,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating home visit config:', error);
      return NextResponse.json(
        { error: 'Failed to update home visit configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service: data
    });
  } catch (error) {
    console.error('Error in home-visit-config endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/services/[id]/home-visit-config - Get home visit configuration
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

    // Get service with home visit config
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      console.error('Error fetching service:', error);
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      serviceType: data.service_type,
      homeVisitFullDayBooking: data.home_visit_full_day_booking,
      homeVisitMinBufferMinutes: data.home_visit_min_buffer_minutes,
      dailyQuotaPerStaff: data.daily_quota_per_staff,
      requiresStaffAssignment: data.requires_staff_assignment
    });
  } catch (error) {
    console.error('Error in home-visit-config GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

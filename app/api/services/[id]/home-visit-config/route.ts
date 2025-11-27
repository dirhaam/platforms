export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

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

// POST /api/services/[id]/home-visit-config - Update home visit configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { id: serviceId } = await params;
    const body = await request.json();

    // Validate input
    const {
      serviceType = 'on_premise', // 'on_premise', 'home_visit', 'both'
      homeVisitFullDayBooking = false,
      homeVisitMinBufferMinutes = 30,
      dailyQuotaPerStaff,
      requiresStaffAssignment = false,
      // Simplified quota-based settings
      dailyHomeVisitQuota = 3,
      homeVisitTimeSlots = ['09:00', '13:00', '16:00']
    } = body;

    if (!['on_premise', 'home_visit', 'both'].includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid serviceType. Must be on_premise, home_visit, or both' },
        { status: 400 }
      );
    }

    // Determine if home visit is available based on service type
    const homeVisitAvailable = serviceType === 'home_visit' || serviceType === 'both';

    // Update service with home visit configuration
    const { data, error } = await supabase
      .from('services')
      .update({
        service_type: serviceType,
        home_visit_available: homeVisitAvailable, // Sync with service_type
        home_visit_full_day_booking: homeVisitFullDayBooking,
        home_visit_min_buffer_minutes: homeVisitMinBufferMinutes,
        daily_quota_per_staff: dailyQuotaPerStaff || null,
        requires_staff_assignment: requiresStaffAssignment,
        // Simplified quota-based settings
        daily_home_visit_quota: dailyHomeVisitQuota,
        home_visit_time_slots: homeVisitTimeSlots,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .eq('tenant_id', resolvedTenantId)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const headerTenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    
    if (!headerTenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const resolvedTenantId = await resolveTenantId(headerTenantId, supabase);
    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { id: serviceId } = await params;

    // Get service with home visit config
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('tenant_id', resolvedTenantId)
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
      requiresStaffAssignment: data.requires_staff_assignment,
      // Simplified quota-based settings
      dailyHomeVisitQuota: data.daily_home_visit_quota || 3,
      homeVisitTimeSlots: data.home_visit_time_slots || ['09:00', '13:00', '16:00']
    });
  } catch (error) {
    console.error('Error in home-visit-config GET endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StaffAvailabilityService } from '@/lib/booking/staff-availability-service';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/bookings/[id]/available-staff - Get available staff for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const { id: bookingId } = await params;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Get tenant ID from subdomain
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantId.toLowerCase())
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        service_id,
        scheduled_at,
        duration,
        is_home_visit,
        services!bookings_service_id_fkey(id, duration, home_visit_min_buffer_minutes)
      `)
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking.is_home_visit) {
      return NextResponse.json({ error: 'Not a home visit booking' }, { status: 400 });
    }

    // Get available staff using StaffAvailabilityService
    const scheduledAt = new Date(booking.scheduled_at);
    const service = (booking.services as unknown) as { id: string; duration: number; home_visit_min_buffer_minutes?: number } | null;
    const duration = service?.duration || booking.duration || 60;
    const bufferMinutes = service?.home_visit_min_buffer_minutes || 30;

    const staffAvailability = await StaffAvailabilityService.getAllAvailableStaffForHomeVisit(
      tenant.id,
      booking.service_id,
      scheduledAt,
      duration,
      bufferMinutes
    );

    // Transform response
    const staff = staffAvailability.map((s) => ({
      id: s.staff.id,
      name: s.staff.name,
      email: s.staff.email,
      homeVisitCount: s.homeVisitCount,
      maxHomeVisits: s.maxHomeVisits,
      isAvailable: s.isAvailable,
      unavailableReason: s.unavailableReason,
    }));

    // Sort: available first, then by home visit count (ascending)
    staff.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return a.homeVisitCount - b.homeVisitCount;
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error in available-staff endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// POST /api/bookings/[id]/assign-staff - Assign or reassign staff to a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const { id: bookingId } = await params;
    const body = await request.json();
    const { staffId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
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

    // Verify booking exists and belongs to tenant
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, is_home_visit, status, staff_id')
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking.is_home_visit) {
      return NextResponse.json({ error: 'Not a home visit booking' }, { status: 400 });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot reassign completed or cancelled booking' }, { status: 400 });
    }

    // Verify staff exists and belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, is_active')
      .eq('id', staffId)
      .eq('tenant_id', tenant.id)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (!staff.is_active) {
      return NextResponse.json({ error: 'Staff is not active' }, { status: 400 });
    }

    // Update booking with new staff
    const previousStaffId = booking.staff_id;
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        staff_id: staffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to assign staff' }, { status: 500 });
    }

    // Log the assignment change
    console.log(`[assign-staff] Booking ${bookingId}: ${previousStaffId || 'none'} -> ${staffId} (${staff.name})`);

    return NextResponse.json({
      success: true,
      message: previousStaffId 
        ? `Staff berhasil diganti ke ${staff.name}` 
        : `Staff ${staff.name} berhasil di-assign`,
      staffId,
      staffName: staff.name,
    });
  } catch (error) {
    console.error('Error in assign-staff endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

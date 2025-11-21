export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';
import { RBAC } from '@/lib/auth/rbac';
import { TenantAuth } from '@/lib/auth/tenant-auth';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// POST /api/bookings/[id]/assign-staff - Assign staff to booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session to check permissions
    const session = await TenantAuth.getSessionFromRequest(request);

    if (!session || !RBAC.hasPermission(session, 'manage_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { staffId } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify booking exists and belongs to tenant
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, service_id, is_home_visit')
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify staff exists and belongs to tenant
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, is_active')
      .eq('id', staffId)
      .eq('tenant_id', tenant.id)
      .single();

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (!staff.is_active) {
      return NextResponse.json({ error: 'Staff member is inactive' }, { status: 400 });
    }

    // Verify staff is assigned to the service
    const { data: staffService, error: staffServiceError } = await supabase
      .from('staff_services')
      .select('id, can_perform')
      .eq('staff_id', staffId)
      .eq('service_id', booking.service_id)
      .single();

    if (staffServiceError || !staffService || !staffService.can_perform) {
      return NextResponse.json(
        { error: 'Staff member is not assigned to this service' },
        { status: 400 }
      );
    }

    // Update booking with assigned staff
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        assigned_staff_id: staffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (updateError || !updatedBooking) {
      console.error('Error assigning staff to booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign staff to booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `Staff member assigned to booking ${bookingId}`,
    });
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/assign-staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/assign-staff - Unassign staff from booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session to check permissions
    const session = await TenantAuth.getSessionFromRequest(request);

    if (!session || !RBAC.hasPermission(session, 'manage_bookings')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Verify booking exists and belongs to tenant
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, assigned_staff_id')
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking.assigned_staff_id) {
      return NextResponse.json({ error: 'No staff assigned to this booking' }, { status: 400 });
    }

    // Update booking to remove staff assignment
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        assigned_staff_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (updateError || !updatedBooking) {
      console.error('Error unassigning staff from booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to unassign staff from booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `Staff unassigned from booking ${bookingId}`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]/assign-staff:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

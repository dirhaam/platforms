export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/bookings/[id]/available-staff - Get all active staff for assignment
// SIMPLIFIED: No schedule checking, just return all active staff
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

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, is_home_visit')
      .eq('id', bookingId)
      .eq('tenant_id', tenant.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get all active staff - SIMPLIFIED, no schedule/availability check
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('id, name, email, role')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name');

    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }

    // Transform response - all staff are available
    const staff = (staffList || []).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      isAvailable: true,
    }));

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error in available-staff endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

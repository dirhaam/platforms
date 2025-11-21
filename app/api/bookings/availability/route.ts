export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { createClient } from '@supabase/supabase-js';

// GET /api/bookings/availability - Get available time slots for a service on a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const queryTenantId = searchParams.get('tenantId');
    const tenantIdentifier = headerTenantId ?? queryTenantId;

    if (!tenantIdentifier) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // If tenantId is subdomain (not UUID), lookup the actual tenant ID
    // UUIDs are always 36 chars long (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    let resolvedTenantId = tenantIdentifier;
    const isUUID = resolvedTenantId.length === 36;

    if (!isUUID) {
      // It's a subdomain, lookup the UUID
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', resolvedTenantId)
        .single();

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }
      resolvedTenantId = tenant.id;
    }

    // Get query parameters
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : undefined;
    const staffId = searchParams.get('staffId'); // Optional: filter by specific staff
    const useStaffFiltering = searchParams.get('useStaffFiltering') === 'true'; // Optional: enable new staff-aware logic

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'serviceId and date are required' },
        { status: 400 }
      );
    }

    // Get availability
    let availability;
    if (useStaffFiltering || staffId) {
      // Use new staff-aware availability logic
      availability = await BookingService.getAvailabilityWithStaff(
        resolvedTenantId,
        serviceId,
        date,
        staffId || undefined
      );
    } else {
      // Use legacy availability logic
      availability = await BookingService.getAvailability(resolvedTenantId, {
        serviceId,
        date,
        duration
      });
    }

    if (!availability) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

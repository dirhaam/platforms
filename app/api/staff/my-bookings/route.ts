export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/staff/my-bookings - Get bookings for logged in staff
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // Optional: filter by date (YYYY-MM-DD)
    const status = searchParams.get('status'); // Optional: filter by status

    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-auth');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse session
    let session;
    try {
      if (sessionCookie.value.startsWith('inline.')) {
        session = JSON.parse(atob(sessionCookie.value.replace('inline.', '')));
      } else {
        return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const staffId = session.userId;
    const sessionTenantId = session.tenantId;

    // Verify tenant matches
    if (tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', tenantId.toLowerCase())
        .single();

      if (tenant && tenant.id !== sessionTenantId) {
        return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 });
      }
    }

    // Check if user wants to see all bookings or just assigned ones
    const showAll = searchParams.get('all') === 'true';
    
    // Build query - simplified without foreign key joins
    let query = supabase
      .from('bookings')
      .select(`
        id,
        scheduled_at,
        duration,
        status,
        notes,
        is_home_visit,
        home_visit_address,
        home_visit_latitude,
        home_visit_longitude,
        staff_id,
        customer_id,
        service_id
      `)
      .eq('tenant_id', sessionTenantId)
      .order('scheduled_at', { ascending: true });
    
    // Filter by staff_id only if not showing all
    if (!showAll) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    // Apply date filter - single date or date range (using string comparison)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (date) {
      // Single date filter
      query = query
        .gte('scheduled_at', `${date}T00:00:00`)
        .lte('scheduled_at', `${date}T23:59:59`);
    } else if (startDate && endDate) {
      // Date range filter
      query = query
        .gte('scheduled_at', `${startDate}T00:00:00`)
        .lte('scheduled_at', `${endDate}T23:59:59`);
    }

    // Apply status filter
    if (status) {
      if (status === 'active') {
        query = query.in('status', ['pending', 'confirmed']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching staff bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Fetch related data in parallel
    const bookingsData = data || [];
    const customerIds = [...new Set(bookingsData.map((b: any) => b.customer_id).filter(Boolean))];
    const serviceIds = [...new Set(bookingsData.map((b: any) => b.service_id).filter(Boolean))];
    
    let customerMap: Record<string, any> = {};
    let serviceMap: Record<string, any> = {};
    
    try {
      const [customersResult, servicesResult] = await Promise.all([
        customerIds.length > 0 
          ? supabase.from('customers').select('id, name, phone, email').in('id', customerIds)
          : Promise.resolve({ data: [] }),
        serviceIds.length > 0 
          ? supabase.from('services').select('id, name').in('id', serviceIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (customersResult.data) {
        customerMap = Object.fromEntries(customersResult.data.map((c: any) => [c.id, c]));
      }
      if (servicesResult.data) {
        serviceMap = Object.fromEntries(servicesResult.data.map((s: any) => [s.id, s]));
      }
    } catch (relatedError) {
      console.error('Error fetching related data:', relatedError);
    }

    // Transform data
    const bookings = bookingsData.map((booking: any) => {
      const customer = customerMap[booking.customer_id];
      const service = serviceMap[booking.service_id];
      
      return {
        id: booking.id,
        scheduledAt: booking.scheduled_at,
        duration: booking.duration,
        status: booking.status,
        notes: booking.notes,
        isHomeVisit: booking.is_home_visit,
        homeVisitAddress: booking.home_visit_address,
        homeVisitLatitude: booking.home_visit_latitude,
        homeVisitLongitude: booking.home_visit_longitude,
        staffId: booking.staff_id,
        customerId: booking.customer_id,
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || '',
        customerEmail: customer?.email || '',
        serviceId: booking.service_id,
        serviceName: service?.name || 'Unknown Service',
      };
    });

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error in staff my-bookings endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

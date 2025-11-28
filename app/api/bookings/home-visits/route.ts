export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/bookings/home-visits - Get all home visit bookings for a tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const assignment = searchParams.get('assignment');
    const tenantHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');

    if (!tenantHeader) {
      return NextResponse.json({ error: 'Tenant ID required', bookings: [], stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } }, { status: 200 });
    }

    // Resolve tenant from subdomain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantHeader.toLowerCase())
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantHeader, tenantError);
      return NextResponse.json({ error: 'Tenant not found', bookings: [], stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } }, { status: 200 });
    }

    // Build query - simplified without explicit foreign key hints
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
        created_at,
        customer_id,
        service_id
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_home_visit', true)
      .order('scheduled_at', { ascending: true });

    // Apply date filter using string comparison (more reliable)
    if (date) {
      query = query
        .gte('scheduled_at', `${date}T00:00:00`)
        .lte('scheduled_at', `${date}T23:59:59`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['pending', 'confirmed']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching home visit bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Get related data (customers, services, staff) separately
    const bookingsData = data || [];
    const customerIds = [...new Set(bookingsData.map((b: any) => b.customer_id).filter(Boolean))];
    const serviceIds = [...new Set(bookingsData.map((b: any) => b.service_id).filter(Boolean))];
    const staffIds = [...new Set(bookingsData.filter((b: any) => b.staff_id).map((b: any) => b.staff_id))];
    
    let customerMap: Record<string, any> = {};
    let serviceMap: Record<string, any> = {};
    let staffMap: Record<string, string> = {};
    
    try {
      // Fetch related data in parallel
      const [customersResult, servicesResult, staffResult] = await Promise.all([
        customerIds.length > 0 
          ? supabase.from('customers').select('id, name, phone').in('id', customerIds)
          : Promise.resolve({ data: [] }),
        serviceIds.length > 0 
          ? supabase.from('services').select('id, name, duration').in('id', serviceIds)
          : Promise.resolve({ data: [] }),
        staffIds.length > 0 
          ? supabase.from('staff').select('id, name').in('id', staffIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (customersResult.data) {
        customerMap = Object.fromEntries(customersResult.data.map((c: any) => [c.id, c]));
      }
      if (servicesResult.data) {
        serviceMap = Object.fromEntries(servicesResult.data.map((s: any) => [s.id, s]));
      }
      if (staffResult.data) {
        staffMap = Object.fromEntries(staffResult.data.map((s: any) => [s.id, s.name]));
      }
    } catch (relatedError) {
      console.error('Error fetching related data:', relatedError);
      // Continue with empty maps - will show "Unknown" for names
    }

    // Transform and filter by assignment
    let bookings = bookingsData.map((booking: any) => {
      const customer = customerMap[booking.customer_id];
      const service = serviceMap[booking.service_id];
      
      return {
        id: booking.id,
        scheduledAt: booking.scheduled_at,
        status: booking.status,
        notes: booking.notes,
        homeVisitAddress: booking.home_visit_address,
        homeVisitLatitude: booking.home_visit_latitude,
        homeVisitLongitude: booking.home_visit_longitude,
        staffId: booking.staff_id,
        staffName: booking.staff_id ? (staffMap[booking.staff_id] || null) : null,
        createdAt: booking.created_at,
        customerId: booking.customer_id,
        customerName: customer?.name || 'Unknown',
        customerPhone: customer?.phone || '',
        serviceId: booking.service_id,
        serviceName: service?.name || 'Unknown',
        serviceDuration: service?.duration || booking.duration,
      };
    });

    // Filter by assignment
    if (assignment === 'assigned') {
      bookings = bookings.filter((b: any) => b.staffId);
    } else if (assignment === 'unassigned') {
      bookings = bookings.filter((b: any) => !b.staffId);
    }

    // Calculate stats
    const stats = {
      total: bookings.length,
      assigned: bookings.filter((b: any) => b.staffId).length,
      unassigned: bookings.filter((b: any) => !b.staffId).length,
      completed: bookings.filter((b: any) => b.status === 'completed').length,
    };

    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error('Error in home-visits endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

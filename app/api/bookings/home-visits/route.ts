export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// GET /api/bookings/home-visits - Get all home visit bookings for a tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
    const searchParams = request.nextUrl.searchParams;
    
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const assignment = searchParams.get('assignment');

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

    // Build query - use left join for staff since it may be null
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
        customers!bookings_customer_id_fkey(id, name, phone, email),
        services!bookings_service_id_fkey(id, name, duration)
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_home_visit', true)
      .order('scheduled_at', { ascending: true });

    // Apply date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());
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

    // Get staff names for bookings that have staff_id
    const staffIds = [...new Set((data || []).filter((b: any) => b.staff_id).map((b: any) => b.staff_id))];
    let staffMap: Record<string, string> = {};
    
    if (staffIds.length > 0) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name')
        .in('id', staffIds);
      
      if (staffData) {
        staffMap = Object.fromEntries(staffData.map((s: any) => [s.id, s.name]));
      }
    }

    // Transform and filter by assignment
    let bookings = (data || []).map((booking: any) => ({
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
      customerId: booking.customers?.id,
      customerName: booking.customers?.name || 'Unknown',
      customerPhone: booking.customers?.phone || '',
      serviceId: booking.services?.id,
      serviceName: booking.services?.name || 'Unknown',
      serviceDuration: booking.services?.duration || booking.duration,
    }));

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

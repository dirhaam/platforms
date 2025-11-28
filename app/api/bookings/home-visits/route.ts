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

    // Get related data (customers, services, staff) separately
    const customerIds = [...new Set((data || []).map((b: any) => b.customer_id).filter(Boolean))];
    const serviceIds = [...new Set((data || []).map((b: any) => b.service_id).filter(Boolean))];
    const staffIds = [...new Set((data || []).filter((b: any) => b.staff_id).map((b: any) => b.staff_id))];
    
    let customerMap: Record<string, any> = {};
    let serviceMap: Record<string, any> = {};
    let staffMap: Record<string, string> = {};
    
    // Fetch customers
    if (customerIds.length > 0) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name, phone')
        .in('id', customerIds);
      if (customerData) {
        customerMap = Object.fromEntries(customerData.map((c: any) => [c.id, c]));
      }
    }
    
    // Fetch services
    if (serviceIds.length > 0) {
      const { data: serviceData } = await supabase
        .from('services')
        .select('id, name, duration')
        .in('id', serviceIds);
      if (serviceData) {
        serviceMap = Object.fromEntries(serviceData.map((s: any) => [s.id, s]));
      }
    }
    
    // Fetch staff
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
    let bookings = (data || []).map((booking: any) => {
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

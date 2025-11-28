import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/bookings/home-visits - Get all home visit bookings for a tenant
export async function GET(request: NextRequest) {
  const tenantHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
  
  // Early return if no tenant
  if (!tenantHeader) {
    return NextResponse.json({ 
      bookings: [], 
      stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } 
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const assignment = searchParams.get('assignment');

    // Resolve tenant from subdomain
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantHeader.toLowerCase())
      .single();

    if (!tenant) {
      return NextResponse.json({ 
        bookings: [], 
        stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } 
      });
    }

    // Build and execute query
    let query = supabase
      .from('bookings')
      .select('id, scheduled_at, duration, status, notes, is_home_visit, home_visit_address, home_visit_latitude, home_visit_longitude, staff_id, created_at, customer_id, service_id')
      .eq('tenant_id', tenant.id)
      .eq('is_home_visit', true)
      .order('scheduled_at', { ascending: true })
      .limit(100);

    // Log for debugging
    console.log('[home-visits] Query params:', { tenantId: tenant.id, date, status });

    if (date) {
      query = query.gte('scheduled_at', `${date}T00:00:00`).lte('scheduled_at', `${date}T23:59:59`);
    }

    if (status === 'active') {
      query = query.in('status', ['pending', 'confirmed']);
    } else if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bookingsData, error } = await query;
    
    // Log results
    console.log('[home-visits] Query result:', { count: bookingsData?.length || 0, error: error?.message });

    if (error) {
      console.error('[home-visits] Query error:', error);
      return NextResponse.json({ bookings: [], stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } });
    }

    const rows = bookingsData || [];
    
    // Simple transform without fetching related data (faster)
    let bookings = rows.map((b: any) => ({
      id: b.id,
      scheduledAt: b.scheduled_at,
      status: b.status,
      notes: b.notes,
      homeVisitAddress: b.home_visit_address,
      homeVisitLatitude: b.home_visit_latitude,
      homeVisitLongitude: b.home_visit_longitude,
      staffId: b.staff_id,
      staffName: null,
      createdAt: b.created_at,
      customerId: b.customer_id,
      customerName: 'Customer',
      customerPhone: '',
      serviceId: b.service_id,
      serviceName: 'Service',
      serviceDuration: b.duration || 60,
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
    console.error('[home-visits] Error:', error);
    return NextResponse.json({ bookings: [], stats: { total: 0, assigned: 0, unassigned: 0, completed: 0 } });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { createBookingSchema } from '@/lib/validation/booking-validation';
import { BookingStatus } from '@/types/booking';
import { createClient } from '@supabase/supabase-js';

// GET /api/bookings - Get bookings for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const queryTenantId = searchParams.get('tenantId');
    const tenantIdentifier = headerTenantId ?? queryTenantId;

    if (!tenantIdentifier) {
      console.warn('[bookings GET] No tenantId found in headers or params');
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
    
    // Parse query parameters
    const status = searchParams.get('status') as BookingStatus | null;
    const customerId = searchParams.get('customerId');
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const bookings = await BookingService.getBookings(resolvedTenantId, {
      status: status || undefined,
      customerId: customerId || undefined,
      serviceId: serviceId || undefined,
      startDate,
      endDate,
      limit,
      offset
    });
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const queryTenantId = searchParams.get('tenantId');
    const querySubdomain = searchParams.get('subdomain');
    const tenantIdentifier = headerTenantId ?? queryTenantId ?? querySubdomain;

    if (!tenantIdentifier) {
      console.warn('[bookings POST] No tenantId found in headers or params');
      return NextResponse.json({ error: 'Tenant ID required (via x-tenant-id header, tenantId or subdomain param)' }, { status: 400 });
    }
    
    console.log('[bookings POST] Tenant identifier:', { headerTenantId, queryTenantId, querySubdomain, resolved: tenantIdentifier });

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
    
    const body = await request.json();
    console.log('[bookings POST] Request body:', body);
    
    // Validate request body
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      console.error('[bookings POST] Validation failed:', validation.error.issues);
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    console.log('[bookings POST] Validation passed, creating booking for tenant:', resolvedTenantId);
    
    // Additional validation for home visits
    if (validation.data.isHomeVisit && !validation.data.homeVisitAddress) {
      return NextResponse.json({ 
        error: 'Home visit address is required for home visit bookings' 
      }, { status: 400 });
    }
    
    const result = await BookingService.createBooking(resolvedTenantId, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ booking: result.booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
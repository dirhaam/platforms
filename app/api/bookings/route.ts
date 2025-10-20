export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { createBookingSchema } from '@/lib/validation/booking-validation';
import { BookingStatus } from '@/types/booking';

// GET /api/bookings - Get bookings for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params and body
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      console.warn('[bookings GET] No tenantId found in headers or params');
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    // Parse query parameters
    const status = searchParams.get('status') as BookingStatus | null;
    const customerId = searchParams.get('customerId');
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const bookings = await BookingService.getBookings(tenantId, {
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
    let tenantId = request.headers.get('x-tenant-id');
    
    // Fallback: also check query params
    if (!tenantId) {
      tenantId = searchParams.get('tenantId');
    }
    
    if (!tenantId) {
      console.warn('[bookings POST] No tenantId found in headers or params');
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    // Additional validation for home visits
    if (validation.data.isHomeVisit && !validation.data.homeVisitAddress) {
      return NextResponse.json({ 
        error: 'Home visit address is required for home visit bookings' 
      }, { status: 400 });
    }
    
    const result = await BookingService.createBooking(tenantId, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ booking: result.booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
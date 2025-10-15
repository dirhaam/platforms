export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { availabilityRequestSchema } from '@/lib/validation/booking-validation';

// GET /api/bookings/availability - Get availability for a service on a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : undefined;
    
    // Validate query parameters
    const validation = availabilityRequestSchema.safeParse({
      serviceId,
      date,
      duration
    });
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    const availability = await BookingService.getAvailability(tenantId, validation.data);
    
    if (!availability) {
      return NextResponse.json({ error: 'Service not found or inactive' }, { status: 404 });
    }
    
    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
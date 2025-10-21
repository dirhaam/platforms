export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { updateBookingSchema } from '@/lib/validation/booking-validation';
import { createClient } from '@supabase/supabase-js';

// Helper function to resolve subdomain to tenant UUID
async function resolveTenantId(tenantIdentifier: string): Promise<{ resolved: string | null; error?: string }> {
  if (!tenantIdentifier) {
    return { resolved: null, error: 'Tenant ID required' };
  }

  // If it's already a UUID (36 chars), return as is
  const isUUID = tenantIdentifier.length === 36;
  if (isUUID) {
    return { resolved: tenantIdentifier };
  }

  // It's a subdomain, lookup the UUID
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantIdentifier.toLowerCase())
      .single();

    if (error || !tenant) {
      return { resolved: null, error: 'Tenant not found' };
    }

    return { resolved: tenant.id };
  } catch (error) {
    console.error('Error resolving tenant:', error);
    return { resolved: null, error: 'Failed to resolve tenant' };
  }
}

// GET /api/bookings/[id] - Get a specific booking
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const { resolved, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolved) {
      return NextResponse.json({ error: resolveError || 'Tenant not found' }, { status: 404 });
    }

    const { id } = await context.params;
    const booking = await BookingService.getBooking(resolved, id);
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/bookings/[id] - Update a booking
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { resolved, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolved) {
      return NextResponse.json({ error: resolveError || 'Tenant not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = updateBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    const { id } = await context.params;
    const result = await BookingService.updateBooking(resolved, id, validation.data);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ booking: result.booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] - Delete a booking
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { resolved, error: resolveError } = await resolveTenantId(tenantId);
    if (!resolved) {
      return NextResponse.json({ error: resolveError || 'Tenant not found' }, { status: 404 });
    }
    
    const { id } = await context.params;
    const result = await BookingService.deleteBooking(resolved, id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const queryTenantId = searchParams.get('tenantId');
    const tenantId = headerTenantId || queryTenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get booking details
    const booking = await BookingService.getBooking(tenantId, bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch payment history
    const { data: paymentHistory, error: paymentError } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('tenant_id', tenantId)
      .order('paid_at', { ascending: true });

    if (paymentError) {
      console.error('[bookings/{id}/details] Error fetching payments:', paymentError);
    }

    // Map payment history to camelCase
    const mappedPayments = (paymentHistory || []).map((p: any) => ({
      id: p.id,
      bookingId: p.booking_id,
      tenantId: p.tenant_id,
      paymentAmount: p.payment_amount,
      paymentMethod: p.payment_method,
      paymentReference: p.payment_reference,
      notes: p.notes,
      paidAt: p.paid_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    console.log('[bookings/{id}/details] Booking with payment history:', {
      bookingId,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      paymentCount: mappedPayments.length
    });

    return NextResponse.json({
      success: true,
      booking,
      payments: mappedPayments
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

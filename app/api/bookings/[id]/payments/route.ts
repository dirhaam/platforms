import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { tenantId, paymentAmount, paymentMethod, paymentReference, notes } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Record additional payment
    const result = await BookingService.recordPayment(
      tenantId,
      bookingId,
      paymentAmount,
      paymentMethod as 'cash' | 'card' | 'transfer' | 'qris',
      paymentReference,
      notes
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking
    });
  } catch (error) {
    console.error('Error recording booking payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get booking
    const booking = await BookingService.getBooking(tenantId, bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch payment history from booking_payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('tenant_id', tenantId)
      .order('paid_at', { ascending: true });

    if (paymentsError) {
      console.error('[GET /api/bookings/{id}/payments] ❌ Error fetching payments:', {
        bookingId,
        tenantId,
        error: paymentsError.message,
        code: paymentsError.code,
        details: paymentsError.details
      });
    } else {
      console.log('[GET /api/bookings/{id}/payments] ✅ Payment history fetched:', {
        bookingId,
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        paymentCount: payments?.length || 0,
        payments: payments?.map(p => ({
          amount: p.payment_amount,
          method: p.payment_method,
          notes: p.notes,
          date: p.paid_at
        })) || []
      });
    }

    return NextResponse.json({
      success: true,
      booking,
      payments: payments || []
    });
  } catch (error) {
    console.error('Error fetching booking payment history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

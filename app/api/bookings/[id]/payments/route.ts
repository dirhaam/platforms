import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/booking/booking-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const bookingId = params.id;
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
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
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

    // Get booking with payment history
    const booking = await BookingService.getBookingById(tenantId, bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking
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

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    console.log('[GET /api/bookings/{id}/history] 📋 Fetching booking history:', {
      bookingId,
      tenantId: tenant.id,
      limit
    });

    const history = await BookingHistoryService.getBookingHistory(
      tenant.id,
      bookingId,
      limit
    );

    console.log('[GET /api/bookings/{id}/history] ✅ History fetched:', {
      bookingId,
      eventCount: history.length
    });

    return NextResponse.json({
      success: true,
      bookingId,
      history,
      count: history.length
    });
  } catch (error) {
    let errorMessage = 'Failed to fetch booking history';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    console.error('[GET /api/bookings/{id}/history] ❌ Error:', {
      message: errorMessage,
      details: errorDetails,
      error
    });

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

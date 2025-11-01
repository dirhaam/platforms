export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { BookingHistoryService } from '@/lib/booking/booking-history-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, description, oldValues, newValues, metadata } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    console.log('[POST /api/bookings/{id}/history-log] 📝 Logging booking event:', {
      bookingId,
      action,
      tenantId: tenant.id
    });

    const event = await BookingHistoryService.logEvent({
      bookingId,
      tenantId: tenant.id,
      action,
      description,
      oldValues,
      newValues,
      metadata
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    console.log('[POST /api/bookings/{id}/history-log] ✅ Event logged:', {
      eventId: event.id,
      action
    });

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    let errorMessage = 'Failed to log booking event';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[POST /api/bookings/{id}/history-log] ❌ Error:', {
      message: errorMessage,
      error
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cashier name from header or session
    const cashierName = request.headers.get('x-user-name') || 'System';

    console.log(`[Invoice] Creating invoice from booking: ${bookingId} for tenant: ${tenant.id}`);

    const invoice = await InvoiceService.createInvoiceFromBooking(tenant.id, bookingId, cashierName);
    
    console.log(`[Invoice] Successfully created invoice: ${invoice.id}`);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create invoice from booking';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    console.error('[Invoice] Error creating invoice from booking:', {
      message: errorMessage,
      details: errorDetails,
      fullError: error
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
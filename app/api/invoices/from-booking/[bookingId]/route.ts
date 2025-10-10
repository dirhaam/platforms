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

    const invoice = await InvoiceService.createInvoiceFromBooking(tenant.id, bookingId);
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice from booking:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice from booking' },
      { status: 500 }
    );
  }
}
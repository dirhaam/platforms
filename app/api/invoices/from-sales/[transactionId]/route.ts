export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await InvoiceService.createInvoiceFromSalesTransaction(
      tenant.id,
      transactionId
    );

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice from sales transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice from sales transaction' },
      { status: 500 }
    );
  }
}

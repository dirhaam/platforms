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

    console.log(`[Invoice] Creating invoice from sales transaction: ${transactionId} for tenant: ${tenant.id}`);

    const invoice = await InvoiceService.createInvoiceFromSalesTransaction(
      tenant.id,
      transactionId
    );

    console.log(`[Invoice] Successfully created invoice: ${invoice.id}`);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create invoice from sales transaction';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }

    console.error('[Invoice] Error creating invoice from sales transaction:', {
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

import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/invoice/invoice-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await InvoiceService.getInvoiceSummary(tenant.id);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice summary' },
      { status: 500 }
    );
  }
}
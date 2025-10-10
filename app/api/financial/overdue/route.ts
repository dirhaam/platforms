import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/invoice/financial-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overdueInvoices = await FinancialService.getOverdueInvoices(tenant.id);
    
    return NextResponse.json(overdueInvoices);
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overdue invoices' },
      { status: 500 }
    );
  }
}
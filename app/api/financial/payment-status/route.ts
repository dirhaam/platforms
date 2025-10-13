export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/invoice/financial-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentStatus = await FinancialService.getPaymentStatusReport(tenant.id);
    
    return NextResponse.json(paymentStatus);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
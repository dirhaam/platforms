export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/invoice/financial-service';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const metrics = await FinancialService.getFinancialMetrics(
      tenant.id,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    );
  }
}
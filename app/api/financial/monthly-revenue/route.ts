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
    const months = parseInt(searchParams.get('months') || '12');

    const monthlyRevenue = await FinancialService.getMonthlyRevenue(tenant.id, months);
    
    return NextResponse.json(monthlyRevenue);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly revenue' },
      { status: 500 }
    );
  }
}
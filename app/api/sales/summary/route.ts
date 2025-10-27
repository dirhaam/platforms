import { NextRequest, NextResponse } from 'next/server';
import { salesService } from '@/lib/sales/sales-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const filters: any = {};
    
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    
    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }

    const summary = await salesService.getSalesSummary(tenantId, filters);
    
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales summary' },
      { status: 500 }
    );
  }
}

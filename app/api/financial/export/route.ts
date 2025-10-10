import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/invoice/financial-service';
import { InvoiceExportOptions } from '@/types/invoice';
import { getTenantFromRequest } from '@/lib/auth/tenant-auth';

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const options: InvoiceExportOptions = await request.json();
    
    if (options.format === 'xlsx') {
      const buffer = await FinancialService.exportToExcel(tenant.id, options);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      });
    } else if (options.format === 'pdf') {
      const buffer = await FinancialService.exportToPDF(tenant.id, options);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting financial data:', error);
    return NextResponse.json(
      { error: 'Failed to export financial data' },
      { status: 500 }
    );
  }
}
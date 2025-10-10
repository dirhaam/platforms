import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ExportOptions } from '@/lib/analytics/export-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const { dataType, format, dateRange, includeFields } = await request.json();

    if (!dataType || !format || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const options: ExportOptions = {
      format,
      dateRange: {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      },
      includeFields
    };

    let exportBuffer: Buffer;

    switch (dataType) {
      case 'bookings':
        exportBuffer = await ExportService.exportBookings(tenantId, options);
        break;
      case 'customers':
        exportBuffer = await ExportService.exportCustomers(tenantId, options);
        break;
      case 'services':
        exportBuffer = await ExportService.exportServices(tenantId, options);
        break;
      case 'financial':
        exportBuffer = await ExportService.exportFinancialData(tenantId, options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid data type' },
          { status: 400 }
        );
    }

    const contentType = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf'
    }[format];

    const filename = `${dataType}-export.${format}`;

    return new NextResponse(exportBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
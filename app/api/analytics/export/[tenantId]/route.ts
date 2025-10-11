import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ExportOptions } from '@/lib/analytics/export-service';

function isValidFormat(value: unknown): value is ExportOptions['format'] {
  return typeof value === 'string' && ['xlsx', 'csv', 'pdf'].includes(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const { dataType, format, dateRange, includeFields } = await request.json();

    if (!dataType || !format || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!isValidFormat(format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
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

    let exportBuffer: Uint8Array;

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

    const contentTypeMap: Record<ExportOptions['format'], string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf'
    };

    const contentType = contentTypeMap[format];

    const filename = `${dataType}-export.${format}`;

    const arrayBuffer = exportBuffer.buffer.slice(
      exportBuffer.byteOffset,
      exportBuffer.byteOffset + exportBuffer.byteLength
    );

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportBuffer.byteLength.toString()
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
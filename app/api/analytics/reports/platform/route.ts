export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ReportConfig } from '@/lib/analytics/export-service';

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(buffer).set(view);
  return buffer;
}

export async function POST(request: NextRequest) {
  try {
    const reportConfig: ReportConfig = await request.json();

    if (!reportConfig.title || !reportConfig.dateRange || !reportConfig.sections) {
      return NextResponse.json(
        { error: 'Missing required report configuration' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const processedConfig: ReportConfig = {
      ...reportConfig,
      dateRange: {
        startDate: new Date(reportConfig.dateRange.startDate),
        endDate: new Date(reportConfig.dateRange.endDate)
      }
    };

    const reportBuffer = await ExportService.generatePlatformReport(processedConfig);

    const contentType = 'application/pdf';
    const filename = `platform-${reportConfig.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    const arrayBuffer = toArrayBuffer(reportBuffer);

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('Platform report generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate platform report' },
      { status: 500 }
    );
  }
}
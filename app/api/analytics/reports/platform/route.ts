import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ReportConfig } from '@/lib/analytics/export-service';

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

    return new NextResponse(reportBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': reportBuffer.byteLength.toString()
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
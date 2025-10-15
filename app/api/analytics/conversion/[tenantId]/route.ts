export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const conversionData = await AnalyticsService.getConversionMetrics(
      tenantId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(conversionData);
  } catch (error) {
    console.error('Conversion analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion data' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const conversionData = await AnalyticsService.getConversionMetrics(
      tenantId,
      startDate,
      endDate
    );

    return NextResponse.json(conversionData);
  } catch (error) {
    console.error('Conversion analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion data' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const platformData = await AnalyticsService.getPlatformAnalytics(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(platformData);
  } catch (error) {
    console.error('Platform analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform analytics data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const platformData = await AnalyticsService.getPlatformAnalytics(
      startDate,
      endDate
    );

    return NextResponse.json(platformData);
  } catch (error) {
    console.error('Platform analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform analytics data' },
      { status: 500 }
    );
  }
}
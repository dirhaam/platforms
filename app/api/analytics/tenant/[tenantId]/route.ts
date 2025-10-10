import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsFilters } from '@/types/analytics';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const filters: AnalyticsFilters = await request.json();

    // Validate date range
    if (!filters.dateRange?.startDate || !filters.dateRange?.endDate) {
      return NextResponse.json(
        { error: 'Date range is required' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const processedFilters: AnalyticsFilters = {
      ...filters,
      dateRange: {
        startDate: new Date(filters.dateRange.startDate),
        endDate: new Date(filters.dateRange.endDate)
      }
    };

    const analyticsData = await AnalyticsService.getTenantAnalytics(
      tenantId,
      processedFilters
    );

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const filters: AnalyticsFilters = {
      dateRange: { startDate, endDate },
      comparisonEnabled: searchParams.get('comparison') === 'true'
    };

    const analyticsData = await AnalyticsService.getTenantAnalytics(
      tenantId,
      filters
    );

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
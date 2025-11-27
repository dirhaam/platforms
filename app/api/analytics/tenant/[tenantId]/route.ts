export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnalyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsFilters } from '@/types/analytics';

const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

async function getTenantIdFromSubdomain(subdomain: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  // Check if it's already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(subdomain)) {
    return subdomain;
  }
  
  // Look up tenant by subdomain
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain.toLowerCase())
    .single();
  
  if (error || !tenant) {
    console.error('Error finding tenant by subdomain:', error);
    return null;
  }
  
  return tenant.id;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId: subdomainOrId } = await context.params;
    const filters: AnalyticsFilters = await request.json();

    // Resolve subdomain to tenant ID
    const tenantId = await getTenantIdFromSubdomain(subdomainOrId);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

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
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId: subdomainOrId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Resolve subdomain to tenant ID
    const tenantId = await getTenantIdFromSubdomain(subdomainOrId);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
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
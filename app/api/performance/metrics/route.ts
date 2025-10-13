export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { RBAC } from '@/lib/auth/rbac';
import { PerformanceMonitor } from '@/lib/performance/performance-monitor';
import { CacheService } from '@/lib/cache/cache-service';
import { DatabaseUtils } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check permissions - only platform admins can view performance metrics
    const { session, error } = await AuthMiddleware.authenticateApiRoute(
      request,
      ['manage_settings'] // Only owners and admins
    );

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only owners can view performance metrics
    if (!RBAC.hasRole(session, 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '300000'); // Default 5 minutes

    // Get performance summary
    const performanceSummary = PerformanceMonitor.getPerformanceSummary(timeRange);

    // Get system metrics
    const systemMetrics = await PerformanceMonitor.collectSystemMetrics();

    // Get health check
    const healthCheck = await PerformanceMonitor.performHealthCheck();

    // Get cache stats
    const cacheStats = await CacheService.getCacheStats();

    // Get database health
    const databaseHealth = await DatabaseUtils.healthCheck();

    // Get performance recommendations
    const recommendations = PerformanceMonitor.getPerformanceRecommendations();

    return NextResponse.json({
      success: true,
      data: {
        summary: performanceSummary,
        system: systemMetrics,
        health: healthCheck,
        cache: cacheStats,
        database: databaseHealth,
        recommendations,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// Export metrics in Prometheus format
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await AuthMiddleware.authenticateApiRoute(
      request,
      ['manage_settings']
    );

    if (error || !session || !RBAC.hasRole(session, 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const format = body.format || 'json';

    const exportedMetrics = PerformanceMonitor.exportMetrics(format);

    if (format === 'prometheus') {
      return new NextResponse(exportedMetrics, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportedMetrics,
    });
  } catch (error) {
    console.error('Export metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}
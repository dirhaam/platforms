export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { RBAC } from '@/lib/auth/rbac';
import { SecurityService } from '@/lib/security/security-service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const { session, error } = await AuthMiddleware.authenticateApiRoute(
      request,
      ['manage_settings', 'view_analytics'] // Only owners and admins can view security metrics
    );

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only owners and admins can view security metrics
    if (!RBAC.hasAnyRole(session, ['owner', 'admin'])) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get security metrics
    const metrics = await SecurityService.getSecurityMetrics(session.tenantId, days);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Security metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
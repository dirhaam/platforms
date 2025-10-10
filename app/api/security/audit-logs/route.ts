import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { RBAC } from '@/lib/auth/rbac';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check permissions
    const { session, error } = await AuthMiddleware.authenticateApiRoute(
      request,
      ['manage_settings', 'view_analytics'] // Only owners and admins can view audit logs
    );

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only owners and admins can view audit logs
    if (!RBAC.hasAnyRole(session, ['owner', 'admin'])) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const success = searchParams.get('success');
    const days = parseInt(searchParams.get('days') || '30');

    const offset = (page - 1) * limit;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: any = {
      tenantId: session.tenantId,
      timestamp: { gte: since },
    };

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (success !== null && success !== undefined) {
      where.success = success === 'true';
    }

    // Get audit logs
    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          resource: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          details: true,
          timestamp: true,
        },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    // Parse details JSON
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: parsedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
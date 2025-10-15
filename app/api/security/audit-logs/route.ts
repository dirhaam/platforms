export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { RBAC } from '@/lib/auth/rbac';
import { db } from '@/lib/database/server';
import { securityAuditLogs } from '@/lib/database/schema';
import { and, desc, eq, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

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
    const conditions = [
      eq(securityAuditLogs.tenantId, session.tenantId),
      gte(securityAuditLogs.timestamp, since),
    ];

    if (action) {
      conditions.push(eq(securityAuditLogs.action, action));
    }

    if (userId) {
      conditions.push(eq(securityAuditLogs.userId, userId));
    }

    if (success !== null && success !== undefined) {
      conditions.push(eq(securityAuditLogs.success, success === 'true'));
    }

    const whereClause = and(...conditions);

    const logsQuery = db
      .select({
        id: securityAuditLogs.id,
        userId: securityAuditLogs.userId,
        action: securityAuditLogs.action,
        resource: securityAuditLogs.resource,
        ipAddress: securityAuditLogs.ipAddress,
        userAgent: securityAuditLogs.userAgent,
        success: securityAuditLogs.success,
        details: securityAuditLogs.details,
        timestamp: securityAuditLogs.timestamp,
      })
      .from(securityAuditLogs)
      .where(whereClause)
      .orderBy(desc(securityAuditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`cast(count(${securityAuditLogs.id}) as int)` })
      .from(securityAuditLogs)
      .where(whereClause);

    const [logs, [{ count: total }]] = await Promise.all([logsQuery, countQuery]);

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
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';
import { RBAC } from '@/lib/auth/rbac';
import { createClient } from '@supabase/supabase-js';

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const success = searchParams.get('success');
    const days = parseInt(searchParams.get('days') || '30');

    const offset = (page - 1) * limit;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build query with filters
    let query = supabase
      .from('securityAuditLogs')
      .select('id, userId, action, resource, ipAddress, userAgent, success, details, timestamp', { count: 'exact' })
      .eq('tenantId', session.tenantId)
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (userId) {
      query = query.eq('userId', userId);
    }

    if (success !== null && success !== undefined) {
      query = query.eq('success', success === 'true');
    }

    const { data: logs, count: total, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }

    // Parse details JSON
    const parsedLogs = (logs || []).map(log => ({
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
          total: total || 0,
          pages: Math.ceil((total || 0) / limit),
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
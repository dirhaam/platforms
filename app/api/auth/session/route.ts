import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';

/**
 * GET /api/auth/session
 * Returns the current user session
 * Used by client to get session data including user name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await TenantAuth.getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        userId: session.userId,
        tenantId: session.tenantId,
        name: session.name,
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

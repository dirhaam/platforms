import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies (tenant-auth cookie)
    const session = await TenantAuth.getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No authentication session found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        tenantId: session.tenantId,
        isSuperAdmin: session.isSuperAdmin || false,
        permissions: session.permissions,
      }
    });

  } catch (error) {
    console.error('Auth me endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}

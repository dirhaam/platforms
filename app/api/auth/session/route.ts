import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import { PermissionService } from '@/lib/auth/permission-service';

/**
 * GET /api/auth/session
 * Returns the current user session with permissions
 * Used by client to get session data including user name and permissions
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

    // Get default permissions for role
    const rolePermissions = PermissionService.getDefaultPermissions(session.role as any);
    
    // Get visible nav items for this role
    const visibleFeatures = PermissionService.getVisibleNavItems(session.role as any);

    return NextResponse.json({
      session: {
        userId: session.userId,
        tenantId: session.tenantId,
        name: session.name,
        email: session.email,
        role: session.role,
        permissions: session.permissions || [],
        isSuperAdmin: session.isSuperAdmin || false,
      },
      // Also include at root level for backward compatibility
      userId: session.userId,
      tenantId: session.tenantId,
      name: session.name,
      email: session.email,
      role: session.role,
      permissions: session.permissions || [],
      isSuperAdmin: session.isSuperAdmin || false,
      // Role-based permissions
      rolePermissions,
      visibleFeatures,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

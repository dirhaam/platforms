import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import { SecurityService } from '@/lib/security/security-service';
import { db } from '@/lib/database';
import { tenants, staff } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await TenantAuth.getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify current password
    let currentPasswordValid = false;
    
    if (session.role === 'owner') {
      const [tenant] = await db
        .select({ passwordHash: tenants.passwordHash })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId))
        .limit(1);

      if (tenant?.passwordHash) {
        currentPasswordValid = await TenantAuth.verifyPassword(currentPassword, tenant.passwordHash);
      } else if (process.env.NODE_ENV === 'development' && currentPassword === 'admin123') {
        currentPasswordValid = true;
      }
    } else {
      const [staffMember] = await db
        .select({ passwordHash: staff.passwordHash })
        .from(staff)
        .where(eq(staff.id, session.userId))
        .limit(1);

      if (staffMember?.passwordHash) {
        currentPasswordValid = await TenantAuth.verifyPassword(currentPassword, staffMember.passwordHash);
      } else if (process.env.NODE_ENV === 'development' && currentPassword === 'staff123') {
        currentPasswordValid = true;
      }
    }

    if (!currentPasswordValid) {
      // Log failed password change attempt
      await SecurityService.logSecurityEvent(
        session.tenantId,
        session.userId,
        'change_password',
        false,
        ipAddress,
        userAgent,
        session.role,
        { reason: 'invalid_current_password' }
      );

      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Set new password
    let result;
    if (session.role === 'owner') {
      result = await TenantAuth.setOwnerPassword(session.tenantId, newPassword);
    } else {
      result = await TenantAuth.setStaffPassword(session.userId, newPassword);
    }

    if (result.success) {
      // Log successful password change
      await SecurityService.logSecurityEvent(
        session.tenantId,
        session.userId,
        'change_password',
        true,
        ipAddress,
        userAgent,
        session.role
      );

      return NextResponse.json({ success: true });
    } else {
      // Log failed password change
      await SecurityService.logSecurityEvent(
        session.tenantId,
        session.userId,
        'change_password',
        false,
        ipAddress,
        userAgent,
        session.role,
        { reason: 'password_validation_failed', error: result.error }
      );

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import { SecurityService } from '@/lib/security/security-service';

interface ResetPasswordRequest {
  email: string;
  subdomain: string;
  userType: 'owner' | 'staff';
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { email, subdomain, userType } = body;

    // Validate input
    if (!email || !subdomain || !userType) {
      return NextResponse.json(
        { success: false, error: 'Email, subdomain, and user type are required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate password reset token
    const result = await TenantAuth.generatePasswordResetToken(email, subdomain, userType);

    if (result.success && result.token) {
      // Log password reset request
      await SecurityService.logSecurityEvent(
        'unknown', // We don't have tenant ID yet
        'unknown', // We don't have user ID yet
        'password_reset_request',
        true,
        ipAddress,
        userAgent,
        userType,
        { email, subdomain }
      );

      // In a real application, you would send an email with the reset link
      // For now, we'll return the token (only in development)
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Password reset token generated',
          token: result.token, // Only return in development
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      }
    } else {
      // Log failed password reset request
      await SecurityService.logSecurityEvent(
        'unknown',
        'unknown',
        'password_reset_request',
        false,
        ipAddress,
        userAgent,
        userType,
        { email, subdomain, error: result.error }
      );

      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
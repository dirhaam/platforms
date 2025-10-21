export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TenantAuth } from '@/lib/auth/tenant-auth';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await TenantAuth.getSessionFromRequest(request);
    
    // Get client IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Logout with security logging
    await TenantAuth.logout(session || undefined, ipAddress, userAgent);

    // Also clear tenant_session cookie (for staff/tenant logins)
    const cookieStore = await cookies();
    cookieStore.delete('tenant_session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
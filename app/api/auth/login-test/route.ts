export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

interface LoginRequest {
  email: string;
  password: string;
  loginType: 'owner' | 'staff' | 'superadmin';
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, loginType } = body;

    // Simple test - bypass auth for specific emails
    if (loginType === 'superadmin' && email.includes('@booqing.my.id')) {
      // Set response with auth data
      const response = NextResponse.json({
        success: true,
        message: 'Login successful (test mode)',
        user: {
          id: 'test-id',
          email: email,
          name: 'Test Admin',
          role: 'superadmin'
        }
      });

      // Set auth cookie (simplified)
      const sessionData = JSON.stringify({
        userId: 'test-id',
        tenantId: 'platform',
        role: 'superadmin',
        permissions: ['*'],
        email: email,
        name: 'Test Admin',
        isSuperAdmin: true,
      });

      response.cookies.set('auth-token', sessionData, {
        httpOnly: true,
        secure: false, // For localhost
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login test error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

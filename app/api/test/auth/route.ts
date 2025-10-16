import { NextResponse } from 'next/server';
import { SuperAdminService } from '@/lib/auth/superadmin-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🧪 Production auth test:', { email, password: '***' });

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Test SuperAdmin authentication directly
    const authResult = await SuperAdminService.authenticate(email, password);

    console.log('📊 Auth result:', {
      success: authResult.success,
      error: authResult.error,
      superAdminId: authResult.superAdmin?.id,
    });

    return NextResponse.json({
      success: authResult.success,
      authenticated: authResult.success,
      superAdmin: authResult.superAdmin ? {
        id: authResult.superAdmin.id,
        email: authResult.superAdmin.email,
        name: authResult.superAdmin.name,
        isActive: authResult.superAdmin.isActive,
        isLocked: authResult.superAdmin.lockedUntil && new Date(authResult.superAdmin.lockedUntil) > new Date(),
      } : null,
      error: authResult.error,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Production auth test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Authentication test endpoint',
    usage: 'POST with email and password to test authentication',
    testCredentials: {
      email: 'superadmin@booqing.my.id',
      password: 'ChangeThisPassword123!',
    },
    endpoints: {
      setupSuperAdmin: '/api/setup/superadmin',
      testAuth: '/api/test/auth',
      login: '/api/auth/login',
    }
  });
}

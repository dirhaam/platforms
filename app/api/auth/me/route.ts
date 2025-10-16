import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieValue = request.cookies.get('tenant-auth')?.value;

    if (!cookieValue) {
      return NextResponse.json(
        { success: false, error: 'No authentication session found' },
        { status: 401 }
      );
    }

    let session;

    // Handle inline session (for production)
    if (cookieValue.startsWith('inline.')) {
      try {
        const payload = cookieValue.slice(7); // Remove 'inline.' prefix
        const json = atob(payload);
        session = JSON.parse(json);
      } catch (error) {
        console.error('Failed to decode inline session:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid session format' },
          { status: 401 }
        );
      }
    } else {
      // Try database session (for development)
      try {
        const { retrieveSession } = await import('@/lib/auth/session-store');
        session = await retrieveSession(cookieValue);
      } catch (error) {
        console.error('Failed to retrieve session from database:', error);
        return NextResponse.json(
          { success: false, error: 'Session retrieval failed' },
          { status: 401 }
        );
      }
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
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

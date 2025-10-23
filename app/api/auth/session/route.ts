import { NextRequest, NextResponse } from 'next/server';

interface SessionData {
  userId?: string;
  tenantId?: string;
  role?: string;
  permissions?: string[];
  email?: string;
  name?: string;
  isSuperAdmin?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('tenant-auth');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Parse session from cookie value
    const cookieValue = sessionCookie.value;
    
    if (cookieValue.startsWith('inline.')) {
      // Decode inline session
      const encoded = cookieValue.substring('inline.'.length);
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const sessionData: SessionData = JSON.parse(decoded);

      return NextResponse.json({
        authenticated: true,
        ...sessionData,
      });
    }

    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

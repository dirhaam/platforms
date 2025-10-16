export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from '@/lib/auth/tenant-auth';

interface LoginRequest {
  email: string;
  password: string;
  loginType: 'owner' | 'staff' | 'superadmin';
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, loginType } = body;

    // Validate input
    if (!email || !password || !loginType) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and login type are required' },
        { status: 400 }
      );
    }

    // Extract subdomain from request (not required for superadmin)
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0];
    
    let subdomain: string | null = null;

    // For superadmin login, subdomain is not required
    if (loginType !== 'superadmin') {
      // Local development
      if (hostname.includes('localhost')) {
        const referer = request.headers.get('referer') || '';
        const subdomainMatch = referer.match(/http:\/\/([^.]+)\.localhost/);
        if (subdomainMatch) {
          subdomain = subdomainMatch[1];
        } else {
          // Fallback: extract from host header for localhost
          if (hostname.includes('.localhost')) {
            subdomain = hostname.split('.')[0];
          }
        }
      } else {
        // Production - extract from hostname
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'booqing.my.id';
        const rootDomainFormatted = rootDomain.split(':')[0];
        
        // Consistent with middleware.ts logic - exclude www subdomain
        const isSubdomain =
          hostname !== rootDomainFormatted &&
          hostname !== `www.${rootDomainFormatted}` &&
          hostname.endsWith(`.${rootDomainFormatted}`);
          
        if (isSubdomain) {
          subdomain = hostname.replace(`.${rootDomainFormatted}`, '');
        }
        
        // Debug logging
        console.log('Login debug - Hostname:', hostname);
        console.log('Login debug - Root domain:', rootDomain);
        console.log('Login debug - Root domain formatted:', rootDomainFormatted);
        console.log('Login debug - Is subdomain?', isSubdomain);
        console.log('Login debug - Extracted subdomain:', subdomain);
      }

      if (!subdomain) {
        console.log('Login debug - Subdomain validation failed for login type:', loginType);
        return NextResponse.json(
          { success: false, error: 'Invalid subdomain' },
          { status: 400 }
        );
      }
    }

    // Get client IP and user agent for security logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Authenticate based on login type
    let result;
    console.log('Login debug - Login type:', loginType);
    console.log('Login debug - Email:', email);
    console.log('Login debug - Subdomain (if applicable):', subdomain || 'N/A');
    
    if (loginType === 'superadmin') {
      result = await TenantAuth.authenticateSuperAdmin(email, password, ipAddress, userAgent);
    } else if (loginType === 'owner') {
      result = await TenantAuth.authenticateOwner(email, password, subdomain!, ipAddress, userAgent);
    } else {
      result = await TenantAuth.authenticateStaff(email, password, subdomain!, ipAddress, userAgent);
    }

    console.log('Login debug - Authentication result:', result);

    if (result.success && result.session) {
      console.log('Login debug - Login successful for:', email);
      
      // Create response with authentication cookie
      const response = NextResponse.json({
        success: true,
        user: {
          name: result.session.name,
          email: result.session.email,
          role: result.session.role,
          tenantId: result.session.tenantId,
          isSuperAdmin: result.session.isSuperAdmin || false,
        },
      });
      
      // Set authentication cookie
      const { persistSession } = await import('@/lib/auth/session-store');
      const sessionId = await persistSession(result.session);
      
      response.cookies.set('tenant-auth', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } else {
      console.log('Login debug - Login failed for:', email, 'Error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
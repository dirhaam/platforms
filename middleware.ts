import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain } from '@/lib/utils';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    // Block access to platform admin page from subdomains (unless superadmin)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      // Check if user is superadmin
      const authResponse = await AuthMiddleware.authenticate(request, subdomain);
      if (authResponse) {
        // Check if this is a superadmin trying to access platform admin
        const session = await AuthMiddleware.getSessionFromRequest(request);
        if (session?.isSuperAdmin && pathname.startsWith('/admin')) {
          // Allow superadmin to access platform admin from any domain
          return NextResponse.next();
        }
        return authResponse;
      }
    }

    // For the root path on a subdomain, rewrite to the subdomain page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }

    // For other subdomain paths, continue with authentication if needed
    const authResponse = await AuthMiddleware.authenticate(request, subdomain);
    if (authResponse) {
      return authResponse;
    }
  } else {
    // On root domain - handle platform admin access
    if (pathname.startsWith('/admin')) {
      const authResponse = await AuthMiddleware.authenticatePlatformAdmin(request);
      if (authResponse) {
        return authResponse;
      }
    }
  }

  // On the root domain, allow normal access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)'
  ]
};

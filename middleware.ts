import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/auth-middleware';

// Get root domain from environment
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  let host = request.headers.get('host') || '';

  // Check for x-forwarded-host header (used by Vercel for custom domains)
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    console.log('[extractSubdomain] Found x-forwarded-host:', forwardedHost);
    host = forwardedHost;
  }

  const hostname = host.split(':')[0];

  console.log('[extractSubdomain] URL:', url);
  console.log('[extractSubdomain] Host header:', host);
  console.log('[extractSubdomain] Hostname:', hostname);
  console.log('[extractSubdomain] rootDomain:', ROOT_DOMAIN);

  const rootDomainFormatted = ROOT_DOMAIN.split(':')[0];

  const isSubdomain = {
    isNotRoot: hostname !== rootDomainFormatted,
    isNotWWW: hostname !== `www.${rootDomainFormatted}`,
    endsWithRoot: hostname.endsWith(`.${rootDomainFormatted}`),
    isSubdomain:
      hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname.endsWith(`.${rootDomainFormatted}`),
    result: null as string | null,
  };

  if (isSubdomain.isSubdomain) {
    isSubdomain.result = hostname.replace(`.${rootDomainFormatted}`, '');
  }

  console.log('[extractSubdomain] isSubdomain check:', isSubdomain);

  return isSubdomain.result;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract subdomain
  const subdomain = extractSubdomain(request);
  console.log(`[middleware] Pathname: ${pathname}`);
  console.log(`[middleware] Extracted subdomain: ${subdomain}`);

  // SUBDOMAIN ROOT PATH - If there's a subdomain and path is /, redirect to /s/[subdomain]
  if (subdomain && pathname === '/') {
    console.log(`[middleware] Subdomain root path detected for: ${subdomain}, redirecting to /s/${subdomain}`);
    const newUrl = new URL(`/s/${subdomain}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // TENANT ROUTES - Handle /tenant/* paths
  if (pathname.startsWith('/tenant')) {
    // Check if trying to access protected /tenant/admin routes
    if (pathname.startsWith('/tenant/admin')) {
      // Get session from cookie (correct name: tenant-auth)
      const tenantSessionCookie = request.cookies.get('tenant-auth');
      const hasSession = !!tenantSessionCookie;

      if (!hasSession) {
        // Redirect to login
        const loginUrl = new URL(`/tenant/login`, request.url);
        loginUrl.searchParams.set('subdomain', subdomain || 'unknown');
        loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
        console.log('[middleware] Redirecting to tenant login - no session');
        return NextResponse.redirect(loginUrl);
      }

      // Add subdomain to query params if not already present
      if (!request.nextUrl.searchParams.has('subdomain') && subdomain) {
        const newUrl = new URL(request.url);
        newUrl.searchParams.set('subdomain', subdomain);
        return NextResponse.rewrite(newUrl);
      }
    }

    // Allow /tenant/login without authentication
    if (pathname.startsWith('/tenant/login')) {
      // Add subdomain to query params if not already present
      if (!request.nextUrl.searchParams.has('subdomain') && subdomain) {
        const newUrl = new URL(request.url);
        newUrl.searchParams.set('subdomain', subdomain);
        return NextResponse.rewrite(newUrl);
      }
    }

    return NextResponse.next();
  }

  // SUBDOMAIN ROUTING - If there's a subdomain and path is /admin, route to tenant login
  if (subdomain && pathname.startsWith('/admin')) {
    console.log(`[middleware] Subdomain admin access detected for: ${subdomain}, routing to tenant login`);
    const loginUrl = new URL(`/tenant/login`, request.url);
    loginUrl.searchParams.set('subdomain', subdomain);
    return NextResponse.redirect(loginUrl);
  }

  // For root domain /admin - authenticate as super admin
  if (!subdomain && pathname.startsWith('/admin')) {
    const authResponse = await AuthMiddleware.authenticate(request, '');
    if (authResponse) {
      return authResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (Service Worker)
     * - offline.html (Offline fallback)
     * - pwa/ (PWA icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|pwa/|.*\\.png|.*\\.svg).*)',
  ],
};

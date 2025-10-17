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

  // If there's a subdomain and path is /admin, route to tenant admin
  if (subdomain && pathname.startsWith('/admin')) {
    console.log(`[middleware] Routing to tenant admin for subdomain: ${subdomain}`);
    
    // Route to tenant admin panel
    const tenantAdminUrl = new URL(`/tenant/admin${pathname === '/admin' ? '' : pathname}`, request.url);
    tenantAdminUrl.searchParams.set('subdomain', subdomain);
    
    // Preserve all query params
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== 'subdomain') {
        tenantAdminUrl.searchParams.set(key, value);
      }
    });

    return NextResponse.rewrite(tenantAdminUrl);
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

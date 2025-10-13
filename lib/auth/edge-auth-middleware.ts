import { NextRequest, NextResponse } from 'next/server';
import { TenantAuth } from './tenant-auth-edge';
import type { TenantSession } from './types';
import { RBAC, RouteGuard, type RouteProtection } from './rbac';

// Route protection configuration
const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  '/admin': {
    permissions: ['manage_bookings'],
    roles: ['owner', 'admin', 'staff'],
  },
  '/admin/dashboard': {
    permissions: ['manage_bookings'],
  },
  '/admin/bookings': {
    permissions: ['manage_bookings'],
  },
  '/admin/customers': {
    permissions: ['manage_customers', 'view_customers'],
  },
  '/admin/services': {
    permissions: ['manage_services'],
    roles: ['owner', 'admin'],
  },
  '/admin/staff': {
    permissions: ['manage_staff'],
    roles: ['owner', 'admin'],
  },
  '/admin/analytics': {
    permissions: ['view_analytics'],
    roles: ['owner', 'admin'],
  },
  '/admin/messages': {
    permissions: ['send_messages'],
  },
  '/admin/settings': {
    permissions: ['manage_settings'],
    roles: ['owner', 'admin'],
  },
};

export class EdgeAuthMiddleware {
  // Check if route requires authentication
  static isProtectedRoute(pathname: string): boolean {
    return Object.keys(PROTECTED_ROUTES).some(route => 
      pathname.startsWith(route)
    );
  }

  // Get route protection configuration
  static getRouteProtection(pathname: string): RouteProtection | null {
    // Find the most specific matching route
    const matchingRoutes = Object.keys(PROTECTED_ROUTES)
      .filter(route => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length); // Sort by specificity (longest first)

    return matchingRoutes.length > 0 ? PROTECTED_ROUTES[matchingRoutes[0]] : null;
  }

  // Main authentication middleware - only validates JWT, no DB access
  static async authenticate(
    request: NextRequest,
    subdomain: string
  ): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Check if route requires authentication
    if (!this.isProtectedRoute(pathname)) {
      return null; // No authentication required
    }

    // Get current session from JWT token (no DB access)
    const session = await TenantAuth.getSessionFromRequest(request);

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For additional tenant verification, this would be done in server components/API routes
    // rather than in the middleware to maintain Edge Runtime compatibility
    
    // Check route-specific permissions (using session data from JWT)
    const protection = this.getRouteProtection(pathname);
    if (protection && !RouteGuard.canAccessRoute(session, protection)) {
      const unauthorizedUrl = new URL(`/unauthorized`, request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Add session data to request headers for use in components
    const response = NextResponse.next();
    response.headers.set('x-tenant-session', JSON.stringify(session));
    response.headers.set('x-tenant-id', session.tenantId);
    response.headers.set('x-user-role', session.role);

    return response;
  }

  // Create login redirect response
  static createLoginRedirect(request: NextRequest, error?: string): NextResponse {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    
    if (error) {
      loginUrl.searchParams.set('error', error);
    }

    return NextResponse.redirect(loginUrl);
  }

  // Create unauthorized response
  static createUnauthorizedRedirect(request: NextRequest): NextResponse {
    const unauthorizedUrl = new URL('/unauthorized', request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Extract session from request headers (for server components)
  static getSessionFromHeaders(headers: Headers): TenantSession | null {
    try {
      const sessionHeader = headers.get('x-tenant-session');
      return sessionHeader ? JSON.parse(sessionHeader) : null;
    } catch (error) {
      console.error('Failed to parse session from headers:', error);
      return null;
    }
  }

  // Get session from request (for middleware use)
  static async getSessionFromRequest(request: NextRequest): Promise<TenantSession | null> {
    return await TenantAuth.getSessionFromRequest(request);
  }

  // Authenticate platform admin access - only validates JWT, no DB access
  static async authenticatePlatformAdmin(request: NextRequest): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Get current session from JWT token (no DB access)
    const session = await TenantAuth.getSessionFromRequest(request);

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'superadmin');
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is superadmin using session data from JWT
    if (session.role !== 'superadmin' || !session.isSuperAdmin) {
      const unauthorizedUrl = new URL(`/unauthorized`, request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Add session data to request headers
    const response = NextResponse.next();
    response.headers.set('x-tenant-session', JSON.stringify(session));
    response.headers.set('x-user-role', session.role);
    response.headers.set('x-is-superadmin', 'true');

    return null; // Allow access
  }

  // Check API route authentication
  static async authenticateApiRoute(
    request: NextRequest,
    requiredPermissions?: string[]
  ): Promise<{ session: TenantSession | null; error?: string }> {
    const session = await TenantAuth.getSessionFromRequest(request);

    if (!session) {
      return { session: null, error: 'Authentication required' };
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = RBAC.hasAnyPermission(session, requiredPermissions as any);
      if (!hasPermission) {
        return { session, error: 'Insufficient permissions' };
      }
    }

    return { session };
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TenantAuth } from './tenant-auth';
import type { TenantSession } from './types';
import { RBAC, RouteGuard, type RouteProtection } from './rbac';

// Route protection configuration
const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  '/admin': {
    permissions: ['manage_bookings'],
    roles: ['superadmin', 'owner', 'admin', 'staff'],
  },
  '/admin/dashboard': {
    permissions: ['manage_bookings'],
    roles: ['superadmin', 'owner', 'admin', 'staff'],
  },
  '/admin/bookings': {
    permissions: ['manage_bookings'],
    roles: ['superadmin', 'owner', 'admin', 'staff'],
  },
  '/admin/customers': {
    permissions: ['manage_customers', 'view_customers'],
    roles: ['superadmin', 'owner', 'admin', 'staff'],
  },
  '/admin/services': {
    permissions: ['manage_services'],
    roles: ['superadmin', 'owner', 'admin'],
  },
  '/admin/staff': {
    permissions: ['manage_staff'],
    roles: ['superadmin', 'owner', 'admin'],
  },
  '/admin/analytics': {
    permissions: ['view_analytics'],
    roles: ['superadmin', 'owner', 'admin'],
  },
  '/admin/whatsapp': {
    permissions: ['send_messages'],
    roles: ['superadmin', 'owner', 'admin', 'staff'],
  },
  '/admin/settings': {
    permissions: ['manage_settings'],
    roles: ['superadmin', 'owner', 'admin'],
  },
};

export class AuthMiddleware {
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

  // Main authentication middleware
  static async authenticate(
    request: NextRequest,
    subdomain: string
  ): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Check if route requires authentication
    if (!this.isProtectedRoute(pathname)) {
      return null; // No authentication required
    }

    // Get current session
    const session = await TenantAuth.getSessionFromRequest(request);

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify session belongs to current tenant
    const tenantData = await this.verifyTenantAccess(session, subdomain);
    if (!tenantData) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set('error', 'invalid_tenant');
      return NextResponse.redirect(loginUrl);
    }

    // Check route-specific permissions
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

  // Verify that session has access to the current tenant
  private static async verifyTenantAccess(
    session: TenantSession,
    subdomain: string
  ): Promise<boolean> {
    try {
      // Superadmin has access to all tenants
      if (session.role === 'superadmin' && session.isSuperAdmin) {
        return true;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .limit(1)
        .single();

      if (error) {
        console.error('Failed to verify tenant access:', error);
        return false;
      }

      return tenant?.id === session.tenantId;
    } catch (error) {
      console.error('Failed to verify tenant access:', error);
      return false;
    }
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

  // Authenticate platform admin access
  static async authenticatePlatformAdmin(request: NextRequest): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Get current session
    const session = await TenantAuth.getSessionFromRequest(request);

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'superadmin');
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is superadmin
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

// Utility function to get session in server components
export async function getServerSession(): Promise<TenantSession | null> {
  return await TenantAuth.getCurrentSession();
}

// Utility function to require authentication in server components
export async function requireAuth(): Promise<TenantSession> {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

// Utility function to require specific permission
export async function requirePermission(permission: string): Promise<TenantSession> {
  const session = await requireAuth();
  
  if (!RBAC.hasPermission(session, permission as any)) {
    throw new Error(`Permission required: ${permission}`);
  }

  return session;
}
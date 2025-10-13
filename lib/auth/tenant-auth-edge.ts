import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { TenantSession, Permission } from './types';
import {
  persistSession,
  retrieveSession,
  removeSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from './session-store';

export class TenantAuth {
  // Set authentication cookie
  static async setAuthCookie(session: TenantSession, env?: Record<string, unknown>): Promise<void> {
    const sessionId = await persistSession(session, env);
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    });
  }

  // Get current session from cookies
  static async getCurrentSession(env?: Record<string, unknown>): Promise<TenantSession | null> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      return await retrieveSession(sessionId, env);
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  // Get session from request (for middleware)
  static async getSessionFromRequest(
    request: NextRequest,
    env?: Record<string, unknown>
  ): Promise<TenantSession | null> {
    try {
      const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      const resolvedEnv = (request as unknown as { cf?: { env?: Record<string, unknown> } })?.cf?.env ?? env;
      return await retrieveSession(sessionId, resolvedEnv);
    } catch (error) {
      console.error('Failed to get session from request:', error);
      return null;
    }
  }

  // Clear authentication cookie
  static async clearAuthCookie(env?: Record<string, unknown>): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      await removeSession(sessionId, env);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  // Get session from cookies (for server components)
  static async getSession(env?: Record<string, unknown>): Promise<TenantSession | null> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      return await retrieveSession(sessionId, env);
    } catch (error) {
      console.error('Failed to get session from cookies:', error);
      return null;
    }
  }

  // Check if user has permission
  static hasPermission(session: TenantSession, permission: Permission): boolean {
    // Owner has all permissions
    if (session.role === 'owner' || session.permissions.includes('*')) {
      return true;
    }

    return session.permissions.includes(permission);
  }

  // Get user permissions based on role
  static getDefaultPermissions(role: 'superadmin' | 'owner' | 'admin' | 'staff'): Permission[] {
    switch (role) {
      case 'superadmin':
        return ['*']; // All permissions across all tenants
      case 'owner':
        return ['*']; // All permissions
      case 'admin':
        return [
          'manage_bookings',
          'manage_customers',
          'manage_services',
          'view_analytics',
          'send_messages',
          'manage_staff',
          'export_data',
        ];
      case 'staff':
        return [
          'manage_bookings',
          'view_customers',
          'send_messages',
        ];
      default:
        return [];
    }
  }

  // Logout user
  static async logout(
    session?: TenantSession,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<void> {
    // Just clear the cookie, logging would be done in API routes
    await this.clearAuthCookie();
  }
}

// Permission definitions
export const PERMISSIONS = {
  MANAGE_BOOKINGS: 'manage_bookings',
  MANAGE_CUSTOMERS: 'manage_customers',
  VIEW_CUSTOMERS: 'view_customers',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_STAFF: 'manage_staff',
  VIEW_ANALYTICS: 'view_analytics',
  SEND_MESSAGES: 'send_messages',
  MANAGE_SETTINGS: 'manage_settings',
  EXPORT_DATA: 'export_data',
} as const;

// Helper functions for API routes
export async function getTenantSession(request?: NextRequest): Promise<TenantSession | null> {
  if (request) {
    return await TenantAuth.getSessionFromRequest(request);
  } else {
    // For server components, get session from cookies
    return await TenantAuth.getSession();
  }
}
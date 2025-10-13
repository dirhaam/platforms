import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { SecurityService } from '@/lib/security/security-service';
import { tenants, staff } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import type { TenantSession, AuthResult, Permission } from './types';
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

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return await SecurityService.hashPassword(password);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await SecurityService.verifyPassword(password, hash);
  }

  // Authenticate tenant owner (email/password login)
  static async authenticateOwner(
    email: string, 
    password: string, 
    subdomain: string,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<AuthResult> {
    try {
      // Find tenant by subdomain and email
      const tenantResult = await db.select().from(tenants).where(
        and(
          eq(tenants.subdomain, subdomain),
          eq(tenants.email, email)
        )
      ).limit(1);

      const tenant = tenantResult[0] || null;

      if (!tenant) {
        // Log failed attempt
        await SecurityService.logSecurityEvent(
          'unknown',
          'unknown',
          'login',
          false,
          ipAddress,
          userAgent,
          'tenant_owner',
          { email, subdomain, reason: 'tenant_not_found' }
        );
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (tenant.lockedUntil && new Date(tenant.lockedUntil) > new Date()) {
        await SecurityService.logSecurityEvent(
          tenant.id,
          tenant.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'tenant_owner',
          { email, reason: 'account_locked' }
        );
        return { success: false, error: 'Account is temporarily locked due to too many failed attempts' };
      }

      // Check for suspicious activity
      const suspiciousCheck = await SecurityService.checkSuspiciousActivity(
        tenant.id,
        ipAddress,
        'login'
      );

      if (suspiciousCheck.shouldBlock) {
        await SecurityService.logSecurityEvent(
          tenant.id,
          tenant.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'tenant_owner',
          { email, reason: 'suspicious_activity', details: suspiciousCheck.reason }
        );
        return { success: false, error: 'Login blocked due to suspicious activity' };
      }

      let isValidPassword = false;

      // Check if tenant has a password hash
      if (tenant.passwordHash) {
        isValidPassword = await this.verifyPassword(password, tenant.passwordHash);
      } else {
        // Fallback for development/migration - check against default password
        if (process.env.NODE_ENV === 'development' && password === 'admin123') {
          isValidPassword = true;
          // Hash and store the password for future use
          const hashedPassword = await this.hashPassword(password);
          await db.update(tenants).set({ passwordHash: hashedPassword }).where(eq(tenants.id, tenant.id));
        }
      }
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const currentAttempts = tenant.loginAttempts ?? 0;
        const newAttempts = currentAttempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await db.update(tenants).set({
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
        }).where(eq(tenants.id, tenant.id));

        await SecurityService.logSecurityEvent(
          tenant.id,
          tenant.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'tenant_owner',
          { email, attempts: newAttempts, locked: shouldLock }
        );

        return { success: false, error: 'Invalid credentials' };
      }

      // Reset login attempts on successful login
      await db.update(tenants).set({
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      }).where(eq(tenants.id, tenant.id));

      const session: TenantSession = {
        userId: tenant.id,
        tenantId: tenant.id,
        role: 'owner',
        permissions: ['*'], // Owner has all permissions
        email: tenant.email,
        name: tenant.ownerName,
      };

      await this.setAuthCookie(session);

      // Log successful login
      await SecurityService.logSecurityEvent(
        tenant.id,
        tenant.id,
        'login',
        true,
        ipAddress,
        userAgent,
        'tenant_owner',
        { email }
      );

      return { success: true, session };
    } catch (error) {
      console.error('Owner authentication failed:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Authenticate staff member
  static async authenticateStaff(
    email: string, 
    password: string, 
    subdomain: string,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<AuthResult> {
    try {
      // Find tenant first
      const tenantResult = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
      const tenant = tenantResult[0] || null;

      if (!tenant) {
        await SecurityService.logSecurityEvent(
          'unknown',
          'unknown',
          'login',
          false,
          ipAddress,
          userAgent,
          'staff',
          { email, subdomain, reason: 'tenant_not_found' }
        );
        return { success: false, error: 'Invalid credentials' };
      }

      // Find staff member
      const staffResult = await db.select().from(staff).where(
        and(
          eq(staff.tenantId, tenant.id),
          eq(staff.email, email),
          eq(staff.isActive, true)
        )
      ).limit(1);
      
      const staffMember = staffResult[0] || null;

      if (!staffMember) {
        await SecurityService.logSecurityEvent(
          tenant.id,
          'unknown',
          'login',
          false,
          ipAddress,
          userAgent,
          'staff',
          { email, reason: 'staff_not_found' }
        );
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (staffMember.lockedUntil && new Date(staffMember.lockedUntil) > new Date()) {
        await SecurityService.logSecurityEvent(
          tenant.id,
          staffMember.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'staff',
          { email, reason: 'account_locked' }
        );
        return { success: false, error: 'Account is temporarily locked due to too many failed attempts' };
      }

      // Check for suspicious activity
      const suspiciousCheck = await SecurityService.checkSuspiciousActivity(
        staffMember.id,
        ipAddress,
        'login'
      );

      if (suspiciousCheck.shouldBlock) {
        await SecurityService.logSecurityEvent(
          tenant.id,
          staffMember.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'staff',
          { email, reason: 'suspicious_activity', details: suspiciousCheck.reason }
        );
        return { success: false, error: 'Login blocked due to suspicious activity' };
      }

      let isValidPassword = false;

      // Check if staff has a password hash
      if (staffMember.passwordHash) {
        isValidPassword = await this.verifyPassword(password, staffMember.passwordHash);
      } else {
        // Fallback for development/migration - check against default password
        if (process.env.NODE_ENV === 'development' && password === 'staff123') {
          isValidPassword = true;
          // Hash and store the password for future use
          const hashedPassword = await this.hashPassword(password);
          await db.update(staff).set({ passwordHash: hashedPassword }).where(eq(staff.id, staffMember.id));
        }
      }
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const currentAttempts = staffMember.loginAttempts ?? 0;
        const newAttempts = currentAttempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await db.update(staff).set({
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 minutes
        }).where(eq(staff.id, staffMember.id));

        await SecurityService.logSecurityEvent(
          tenant.id,
          staffMember.id,
          'login',
          false,
          ipAddress,
          userAgent,
          'staff',
          { email, attempts: newAttempts, locked: shouldLock }
        );

        return { success: false, error: 'Invalid credentials' };
      }

      // Reset login attempts on successful login
      await db.update(staff).set({
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      }).where(eq(staff.id, staffMember.id));

      const session: TenantSession = {
        userId: staffMember.id,
        tenantId: tenant.id,
        role: staffMember.role as 'admin' | 'staff',
        permissions: Array.isArray(staffMember.permissions) ? staffMember.permissions : [],
        email: staffMember.email,
        name: staffMember.name,
      };

      await this.setAuthCookie(session);

      // Log successful login
      await SecurityService.logSecurityEvent(
        tenant.id,
        staffMember.id,
        'login',
        true,
        ipAddress,
        userAgent,
        'staff',
        { email }
      );

      return { success: true, session };
    } catch (error) {
      console.error('Staff authentication failed:', error);
      return { success: false, error: 'Authentication failed' };
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

  // Authenticate super admin (platform-wide access)
  static async authenticateSuperAdmin(
    email: string,
    password: string,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<AuthResult> {
    try {
      // Import SuperAdminService
      const { SuperAdminService } = await import('./superadmin-service');
      
      // Authenticate using SuperAdminService
      const authResult = await SuperAdminService.authenticate(email, password);

      if (!authResult.success) {
        // Log failed attempt (disabled for now due to DB issues)
        // await SecurityService.logSecurityEvent(
        //   'platform',
        //   'unknown',
        //   'login',
        //   false,
        //   ipAddress,
        //   userAgent,
        //   'superadmin',
        //   { email, reason: authResult.error }
        // );
        return { success: false, error: authResult.error };
      }

      const superAdmin = authResult.superAdmin!;

      const session: TenantSession = {
        userId: superAdmin.id,
        tenantId: 'platform', // Special tenant ID for superadmin
        role: 'superadmin',
        permissions: ['*'], // All permissions across all tenants
        email: superAdmin.email,
        name: superAdmin.name,
        isSuperAdmin: true,
      };

      await this.setAuthCookie(session);

      // Log successful login (disabled for now due to DB issues)
      // await SecurityService.logSecurityEvent(
      //   'platform',
      //   superAdmin.id,
      //   'login',
      //   true,
      //   ipAddress,
      //   userAgent,
      //   'superadmin',
      //   { email }
      // );

      return { success: true, session };
    } catch (error) {
      console.error('SuperAdmin authentication failed:', error);
      return { success: false, error: 'Authentication failed' };
    }
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
    if (session) {
      // Log logout event
      await SecurityService.logSecurityEvent(
        session.tenantId,
        session.userId,
        'logout',
        true,
        ipAddress,
        userAgent,
        session.role
      );
    }
    
    await this.clearAuthCookie();
  }

  // Set password for tenant owner
  static async setOwnerPassword(
    tenantId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password strength
      const validation = SecurityService.validatePassword(newPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Hash password
      const passwordHash = await this.hashPassword(newPassword);

      // Update tenant
      await db.update(tenants).set({ 
        passwordHash,
        loginAttempts: 0,
        lockedUntil: null,
      }).where(eq(tenants.id, tenantId));

      return { success: true };
    } catch (error) {
      console.error('Failed to set owner password:', error);
      return { success: false, error: 'Failed to set password' };
    }
  }

  // Set password for staff member
  static async setStaffPassword(
    staffId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password strength
      const validation = SecurityService.validatePassword(newPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Hash password
      const passwordHash = await this.hashPassword(newPassword);

      // Update staff
      await db.update(staff).set({ 
        passwordHash,
        loginAttempts: 0,
        lockedUntil: null,
      }).where(eq(staff.id, staffId));

      return { success: true };
    } catch (error) {
      console.error('Failed to set staff password:', error);
      return { success: false, error: 'Failed to set password' };
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(
    email: string,
    subdomain: string,
    userType: 'owner' | 'staff'
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { token, hashedToken, expiresAt } = await SecurityService.generatePasswordResetToken();

      if (userType === 'owner') {
        const tenantResult = await db.select().from(tenants).where(
          and(
            eq(tenants.subdomain, subdomain),
            eq(tenants.email, email)
          )
        ).limit(1);
        
        const tenant = tenantResult[0] || null;

        if (!tenant) {
          return { success: false, error: 'User not found' };
        }

        await db.update(tenants).set({
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        }).where(eq(tenants.id, tenant.id));
      } else {
        const tenantResult = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
        const tenant = tenantResult[0] || null;

        if (!tenant) {
          return { success: false, error: 'Tenant not found' };
        }

        const staffResult = await db.select().from(staff).where(
          and(
            eq(staff.tenantId, tenant.id),
            eq(staff.email, email)
          )
        ).limit(1);
        
        const staffMember = staffResult[0] || null;

        if (!staffMember) {
          return { success: false, error: 'User not found' };
        }

        await db.update(staff).set({
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        }).where(eq(staff.id, staffMember.id));
      }

      return { success: true, token };
    } catch (error) {
      console.error('Failed to generate password reset token:', error);
      return { success: false, error: 'Failed to generate password reset token' };
    }
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
export async function getTenantFromRequest(request: NextRequest): Promise<{ id: string; name: string } | null> {
  try {
    const session = await TenantAuth.getSessionFromRequest(request);
    if (!session) {
      return null;
    }

    // For superadmin, we might need to get tenant from URL params or headers
    if (session.isSuperAdmin) {
      // Extract tenant ID from URL or headers if needed
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const tenantIdIndex = pathParts.findIndex(part => part === 'tenant') + 1;
      if (tenantIdIndex > 0 && pathParts[tenantIdIndex]) {
        return { id: pathParts[tenantIdIndex], name: 'Platform Admin Access' };
      }
    }

    return { id: session.tenantId, name: session.name };
  } catch (error) {
    console.error('Error getting tenant from request:', error);
    return null;
  }
}

export async function getTenantSession(request?: NextRequest): Promise<TenantSession | null> {
  if (request) {
    return await TenantAuth.getSessionFromRequest(request);
  } else {
    // For server components, get session from cookies
    return await TenantAuth.getSession();
  }
}
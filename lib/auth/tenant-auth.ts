import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SecurityService } from '@/lib/security/security-service';
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
  static async setAuthCookie(session: TenantSession): Promise<void> {
    const sessionId = await persistSession(session);
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
  static async getCurrentSession(): Promise<TenantSession | null> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      return await retrieveSession(sessionId);
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  // Get session from request (for middleware)
  static async getSessionFromRequest(
    request: NextRequest
  ): Promise<TenantSession | null> {
    try {
      const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      return await retrieveSession(sessionId);
    } catch (error) {
      console.error('Failed to get session from request:', error);
      return null;
    }
  }

  // Clear authentication cookie
  static async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      await removeSession(sessionId);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  // Get session from cookies (for server components)
  static async getSession(): Promise<TenantSession | null> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      
      if (!sessionId) {
        return null;
      }

      return await retrieveSession(sessionId);
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Find tenant by subdomain and email
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('email', email)
        .limit(1)
        .single();

      const tenant = tenantError ? null : tenantData;

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
          await supabase
            .from('tenants')
            .update({ passwordHash: hashedPassword })
            .eq('id', tenant.id);
        }
      }
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const currentAttempts = tenant.loginAttempts ?? 0;
        const newAttempts = currentAttempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await supabase
          .from('tenants')
          .update({
            loginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
          })
          .eq('id', tenant.id);

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
      await supabase
        .from('tenants')
        .update({
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date().toISOString(),
        })
        .eq('id', tenant.id);

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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Find tenant first
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .limit(1)
        .single();
      
      const tenant = tenantError ? null : tenantData;

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
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('tenantId', tenant.id)
        .eq('email', email)
        .eq('isActive', true)
        .limit(1)
        .single();
      
      const staffMember = staffError ? null : staffData;

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
          await supabase
            .from('staff')
            .update({ passwordHash: hashedPassword })
            .eq('id', staffMember.id);
        }
      }
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const currentAttempts = staffMember.loginAttempts ?? 0;
        const newAttempts = currentAttempts + 1;
        const shouldLock = newAttempts >= 5;
        
        await supabase
          .from('staff')
          .update({
            loginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
          })
          .eq('id', staffMember.id);

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
      await supabase
        .from('staff')
        .update({
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date().toISOString(),
        })
        .eq('id', staffMember.id);

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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Validate password strength
      const validation = SecurityService.validatePassword(newPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Hash password
      const passwordHash = await this.hashPassword(newPassword);

      // Update tenant
      const { error } = await supabase
        .from('tenants')
        .update({
          passwordHash,
          loginAttempts: 0,
          lockedUntil: null,
        })
        .eq('id', tenantId);
      
      if (error) throw error;

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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Validate password strength
      const validation = SecurityService.validatePassword(newPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Hash password
      const passwordHash = await this.hashPassword(newPassword);

      // Update staff
      const { error } = await supabase
        .from('staff')
        .update({
          passwordHash,
          loginAttempts: 0,
          lockedUntil: null,
        })
        .eq('id', staffId);
      
      if (error) throw error;

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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { token, hashedToken, expiresAt } = await SecurityService.generatePasswordResetToken();

      if (userType === 'owner') {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('email', email)
          .limit(1)
          .single();
        
        const tenant = tenantError ? null : tenantData;

        if (!tenant) {
          return { success: false, error: 'User not found' };
        }

        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            passwordResetToken: hashedToken,
            passwordResetExpires: expiresAt.toISOString(),
          })
          .eq('id', tenant.id);
        
        if (updateError) throw updateError;
      } else {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .limit(1)
          .single();
        
        const tenant = tenantError ? null : tenantData;

        if (!tenant) {
          return { success: false, error: 'Tenant not found' };
        }

        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('tenantId', tenant.id)
          .eq('email', email)
          .limit(1)
          .single();
        
        const staffMember = staffError ? null : staffData;

        if (!staffMember) {
          return { success: false, error: 'User not found' };
        }

        const { error: updateError } = await supabase
          .from('staff')
          .update({
            passwordResetToken: hashedToken,
            passwordResetExpires: expiresAt.toISOString(),
          })
          .eq('id', staffMember.id);
        
        if (updateError) throw updateError;
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
    const url = new URL(request.url);
    const session = await TenantAuth.getSessionFromRequest(request);

    if (session) {
      if (session.isSuperAdmin) {
        const pathParts = url.pathname.split('/');
        const tenantIdIndex = pathParts.findIndex(part => part === 'tenant') + 1;
        if (tenantIdIndex > 0 && pathParts[tenantIdIndex]) {
          return { id: pathParts[tenantIdIndex], name: 'Platform Admin Access' };
        }
      }

      return { id: session.tenantId, name: session.name };
    }

    const headerTenant = request.headers.get('x-tenant-id') ?? request.headers.get('x-tenant-subdomain');
    const queryTenant = url.searchParams.get('tenantId') ?? url.searchParams.get('subdomain');
    const identifier = (headerTenant ?? queryTenant)?.trim();

    if (identifier) {
      const resolvedTenant = await resolveTenantByIdentifier(identifier);
      if (resolvedTenant) {
        return resolvedTenant;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting tenant from request:', error);
    return null;
  }
}

async function resolveTenantByIdentifier(identifier: string): Promise<{ id: string; name: string } | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const isUuid = identifier.length === 36 && identifier.includes('-');

    if (isUuid) {
      const { data } = await supabase
        .from('tenants')
        .select('id, business_name')
        .eq('id', identifier)
        .single();

      if (data) {
        const businessName = (data as any).business_name ?? (data as any).businessName ?? 'Tenant';
        return { id: data.id, name: businessName };
      }
    } else {
      const { data } = await supabase
        .from('tenants')
        .select('id, business_name')
        .eq('subdomain', identifier)
        .single();

      if (data) {
        const businessName = (data as any).business_name ?? (data as any).businessName ?? 'Tenant';
        return { id: data.id, name: businessName };
      }
    }
  } catch (error) {
    console.error('Failed to resolve tenant identifier:', error);
  }

  return null;
}

export async function getTenantSession(request?: NextRequest): Promise<TenantSession | null> {
  if (request) {
    return await TenantAuth.getSessionFromRequest(request);
  } else {
    // For server components, get session from cookies
    return await TenantAuth.getSession();
  }
}
'use server';

import { cookies } from 'next/headers';

// This action requires Node.js runtime due to database access and bcrypt usage
export const runtime = 'nodejs';
import { redirect } from 'next/navigation';
import { db } from '@/lib/database';
import { SecurityService } from '@/lib/security/security-service';
import { tenants, staff } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { TenantAuth } from '@/lib/auth/tenant-auth';
import type { TenantSession } from '@/lib/auth/types';

interface LoginCredentials {
  email: string;
  password: string;
  subdomain: string;
}

interface SuperAdminLoginCredentials {
  email: string;
  password: string;
}

/**
 * Authenticate tenant owner (server action)
 * This is an edge-incompatible function since it accesses DB and uses bcrypt
 * It should only be used in server actions
 */
export async function authenticateOwner(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; redirect?: string }> {
  const { email, password, subdomain } = credentials;
  const headers = await import('next/headers');
  const request = { headers: await headers.headers() } as any; // Simplified
  const ipAddress = request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

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
      isValidPassword = await SecurityService.verifyPassword(password, tenant.passwordHash);
    } else {
      // Fallback for development/migration - check against default password
      if (process.env.NODE_ENV === 'development' && password === 'admin123') {
        isValidPassword = true;
        // Hash and store the password for future use
        const hashedPassword = await SecurityService.hashPassword(password);
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

    await TenantAuth.setAuthCookie(session);

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

    return { success: true, redirect: `/s/${subdomain}` };
  } catch (error) {
    console.error('Owner authentication failed:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Authenticate staff member (server action)
 * This is an edge-incompatible function since it accesses DB and uses bcrypt
 * It should only be used in server actions
 */
export async function authenticateStaff(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; redirect?: string }> {
  const { email, password, subdomain } = credentials;
  const headers = await import('next/headers');
  const request = { headers: await headers.headers() } as any; // Simplified
  const ipAddress = request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

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
      isValidPassword = await SecurityService.verifyPassword(password, staffMember.passwordHash);
    } else {
      // Fallback for development/migration - check against default password
      if (process.env.NODE_ENV === 'development' && password === 'staff123') {
        isValidPassword = true;
        // Hash and store the password for future use
        const hashedPassword = await SecurityService.hashPassword(password);
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

    await TenantAuth.setAuthCookie(session);

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

    return { success: true, redirect: `/s/${subdomain}` };
  } catch (error) {
    console.error('Staff authentication failed:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Authenticate super admin (server action)
 */
export async function authenticateSuperAdmin(credentials: SuperAdminLoginCredentials): Promise<{ success: boolean; error?: string; redirect?: string }> {
  const { email, password } = credentials;
  const headers = await import('next/headers');
  const request = { headers: await headers.headers() } as any; // Simplified
  const ipAddress = request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Import SuperAdminService
    const { SuperAdminService } = await import('@/lib/auth/superadmin-service');
    
    // Authenticate using SuperAdminService
    const authResult = await SuperAdminService.authenticate(email, password);

    if (!authResult.success) {
      // Log failed attempt (disabled for now due to DB issues)
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

    await TenantAuth.setAuthCookie(session);

    // Log successful login (disabled for now due to DB issues)
    return { success: true, redirect: '/admin' };
  } catch (error) {
    console.error('SuperAdmin authentication failed:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Logout function (server action)
 */
export async function logout(redirectUrl = '/login'): Promise<void> {
  const headers = await import('next/headers');
  const request = { headers: await headers.headers() } as any; // Simplified
  const ipAddress = request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Get current session before clearing
  const session = await TenantAuth.getCurrentSession();
  
  await TenantAuth.logout(session ?? undefined, ipAddress, userAgent);
  
  redirect(redirectUrl);
}
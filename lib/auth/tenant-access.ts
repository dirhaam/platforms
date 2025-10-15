import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TenantAuth } from '@/lib/auth/tenant-auth-edge';
import type { TenantSession, Permission } from '@/lib/auth/types';
import { db } from '@/lib/database/server';
import { tenants } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

/**
 * Server-side helper to verify that a session has access to a specific tenant
 * This function can only be used in server components or server actions
 */
export async function verifyTenantAccess(
  session: TenantSession,
  subdomain: string
): Promise<boolean> {
  try {
    // Superadmin has access to all tenants
    if (session.role === 'superadmin' && session.isSuperAdmin) {
      return true;
    }

    // In Edge Runtime compatible approach, we'll check against session data
    // and optionally validate with database if needed in server components
    
    // First, check if tenant ID in session matches the subdomain
    // In our JWT-based approach, session.tenantId comes from the JWT token
    // so we could validate it against the actual tenant data if necessary
    
    // For now, just verify that the subdomain matches the expected tenant
    // In a real implementation, we might need to make an async call to our Supabase database
    // to verify that the tenant actually exists and the session is valid
    
    // This is a simplified check - in a real implementation you might want to 
    // verify against the actual tenant data from Supabase
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    return tenant?.id === session.tenantId;
  } catch (error) {
    console.error('Failed to verify tenant access:', error);
    return false;
  }
}

/**
 * Server-side helper to require tenant access in server components
 * Redirects to login if not authorized
 */
export async function requireTenantAccess(subdomain: string): Promise<TenantSession> {
  const session = await TenantAuth.getCurrentSession();
  
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent('/s/' + subdomain)}`);
  }

  const hasAccess = await verifyTenantAccess(session, subdomain);
  if (!hasAccess) {
    redirect(`/login?error=invalid_tenant&redirect=${encodeURIComponent('/s/' + subdomain)}`);
  }

  return session;
}

/**
 * Server-side helper to require admin access for tenant
 * Redirects to unauthorized if not authorized
 */
export async function requireTenantAdminAccess(subdomain: string): Promise<TenantSession> {
  const session = await requireTenantAccess(subdomain);
  
  if (!['owner', 'admin'].includes(session.role)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Server-side helper to require specific permission
 * Redirects to unauthorized if not authorized
 */
export async function requirePermission(
  subdomain: string,
  requiredPermission: Permission
): Promise<TenantSession> {
  const session = await requireTenantAccess(subdomain);
  
  if (!TenantAuth.hasPermission(session, requiredPermission)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Server-side helper to get tenant info for the current session
 */
export async function getCurrentTenantInfo(subdomain: string) {
  const session = await TenantAuth.getCurrentSession();
  
  if (!session) {
    return null;
  }

  try {
    const [tenant] = await db
      .select({ 
        id: tenants.id,
        businessName: tenants.businessName,
        subdomain: tenants.subdomain,
        emoji: tenants.emoji,
        homeVisitEnabled: tenants.homeVisitEnabled,
        whatsappEnabled: tenants.whatsappEnabled
      })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (!tenant || tenant.id !== session.tenantId) {
      return null;
    }

    return tenant;
  } catch (error) {
    console.error('Failed to get tenant info:', error);
    return null;
  }
}
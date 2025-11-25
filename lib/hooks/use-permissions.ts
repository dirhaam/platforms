'use client';

import { useEffect, useState, useCallback } from 'react';
import { PermissionService, UserRole, RolePermissions } from '@/lib/auth/permission-service';

interface SessionData {
  userId?: string;
  tenantId?: string;
  role?: UserRole;
  permissions?: string[];
  email?: string;
  name?: string;
  isSuperAdmin?: boolean;
  rolePermissions?: RolePermissions;
  visibleFeatures?: string[];
}

/**
 * Hook to check user permissions in client components
 * 
 * Usage:
 * const { canAccess, canPerform, role, loading } = usePermissions();
 * 
 * if (canAccess('staff')) {
 *   // Show staff management features
 * }
 * 
 * if (canPerform('bookings', 'delete')) {
 *   // Show delete button
 * }
 */
export function usePermissions() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession({
            userId: data.userId || data.session?.userId,
            tenantId: data.tenantId || data.session?.tenantId,
            role: data.role || data.session?.role,
            permissions: data.permissions || data.session?.permissions || [],
            email: data.email || data.session?.email,
            name: data.name || data.session?.name,
            isSuperAdmin: data.isSuperAdmin || data.session?.isSuperAdmin,
            rolePermissions: data.rolePermissions,
            visibleFeatures: data.visibleFeatures,
          });
          
          // Set role-based permissions
          if (data.rolePermissions) {
            setPermissions(data.rolePermissions);
          } else if (data.role || data.session?.role) {
            const role = data.role || data.session?.role;
            const perms = PermissionService.getDefaultPermissions(role);
            setPermissions(perms);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const canAccess = useCallback((
    feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance'
  ): boolean => {
    if (!session?.role) return false;
    
    // Superadmin and owner have full access
    if (session.isSuperAdmin || session.role === 'owner' || session.role === 'superadmin') {
      return true;
    }
    
    // Check from visibleFeatures if available
    if (session.visibleFeatures) {
      return session.visibleFeatures.includes(feature);
    }
    
    return PermissionService.canAccess(session.role, feature);
  }, [session]);

  const canPerform = useCallback((
    resource: 'bookings' | 'customers' | 'services' | 'staff',
    action: 'view' | 'create' | 'update' | 'delete'
  ): boolean => {
    if (!session?.role) return false;
    
    // Superadmin and owner have full access
    if (session.isSuperAdmin || session.role === 'owner' || session.role === 'superadmin') {
      return true;
    }
    
    return PermissionService.canPerform(session.role, resource, action);
  }, [session]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!session) return false;
    
    // Superadmin and owner have all permissions
    if (session.isSuperAdmin || session.role === 'owner' || session.role === 'superadmin') {
      return true;
    }
    
    // Check wildcard
    if (session.permissions?.includes('*')) {
      return true;
    }
    
    return session.permissions?.includes(permission) || false;
  }, [session]);

  const getVisibleNavItems = useCallback((): string[] => {
    if (!session?.role) return [];
    
    // Return from session if available
    if (session.visibleFeatures) {
      return session.visibleFeatures;
    }
    
    return PermissionService.getVisibleNavItems(session.role);
  }, [session]);

  const isOwnerOrAdmin = useCallback((): boolean => {
    if (!session?.role) return false;
    return ['owner', 'admin', 'superadmin'].includes(session.role);
  }, [session]);

  const isStaffOnly = useCallback((): boolean => {
    if (!session?.role) return false;
    return session.role === 'staff';
  }, [session]);

  return {
    role: session?.role,
    permissions,
    loading,
    canAccess,
    canPerform,
    hasPermission,
    getVisibleNavItems,
    isOwnerOrAdmin,
    isStaffOnly,
    session,
    isSuperAdmin: session?.isSuperAdmin || false,
  };
}

/**
 * Simple hook to check specific resource permissions
 * 
 * Usage:
 * const { canView, canCreate, canUpdate, canDelete } = useResourcePermissions('bookings');
 */
export function useResourcePermissions(resource: 'bookings' | 'customers' | 'services' | 'staff') {
  const { canPerform, loading } = usePermissions();

  return {
    canView: canPerform(resource, 'view'),
    canCreate: canPerform(resource, 'create'),
    canUpdate: canPerform(resource, 'update'),
    canDelete: canPerform(resource, 'delete'),
    loading,
  };
}

/**
 * Simple hook to check if feature is accessible
 * 
 * Usage:
 * const canViewStaff = useCanAccess('staff');
 */
export function useCanAccess(
  feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance'
) {
  const { canAccess, loading } = usePermissions();
  return { hasAccess: canAccess(feature), loading };
}

/**
 * Hook to get current user role
 */
export function useUserRole() {
  const { role, loading, isSuperAdmin, isOwnerOrAdmin, isStaffOnly } = usePermissions();
  return { role, loading, isSuperAdmin, isOwnerOrAdmin: isOwnerOrAdmin(), isStaffOnly: isStaffOnly() };
}

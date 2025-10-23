'use client';

import { useEffect, useState } from 'react';
import { PermissionService, UserRole, RolePermissions } from '@/lib/auth/permission-service';

interface SessionData {
  role?: UserRole;
  permissions?: string[];
  tenantId?: string;
  email?: string;
  name?: string;
}

/**
 * Hook to check user permissions in client components
 * Usage:
 * const { canView, canCreate, canUpdate, canDelete } = usePermissions('bookings');
 * const { canAccess } = usePermissions();
 * 
 * if (canAccess('staff')) {
 *   // Show staff management features
 * }
 */
export function usePermissions() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);

  useEffect(() => {
    // Get session from cookie or localStorage
    const getSession = async () => {
      try {
        // Try to get session from API
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          
          // Parse permissions based on role
          if (data.role) {
            const perms = PermissionService.getDefaultPermissions(data.role);
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

  const canAccess = (feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance'): boolean => {
    if (!session?.role) return false;
    return PermissionService.canAccess(session.role, feature);
  };

  const canPerform = (resource: 'bookings' | 'customers' | 'services' | 'staff', action: 'view' | 'create' | 'update' | 'delete'): boolean => {
    if (!session?.role) return false;
    return PermissionService.canPerform(session.role, resource, action);
  };

  const getVisibleNavItems = (): string[] => {
    if (!session?.role) return [];
    return PermissionService.getVisibleNavItems(session.role);
  };

  return {
    role: session?.role,
    permissions,
    loading,
    canAccess,
    canPerform,
    getVisibleNavItems,
    session,
  };
}

/**
 * Simple hook to check specific resource permissions
 * Usage:
 * const { canView, canCreate, canUpdate, canDelete } = useResourcePermissions('bookings');
 */
export function useResourcePermissions(resource: 'bookings' | 'customers' | 'services' | 'staff') {
  const { canPerform } = usePermissions();

  return {
    canView: canPerform(resource, 'view'),
    canCreate: canPerform(resource, 'create'),
    canUpdate: canPerform(resource, 'update'),
    canDelete: canPerform(resource, 'delete'),
  };
}

/**
 * Simple hook to check if feature is accessible
 * Usage:
 * const canViewStaff = useCanAccess('staff');
 */
export function useCanAccess(feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance') {
  const { canAccess } = usePermissions();
  return canAccess(feature);
}

import type { TenantSession, Permission } from './types';
import * as React from 'react';

// Role definitions
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description: string;
}

// Predefined roles
export const ROLES: Record<string, Role> = {
  SUPERADMIN: {
    id: 'superadmin',
    name: 'Super Administrator',
    permissions: ['*'] as Permission[], // All permissions across all tenants
    description: 'Platform-wide access to all tenants and administrative features',
  },
  OWNER: {
    id: 'owner',
    name: 'Business Owner',
    permissions: ['*'] as Permission[], // All permissions
    description: 'Full access to all features and settings',
  },
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      'manage_bookings',
      'manage_customers',
      'manage_services',
      'view_analytics',
      'send_messages',
      'manage_staff',
      'export_data',
      'manage_settings',
    ] as Permission[],
    description: 'Administrative access with most features',
  },
  STAFF: {
    id: 'staff',
    name: 'Staff Member',
    permissions: [
      'manage_bookings',
      'view_customers',
      'send_messages',
    ] as Permission[],
    description: 'Basic staff access for daily operations',
  },
  RECEPTIONIST: {
    id: 'receptionist',
    name: 'Receptionist',
    permissions: [
      'manage_bookings',
      'manage_customers',
      'send_messages',
    ] as Permission[],
    description: 'Front desk operations and customer management',
  },
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  BOOKING_MANAGEMENT: {
    name: 'Booking Management',
    permissions: ['manage_bookings'] as Permission[],
    description: 'Create, edit, and manage bookings',
  },
  CUSTOMER_MANAGEMENT: {
    name: 'Customer Management',
    permissions: ['manage_customers', 'view_customers'] as Permission[],
    description: 'Manage customer information and history',
  },
  SERVICE_MANAGEMENT: {
    name: 'Service Management',
    permissions: ['manage_services'] as Permission[],
    description: 'Create and manage service offerings',
  },
  COMMUNICATION: {
    name: 'Communication',
    permissions: ['send_messages'] as Permission[],
    description: 'Send messages and communicate with customers',
  },
  ANALYTICS: {
    name: 'Analytics & Reports',
    permissions: ['view_analytics', 'export_data'] as Permission[],
    description: 'View business analytics and export data',
  },
  ADMINISTRATION: {
    name: 'Administration',
    permissions: ['manage_staff', 'manage_settings'] as Permission[],
    description: 'Manage staff and business settings',
  },
} as const;

export class RBAC {
  // Check if session has specific permission
  static hasPermission(session: TenantSession | null, permission: Permission): boolean {
    if (!session) return false;
    
    // Superadmin and Owner have all permissions
    if (session.role === 'superadmin' || session.role === 'owner' || session.permissions.includes('*')) {
      return true;
    }

    return session.permissions.includes(permission);
  }

  // Check if session has any of the specified permissions
  static hasAnyPermission(session: TenantSession | null, permissions: Permission[]): boolean {
    if (!session) return false;
    
    return permissions.some(permission => this.hasPermission(session, permission));
  }

  // Check if session has all of the specified permissions
  static hasAllPermissions(session: TenantSession | null, permissions: Permission[]): boolean {
    if (!session) return false;
    
    return permissions.every(permission => this.hasPermission(session, permission));
  }

  // Check if session has specific role
  static hasRole(session: TenantSession | null, role: string): boolean {
    if (!session) return false;
    return session.role === role;
  }

  // Check if session has any of the specified roles
  static hasAnyRole(session: TenantSession | null, roles: string[]): boolean {
    if (!session) return false;
    return roles.includes(session.role);
  }

  // Get role definition
  static getRole(roleId: string): Role | undefined {
    return Object.values(ROLES).find(role => role.id === roleId);
  }

  // Get all available roles
  static getAllRoles(): Role[] {
    return Object.values(ROLES);
  }

  // Get permissions for a role
  static getPermissionsForRole(roleId: string): Permission[] {
    const role = this.getRole(roleId);
    return role ? role.permissions : [];
  }

  // Check if user can access a specific route/feature
  static canAccessFeature(session: TenantSession | null, feature: string): boolean {
    if (!session) return false;

    const featurePermissions: Record<string, Permission[]> = {
      'dashboard': ['manage_bookings', 'view_customers'],
      'bookings': ['manage_bookings'],
      'customers': ['manage_customers', 'view_customers'],
      'services': ['manage_services'],
      'staff': ['manage_staff'],
      'analytics': ['view_analytics'],
      'messages': ['send_messages'],
      'settings': ['manage_settings'],
      'export': ['export_data'],
    };

    const requiredPermissions = featurePermissions[feature];
    if (!requiredPermissions) return true; // No specific permissions required

    return this.hasAnyPermission(session, requiredPermissions);
  }

  // Get accessible features for a session
  static getAccessibleFeatures(session: TenantSession | null): string[] {
    if (!session) return [];

    const features = [
      'dashboard',
      'bookings', 
      'customers',
      'services',
      'staff',
      'analytics',
      'messages',
      'settings',
      'export',
    ];

    return features.filter(feature => this.canAccessFeature(session, feature));
  }

  // Validate role assignment (ensure role exists and is valid)
  static validateRole(roleId: string): boolean {
    return Object.keys(ROLES).includes(roleId.toUpperCase());
  }

  // Get permission description
  static getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
      'manage_bookings': 'Create, edit, cancel, and manage all bookings',
      'manage_customers': 'Add, edit, and manage customer information',
      'view_customers': 'View customer information and booking history',
      'manage_services': 'Create, edit, and manage service offerings',
      'manage_staff': 'Add, edit, and manage staff members and their roles',
      'view_analytics': 'View business analytics and performance metrics',
      'send_messages': 'Send messages to customers via WhatsApp or other channels',
      'manage_settings': 'Modify business settings and configuration',
      'export_data': 'Export business data and generate reports',
      '*': 'All permissions (wildcard access)',
    };

    return descriptions[permission] || 'Unknown permission';
  }

  // Create custom role (for future extensibility)
  static createCustomRole(
    id: string,
    name: string,
    permissions: Permission[],
    description: string
  ): Role {
    return {
      id,
      name,
      permissions,
      description,
    };
  }

  // Check if permissions are sufficient for an action
  static canPerformAction(
    session: TenantSession | null,
    action: string,
    resource?: string
  ): boolean {
    if (!session) return false;

    // Define action-permission mappings
    const actionPermissions: Record<string, Permission[]> = {
      'create_booking': ['manage_bookings'],
      'edit_booking': ['manage_bookings'],
      'cancel_booking': ['manage_bookings'],
      'view_booking': ['manage_bookings', 'view_customers'],
      'create_customer': ['manage_customers'],
      'edit_customer': ['manage_customers'],
      'view_customer': ['manage_customers', 'view_customers'],
      'create_service': ['manage_services'],
      'edit_service': ['manage_services'],
      'delete_service': ['manage_services'],
      'send_message': ['send_messages'],
      'view_analytics': ['view_analytics'],
      'export_data': ['export_data'],
      'manage_staff_member': ['manage_staff'],
      'change_settings': ['manage_settings'],
    };

    const requiredPermissions = actionPermissions[action];
    if (!requiredPermissions) return true;

    return this.hasAnyPermission(session, requiredPermissions);
  }
}

// Higher-order component for permission checking
export function withPermission<T extends object>(
  permission: Permission,
  component: React.ComponentType<T>
): React.ComponentType<T> {
  return function PermissionWrapper(props: T) {
    // This would be used in React components
    // Implementation would depend on how you manage session state
    return React.createElement(component, props);
  };
}

// Route protection utility
export interface RouteProtection {
  permissions?: Permission[];
  roles?: string[];
  requireAll?: boolean; // If true, requires ALL permissions/roles, otherwise ANY
}

export class RouteGuard {
  static canAccessRoute(
    session: TenantSession | null,
    protection: RouteProtection
  ): boolean {
    if (!session) return false;

    const { permissions = [], roles = [], requireAll = false } = protection;

    // Check roles if specified
    if (roles.length > 0) {
      const hasRole = requireAll 
        ? roles.every(role => RBAC.hasRole(session, role))
        : RBAC.hasAnyRole(session, roles);
      
      if (!hasRole) return false;
    }

    // Check permissions if specified
    if (permissions.length > 0) {
      const hasPermission = requireAll
        ? RBAC.hasAllPermissions(session, permissions)
        : RBAC.hasAnyPermission(session, permissions);
      
      if (!hasPermission) return false;
    }

    return true;
  }
}
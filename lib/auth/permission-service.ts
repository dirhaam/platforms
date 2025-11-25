/**
 * Permission Service
 * Handles role-based access control (RBAC) for the application
 */

export type UserRole = 'owner' | 'admin' | 'staff' | 'superadmin';

export interface RolePermissions {
  bookings: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  customers: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  services: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  staff: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  analytics: boolean;
  settings: boolean;
  messages: boolean;
  finance: boolean;
}

export class PermissionService {
  /**
   * Get default permissions for a role
   */
  static getDefaultPermissions(role: UserRole): RolePermissions {
    switch (role) {
      case 'owner':
      case 'admin':
        return {
          bookings: { view: true, create: true, update: true, delete: true },
          customers: { view: true, create: true, update: true, delete: true },
          services: { view: true, create: true, update: true, delete: true },
          staff: { view: true, create: true, update: true, delete: true },
          analytics: true,
          settings: true,
          messages: true,
          finance: true,
        };
      case 'staff':
        return {
          bookings: { view: true, create: true, update: true, delete: false },
          customers: { view: true, create: true, update: true, delete: false },
          services: { view: true, create: false, update: false, delete: false },
          staff: { view: false, create: false, update: false, delete: false },
          analytics: false,
          settings: false,
          messages: true,
          finance: false,
        };
      case 'superadmin':
        return {
          bookings: { view: true, create: true, update: true, delete: true },
          customers: { view: true, create: true, update: true, delete: true },
          services: { view: true, create: true, update: true, delete: true },
          staff: { view: true, create: true, update: true, delete: true },
          analytics: true,
          settings: true,
          messages: true,
          finance: true,
        };
      default:
        return {
          bookings: { view: false, create: false, update: false, delete: false },
          customers: { view: false, create: false, update: false, delete: false },
          services: { view: false, create: false, update: false, delete: false },
          staff: { view: false, create: false, update: false, delete: false },
          analytics: false,
          settings: false,
          messages: false,
          finance: false,
        };
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    role: UserRole,
    resource: keyof RolePermissions,
    action?: keyof (RolePermissions['bookings'] | RolePermissions)
  ): boolean {
    const permissions = this.getDefaultPermissions(role);
    
    if (action === undefined) {
      // Check boolean permission
      return (permissions[resource] as boolean) === true;
    }

    // Check specific action permission
    const resourcePermissions = permissions[resource];
    if (typeof resourcePermissions === 'boolean') {
      return resourcePermissions;
    }

    return (resourcePermissions[action as keyof typeof resourcePermissions] as boolean) === true;
  }

  /**
   * Get permissions from custom permission array
   * Format: 'resource.action' e.g., 'bookings.create', 'customers.view'
   */
  static parsePermissions(permissionStrings: string[]): RolePermissions {
    const permissions = this.getDefaultPermissions('staff'); // Start with minimal permissions

    permissionStrings.forEach(perm => {
      const [resource, action] = perm.split('.');
      if (resource && action && permissions[resource as keyof RolePermissions]) {
        const resourcePerms = permissions[resource as keyof RolePermissions];
        if (typeof resourcePerms === 'object' && action in resourcePerms) {
          (resourcePerms as any)[action] = true;
        }
      }
    });

    return permissions;
  }

  /**
   * Check if user can access a feature
   */
  static canAccess(
    role: UserRole | undefined,
    feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance'
  ): boolean {
    if (!role) return false;
    
    const permissions = this.getDefaultPermissions(role);
    const featurePermission = permissions[feature as keyof RolePermissions];
    
    // If it's a boolean (analytics, settings, messages, finance)
    if (typeof featurePermission === 'boolean') {
      return featurePermission;
    }
    
    // If it's an object (bookings, customers, services, staff), check if user has view permission
    if (typeof featurePermission === 'object' && featurePermission !== null) {
      return featurePermission.view === true;
    }
    
    return false;
  }

  /**
   * Check if user can perform action on resource
   */
  static canPerform(
    role: UserRole | undefined,
    resource: 'bookings' | 'customers' | 'services' | 'staff',
    action: 'view' | 'create' | 'update' | 'delete'
  ): boolean {
    if (!role) return false;
    return this.hasPermission(role, resource as keyof RolePermissions, action as any);
  }

  /**
   * Get visible navigation items based on role
   */
  static getVisibleNavItems(role: UserRole): string[] {
    const items: string[] = ['dashboard']; // Dashboard is always visible

    if (this.canAccess(role, 'bookings')) items.push('bookings');
    if (this.canAccess(role, 'customers')) items.push('customers');
    if (this.canAccess(role, 'services')) items.push('services');
    if (this.canAccess(role, 'staff')) items.push('staff');
    if (this.canAccess(role, 'analytics')) items.push('analytics');
    if (this.canAccess(role, 'settings')) items.push('settings');

    return items;
  }
}

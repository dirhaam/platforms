'use client';

import { ReactNode } from 'react';
import { usePermissions, useCanAccess, useResourcePermissions } from '@/lib/hooks/use-permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PermissionGateProps {
  feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance';
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Component to gate access to features based on user permissions
 * If user doesn't have permission, shows fallback or access denied message
 * 
 * Usage:
 * <PermissionGate feature="staff">
 *   <StaffManagement />
 * </PermissionGate>
 */
export function PermissionGate({ feature, children, fallback, showMessage = true }: PermissionGateProps) {
  const { hasAccess, loading } = useCanAccess(feature);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    
    if (!showMessage) return null;
    
    return <AccessDeniedMessage feature={feature} />;
  }

  return <>{children}</>;
}

/**
 * Component to conditionally show action button based on permissions
 * 
 * Usage:
 * <PermissionButton resource="bookings" action="delete">
 *   <Button variant="destructive">Delete</Button>
 * </PermissionButton>
 */
interface PermissionButtonProps {
  resource: 'bookings' | 'customers' | 'services' | 'staff';
  action: 'view' | 'create' | 'update' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionButton({ resource, action, children, fallback }: PermissionButtonProps) {
  const { canPerform, loading } = usePermissions();
  
  if (loading) return null;
  
  const hasPermission = canPerform(resource, action);

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for role-based access
 * 
 * Usage:
 * <RoleGate roles={['owner', 'admin']}>
 *   <AdminOnlyComponent />
 * </RoleGate>
 */
interface RoleGateProps {
  roles: ('owner' | 'admin' | 'staff' | 'superadmin')[];
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function RoleGate({ roles, children, fallback, showMessage = true }: RoleGateProps) {
  const { role, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    
    if (!showMessage) return null;
    
    return <AccessDeniedMessage />;
  }

  return <>{children}</>;
}

/**
 * Component for owner/admin only content
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGate roles={['owner', 'admin', 'superadmin']} fallback={fallback} showMessage={false}>
      {children}
    </RoleGate>
  );
}

/**
 * Component for owner only content
 */
export function OwnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGate roles={['owner', 'superadmin']} fallback={fallback} showMessage={false}>
      {children}
    </RoleGate>
  );
}

/**
 * Access denied message component
 */
function AccessDeniedMessage({ feature }: { feature?: string }) {
  const featureLabels: Record<string, string> = {
    bookings: 'Bookings',
    customers: 'Customers',
    services: 'Services',
    staff: 'Staff Management',
    analytics: 'Analytics',
    settings: 'Settings',
    messages: 'Messages',
    finance: 'Finance',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {feature 
          ? `Anda tidak memiliki izin untuk mengakses ${featureLabels[feature] || feature}. Hubungi admin untuk mendapatkan akses.`
          : 'Anda tidak memiliki izin untuk mengakses halaman ini.'
        }
      </p>
      <Button asChild variant="outline">
        <Link href="/tenant/admin">
          Kembali ke Dashboard
        </Link>
      </Button>
    </div>
  );
}

/**
 * Inline permission check - shows nothing if no access
 * Useful for hiding individual elements
 */
export function IfCanAccess({ 
  feature, 
  children 
}: { 
  feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance';
  children: ReactNode;
}) {
  return (
    <PermissionGate feature={feature} showMessage={false}>
      {children}
    </PermissionGate>
  );
}

/**
 * Inline role check - shows nothing if role doesn't match
 */
export function IfRole({ 
  roles, 
  children 
}: { 
  roles: ('owner' | 'admin' | 'staff' | 'superadmin')[];
  children: ReactNode;
}) {
  return (
    <RoleGate roles={roles} showMessage={false}>
      {children}
    </RoleGate>
  );
}

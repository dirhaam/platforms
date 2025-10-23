'use client';

import { ReactNode } from 'react';
import { useCanAccess } from '@/lib/hooks/use-permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PermissionGateProps {
  feature: 'bookings' | 'customers' | 'services' | 'staff' | 'analytics' | 'settings' | 'messages' | 'finance';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to gate access to features based on user permissions
 * If user doesn't have permission, shows fallback or nothing
 */
export function PermissionGate({ feature, children, fallback }: PermissionGateProps) {
  const hasAccess = useCanAccess(feature);

  if (!hasAccess) {
    return fallback || (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

/**
 * Component to conditionally show action button based on permissions
 */
interface PermissionButtonProps {
  resource: 'bookings' | 'customers' | 'services' | 'staff';
  action: 'view' | 'create' | 'update' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionButton({ resource, action, children, fallback }: PermissionButtonProps) {
  const { canPerform } = require('@/lib/hooks/use-permissions').usePermissions();
  const hasPermission = canPerform(resource, action);

  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
}

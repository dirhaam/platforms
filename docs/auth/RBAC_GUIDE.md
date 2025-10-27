# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This application implements a comprehensive Role-Based Access Control system with three user roles per tenant plus a SuperAdmin role for platform management.

## Roles & Permissions

### 1. **Owner/Admin**
- Full access to all features
- Can manage staff members
- Full permissions on:
  - ✅ View, Create, Update, Delete Bookings
  - ✅ View, Create, Update, Delete Customers
  - ✅ View, Create, Update, Delete Services
  - ✅ View, Create, Update, Delete Staff
  - ✅ Access Analytics
  - ✅ Access Settings
  - ✅ Access Messages
  - ✅ Access Finance

### 2. **Admin** 
- Most features enabled
- Cannot manage other admins
- Permissions:
  - ✅ View, Create, Update, Delete Bookings
  - ✅ View, Create, Update, Delete Customers
  - ✅ View, Create, Update, Delete Services
  - ✅ View, Create, Update, Delete Staff
  - ✅ Access Analytics
  - ✅ Access Settings
  - ✅ Access Messages
  - ✅ Access Finance

### 3. **Staff**
- Limited feature access
- Cannot manage staff or settings
- Permissions:
  - ✅ View, Create, Update Bookings (cannot delete)
  - ✅ View, Create, Update Customers (cannot delete)
  - ✅ View Services (cannot create/update/delete)
  - ❌ No staff management access
  - ❌ No analytics access
  - ❌ No settings access
  - ✅ Access Messages
  - ❌ No finance access

### 4. **SuperAdmin**
- Platform-wide access
- Manages all tenants
- Full permissions on all features
- Can create/manage SuperAdmins

## Implementation

### Permission Service (`lib/auth/permission-service.ts`)

Core service for permission checking:

```typescript
// Check if user can access a feature
PermissionService.canAccess(role, 'bookings');

// Check if user can perform action on resource
PermissionService.canPerform(role, 'bookings', 'delete');

// Get visible navigation items
PermissionService.getVisibleNavItems(role); // ['bookings', 'customers', ...]
```

### Hooks (`lib/hooks/use-permissions.ts`)

Client-side hooks for React components:

#### `usePermissions()`
```typescript
const { role, canAccess, canPerform, getVisibleNavItems } = usePermissions();

if (canAccess('staff')) {
  // Show staff management section
}

if (canPerform('bookings', 'delete')) {
  // Show delete button
}
```

#### `useResourcePermissions(resource)`
```typescript
const { canView, canCreate, canUpdate, canDelete } = useResourcePermissions('bookings');
```

#### `useCanAccess(feature)`
```typescript
const canViewStaff = useCanAccess('staff');
```

### Permission Gate Components (`components/tenant/permission-gate.tsx`)

```typescript
// Gate entire feature
<PermissionGate feature="staff">
  <StaffManagementComponent />
</PermissionGate>

// Show fallback if no access
<PermissionGate 
  feature="analytics" 
  fallback={<p>You don't have access to analytics</p>}
>
  <AnalyticsComponent />
</PermissionGate>
```

## Using RBAC in Components

### Example 1: Conditional Rendering Based on Feature Access
```typescript
'use client';

import { useCanAccess } from '@/lib/hooks/use-permissions';

export function Dashboard() {
  const canViewAnalytics = useCanAccess('analytics');
  const canManageStaff = useCanAccess('staff');

  return (
    <div>
      {canViewAnalytics && <AnalyticsCard />}
      {canManageStaff && <StaffManagementCard />}
    </div>
  );
}
```

### Example 2: Conditional Actions
```typescript
'use client';

import { useResourcePermissions } from '@/lib/hooks/use-permissions';
import { Button } from '@/components/ui/button';

export function BookingActions({ bookingId }) {
  const { canUpdate, canDelete } = useResourcePermissions('bookings');

  return (
    <div className="flex gap-2">
      <Button onClick={() => editBooking(bookingId)}>
        View
      </Button>
      
      {canUpdate && (
        <Button onClick={() => updateBooking(bookingId)} variant="outline">
          Edit
        </Button>
      )}
      
      {canDelete && (
        <Button onClick={() => deleteBooking(bookingId)} variant="destructive">
          Delete
        </Button>
      )}
    </div>
  );
}
```

### Example 3: Permission Gate Wrapper
```typescript
import { PermissionGate } from '@/components/tenant/permission-gate';

export function AdminPanel() {
  return (
    <PermissionGate 
      feature="staff"
      fallback={<p>Staff management is not available for your role.</p>}
    >
      <StaffManagementInterface />
    </PermissionGate>
  );
}
```

## API Endpoints

### Get Current Session
```
GET /api/auth/session

Response:
{
  "authenticated": true,
  "userId": "user-id",
  "tenantId": "tenant-id",
  "role": "admin",
  "permissions": ["bookings.view", "customers.create", ...],
  "email": "user@example.com",
  "name": "User Name"
}
```

## Creating Users with Specific Roles

### Via Admin Dashboard
1. Navigate to: `/admin/tenants/{tenant-id}/users`
2. Select role: Owner, Admin, or Staff
3. Fill user details
4. Click "Create [Role]"

### Permission Assignment
When creating users, permissions are automatically assigned based on role:
- **Owner/Admin**: Full permissions (`['*']`)
- **Staff**: Limited permissions
  - `bookings.view, bookings.create, bookings.update`
  - `customers.view, customers.create, customers.update`
  - `messages.view, messages.create`

## Database Structure

### Staff Table
```sql
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50), -- 'admin' or 'staff'
  permissions TEXT[], -- JSON array of permission strings
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Session Storage

Session data is stored in browser cookies with the format:
```
tenant-auth = inline.{base64-encoded-json}
```

Decoded session example:
```json
{
  "userId": "user-123",
  "tenantId": "tenant-456",
  "role": "admin",
  "permissions": ["bookings.view", "customers.create", ...],
  "email": "admin@example.com",
  "name": "Admin User"
}
```

## Best Practices

1. **Always check permissions on both client and server**
   - Client side: Better UX (hide unavailable features)
   - Server side: Security (validate before performing action)

2. **Use permission gates for sensitive features**
   - Prevents accidental exposure of UI
   - Shows helpful message when access denied

3. **Log permission denials**
   - Helps debug access issues
   - Good for audit trails

4. **Update permissions when role changes**
   - Permissions are loaded on app init
   - Refresh page to load new permissions

## Future Enhancements

- [ ] Custom permissions per user
- [ ] Time-based role access (temporary promotions)
- [ ] Permission inheritance from departments/groups
- [ ] Granular API endpoint access control
- [ ] Permission audit logging
- [ ] Two-factor authentication for sensitive roles

## Troubleshooting

### User can't access feature
1. Check user role in database
2. Verify permissions array for role
3. Check PermissionService.getDefaultPermissions(role)
4. Refresh browser to reload session

### Permission changes not reflecting
1. Logout and login again
2. Or refresh page to reload session from `/api/auth/session`

### RBAC showing "No permission" incorrectly
1. Check browser console for session fetch errors
2. Verify `/api/auth/session` endpoint returns correct role
3. Check cookie name matches ('tenant-auth')

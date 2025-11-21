# RBAC & Home Visit Task Assignment Inspection Report

## Executive Summary
Inspeksi RBAC dan home visit task assignment mengungkap beberapa issues penting terkait authorization, staff management, dan task assignment workflow.

---

## 1. RBAC Implementation Status

### 1.1 Current RBAC System ✓
**Files**: `lib/auth/rbac.ts`, `lib/auth/permission-service.ts`

**Roles Defined**:
- `superadmin` - Platform-wide access (all permissions)
- `owner` - Business owner (all permissions)
- `admin` - Administrator (manage_bookings, manage_customers, manage_services, view_analytics, send_messages, manage_staff, export_data, manage_settings)
- `staff` - Staff member (manage_bookings, view_customers, send_messages)
- `receptionist` - Front desk (manage_bookings, manage_customers, send_messages)

**Status**: ✓ Well-structured with proper permission checking methods

### 1.2 Permission Check Methods ✓
- `RBAC.hasPermission()` - Check single permission
- `RBAC.hasAnyPermission()` - Check any of multiple permissions
- `RBAC.hasAllPermissions()` - Check all permissions
- `RBAC.hasRole()` - Check specific role
- `RBAC.canAccessFeature()` - Check feature access

---

## 2. Authentication & Session Management

### 2.1 Tenant Auth Flow ✓
**File**: `lib/auth/tenant-auth.ts`

**Implemented**:
- Owner authentication (email/password)
- Staff authentication
- SuperAdmin authentication
- Session persistence with cookies
- Password hashing & verification
- Failed login attempt tracking (locks after 5 attempts)
- Suspicious activity detection

**Status**: ✓ Good implementation with security features

### 2.2 Middleware Protection ✓
**File**: `middleware.ts`

**Features**:
- Subdomain extraction
- Route protection for `/tenant/admin`
- Session verification
- Redirect to login if no session

**Status**: ✓ Basic protection in place

---

## 3. Staff Management Issues & Gaps

### 3.1 ❌ CRITICAL ISSUE: Staff CRUD Permission Check Missing

**Location**: `app/api/admin/staff/route.ts`

**Problem**:
```typescript
// ❌ NO PERMISSION CHECK - Anyone with valid tenant ID can fetch staff
export async function GET(request: NextRequest) {
  const tenantIdentifier = request.headers.get('x-tenant-id') ?? queryTenantId;
  // Returns all staff for tenant - NO RBAC CHECK
}
```

**Impact**: 
- Staff member can fetch other staff data
- No permission verification
- Potential data exposure

**Solution Needed**:
```typescript
// ✓ ADD PERMISSION CHECK
import { getTenantSession } from '@/lib/auth/tenant-auth';

export async function GET(request: NextRequest) {
  const session = await getTenantSession(request);
  if (!session) return Unauthorized();
  
  // Check permission
  if (!RBAC.hasPermission(session, 'manage_staff')) {
    return Forbidden();
  }
  
  // Then proceed with staff fetch
}
```

### 3.2 ❌ CRITICAL ISSUE: Admin Staff Endpoint Not Accessible

**Problem**: 
- Component calls `/api/admin/staff` but returns 404 on test server
- No GET response logging
- Error handling incomplete

**Files Affected**:
- `app/tenant/admin/staff/content.tsx` - Line 26: `fetch('/api/admin/staff')`
- `app/api/admin/staff/route.ts` - GET handler exists but may have issues

### 3.3 ⚠️ ISSUE: Missing Staff Detail Endpoint

**Location**: `app/api/staff/[id]/route.ts` - **MISSING**

**Used In**: `app/tenant/admin/staff/[id]/content.tsx` - Line 34

**Problem**:
```typescript
const response = await fetch(`/api/staff/${staffId}`, {
  headers: { 'x-tenant-id': subdomain }
});
```

**No corresponding route found**. Need to create GET `/api/staff/[id]` endpoint.

### 3.4 ⚠️ ISSUE: Missing Staff Schedule Endpoint

**Used In**: `components/staff/staff-schedule.tsx`

**Problem**: Calls `/api/staff/[id]/schedule` but endpoint exists but may be incomplete.

### 3.5 ⚠️ ISSUE: Missing Staff Leave Endpoint

**Used In**: `components/staff/staff-leave.tsx`

**Problem**: Calls `/api/staff/[id]/leave` - endpoint exists but may be incomplete.

---

## 4. Home Visit Task Assignment Issues

### 4.1 ✓ Home Visit Configuration

**File**: `components/services/home-visit-config.tsx`

**Implemented**:
- Service type selection (on_premise, home_visit, both)
- Full day booking toggle
- Travel buffer minutes
- Daily quota per staff
- Requires staff assignment toggle

**Status**: ✓ Component looks good

### 4.2 ❌ CRITICAL ISSUE: No Staff Assignment Workflow

**Problem**: 
- Home visit config allows "Requires Staff Assignment" toggle
- BUT no API endpoint to assign staff to bookings
- Staff assignment for home visit bookings missing

**What's Missing**:
```
POST /api/bookings/{id}/assign-staff
- Assign staff to specific booking
- Check staff availability for travel time
- Validate staff skill for service
```

### 4.3 ⚠️ ISSUE: Home Visit Travel Calculation

**File**: `lib/booking/booking-service.ts`

**Current State**:
- Travel distance calculated (travel_distance field)
- Travel duration calculated (travel_duration field)
- Travel surcharge calculated (travel_surcharge_amount field)

**Missing**:
- Staff assignment affects travel calculation
- Multiple staff assignment scenarios
- Travel optimization logic

### 4.4 ❌ CRITICAL ISSUE: Home Visit Staff Validation Missing

**Problem**:
- No validation that assigned staff can perform home visit
- No check if staff is available during travel time
- No check if service is assigned to staff

**Files That Need Updates**:
- `lib/booking/booking-service.ts` - createBooking() method
- `app/api/bookings/route.ts` - POST endpoint

---

## 5. Service-Staff Relationship Issues

### 5.1 ⚠️ ISSUE: Staff Service Assignment UI

**File**: `components/services/staff-assignment.tsx`

**Problems**:
1. Calls `/api/services/{id}/staff` to fetch assigned staff - ✓ Exists
2. POST to assign staff - ✓ Exists
3. Delete staff assignment - ❌ Missing DELETE method

**Missing**:
```typescript
// Need DELETE /api/services/[id]/staff/[staffId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  // Remove staff from service
}
```

### 5.2 ✓ Staff Service Assignment API

**File**: `app/api/services/[id]/staff/route.ts`

**Implemented**:
- GET staff assigned to service
- POST to assign staff

**Missing**:
- DELETE staff assignment
- PUT to update assignment

---

## 6. API Endpoint Authorization Summary

| Endpoint | Method | Permission Check | Status |
|----------|--------|------------------|--------|
| `/api/admin/staff` | GET | ❌ Missing | CRITICAL |
| `/api/staff/[id]` | GET | ❌ Not Found | CRITICAL |
| `/api/staff/[id]/schedule` | GET/POST | ⚠️ Unclear | NEEDS CHECK |
| `/api/staff/[id]/leave` | GET/POST | ⚠️ Unclear | NEEDS CHECK |
| `/api/services/[id]/staff` | GET | ⚠️ Unclear | NEEDS CHECK |
| `/api/services/[id]/staff` | POST | ⚠️ Unclear | NEEDS CHECK |
| `/api/services/[id]/staff/[staffId]` | DELETE | ❌ Missing | NEEDED |
| `/api/bookings/{id}/assign-staff` | POST | ❌ Missing | NEEDED |

---

## 7. Admin vs Tenant Role Separation

### Admin Main Website
**Not inspected yet** - Need to check:
- Super admin routes protection
- Admin staff management endpoints
- Admin home visit configuration

### Tenant Admin Area
**Files**:
- `app/tenant/admin/staff/content.tsx` - Staff list
- `app/tenant/admin/staff/[id]/content.tsx` - Staff details
- `app/tenant/admin/staff/[id]/page.tsx` - Page wrapper

**Issues**:
1. No explicit permission checks in components
2. Rely on middleware redirect (not enough)
3. Should verify `manage_staff` permission in each endpoint

---

## 8. Critical Fixes Needed

### Priority 1 - CRITICAL (Blocks Home Visit Feature)

1. **Create GET `/api/staff/[id]` endpoint**
   ```
   Files: app/api/staff/[id]/route.ts (doesn't exist)
   Purpose: Fetch individual staff details
   Auth: Check manage_staff permission OR staff can view own
   ```

2. **Add Permission Check to `/api/admin/staff` GET**
   ```
   File: app/api/admin/staff/route.ts:7
   Add: RBAC.hasPermission(session, 'manage_staff') check
   ```

3. **Create Booking Staff Assignment Endpoint**
   ```
   File: app/api/bookings/[id]/assign-staff/route.ts (new)
   Methods: POST (assign), DELETE (unassign)
   Auth: Check manage_bookings + manage_staff
   ```

### Priority 2 - HIGH (Feature Completion)

4. **Add DELETE method to `/api/services/[id]/staff`**
   ```
   Purpose: Remove staff from service
   Auth: Check manage_staff permission
   ```

5. **Add Permission Checks to All Staff Endpoints**
   ```
   Files: app/api/staff/[id]/* routes
   Add: Session verification + RBAC checks
   ```

6. **Add Home Visit Staff Validation**
   ```
   File: lib/booking/booking-service.ts - createBooking()
   Check: Assigned staff can perform service
   Check: Staff available during travel time
   ```

### Priority 3 - MEDIUM (Enhancement)

7. **Add Logging & Audit Trail**
   ```
   Log all staff assignments for home visits
   ```

8. **Add Transaction Safety**
   ```
   Use database transactions for multi-step operations
   ```

---

## 9. Recommendations

1. **Implement Consistent Authorization Pattern**
   - All API endpoints should check session + permissions
   - Create auth middleware to reduce boilerplate

2. **Add Audit Logging**
   - Log staff assignments
   - Log permission denials
   - Log home visit task changes

3. **Validate Staff-Service Compatibility**
   - Before assigning staff to booking, verify:
     - Staff is assigned to service
     - Staff is active
     - Staff has required skills
     - Staff is available (schedule + leave)

4. **Implement Staff Availability Service**
   - Check travel time between appointments
   - Check daily quota
   - Check working hours

5. **Add Home Visit Safety Checks**
   - Validate address coordinates
   - Check service area coverage
   - Calculate travel surcharge based on assigned staff location

---

## 10. Testing Checklist

- [ ] Staff admin can create staff members
- [ ] Staff admin can assign staff to services
- [ ] Staff admin can assign staff to home visit bookings
- [ ] Staff member cannot access other staff data
- [ ] Staff member cannot assign staff
- [ ] Home visit booking validates staff assignment
- [ ] Travel time considered in availability
- [ ] Permission denials logged
- [ ] Session expiry handled properly

---

## Files to Review

### Auth & Permissions
- `lib/auth/rbac.ts` - ✓ Reviewed
- `lib/auth/permission-service.ts` - ✓ Reviewed
- `lib/auth/tenant-auth.ts` - ✓ Reviewed
- `middleware.ts` - ✓ Reviewed

### Staff Management
- `app/api/admin/staff/route.ts` - ❌ Needs fixes
- `app/api/staff/route.ts` - ⚠️ Needs review
- `app/api/staff/[id]/route.ts` - ❌ Missing
- `app/api/staff/[id]/schedule/route.ts` - ⚠️ Needs review
- `app/api/staff/[id]/leave/route.ts` - ⚠️ Needs review

### Home Visit
- `components/services/home-visit-config.tsx` - ✓ Reviewed
- `app/api/services/[id]/home-visit-config/route.ts` - ⚠️ Needs review
- `app/api/services/[id]/staff/route.ts` - ⚠️ Needs review & DELETE method

### Booking
- `app/api/bookings/route.ts` - ⚠️ Needs permission checks
- `lib/booking/booking-service.ts` - ⚠️ Needs staff validation


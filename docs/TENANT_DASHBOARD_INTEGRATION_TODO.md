# Tenant Dashboard - Integration Roadmap (SIMPLIFIED)

**Status:** Task 1 COMPLETE ✅ - Ready for Task 2!  
**Actual Effort Estimate:** 1-2 weeks (vs original 4-6 weeks)  
**Last Updated:** 2025-10-17 (Updated after Task 1 completion)  
**Session:** Started implementation

---

## 📌 Key Discovery

All core business logic is **ALREADY IMPLEMENTED** as React components in `/components/`:

### What We Have
- ✅ `BookingManagement.tsx` - Complete booking CRUD + calendar + recurring
- ✅ `CustomerManagement.tsx` - Full customer database management
- ✅ `InvoiceManagement.tsx` - Invoice generation & tracking
- ✅ `FinancialDashboard.tsx` - Revenue analytics
- ✅ `PlatformAnalyticsDashboard.tsx` - Analytics dashboard
- ✅ API endpoints for all features at `/api/bookings`, `/api/customers`, `/api/services`, `/api/invoices`

### What We Need To Do
1. **Fix authentication** for tenant/staff login
2. **Import components** into `/tenant/admin/*` pages  
3. **Update APIs** to filter by `tenant_id`
4. **Update components props** to work with tenant context

---

## 🎯 Actual Integration Tasks

### CRITICAL - Must Complete

#### 1. Fix Tenant/Staff Authentication (Priority: 🔴 CRITICAL)
- **Status:** ✅ COMPLETE
- **Effort:** 4-5 hours (Actual: ~2 hours)
- **Completed:** 2025-10-17
- **Commits:** 
  - `feat: implement tenant/staff authentication system`
  - `fix: remove use-toast hook dependency`
- **Tasks:**
  - [x] Create auth endpoint for staff login (`/api/auth/staff-login`)
  - [x] Add session management for staff
  - [x] Create protected middleware for `/tenant/admin/*`
  - [x] Update login page to support tenant subdomain login
  - [ ] Test login flow for staff (manual testing needed after deploy)
- **Files Created/Modified:**
  - ✅ `app/tenant/login/page.tsx` (new)
  - ✅ `app/api/auth/staff-login/route.ts` (new)
  - ✅ `middleware.ts` (updated for tenant admin protection)
  - ✅ Updated all `/tenant/admin/*` pages with proper redirects
- **What Was Done:**
  - Created staff login with email/password authentication
  - Implemented session management with 7-day cookie expiration
  - Added account lockout (5 attempts → 30 min lockout)
  - Middleware protects `/tenant/admin/*` routes
  - If no session, redirects to `/tenant/login`
  - Session stored in database for audit purposes
  - Secure password verification with hashing
- **Status:** Ready for testing on Vercel ✅

---

#### 2. Update API Endpoints for Tenant Filtering (Priority: 🔴 CRITICAL) 
- **Status:** ❌ Not started
- **Effort:** 3-4 hours
- **Prerequisite for:** Tasks 4-10 (all features depend on this)
- **What to Do:**
  Add `.eq('tenant_id', tenantId)` filter to every API endpoint so they only return data for current tenant.
  
  **Pattern:**
  ```typescript
  // BEFORE: Shows ALL bookings across ALL tenants
  const { data } = await supabase.from('bookings').select('*');
  
  // AFTER: Shows ONLY tenant's bookings
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId);  // <-- ADD THIS!
  ```

- **Files to Update:**
  - [ ] `app/api/bookings/route.ts` - GET/POST bookings
  - [ ] `app/api/bookings/[id]/route.ts` - GET/PUT/DELETE single booking
  - [ ] `app/api/bookings/availability/route.ts` - check availability
  - [ ] `app/api/customers/route.ts` - GET/POST customers
  - [ ] `app/api/customers/[id]/route.ts` - GET/PUT/DELETE customer
  - [ ] `app/api/services/route.ts` - GET/POST services
  - [ ] `app/api/services/[id]/route.ts` - GET/PUT/DELETE service
  - [ ] `app/api/invoices/route.ts` - GET/POST invoices
  - [ ] `app/api/invoices/[id]/route.ts` - GET/PUT/DELETE invoice
  - [ ] And other APIs that query from database

- **How to Get tenantId:**
  ```typescript
  // From request body or query params
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  // OR from auth context if available
  // OR extract from session cookie if available
  ```

- **Testing:**
  - [ ] Each API returns only that tenant's data
  - [ ] Cannot access other tenant's data
  - [ ] 401/403 if no tenantId provided

---

#### 3. Integrate Booking Management (Priority: 🔴 CRITICAL)
- **Status:** ⏳ Blocked by Task 2
- **Effort:** 2-3 hours (after API updates)
- **Tasks:**
  - [ ] Update `/tenant/admin/bookings/page.tsx`
  - [ ] Import `BookingManagement` component from `/components/booking/`
  - [ ] Get `tenantId` from query params
  - [ ] Fetch tenant's services and customers
  - [ ] Pass to BookingManagement with tenant context
- **Files to Modify:**
  - `app/tenant/admin/bookings/page.tsx`
- **Tests:**
  - [ ] Component renders without errors
  - [ ] Can view bookings list
  - [ ] Can create new booking
  - [ ] Can update booking status

---

#### 3. Update API Endpoints for Tenant Filtering (Priority: 🔴 CRITICAL)
- **Status:** ❌ Not started
- **Effort:** 3-4 hours
- **Key APIs to Update:**
  - [ ] `/api/bookings` - add `tenant_id` filter
  - [ ] `/api/customers` - add `tenant_id` filter
  - [ ] `/api/services` - add `tenant_id` filter
  - [ ] `/api/invoices` - add `tenant_id` filter
  - [ ] `/api/bookings/availability` - use tenant context
- **Pattern to Follow:**
  ```typescript
  // Before (shows all):
  const { data } = await supabase.from('bookings').select('*');
  
  // After (tenant-specific):
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId);  // <-- Add this filter
  ```
- **Files to Modify:**
  - `app/api/bookings/route.ts`
  - `app/api/customers/route.ts`
  - `app/api/services/route.ts`
  - `app/api/invoices/route.ts`
  - etc...

---

#### 4. Integrate Customer Management (Priority: 🔴 CRITICAL)
- **Status:** ❌ Not started
- **Effort:** 2-3 hours
- **Tasks:**
  - [ ] Update `/tenant/admin/customers/page.tsx`
  - [ ] Import `CustomerManagement` component
  - [ ] Pass tenantId and customers data
  - [ ] Update API calls to use tenant context
- **Files to Modify:**
  - `app/tenant/admin/customers/page.tsx`

---

#### 5. Integrate Service Management (Priority: 🔴 CRITICAL)
- **Status:** ❌ Not started
- **Effort:** 2-3 hours
- **Tasks:**
  - [ ] Check `/components/` for service management component
  - [ ] Update `/tenant/admin/services/page.tsx`
  - [ ] Import service component
  - [ ] Connect to tenant-filtered API
- **Files to Modify:**
  - `app/tenant/admin/services/page.tsx`

---

### HIGH PRIORITY - Complete After Critical

#### 6. Integrate Financial Management (Priority: 🟠 HIGH)
- **Status:** ❌ Not started
- **Effort:** 2-3 hours
- **Tasks:**
  - [ ] Import `FinancialDashboard` or `InvoiceManagement`
  - [ ] Create `/tenant/admin/finance` page
  - [ ] Pass tenant-filtered invoice data
- **Files to Create/Modify:**
  - `app/tenant/admin/finance/page.tsx` (new)

---

#### 7. Integrate Analytics (Priority: 🟠 HIGH)
- **Status:** ❌ Not started
- **Effort:** 2 hours
- **Tasks:**
  - [ ] Create tenant-specific analytics component (copy PlatformAnalyticsDashboard)
  - [ ] Update `/tenant/admin/analytics/page.tsx`
  - [ ] Filter all charts/metrics by tenant_id
- **Files to Modify:**
  - `app/tenant/admin/analytics/page.tsx`
  - Create `components/analytics/TenantAnalyticsDashboard.tsx` (copy from Platform version)

---

#### 8. Integrate WhatsApp Messages (Priority: 🟠 HIGH)
- **Status:** ❌ Not started
- **Effort:** 1-2 hours
- **Tasks:**
  - [ ] Check `/components/` for message/chat component
  - [ ] Update `/tenant/admin/messages/page.tsx`
  - [ ] Import message component
  - [ ] Filter by tenant
- **Files to Modify:**
  - `app/tenant/admin/messages/page.tsx`

---

#### 9. Integrate Settings (Priority: 🟠 HIGH)
- **Status:** ❌ Not started
- **Effort:** 1-2 hours
- **Tasks:**
  - [ ] Check `/components/settings/` for BusinessSettingsPanel or similar
  - [ ] Update `/tenant/admin/settings/page.tsx`
  - [ ] Import settings component
- **Files to Modify:**
  - `app/tenant/admin/settings/page.tsx`

---

#### 10. Integrate Staff Management (Priority: 🟠 HIGH)
- **Status:** ❌ Not started
- **Effort:** 1-2 hours
- **Tasks:**
  - [ ] Create `/tenant/admin/staff/page.tsx`
  - [ ] Build staff list (use existing staff API)
  - [ ] Allow create/edit/delete staff (in tenant dashboard context)
- **Files to Create:**
  - `app/tenant/admin/staff/page.tsx` (new)
  - `components/tenant/StaffManagement.tsx` (new - can be simple)

---

### MEDIUM PRIORITY - Nice to Have

#### 11. Landing Page Enhancements (Priority: 🟡 MEDIUM)
- **Status:** ❌ Not started
- **Effort:** 2-3 hours
- **Tasks:**
  - [ ] Add online booking form to landing page
  - [ ] Add service details/gallery
  - [ ] Add customer reviews
- **Files to Modify:**
  - Components in `components/subdomain/`

---

#### 12. Testing & QA (Priority: 🟡 MEDIUM)
- **Status:** ❌ Not started
- **Effort:** 4-5 hours
- **Tasks:**
  - [ ] Test complete staff login flow
  - [ ] Test all CRUD operations
  - [ ] Test tenant isolation (staff can't see other tenants)
  - [ ] Test permissions/access control
  - [ ] Create test data for manual testing

---

## 📊 Component Inventory

To speed up integration, here are all available components:

```
/components/booking/
  ✅ BookingManagement.tsx
  ✅ BookingCalendar.tsx
  ✅ BookingDialog.tsx
  ✅ RecurringBookingManager.tsx
  ✅ HomeVisitBookingManager.tsx
  ✅ PricingCalculator.tsx
  ✅ TimeSlotPicker.tsx
  ✅ BlackoutDatesManager.tsx

/components/customer/
  ✅ CustomerManagement.tsx
  ✅ CustomerDetailsDialog.tsx
  ✅ CustomerSearch.tsx
  ✅ CustomerDialog.tsx

/components/invoice/
  ✅ InvoiceManagement.tsx
  ✅ InvoicePreview.tsx

/components/financial/
  ✅ FinancialDashboard.tsx
  ✅ RevenueDashboard.tsx

/components/analytics/
  ✅ PlatformAnalyticsDashboard.tsx
  ✅ (need tenant-specific variant)

/components/dashboard/
  ✅ Various dashboard widgets

/components/settings/
  ✅ BusinessSettingsPanel.tsx
  ✅ (check what else is available)

/components/admin/
  ✅ TenantManagement.tsx
  ✅ SystemMonitoring.tsx
  ✅ etc.
```

---

## 🔄 File Structure After Integration

```
app/tenant/admin/
├── page.tsx                    (Dashboard - already created)
├── layout.tsx                  (Sidebar - already created)
├── bookings/
│   └── page.tsx               (Import BookingManagement)
├── customers/
│   └── page.tsx               (Import CustomerManagement)
├── services/
│   └── page.tsx               (Import service component)
├── finance/
│   └── page.tsx               (NEW - Import FinancialDashboard)
├── messages/
│   └── page.tsx               (Import message component)
├── staff/
│   └── page.tsx               (NEW - Create staff list)
├── settings/
│   └── page.tsx               (Import BusinessSettingsPanel)
├── analytics/
│   └── page.tsx               (Import TenantAnalyticsDashboard)
└── login/
    └── page.tsx               (NEW - Staff login)
```

---

## 🚀 Quick Implementation Checklist

**Start Here:**
- [ ] Fix staff authentication (Task 1)
- [ ] Add tenant_id filtering to all APIs (Task 3)
- [ ] Integrate Booking (Task 2)
- [ ] Integrate Customers (Task 4)
- [ ] Integrate Services (Task 5)

**Then:**
- [ ] Add Finance/Analytics/Messages/Settings/Staff pages
- [ ] Test everything works
- [ ] Deploy to Vercel

---

## 📈 Progress Tracking

| Task | Status | Hours | Priority | Start | End |
|------|--------|-------|----------|-------|-----|
| 1. Auth | ✅ DONE | 4-5 | 🔴 | 2025-10-17 | 2025-10-17 |
| 2. API Updates | ⏳ NEXT | 3-4 | 🔴 | - | - |
| 3. Bookings | ⏳ After 2 | 2-3 | 🔴 | - | - |
| 4. Customers | ⏳ After 2 | 2-3 | 🔴 | - | - |
| 5. Services | ⏳ After 2 | 2-3 | 🔴 | - | - |
| 6. Finance | ⏳ After 5 | 2-3 | 🟠 | - | - |
| 7. Analytics | ⏳ After 5 | 2 | 🟠 | - | - |
| 8. Messages | ⏳ After 5 | 1-2 | 🟠 | - | - |
| 9. Settings | ⏳ After 5 | 1-2 | 🟠 | - | - |
| 10. Staff | ⏳ After 5 | 1-2 | 🟠 | - | - |
| **COMPLETED** | ✅ | 4-5 hours | | | |
| **REMAINING** | | **18-27 hours** | | | |
| **TOTAL** | | **23-32 hours** | | | |

**Timeline:** 
- ✅ Task 1 completed: 2 hours (faster than expected!)
- ⏳ Task 2 next: 3-4 hours
- Estimated total: 1-2 weeks (5 working days at 6 hrs/day)

---

## 💡 Implementation Tips

1. **Copy/Paste Approach:** Most components can be imported as-is. Just add tenant filtering.

2. **Component Props Pattern:**
   ```tsx
   // Before (super-admin view)
   <BookingManagement services={allServices} />
   
   // After (tenant view)
   <BookingManagement 
     tenantId={currentTenantId}
     services={tenantServices}
     customers={tenantCustomers}
   />
   ```

3. **API Pattern:** Always add `.eq('tenant_id', tenantId)` before `.select()`

4. **Testing:** Test each feature individually before moving to next

5. **Deployment:** Test locally first, then push to Vercel

---

## 🎯 Success Criteria

When complete:
- [ ] Staff can login to `demo.booqing.my.id/admin`
- [ ] Dashboard shows tenant-specific data only
- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Data is properly isolated per tenant
- [ ] No data leakage between tenants
- [ ] All pages load without errors
- [ ] Mobile responsive

---

---

## 📝 Session Update - 2025-10-17

### ✅ What Was Completed Today

**Task 1: Tenant/Staff Authentication - COMPLETE**
- Created `/api/auth/staff-login` endpoint
  - Staff login with email/password
  - Account lockout after 5 failed attempts (30 min)
  - Session management with 7-day expiration
  - Secure password hashing and verification
  
- Created `/tenant/login` page
  - Clean UI for staff login
  - Error handling and validation
  - Redirects to admin dashboard on success
  
- Updated middleware.ts
  - Protects `/tenant/admin/*` routes
  - Redirects to login if no session
  - Auto-adds subdomain to query params
  
- Updated all tenant admin pages to use correct redirects

### 🎯 What's Next (For Tonight)

**Task 2: Update API Endpoints for Tenant Filtering - PRIORITY**

This is CRITICAL because all other features depend on it. The pattern is simple:

**Current state:** APIs return ALL data across ALL tenants (security risk!)
```typescript
const { data } = await supabase.from('bookings').select('*'); // Returns everything!
```

**What to do:** Add tenant filter to every API
```typescript
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('tenant_id', tenantId); // Only this tenant's data
```

**Files to update:**
- `/api/bookings/route.ts` - and all booking-related APIs
- `/api/customers/route.ts` - and customer APIs
- `/api/services/route.ts` - and service APIs
- `/api/invoices/route.ts` - and invoice APIs
- Any other API that queries database

**Timeline:** 3-4 hours should complete this

### 📋 After Task 2 Complete

Once APIs filter by tenant_id, you can:
- Task 3: Import `BookingManagement` component (1-2 hrs)
- Task 4: Import `CustomerManagement` component (1-2 hrs)
- Task 5: Import Service component (1-2 hrs)
- Task 6-10: Finance, Analytics, Messages, Settings, Staff (all 1-2 hrs each)

### 🚀 Getting Started Tonight

1. Read Task 2 section carefully (lines ~110-150)
2. Start with `app/api/bookings/route.ts`
3. Add `.eq('tenant_id', tenantId)` filter
4. Move to next file
5. Test that APIs only return tenant data

Good luck! 💪

---

**Next Action:** Start with Task 2 (API Tenant Filtering) to unblock all other feature integration! 🚀

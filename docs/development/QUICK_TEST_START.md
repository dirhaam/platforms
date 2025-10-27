# Quick Start Testing Guide

## 🚀 Setup (5 minutes)

### Step 1: Create Test Data
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to your project → SQL Editor
3. Copy content from `scripts/test-setup.sql`
4. Paste and run the SQL script
5. Verify all test tables show counts > 0

**Test Credentials:**
- **Email:** `staff@testdemo.com`
- **Password:** `test123`
- **Tenant:** `test-demo`

### Step 2: Start Dev Server
```bash
npm run dev
```

Dev server runs at: `http://localhost:3000`

---

## 📝 Testing Checklist

### Phase 1: Authentication (10 min)
**Goal:** Verify login system works

- [ ] Open http://localhost:3000/tenant/login
- [ ] Try invalid password → should show error
- [ ] Enter correct password → should redirect to dashboard
- [ ] Verify you're at `/tenant/admin?subdomain=test-demo`
- [ ] Logout and verify redirect to login
- [ ] Try accessing `/tenant/admin/bookings` without login → should redirect to login

**Status:** ✅ or ❌
**Notes:** 

---

### Phase 2: Bookings Module (15 min)
**Goal:** Test booking CRUD operations

#### View Bookings
- [ ] Navigate to `/tenant/admin/bookings`
- [ ] See 3 test bookings in table (John, Jane, Bob)
- [ ] Verify pagination works (if needed)

#### Filter & Search
- [ ] Filter by status → only show matching bookings
- [ ] Filter by date range → results update
- [ ] Search by customer name → results filter

#### Create Booking
- [ ] Click "Create Booking" button
- [ ] Fill form: Select customer, service, date, time
- [ ] Click Save
- [ ] New booking appears in list

#### Edit Booking
- [ ] Click Edit on a booking
- [ ] Change status to "completed"
- [ ] Click Save
- [ ] Booking status updates in list

#### Delete Booking
- [ ] Click Delete on a booking
- [ ] Confirm deletion
- [ ] Booking removed from list

**Status:** ✅ or ❌
**Notes:**

---

### Phase 3: Customers Module (15 min)
**Goal:** Test customer management

#### View Customers
- [ ] Navigate to `/tenant/admin/customers`
- [ ] See 3 test customers (John, Jane, Bob)
- [ ] Verify search works
- [ ] Verify pagination works

#### Create Customer
- [ ] Click "Add Customer" button
- [ ] Fill: Name, Email, Phone, Address
- [ ] Click Save
- [ ] New customer in list

#### Update Customer
- [ ] Click a customer to edit
- [ ] Change phone number
- [ ] Click Save
- [ ] Phone number updates

#### Delete Customer
- [ ] Click Delete on a customer
- [ ] Confirm
- [ ] Customer removed

**Status:** ✅ or ❌
**Notes:**

---

### Phase 4: Services Module (10 min)
**Goal:** Test service management

- [ ] Navigate to `/tenant/admin/services`
- [ ] See 3 services (Haircut, Hair Coloring, Massage)
- [ ] Verify all columns display: Name, Category, Duration, Price, Status
- [ ] Click Delete on a service → removed from list
- [ ] No errors in console

**Status:** ✅ or ❌
**Notes:**

---

### Phase 5: Finance Module (10 min)
**Goal:** Test invoice management

#### View Invoices
- [ ] Navigate to `/tenant/admin/finance`
- [ ] Invoice list loads
- [ ] Page is ready for creating invoices from bookings

#### Filter Invoices
- [ ] Filter by "paid" status → only shows paid invoices
- [ ] Filter by "pending" status → only shows pending
- [ ] Filter by date range → results update
- [ ] Search by customer → results filter

#### Invoice Preview
- [ ] Click an invoice row
- [ ] Preview dialog opens
- [ ] Shows invoice details

**Status:** ✅ or ❌
**Notes:**

---

### Phase 6: Analytics Dashboard (10 min)
**Goal:** Test analytics

- [ ] Navigate to `/tenant/admin/analytics`
- [ ] See 4 KPI cards:
  - Total Revenue (from bookings: 50k + 150k + 120k = 320,000 IDR)
  - Total Bookings (3)
  - Total Customers (3)
  - Avg Booking Value
- [ ] Change date range to "Last 7 days" → data updates
- [ ] Change to "Last 30 days" → data updates
- [ ] View "Revenue Trend" chart
- [ ] View "Booking Trends" chart
- [ ] View "Top Services" pie chart

**Status:** ✅ or ❌
**Notes:**

---

### Phase 7: Data Isolation (20 min)
**Goal:** Verify tenant data isolation - critical security test

#### Create Second Test Tenant
1. Run this SQL in Supabase:
   ```sql
   INSERT INTO public.tenants (subdomain, business_name, owner_name, email, phone, subscription_plan, subscription_status, business_category) 
   VALUES ('test-tenant-2', 'Second Business', 'Another Owner', 'owner2@test.com', '+6287654321', 'basic', 'active', 'salon');
   
   INSERT INTO public.staff (tenant_id, name, email, role, password_hash, is_active) 
   VALUES ((SELECT id FROM tenants WHERE subdomain = 'test-tenant-2'), 'Staff 2', 'staff2@test.com', 'admin', '$2b$10$YEHzJ9/B3QXFVQyH6Qe1.uIFLHe5x/qJDBvyLpCFDjAeH9ywkCPLK', true);
   ```

#### Test Isolation
- [ ] Logout from test-demo
- [ ] Login as staff2@test.com (password: test123)
- [ ] Navigate to `/tenant/admin/bookings`
- [ ] **CRITICAL:** Verify NO bookings from test-demo appear
- [ ] Go to Customers - **NO customers from test-demo**
- [ ] Go to Services - **NO services from test-demo**
- [ ] Go to Finance - **NO invoices from test-demo**
- [ ] Open browser DevTools → Network tab
- [ ] Logout, login back to test-demo
- [ ] In DevTools, watch API calls
- [ ] Verify API responses only include test-demo data
- [ ] No response status 401/403 errors

**CRITICAL:** If you see other tenant's data → DATA ISOLATION FAILED ❌

**Status:** ✅ or ❌
**Notes:**

---

### Phase 8: Error Handling (5 min)
**Goal:** Verify error messages work

- [ ] Try creating invalid data (missing required fields)
- [ ] Verify error message shows
- [ ] Try deleting → cancel in dialog → should not delete
- [ ] Test network error by going offline → check graceful handling
- [ ] Open DevTools Console → should have minimal errors

**Status:** ✅ or ❌
**Notes:**

---

## 📊 Overall Test Results

| Feature | Status | Critical | Issues |
|---------|--------|----------|--------|
| Authentication | ⏳ | Yes | |
| Bookings | ⏳ | Yes | |
| Customers | ⏳ | Yes | |
| Services | ⏳ | Yes | |
| Finance | ⏳ | Yes | |
| Analytics | ⏳ | No | |
| Data Isolation | ⏳ | YES! | |
| Error Handling | ⏳ | No | |

---

## 🐛 Found Issues?

Use this template for each bug:

### Bug: [Title]
- **Module:** [Bookings/Customers/etc]
- **Severity:** Critical / High / Medium / Low
- **Steps:**
  1. Do this
  2. Then do this
  3. Bug occurs here
- **Expected:** [What should happen]
- **Actual:** [What actually happens]
- **Console Error:** [If any - paste error]
- **Screenshot:** [If needed]

---

## ✅ Success = All Tests Pass

When all phases complete:
- [ ] No critical issues found
- [ ] Data isolation verified (MOST IMPORTANT)
- [ ] All CRUD operations work
- [ ] UI responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] Performance acceptable

**Then:** Ready for production deployment! 🚀


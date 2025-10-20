# Tenant Dashboard Testing Guide

**Status:** Testing Phase  
**Last Updated:** 2025-10-17  
**Session:** Manual End-to-End Testing

---

## 🧪 Test Environment Setup

### Prerequisites
1. Ensure dev server is running: `npm run dev`
2. Have Supabase access for test data verification
3. Browser ready (Chrome/Firefox)
4. Test subdomain available: `demo.localhost:3000` or staging environment

---

## 📋 Test Checklist

### Phase 1: Authentication & Access Control

#### Test 1.1: Staff Login
- [ ] Navigate to `http://demo.localhost:3000/tenant/login`
- [ ] Enter valid staff credentials (create test staff first if needed)
- [ ] Verify login success and redirect to dashboard
- [ ] Verify session cookie is set
- [ ] Test invalid credentials show error
- [ ] Test account lockout after 5 failed attempts

#### Test 1.2: Protected Routes
- [ ] Try accessing `/tenant/admin/bookings` without login
- [ ] Verify redirect to login page
- [ ] Login and verify redirect to original page
- [ ] Test logout functionality

---

### Phase 2: Bookings Management

#### Test 2.1: View Bookings
- [ ] Navigate to `/tenant/admin/bookings`
- [ ] Verify bookings list loads
- [ ] Verify only current tenant's bookings show
- [ ] Check pagination works

#### Test 2.2: Create Booking
- [ ] Click "Create Booking" button
- [ ] Fill in booking form (customer, service, date, time)
- [ ] Submit and verify success
- [ ] Verify new booking appears in list
- [ ] Verify booking data saved to database

#### Test 2.3: Update Booking
- [ ] Click edit on a booking
- [ ] Change booking details
- [ ] Save and verify changes persisted
- [ ] Verify status update works

#### Test 2.4: Delete Booking
- [ ] Click delete on a booking
- [ ] Confirm deletion
- [ ] Verify booking removed from list

---

### Phase 3: Customer Management

#### Test 3.1: View Customers
- [ ] Navigate to `/tenant/admin/customers`
- [ ] Verify customers list loads
- [ ] Verify pagination works
- [ ] Test search functionality
- [ ] Verify sorting works

#### Test 3.2: Create Customer
- [ ] Click "Add Customer" button
- [ ] Fill customer form (name, phone, email)
- [ ] Submit and verify success
- [ ] Verify new customer in list

#### Test 3.3: Update Customer
- [ ] Click customer to view details
- [ ] Edit customer information
- [ ] Save and verify persisted

#### Test 3.4: Delete Customer
- [ ] Delete a customer
- [ ] Verify removed from list

---

### Phase 4: Services Management

#### Test 4.1: View Services
- [ ] Navigate to `/tenant/admin/services`
- [ ] Verify services list loads
- [ ] Check all service details display correctly

#### Test 4.2: Delete Service
- [ ] Delete a service
- [ ] Verify removed from list
- [ ] Verify delete confirmation works

---

### Phase 5: Finance Management

#### Test 5.1: View Invoices
- [ ] Navigate to `/tenant/admin/finance`
- [ ] Verify invoices list loads
- [ ] Check pagination works
- [ ] Test filtering by status

#### Test 5.2: Search & Filter
- [ ] Filter invoices by date range
- [ ] Filter by status (paid, unpaid, overdue)
- [ ] Search by customer name
- [ ] Verify results match filters

---

### Phase 6: Analytics Dashboard

#### Test 6.1: View Analytics
- [ ] Navigate to `/tenant/admin/analytics`
- [ ] Verify dashboard loads
- [ ] Check KPI cards show correct values
- [ ] Verify charts render

#### Test 6.2: Date Range Filtering
- [ ] Change date range to "Last 7 days"
- [ ] Verify data updates
- [ ] Change to "Last 30 days"
- [ ] Verify analytics refresh
- [ ] Test custom date range

---

### Phase 7: Tenant Data Isolation

#### Test 7.1: Cross-Tenant Data Isolation
**Setup:** Create 2 test tenants with different data

- [ ] Login as Tenant A staff
- [ ] Verify only Tenant A's bookings visible
- [ ] Verify only Tenant A's customers visible
- [ ] Check API responses filter correctly
- [ ] Logout and login as Tenant B staff
- [ ] Verify only Tenant B's data visible
- [ ] Verify no cross-tenant data leakage

#### Test 7.2: API Security
- [ ] Test API endpoints with wrong tenant_id
- [ ] Verify 401/403 Unauthorized responses
- [ ] Test that `x-tenant-id` header is required
- [ ] Verify API doesn't return other tenant data

---

### Phase 8: UI/UX & Performance

#### Test 8.1: Loading States
- [ ] Verify loading spinners appear during data fetch
- [ ] Check skeleton loaders work
- [ ] Verify error messages display

#### Test 8.2: Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify navigation works on mobile

#### Test 8.3: Performance
- [ ] Check page load times
- [ ] Verify no console errors
- [ ] Check network tab for unnecessary requests
- [ ] Verify lazy loading works

---

## 🔍 Test Data Setup

### SQL to Create Test Data

```sql
-- Create test tenant
INSERT INTO tenants (
  subdomain, business_name, owner_name, email, phone, 
  subscription_plan, subscription_status
) VALUES (
  'test-tenant-1', 'Test Business', 'Test Owner', 
  'test@example.com', '+1234567890', 'basic', 'active'
);

-- Create test staff
INSERT INTO staff (
  tenant_id, name, email, role, password_hash, is_active
) VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  'Test Staff', 'staff@testbusiness.com', 'admin', 
  'hashed_password_here', true
);

-- Create test services
INSERT INTO services (
  tenant_id, name, description, duration, price, 
  category, is_active
) VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  'Haircut', 'Professional haircut service', 60, 50000,
  'hair', true
),
(
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  'Coloring', 'Hair coloring service', 120, 150000,
  'hair', true
);

-- Create test customers
INSERT INTO customers (
  tenant_id, name, phone, email, address
) VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  'John Doe', '+62812345678', 'john@example.com', 'Jakarta'
),
(
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  'Jane Smith', '+62813456789', 'jane@example.com', 'Bandung'
);

-- Create test bookings
INSERT INTO bookings (
  tenant_id, customer_id, service_id, status,
  scheduled_at, duration, total_amount
) VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'test-tenant-1'),
  (SELECT id FROM customers WHERE name = 'John Doe' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Haircut' LIMIT 1),
  'confirmed',
  NOW() + INTERVAL '2 days', 60, 50000
);
```

---

## 🚀 Running Tests

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Create Test Tenant & Staff**
   - Use Supabase dashboard or run SQL above
   - Note credentials for testing

3. **Test Login Flow**
   - Open `http://demo.localhost:3000/tenant/login`
   - Try invalid credentials first (test error handling)
   - Login with valid credentials
   - Verify redirect to dashboard

4. **Test Each Module**
   - Follow checklist items above
   - Document any failures
   - Screenshot errors for reference

5. **Test Tenant Isolation**
   - Create second test tenant
   - Verify data isolation
   - Test API security

---

## 📊 Test Results Template

| Feature | Status | Notes | Date |
|---------|--------|-------|------|
| Staff Login | ⏳ | | |
| Bookings CRUD | ⏳ | | |
| Customers CRUD | ⏳ | | |
| Services Management | ⏳ | | |
| Finance/Invoices | ⏳ | | |
| Analytics | ⏳ | | |
| Tenant Isolation | ⏳ | | |
| API Security | ⏳ | | |

---

## 🐛 Bug Report Template

When you find an issue, document it as:

```
### Bug: [Brief Title]
- **Module:** [Bookings/Customers/etc]
- **Severity:** [Critical/High/Medium/Low]
- **Steps to Reproduce:**
  1. Login as staff
  2. Navigate to X
  3. Click Y
  4. Observe unexpected behavior
- **Expected:** [What should happen]
- **Actual:** [What actually happens]
- **Screenshots:** [If applicable]
- **Console Errors:** [Any JS errors]
```

---

## ✅ Success Criteria

Testing is complete when:
- [ ] All authentication flows work
- [ ] All CRUD operations succeed
- [ ] Data loads correctly for logged-in tenant
- [ ] No cross-tenant data visible
- [ ] No API security issues
- [ ] Mobile responsive works
- [ ] No console errors
- [ ] Performance acceptable

---

## 📝 Notes

- Test on both localhost and staging
- Create fresh test data for each session
- Document any issues in bug reports
- Verify fixes before moving to production


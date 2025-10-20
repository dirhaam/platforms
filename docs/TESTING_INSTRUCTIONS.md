# Testing Instructions - Tenant Dashboard Integration

**Status:** ✅ All 10 tasks complete and compiling successfully  
**Last Updated:** 2025-10-20  
**Purpose:** Manual end-to-end testing before production deployment

---

## 📋 What You'll Test

Your tenant dashboard includes:
1. ✅ Staff authentication (login/logout)
2. ✅ Bookings management (CRUD + filtering)
3. ✅ Customers management (CRUD + search)
4. ✅ Services management (list + delete)
5. ✅ Finance/Invoice management (list + filtering)
6. ✅ Analytics dashboard (metrics + charts)
7. ✅ Messages page (placeholder)
8. ✅ Settings page (placeholder)
9. ✅ Staff management (list view)
10. ✅ Tenant data isolation (CRITICAL)

---

## 🚀 Quick Start (15 minutes)

### Step 1: Setup Test Data (5 min)

**Option A: Using Supabase UI**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Open file: `scripts/test-setup.sql`
6. Copy all content
7. Paste into SQL Editor
8. Click **Run**
9. Verify all queries show success ✅

**Option B: Using psql (if you have Postgres CLI)**
```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]/[db]"

# Run the setup script
\i scripts/test-setup.sql
```

---

### Step 2: Verify Test Data (2 min)

In Supabase SQL Editor, run:
```sql
-- Check test tenant
SELECT id, subdomain, business_name FROM public.tenants WHERE subdomain = 'test-demo';

-- Check test staff
SELECT id, email, role FROM public.staff WHERE email = 'staff@testdemo.com';

-- Check test data counts
SELECT 
  (SELECT COUNT(*) FROM public.services WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo')) as services_count,
  (SELECT COUNT(*) FROM public.customers WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo')) as customers_count,
  (SELECT COUNT(*) FROM public.bookings WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo')) as bookings_count,
  (SELECT COUNT(*) FROM public.invoices WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'test-demo')) as invoices_count;
```

**Expected results:**
- services_count: 3
- customers_count: 3
- bookings_count: 3
- invoices_count: 2

---

### Step 3: Start Development Server (3 min)

```bash
cd D:\boq\platforms
npm run dev
```

You should see:
```
> dev
> next dev

  ▲ Next.js 15.3.2
  - Local:        http://localhost:3000
```

Open in browser: **http://localhost:3000**

---

### Step 4: Test Login (2 min)

1. Open **http://localhost:3000/tenant/login**
2. See login form
3. Try invalid password:
   - Email: `staff@testdemo.com`
   - Password: `wrong` 
   - Should show error ❌
4. Try correct password:
   - Email: `staff@testdemo.com`
   - Password: `test123`
   - Should redirect to dashboard ✅

---

## 📝 Testing Phases (60-90 minutes)

See **`docs/QUICK_TEST_START.md`** for detailed checklist.

Quick overview:
| Phase | Module | Time | Goal |
|-------|--------|------|------|
| 1 | Authentication | 10 min | Login works |
| 2 | Bookings | 15 min | CRUD operations |
| 3 | Customers | 15 min | CRUD operations |
| 4 | Services | 10 min | List & delete |
| 5 | Finance | 10 min | Filtering works |
| 6 | Analytics | 10 min | Dashboard displays |
| 7 | Data Isolation | 20 min | **CRITICAL** |
| 8 | Error Handling | 5 min | No crashes |

---

## 🔐 Critical: Data Isolation Test

**This is the most important test!**

### Why It Matters
- Ensures one tenant can't see another tenant's data
- Prevents data leakage in multi-tenant SaaS
- Required for production deployment

### How to Test

#### Setup Second Tenant (in Supabase SQL Editor):
```sql
-- Create tenant 2
INSERT INTO public.tenants (subdomain, business_name, owner_name, email, phone, subscription_plan, subscription_status) 
VALUES ('test-tenant-2', 'Second Business', 'Owner 2', 'owner2@test.com', '+6287654321', 'basic', 'active');

-- Create tenant 2 staff
INSERT INTO public.staff (tenant_id, name, email, role, password_hash, is_active) 
VALUES (
  (SELECT id FROM public.tenants WHERE subdomain = 'test-tenant-2'),
  'Staff 2', 'staff2@test.com', 'admin', 
  '$2b$10$YEHzJ9/B3QXFVQyH6Qe1.uIFLHe5x/qJDBvyLpCFDjAeH9ywkCPLK', 
  true
);
```

#### Test Isolation:
1. **Logged in as test-demo staff:**
   - Navigate to `/tenant/admin/bookings`
   - See 3 bookings (John, Jane, Bob)
   - Note the data

2. **Switch to test-tenant-2 staff:**
   - Logout
   - Login with: `staff2@test.com` / `test123`
   - Navigate to `/tenant/admin/bookings`
   - **MUST be empty** (staff2 has no bookings)
   - **CRITICAL:** If you see test-demo's bookings → DATA LEAK ❌

3. **Back to test-demo:**
   - Logout and login as `staff@testdemo.com`
   - Should still see 3 bookings
   - Verify nothing was lost

### Expected Results ✅
```
Tenant A login → See Tenant A data only ✅
Tenant B login → See Tenant B data only ✅
No cross-tenant data visible ✅
API returns 401 for unauthorized access ✅
```

---

## 🐛 Logging Issues

### If You Find a Bug

Use this template:

```markdown
### Bug: [Title]
- **Module:** [Bookings/Customers/Finance/etc]
- **Severity:** Critical / High / Medium / Low
- **Steps to Reproduce:**
  1. First action
  2. Second action
  3. Bug occurs
- **Expected:** [What should happen]
- **Actual:** [What actually happened]
- **Error Message:** [If any console errors]
- **Browser:** Chrome/Firefox/Safari
- **Screenshot:** [If helpful]
```

Example:
```markdown
### Bug: Bookings filter by status not working
- **Module:** Bookings
- **Severity:** High
- **Steps:**
  1. Navigate to Bookings page
  2. Click filter dropdown
  3. Select "completed"
  4. Still showing all bookings
- **Expected:** Only completed bookings show
- **Actual:** All bookings still visible
- **Error:** No console errors
```

---

## ✅ Success Criteria

Testing is complete when:

- [ ] **Phase 1-6:** All CRUD operations work without errors
- [ ] **Phase 7:** Data isolation verified (MOST IMPORTANT)
- [ ] **Phase 8:** No unhandled errors or crashes
- [ ] **Performance:** Pages load in < 2 seconds
- [ ] **UI:** Responsive on mobile/tablet/desktop
- [ ] **Console:** No warnings or errors (except pre-existing 404 page issue)

---

## 🎯 After Testing

### If All Tests Pass ✅
1. Take screenshot of analytics dashboard
2. Note any performance observations
3. Proceed to deployment

### If Issues Found ❌
1. Document issues using bug template
2. Check if issue is critical (blocks functionality)
3. Either fix immediately or create ticket for later
4. Re-test affected areas

---

## 📊 Test Results Template

Copy and fill this out as you test:

```
## Testing Results - [Date]

### Phase 1: Authentication
- Login flow: ✅ / ❌
- Logout: ✅ / ❌
- Protected routes: ✅ / ❌
- Notes: 

### Phase 2: Bookings
- View: ✅ / ❌
- Create: ✅ / ❌
- Edit: ✅ / ❌
- Delete: ✅ / ❌
- Filter/Search: ✅ / ❌
- Notes:

### Phase 3: Customers
- View: ✅ / ❌
- Create: ✅ / ❌
- Edit: ✅ / ❌
- Delete: ✅ / ❌
- Search: ✅ / ❌
- Notes:

### Phase 4: Services
- View: ✅ / ❌
- Delete: ✅ / ❌
- Notes:

### Phase 5: Finance
- View: ✅ / ❌
- Filter/Search: ✅ / ❌
- Notes:

### Phase 6: Analytics
- Dashboard loads: ✅ / ❌
- KPI cards: ✅ / ❌
- Charts display: ✅ / ❌
- Date filtering: ✅ / ❌
- Notes:

### Phase 7: Data Isolation (CRITICAL)
- Tenant A sees only own data: ✅ / ❌
- Tenant B sees only own data: ✅ / ❌
- No cross-tenant leakage: ✅ / ❌
- Notes:

### Phase 8: Error Handling
- Errors handled gracefully: ✅ / ❌
- No crashes: ✅ / ❌
- Notes:

### Issues Found
[List any bugs here]

### Ready for Production?
- [ ] Yes - All tests passed
- [ ] No - [List blocking issues]
```

---

## 🆘 Support

### Common Issues

**Q: Can't connect to Supabase?**
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Q: Test data not showing after SQL runs?**
- Refresh browser page
- Check RLS policies aren't blocking
- Verify you ran entire SQL script

**Q: Login not working?**
- Check password is exactly: `test123`
- Check email is: `staff@testdemo.com`
- Check browser cookies enabled

**Q: Seeing other tenant's data?**
- This is a CRITICAL bug - data isolation failed
- Stop testing and report immediately
- Do not proceed to production

---

## 📞 Questions?

If you need help during testing, check:
1. `docs/QUICK_TEST_START.md` - Step-by-step checklist
2. `docs/TESTING_GUIDE.md` - Detailed test phases
3. Console (F12) - For error messages
4. Network tab (F12) - For API response issues

---

**Ready to test? Start with docs/QUICK_TEST_START.md! 🚀**


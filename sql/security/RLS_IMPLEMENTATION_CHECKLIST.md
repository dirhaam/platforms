# RLS Implementation Checklist for Application

## Status: ✅ RLS Enabled on Database

The RLS policies have been applied to all 36 tables. Now the application needs to be updated to work with RLS.

## ⚠️ CRITICAL: Without these changes, RLS will BLOCK all queries!

## Implementation Steps

### Step 1: ✅ Use RLS Context Helper (EASIEST)

**File**: `lib/database/rls-context.ts` (Already created)

This helper handles all RLS context setup:

```typescript
import { setRLSContext, withRLSContext } from '@/lib/database/rls-context';
import { createClient } from '@supabase/supabase-js';

// In your API route:
const supabase = createClient(url, key);

// Method 1: Set context manually
await setRLSContext(supabase, tenantId);
const { data } = await supabase.from('invoices').select('*').eq('tenant_id', tenantId);

// Method 2: Use wrapper (cleaner)
const data = await withRLSContext(supabase, tenantId, async () => {
  return await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId);
});
```

### Step 2: Update ALL API Routes

Every API endpoint that queries the database MUST:
1. Get `tenantId` from request headers
2. Call `setRLSContext(supabase, tenantId)`
3. Include `.eq('tenant_id', tenantId)` in queries as safety layer

**Pattern for all API routes:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setRLSContext } from '@/lib/database/rls-context';

export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Get tenant from header
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3️⃣ SET RLS CONTEXT (CRITICAL!)
    await setRLSContext(supabase, tenantId);

    // 4️⃣ Query with tenant_id filter
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId);  // Always include as backup

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 3: Search and Update All API Routes

**Files to update:**
```bash
# Find all API route files
find app/api -name "route.ts" -type f
```

**Search pattern:** `from('` to find all Supabase queries

**For each route:**
1. Add `setRLSContext(supabase, tenantId)` after creating client
2. Ensure `.eq('tenant_id', tenantId)` is in all queries
3. Test with multiple tenant accounts

### Step 4: Test RLS is Working

**Test 1: Verify tenant isolation**
```typescript
// Login as tenant A
const dataA = await supabase.from('invoices').select('*');

// Login as tenant B
const dataB = await supabase.from('invoices').select('*');

// dataA and dataB should be DIFFERENT!
// If they're the same, RLS is not working
```

**Test 2: Verify context is set**
```typescript
// Add temporary logging in API route
console.log('[RLS] Tenant ID:', tenantId);
console.log('[RLS] Query results:', data?.length, 'records');

// Should see correct tenant ID and different record counts per tenant
```

**Test 3: Direct database query to verify**
```sql
-- In Supabase SQL editor
SET app.current_tenant_id = 'TENANT_ID_HERE';
SELECT * FROM invoices;
```

## 📋 Files to Update

### High Priority (Booking System)
- [ ] `/app/api/bookings/route.ts`
- [ ] `/app/api/bookings/[id]/route.ts`
- [ ] `/app/api/bookings/availability/route.ts`
- [ ] `/app/api/bookings/blocked-dates/route.ts`

### High Priority (Invoice System)
- [ ] `/app/api/invoices/route.ts`
- [ ] `/app/api/invoices/[id]/route.ts`
- [ ] `/app/api/invoices/from-booking/[bookingId]/route.ts`
- [ ] `/app/api/invoices/from-sales/[transactionId]/route.ts`

### High Priority (Sales)
- [ ] `/app/api/sales/transactions/route.ts`
- [ ] `/app/api/sales/transactions/[id]/route.ts`

### High Priority (Settings)
- [ ] `/app/api/settings/business-hours/route.ts`
- [ ] `/app/api/settings/invoice-config/route.ts`
- [ ] `/app/api/settings/**/route.ts` (all settings endpoints)

### Medium Priority (Customers & Services)
- [ ] `/app/api/customers/route.ts`
- [ ] `/app/api/services/route.ts`
- [ ] `/app/api/staff/route.ts`

### Medium Priority (Messaging)
- [ ] `/app/api/messages/route.ts`
- [ ] `/app/api/conversations/route.ts`
- [ ] `/app/api/whatsapp/route.ts`

## 🚨 What Happens Without Implementation

### ❌ WITHOUT RLS Context Set:

```
GET /invoices
Response: [] (empty array)
Reason: RLS blocks all records because tenant context is NULL
```

### ✅ WITH RLS Context Set:

```
GET /invoices (Tenant A)
Response: [invoice1, invoice2, invoice3] (only Tenant A's invoices)

GET /invoices (Tenant B)
Response: [invoice4, invoice5] (only Tenant B's invoices)
```

## 🔍 Debugging RLS Issues

### Log what tenant_id is being used:
```typescript
console.log('[RLS] Setting context for tenant:', tenantId);
console.log('[RLS] Query returned', data?.length, 'records');
```

### Common Issues:

| Problem | Cause | Solution |
|---------|-------|----------|
| Empty results | RLS context not set | Call `setRLSContext()` before query |
| Wrong data | tenant_id mismatch | Verify header value matches database |
| Slow queries | RLS evaluating all rows | Ensure indexes exist on tenant_id |
| Permission denied | RLS policy too strict | Check policy rules in database |

## 📚 Reference

### RLS Function
**Database**: `get_current_tenant_id()` 
**Returns**: Current tenant ID from session variable

### RLS Policies Applied
**Format**: `table_name_tenant_isolation`
**Logic**: Only allow access to records where `tenant_id = get_current_tenant_id()`

### Session Variable
**Key**: `app.current_tenant_id`
**Type**: UUID
**Set by**: Application code using `setRLSContext()`

## ✅ Verification Checklist

After updating all routes:

- [ ] All API routes set RLS context
- [ ] All queries include `.eq('tenant_id', tenantId)` filter
- [ ] Tested with multiple tenant accounts
- [ ] Verified tenant isolation works
- [ ] No performance degradation
- [ ] RLS context logging shows correct tenant IDs
- [ ] Ready for production deployment

## 🚀 Production Deployment

1. Apply SQL migration to production database
2. Deploy application with RLS context updates
3. Monitor logs for RLS context warnings
4. Verify multi-tenant isolation with staging data
5. Monitor performance - should be similar to before

## 💡 Pro Tips

1. **Always use `.eq('tenant_id', tenantId)`** even with RLS - provides defense in depth
2. **Cache RLS context** if making multiple queries in same request
3. **Log RLS context** during development to catch issues early
4. **Test multi-tenant** isolation before going to production
5. **Monitor performance** - add indexes on `(tenant_id, other_columns)` if needed

## Support

See `RLS_SETUP_GUIDE.md` for architectural details and troubleshooting.

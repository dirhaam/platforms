# Row Level Security (RLS) Setup Guide

## Problem

Supabase detected that 36 tables do NOT have Row Level Security (RLS) enabled. This is a **CRITICAL SECURITY ISSUE**:

- ❌ Anyone with database credentials can access ALL tenant data
- ❌ Direct API calls can bypass application logic
- ❌ Data from different tenants can be viewed/modified by unauthorized users

## Solution

Enable RLS on all tables and implement tenant-based isolation policies.

## Implementation Steps

### Step 1: Run the Migration Script

Execute the SQL script: `sql/security/enable-rls-all-tables.sql`

This will:
1. Enable RLS on all 36 public tables
2. Create a helper function `get_current_tenant_id()`
3. Create RLS policies for tenant isolation

### Step 2: Update Your API Handlers

After enabling RLS, you MUST set the tenant context in every request:

```typescript
// In your API middleware or endpoint handlers
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Set tenant context for RLS to work
const { error } = await supabase.rpc('set_config', {
  key: 'app.current_tenant_id',
  value: tenantId
});

// OR using connection string if available
const { data, error } = await supabase
  .from('invoices')
  .select('*')
  .eq('tenant_id', tenantId);  // Always filter by tenant_id as fallback
```

### Step 3: Important: Always Include Tenant ID Filter

Even with RLS enabled, ALWAYS filter by `tenant_id` in your queries:

```typescript
// CORRECT - includes tenant_id filter
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('tenant_id', tenantId);

// RISKY - relies only on RLS (not recommended as sole protection)
const { data } = await supabase
  .from('invoices')
  .select('*');
```

## How RLS Works

### 1. **Tenant Isolation**
Each record has a `tenant_id` column. RLS policies ensure:
- Users can only see records where `tenant_id = current_tenant_id`
- INSERT/UPDATE/DELETE only allowed for current tenant

### 2. **Session Context**
When a request comes in:
1. Application extracts `tenant_id` from request headers or JWT
2. Sets it in the database session: `app.current_tenant_id`
3. RLS policies automatically filter all queries by this tenant

### 3. **Function-based Policies**
The helper function `get_current_tenant_id()` reads from:
1. Current session variable (`app.current_tenant_id`)
2. Or looks up from `sessions` table using `user_id`
3. Returns TEXT (not UUID) for flexibility with different ID formats

## Tables Protected

### Invoice System (6 tables)
- `invoices` - Main invoice records
- `invoice_items` - Invoice line items
- `invoice_branding_settings` - Invoice customization
- `invoice_tax_service_charge` - Tax/fee configuration
- `invoice_travel_surcharge_settings` - Travel surcharge settings
- `invoice_additional_fees` - Additional fees configuration

### Sales Transactions (3 tables)
- `sales_transactions` - Transaction records
- `sales_transaction_items` - Transaction items
- `sales_transaction_payments` - Payment records

### Booking System (2 tables)
- `bookings` - Booking records
- `booking_payments` - Booking payment records

### Core Business (4 tables)
- `tenants` - Business accounts
- `services` - Services offered
- `customers` - Customer records
- `staff` - Staff members

### Scheduling (3 tables)
- `business_hours` - Operating hours
- `blackout_dates` - Closed dates
- `blocked_dates` - Unavailable dates

### Messaging (3 tables)
- `conversations` - Chat conversations
- `messages` - Chat messages
- `message_templates` - Template messages

### WhatsApp Integration (3 tables)
- `whatsapp_endpoints` - WhatsApp connections
- `whatsapp_devices` - Connected devices
- `tenant_whatsapp_config` - WhatsApp settings

### Media/Gallery (4 tables)
- `tenant_photo_galleries` - Gallery albums
- `tenant_gallery_photos` - Photos in galleries
- `tenant_media_settings` - Media settings
- `tenant_videos` - Video records

### Settings (3 tables)
- `service_areas` - Service coverage areas
- `tenant_social_media` - Social media links
- `tenant_subdomains` - Subdomain mappings

### Session/Audit (3 tables)
- `sessions` - User sessions
- `security_audit_logs` - Security audit trail
- `activity_logs` - Activity history

### Cache (1 table)
- `cache` - Cache storage (read-only for clients)

## Testing RLS

### Test 1: Verify RLS is Enabled
```sql
-- Should show RLS enabled for all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Test 2: Verify Policies Exist
```sql
-- Should show all policies created
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Test 3: Test Isolation
```sql
-- Should fail if logged in as different tenant
SELECT * FROM invoices 
WHERE tenant_id != get_current_tenant_id();  -- RLS blocks this
```

## Important Notes

### ⚠️ Breaking Changes

1. **All existing queries must include tenant_id filter** or set session context
2. **Service role key can bypass RLS** - keep it secure!
3. **Backend queries using SERVICE_ROLE_KEY** - must still filter by tenant_id

### 🔒 Security Best Practices

1. **Never expose SERVICE_ROLE_KEY** - only use on backend
2. **Always set tenant context** in session before queries
3. **Always filter by tenant_id** as additional layer
4. **Audit logs enabled** - all changes are logged
5. **Test RLS policies** before production deployment

### 🚀 Migration Checklist

- [ ] Run SQL migration script
- [ ] Update all API handlers to set tenant context
- [ ] Update frontend client to include tenant_id in queries
- [ ] Test with multiple tenant accounts
- [ ] Verify RLS policies are working
- [ ] Run security audit
- [ ] Deploy to production

## Rollback Plan

If issues occur, you can temporarily disable RLS:

```sql
-- ONLY FOR EMERGENCY ROLLBACK
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

But this should only be temporary. Fix the underlying issue and re-enable immediately.

## References

- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Postgres RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security-best-practices)

# WhatsApp Setup - Debugging 500 Error

## 🔴 Problem
POST /api/whatsapp/tenant-config/{tenantId} returns 500 Internal Server Error

## 🔍 Step-by-Step Troubleshooting

### Step 1: Check Database Tables Exist
```bash
# In Supabase SQL Editor, run:

-- Check if table exists
\d whatsapp_endpoints;
\d tenant_whatsapp_config;

-- If not found, run migration:
-- Copy contents of: sql/whatsapp/fix-whatsapp-endpoints-types.sql
-- Paste & execute
```

**Expected Result**:
```
                Table "public.whatsapp_endpoints"
      Column      |           Type            | Collation | Nullable | Default
------------------+---------------------------+-----------+----------+---------
 id               | uuid                      |           | not null | gen_random_uuid()
 tenant_id        | uuid                      |           | not null | 
 name             | text                      |           | not null | 
 api_url          | text                      |           | not null | 
 api_key          | text                      |           | not null | 
 webhook_url      | text                      |           | not null | 
 webhook_secret   | text                      |           | not null | 
 is_active        | boolean                   |           |          | true
 health_status    | text                      |           |          | 'unknown'
 last_health_check| timestamp with time zone  |           |          | 
 created_at       | timestamp with time zone  |           |          | now()
 updated_at       | timestamp with time zone  |           |          | now()
```

**If missing**: ⚠️ RUN MIGRATION NOW!

---

### Step 2: Check Environment Variables

Check if `WHATSAPP_ENDPOINTS` is set in production:

```bash
# Vercel (if using):
# 1. Go to Project Settings → Environment Variables
# 2. Look for WHATSAPP_ENDPOINTS
# 3. Format should be:
[{"name":"Primary","apiUrl":"https://...","apiKey":"..."}]

# Local (.env.local):
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://...","apiKey":"..."}]
```

**If not set**: ⚠️ ADD IT NOW!

---

### Step 3: Check Server Logs

#### If Using Vercel:
```bash
# Terminal:
vercel logs

# Or in web:
# 1. Go to Vercel Dashboard
# 2. Select project
# 3. Go to "Deployments"
# 4. Click latest deployment
# 5. Go to "Function Logs"
# 6. Look for errors around POST /api/whatsapp/tenant-config
```

#### If Using Local Dev:
```bash
# Terminal where you ran `npm run dev`:
# Look for error stack trace

# Or check browser DevTools:
# F12 → Network → Find POST request
# Click it → Response tab
# See full error message
```

---

### Step 4: Most Common Issues

#### Issue 1: Missing Database Tables
**Error in logs**: 
```
relation "whatsapp_endpoints" does not exist
```
**Fix**:
```sql
-- Run: sql/whatsapp/fix-whatsapp-endpoints-types.sql
```

#### Issue 2: Missing ENV Variable
**Error in logs**:
```
Cannot read property 'getEndpointConfig' of undefined
or
WHATSAPP_ENDPOINTS is undefined
```
**Fix**:
```bash
# Add to .env.local or Vercel env vars:
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://your-api.com",
    "apiKey": "your-key"
  }
]
```

#### Issue 3: Invalid JSON in WHATSAPP_ENDPOINTS
**Error in logs**:
```
SyntaxError: Unexpected token
```
**Fix**:
```bash
# Make sure JSON is valid - use JSONLint to validate:
# https://jsonlint.com/

# Correct format:
[{"name":"Primary","apiUrl":"https://...","apiKey":"..."}]

# Wrong (single quotes):
[{'name':'Primary',...}]  ❌

# Wrong (trailing comma):
[{"name":"Primary",...},]  ❌
```

#### Issue 4: Supabase Connection Error
**Error in logs**:
```
SUPABASE_SERVICE_ROLE_KEY is undefined
or
Cannot connect to Supabase
```
**Fix**:
```bash
# Verify in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx
```

#### Issue 5: KV Store Error
**Error in logs**:
```
KV store not configured
or
Cannot read property 'set' of undefined
```
**Fix**:
- If local: KV cache might not work, but shouldn't break API
- If Vercel: Make sure Vercel KV is connected (if using)

---

## 🔧 Quick Fix Checklist

```
[ ] 1. Database tables exist
      → Run: sql/whatsapp/fix-whatsapp-endpoints-types.sql
      → Verify with: \d whatsapp_endpoints;

[ ] 2. ENV variables set
      → Add WHATSAPP_ENDPOINTS to .env.local or Vercel
      → Validate JSON format

[ ] 3. Restart app
      → Local: Ctrl+C then npm run dev
      → Production: Redeploy to Vercel or your platform

[ ] 4. Clear cache
      → Browser: Ctrl+Shift+Delete (clear all)
      → Or try incognito window

[ ] 5. Test again
      → Try assigning endpoint
      → Check for success
```

---

## 📋 Diagnostic Commands

### Run These to Check Everything:

**In Supabase SQL Editor:**
```sql
-- Check tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'whatsapp_endpoints'
);

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_endpoints';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'whatsapp_endpoints';

-- Check foreign keys
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'whatsapp_endpoints';
```

**In Browser Console (F12):**
```javascript
// Test if API is accessible
fetch('/api/whatsapp/available-endpoints')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));

// Should see: { endpoints: ["Primary", "Secondary", ...] }
```

---

## 🔍 Detailed Error Investigation

### Enable Detailed Logging

**File**: `app/api/whatsapp/tenant-config/[tenantId]/route.ts`

Add detailed logging:

```typescript
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    console.log('[WhatsApp POST] Starting...');
    
    const { tenantId } = await context.params;
    console.log('[WhatsApp POST] tenantId:', tenantId);
    
    const body = await request.json();
    console.log('[WhatsApp POST] body:', body);
    
    const { endpoint_name } = body;
    console.log('[WhatsApp POST] endpoint_name:', endpoint_name);

    // ... rest of code ...

    console.log('[WhatsApp POST] Success');
    return response;
    
  } catch (error) {
    console.error('[WhatsApp POST] ERROR:', error);
    console.error('[WhatsApp POST] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
```

Then check logs to see exactly where it fails.

---

## 📞 If Still Stuck

Provide these details:

1. **Database check**:
   ```sql
   SELECT * FROM whatsapp_endpoints LIMIT 1;
   ```
   (Does it return a table or error?)

2. **ENV variable check**:
   - Is `WHATSAPP_ENDPOINTS` set in production?
   - Is it valid JSON?

3. **Server logs**:
   - What's the full error message?
   - Which line is failing?

4. **Exact request**:
   - What endpoint_name are you sending?
   - Is it in the WHATSAPP_ENDPOINTS list?

---

## ✅ When It's Fixed

You should see:
1. Success message in admin UI
2. `is_configured = true` in database
3. Tenant can see endpoint configuration
4. No errors in console or logs

Good luck! 🚀

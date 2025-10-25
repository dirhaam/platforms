# 🔴 FIX 500 ERROR - IMMEDIATE STEPS

Anda mendapat POST 500 error. Mari kita fix sekarang!

---

## ⚡ QUICK FIX (15 mins)

### Step 1: Check Database Tables (2 mins)

Buka **Supabase SQL Editor** dan jalankan:

```sql
-- Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'whatsapp_endpoints'
);
```

**If returns FALSE** (tables don't exist):
```sql
-- Run this migration:
-- Copy contents of: fix-whatsapp-endpoints-types.sql
-- Paste & execute in SQL Editor
```

**Expected**:
```
 exists 
--------
 t
(1 row)
```

---

### Step 2: Check Environment Variables (3 mins)

**If on Vercel:**
1. Go to Project Settings → Environment Variables
2. Look for `WHATSAPP_ENDPOINTS`
3. Must exist and be valid JSON

**If on local:**
1. Open `.env.local`
2. Add or verify:
```bash
WHATSAPP_ENDPOINTS=[
  {
    "name": "Primary",
    "apiUrl": "https://your-whatsapp-api.com",
    "apiKey": "your-api-key-here"
  }
]
```

**If not set**: ⚠️ **ADD IT NOW**

---

### Step 3: Redeploy with New Logging (5 mins)

Code sekarang sudah punya detailed logging. Redeploy:

**Local:**
```bash
# If you have changes uncommitted
git add .
git commit -m "debug: WhatsApp setup"

# Restart dev server
npm run dev
```

**Vercel:**
```bash
# Just push to main
git push origin main

# Wait for deployment
# Check function logs: vercel logs --follow
```

---

### Step 4: Test & Check Logs (5 mins)

1. Go to admin page
2. Try assigning endpoint
3. **Check logs immediately**

**For Vercel:**
```bash
vercel logs --follow
```

**For local dev:**
```bash
# Terminal where npm run dev is running
# Look for: [WhatsApp POST] messages
```

**You should see**:
```
[WhatsApp POST] Starting endpoint assignment...
[WhatsApp POST] tenantId: c9d49197-317d-4d28-8fc3-fb4b2a717da0
[WhatsApp POST] endpoint_name: Primary
[WhatsApp POST] Validating endpoint in ENV...
[WhatsApp POST] Endpoint validated ✓
[WhatsApp POST] Resolving tenant ID...
[WhatsApp POST] Tenant resolved: c9d49197-317d-4d28-8fc3-fb4b2a717da0
[WhatsApp POST] Getting endpoint config...
[WhatsApp POST] Endpoint config retrieved ✓
[WhatsApp POST] Syncing endpoint to database...
[WhatsApp POST] Endpoint synced ✓
[WhatsApp POST] Config saved ✓
[WhatsApp POST] Returning success response...
```

**If you see ERROR somewhere** → Error message tells you what's wrong

---

## 🔍 FIND THE ERROR

### If logs show error, match to this list:

| Error Log | Meaning | Fix |
|-----------|---------|-----|
| `Endpoint not found in ENV` | endpoint_name doesn't match ENV | Check WHATSAPP_ENDPOINTS spelling |
| `Failed to resolve tenant` | Tenant not found | Check tenant UUID/subdomain |
| `relation "whatsapp_endpoints" does not exist` | Database table missing | Run migration SQL |
| `SUPABASE_SERVICE_ROLE_KEY is undefined` | Missing ENV var | Add to .env.local or Vercel settings |
| `Cannot read property 'setEndpoint'` | whatsappEndpointManager error | Check KV cache setup |
| `SyntaxError` | Invalid JSON in WHATSAPP_ENDPOINTS | Use JSONLint to validate |

---

## 🎯 MOST LIKELY CAUSES

### Issue #1: Database Tables Missing (70% chance)

**Fix**:
```bash
# In Supabase SQL Editor:
1. Copy: fix-whatsapp-endpoints-types.sql
2. Paste & Execute
3. Run: \d whatsapp_endpoints;
4. Should show table structure
```

### Issue #2: ENV Variable Not Set (25% chance)

**Fix**:
```bash
# .env.local or Vercel settings:
WHATSAPP_ENDPOINTS=[{"name":"Primary","apiUrl":"https://...","apiKey":"..."}]

# Then restart or redeploy
```

### Issue #3: Invalid JSON Format (5% chance)

**Fix**:
```bash
# WRONG (single quotes):
[{'name':'Primary',...}]  ❌

# RIGHT (double quotes):
[{"name":"Primary",...}]  ✅

# Validate: https://jsonlint.com/
```

---

## ✅ VERIFICATION

Once fixed, you should see:

```
1. SUCCESS message in admin UI
2. No error in console/logs
3. Database record created:
   - whatsapp_endpoints table has new row
   - tenant_whatsapp_config table has new row
4. Tenant sees "Endpoint Configuration" (not error)
```

---

## 📋 DIAGNOSTIC QUERIES

Run in Supabase SQL Editor:

```sql
-- Check tables exist
\d whatsapp_endpoints;

-- Check records
SELECT * FROM whatsapp_endpoints;
SELECT * FROM tenant_whatsapp_config;

-- Check if specific tenant has config
SELECT * FROM tenant_whatsapp_config 
WHERE tenant_id = 'c9d49197-317d-4d28-8fc3-fb4b2a717da0';
```

---

## 🆘 Still Stuck?

If you still get 500 error after these steps:

1. **Share the error from logs:**
   - If Vercel: Run `vercel logs --follow` and paste error
   - If local: Paste the [WhatsApp POST] ERROR message

2. **Check these commands:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM whatsapp_endpoints LIMIT 1;
   SELECT * FROM tenant_whatsapp_config LIMIT 1;
   ```

3. **Verify ENV:**
   ```bash
   # In terminal:
   echo $WHATSAPP_ENDPOINTS  # Should show JSON
   ```

---

## 🚀 Once Working

Success looks like:
- No 500 error
- Success message in UI
- Data saved to database
- Tenant sees configuration

Then you're done! 🎉

Good luck! Let me know if you need help. 💪

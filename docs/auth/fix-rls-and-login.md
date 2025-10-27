# 🔧 LENGKAP SUPABASE RLS & LOGIN ISSUES

## 📖 Summary Current Issues

### ❌ **Error Patterns Detected:**
1. **401 Unauthorized** pada login API
2. **404 Not Found** pada main domain dan subdomain
3. **Network error** - menunjukkan connection issues

### 🎯 **Root Causes:**
1. **RLS Policies** blocking API access
2. **Database connection issues**
3. **Missing environment variables**
4. **Wrong redirect configuration**

---

## 🚀 **QUICK FIX SOLUTIONS**

### **Priority #1: Fix Database Connection**

#### **Step 1: Verify Environment Variables in Vercel**
```bash
# Check current environment (akan menunjukkan kekurangan)
vercel env ls

# Add/update environment variables
vercel env add DATABASE_URL="postgresql://postgres.db_user:password@db.xxx.supabase.co:5432/postgres"
vercel env add NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
vercel env add SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here"
vercel env add NODE_ENV="production"
```

#### **Step 2: Test Database Connection**
```bash
# Test koneksi
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW() as test').then(console.log).catch(console.error);
pool.end();
"
```

### **Priority #2: Fix RLS Policies**

#### **Option A: Disable RLS Temporarily (Quick Fix)**
```sql
-- Di Supabase Dashboard → SQL Editor
-- Ini adalah RLS policy yang menyebabkan redirect loop

-- 1. Disabilitasi sementara (NOT RECOMMENDED FOR PRODUCTION)
DROP POLICY IF EXISTS "authenticated" ON auth.users;
DROP POLICY IF EXISTS "service_role" ON auth.users;
```

#### **Option B: Update Service Role Policy (Recommended)**
```sql
-- Update service role agar bisa akses API
ALTER POLICY "service_role" ON auth.users
USING (function() RETURNS boolean)
CHECK (
  auth.jwt() ->> string IS NOT NULL
);

-- Tambahkan policy untuk bypass RLS untuk API calls (LEBIH DIREKOMENKAN)
CREATE POLICY "bypass_rls_for_api" ON public
USING (function() RETURNS boolean)
CHECK (
  current_setting('request.headers.x-bypass-rls', true, false) = true
);

-- Grant permissions
GRANT ALL on SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

### **Priority #3: Configure Redirect URLs**

#### **Di Supabase Dashboard:**
1. **Project → Authentication → URL Configuration**
2. **Primary URL**: `https://booqing.my.id`
3. **Add Redirect URLs:**
   ```
   https://booqing.my.id/**
   https://booqing.my.id/api/**
   https://booqing.my.id/admin/**
   https://booqing.my.id/login/**
   https://*.booqing.my.id/**

   # Untuk development:
   http://localhost:3000/**
   ```

---

## 🔧 **STEP-BY-STEP IMPLEMENTATION**

### **Langkah 1: Debug Environment**
```bash
# 1. Check Vercel environment
vercel env ls

# 2. Test connection轮流
node -e "
const { Pool } = require('pg');
const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

Console.log('Database URL exists:', !!env.DATABASE_URL);
Console.log('Supabase URL set:', !!env.NEXT_PUBLIC_SUPABASE_URL);
"
```

### **Langkah 2: Fix RLS**
```sql
-- Connect ke Supabase SQL Editor
-- Dashboard → Project → SQL Editor

-- Jalankan query untuk mengecek RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Hapus RLS policies yang menyebabkan redirect loop
DROP POLICY IF EXISTS "authenticated" ON auth.users;
DROP POLICY IF EXISTS "service_role" ON auth.users;
```

### **Langkah 3: Setup Service Role Key**
1. Dashboard → Project → API → **service_role**
2. **"Regenerate"** untuk dapatkan key baru
3. **Permissions set**: 
   - Create users
   - Read users
   - Update users
   - Impersonate users

### **Langkah 4: Configure Redirect URLs**
1. Dashboard → Project → Authentication → **URL Configuration**
2. **Add URLs seperti di atas**
3. **Save & Deploy**

---

## 🧪 **Testing After Fix**

### **Test Script yang Sudah Dibuat:**
```bash
node test-redirect-ls.js
```

### **Expected Results:**
```
✅ API access: 200 OK
✅ API response: {"tenants": []}
❌ No redirects for API calls
✅ Main domain: 200 OK  
✅ Subdomain: 200 OK
```

### **Test Login:**
1. Akses: `https://booqing.my.id/admin`
2. Login: **Email & Password super admin**
3. Expected: ✅ Berhasil login ke dashboard

---

## ⚡ **TROUBLESHOOTING**

### **Error Masih Terjadi:**
1. **404 Error** → Connection issues (check env vars)
2. **Still Redirect Loop** → RLS policies still active
3. **401 Unauthorized** → Service role key or permissions issue

### **Debug Commands:**
```bash
# Check Vercel environment
vercel env ls

# Test database specifically  
node -e "
const fs = require('fs');
const env = JSON.parse(fs.readFileSync('.env.local', 'utf8'));
console.log('DATABASE_URL:', env.DATABASE_URL.substring(0, 20) + '...');
console.log('SUPABASE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
"

# Test Supabase connection
curl -X POST "https://api.supabase.co/rest/v1/auth/healthcheck"
```

---

## 💡 **Permanent Solution Checklist**

### ✅ **Production Ready:**
- [ ] All environment variables configured in Vercel
- [ ] Database connection verified
- [ ] RLS policies properly configured  
- [ Redirect URLs configured
- [ ] Super admin created and tested

### ✅ **Security Best Practices:**
- [ ] Service role key secret stored securely
- [ ] RLS policies enabled (not disabled)
- [ ] Redirect URLs properly scoped
- [ ] API keys rotated regularly

---

## 🎯 **Expected Login Flow After Fix:**

1. ✅ **User enters** admin credentials
2. ✅ **API call** `/api/auth/login` → No blocks
3. ✅ **Authentication** → Database logic runs
4. ✅ **Session cookie** → Set successfully  
5. ✅ **Redirect** → Admin dashboard
6. ✅ **Success** → User logged in!

---

## 📞 **Implementation Notes**

### **Database Migration Impact:**
- Tidak ada perubahan data schema diperlukan
- Hanya configuration authentication policies
- User records tetap utuh

### **Rollback Process:**
```sql
-- Jika perlu restore original RLS policies
CREATE POLICY "authenticated" ON auth.users
CREATE POLICY "service_role" ON auth.users
```

---

**Setelah mengikuti langkah-langkah di atas, login akan berfungsi normal tanpa 401 redirect error!** 🎉

# 🔐 Admin Setup Guide - Booqing Platform

## 📋 Overview

Guide untuk membuat Super Admin pertama kali di Booqing Platform dengan Supabase integration.

## 🎯 Two Setup Methods

### Method 1: Interactive Setup (Recommended)
Gunakan script interaktif untuk setup lengkap dengan guided wizard.

### Method 2: Script Configuration
Edit script langsung dan jalankan untuk automated setup.

---

## 🚀 Method 1: Interactive Setup (Recommended)

### Prerequisites

1. **Environment Variables tersedia** di `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://...
   ```

2. **Dependencies terinstall**:
   ```bash
   pnpm install
   ```

### Steps

1. **Jalankan Interactive Setup Script**:
   ```bash
   node setup-supabase-admin.js
   ```

2. **Follow the Prompts**:
   ```
   🚀 Booqing Platform - Supabase Admin Setup

   📝 Konfigurasi Super Admin:

   Email admin: admin@yourcompany.com
   Nama lengkap: John Doe
   Password (min 8 karakter): yourSecurePassword123
   Konfirmasi password: yourSecurePassword123

   ✅ Lanjutkan? (y/N): y
   ```

3. **Setup Process Automatik**:
   - ✅ Create user di Supabase Auth
   - ✅ Create record di `super_admins` table
   - ✅ Test authentication
   - ✅ Verify database access

4. **Login Information**:
   ```
   📋 Login Information:
      URL: http://localhost:3000/admin
      Email: admin@yourcompany.com
      Password: yourSecurePassword123
   ```

---

## ⚙️ Method 2: Manual Script Setup

### 1. Edit Configuration

Edit file `create-admin.js`:

```javascript
const adminConfig = {
  email: 'admin@yourdomain.com',     // ⚠️ GANTI dengan email Anda
  password: 'your_secure_password',  // ⚠️ GANTI dengan password Anda
  name: 'Super Admin',               // ⚠️ GANTI dengan nama Anda
  isAdmin: true
};
```

### 2. Jalankan Script

```bash
node create-admin.js
```

### 3. Expected Output

```
🚀 Starting Super Admin Creation Process...

📋 Admin Configuration:
   Email: admin@yourdomain.com
   Name: Super Admin
   Role: Super Admin

🔐 Step 1: Creating user in Supabase Auth...
✅ User created successfully in Supabase Auth
   User ID: xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx

📝 Step 2: Creating record in super_admins table...
✅ Super admin record created/updated successfully:
   ID: xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx
   Email: admin@yourdomain.com
   Name: Super Admin
   Permissions: [admin.all, tenant.create, tenant.update, tenant.delete, superadmin.all]
   Can Access All Tenants: true

🧪 Step 3: Testing authentication...
✅ Authentication test successful
   Session Active: Yes

🎉 Super Admin setup completed successfully!
```

---

## 🔧 Environment Variables Setup

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Application
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
ROOT_DOMAIN=localhost:3000
```

### Where to Get Values

1. **Supabase Dashboard** → **Project Settings** → **API**
2. **Service Role Key**: Untuk admin operations (bukan anon key)
3. **Database URL**: From connection string di Supabase

---

## 🗄️ Database Tables Involved

### 1. `auth.users` (Supabase Auth)
```sql
-- Otomatis dibuat oleh Supabase saat user registration
```

### 2. `super_admins` (Custom Table)
```sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  password_hash TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  can_access_all_tenants BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Verification Steps

### 1. Check Supabase Auth Users

#### Dashboard:
1. **Supabase Dashboard** → **Authentication** → **Users**
2. Verify user created dengan role metadata

#### API Check:
```bash
curl -H "apikey: YOUR_SERVICE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_KEY" \
     "https://your-project.supabase.co/auth/v1/admin/users"
```

### 2. Check Database Record

```sql
SELECT 
  id, 
  email, 
  name, 
  is_active, 
  can_access_all_tenants,
  created_at
FROM super_admins 
WHERE email = 'admin@yourdomain.com';
```

### 3. Test Login Application

1. **Start Development Server**:
   ```bash
   pnpm dev
   ```

2. **Access Admin Panel**:
   ```
   http://localhost:3000/admin
   ```

3. **Login dengan created credentials**

---

## 🔐 Security Best Practices

### 1. Password Requirements
- Minimum 8 characters
- Mix of letters, numbers, and special characters
- Avoid common patterns

### 2. Environment Security
- Never commit `.env.local` to git
- Use strong `JWT_SECRET`
- Store `SUPABASE_SERVICE_ROLE_KEY` securely

### 3. Access Control
- Enable 2FA for Supabase dashboard (in production)
- Use IP restrictions if possible
- Regular passwords rotation

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Missing environment variables"
```bash
❌ Missing required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
```

**Solution**: Check `.env.local` file berisi semua required variables.

#### 2. "User already registered"
```
⚠️ User already exists in Auth, proceeding with existing user...
```

**Solution**: Script will handle existing user automatically.

#### 3. "Connection refused"
```
❌ Setup failed: connection ECONNREFUSED
```

**Solution**: 
- Verify Supabase project is active
- Check network connection
- Validate DATABASE_URL format

#### 4. "Permission denied"
```
❌ Authentication test failed: new row violates row-level security policy
```

**Solution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` (not ANON key) is used.

### Debug Commands

#### Test Database Connection
```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(console.log);
"
```

#### Verify Supabase Auth Connectivity
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.auth.admin.listUsers().then(console.log);
"
```

---

## 📝 Next Steps After Setup

### 1. Immediate Actions
- [ ] Login ke admin panel
- [ ] Change default password
- [ ] Validate all features work correctly

### 2. System Configuration
- [ ] Business hours setup
- [ ] Service categories configuration
- [ ] Payment gateway setup (jika diperlukan)
- [ ] Email/SMTP configuration

### 3. Tenant Management
- [ ] Create first test tenant
- [ ] Configure tenant settings
- [ ] Test tenant subdomain access
- [ ] Validate tenant isolation

---

## 🆘 Support

### Documentation References
- [Platform Documentation](./PLATFORM_DOCUMENTATION.md)
- [Security Guide](./SECURITY.md)
- [API Reference](./API_REFERENCE.md)

### Common Help Topics
1. **Environment Setup**: Check main README.md
2. **Database Issues**: Check migration guide
3. **Authentication Problems**: Check auth documentation

### Emergency Steps
If setup fails completely:
1. Delete any partial users from Supabase Auth dashboard
2. Clean database records if needed
3. Restart setup process
4. Contact support if issues persist

---

*Last updated: 15 October 2024*

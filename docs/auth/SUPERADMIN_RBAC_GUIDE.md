# SuperAdmin & RBAC System Guide

## 🎯 Overview

Sistem Booqing Platform telah dilengkapi dengan sistem Role-Based Access Control (RBAC) yang komprehensif dan SuperAdmin untuk akses platform-wide. SuperAdmin dapat mengakses semua tenant dan fitur administratif platform.

## 🔑 SuperAdmin Credentials

**Email:** `dirhamrozi@gmail.com`  
**Password:** `12345nabila`  
**Role:** `superadmin`  
**Access:** Platform-wide access ke semua tenant dan main website

## 🏗️ RBAC Roles Structure

### 1. SuperAdmin (`superadmin`)
- **Akses:** Platform-wide access ke semua tenant
- **Permissions:** `['*']` (semua permission)
- **Dapat:** 
  - Login ke main website (localhost:3000/login)
  - Mengakses semua tenant tanpa batasan
  - Mengelola platform-wide settings
  - Melihat analytics semua tenant
  - Mengelola SuperAdmin lainnya

### 2. Owner (`owner`)
- **Akses:** Full access ke tenant mereka sendiri
- **Permissions:** `['*']` (semua permission untuk tenant mereka)
- **Dapat:**
  - Mengelola semua aspek bisnis mereka
  - Menambah/menghapus staff
  - Mengakses semua fitur tenant

### 3. Admin (`admin`)
- **Akses:** Administrative access dengan sebagian besar fitur
- **Permissions:**
  - `manage_bookings`
  - `manage_customers`
  - `manage_services`
  - `view_analytics`
  - `send_messages`
  - `manage_staff`
  - `export_data`
  - `manage_settings`

### 4. Staff (`staff`)
- **Akses:** Basic staff access untuk operasi harian
- **Permissions:**
  - `manage_bookings`
  - `view_customers`
  - `send_messages`

### 5. Receptionist (`receptionist`)
- **Akses:** Front desk operations dan customer management
- **Permissions:**
  - `manage_bookings`
  - `manage_customers`
  - `send_messages`

## 🚀 Login Instructions

### SuperAdmin Login
1. Buka: `http://localhost:3000/login`
2. Pilih tab "Super Admin"
3. Email: `dirhamrozi@gmail.com`
4. Password: `12345nabila`
5. Akan diarahkan ke `/admin` dengan akses platform penuh

### Tenant Login (Owner/Staff)
1. Buka: `http://[subdomain].localhost:3000/login`
2. Pilih tab "Owner" atau "Staff"
3. Masukkan credentials tenant
4. Akan diarahkan ke dashboard tenant

## 🛠️ Technical Implementation

### Data Storage
- **SuperAdmin:** Disimpan di Redis Upstash
- **Tenant Users:** Disimpan di PostgreSQL (Prisma)
- **Sessions:** JWT tokens dengan HTTP-only cookies

### Authentication Flow
```typescript
// SuperAdmin Authentication
TenantAuth.authenticateSuperAdmin(email, password)
  -> SuperAdminService.authenticate()
  -> Redis lookup & password verification
  -> JWT session creation

// Tenant Authentication  
TenantAuth.authenticateOwner(email, password, subdomain)
  -> Prisma database lookup
  -> Password verification
  -> JWT session creation
```

### Middleware Protection
```typescript
// Platform Admin Routes (SuperAdmin only)
/admin/* -> AuthMiddleware.authenticatePlatformAdmin()

// Tenant Routes (Owner/Staff/Admin)
/[subdomain]/* -> AuthMiddleware.authenticate()
```

## 📁 File Structure

```
lib/auth/
├── rbac.ts                 # Role definitions & permission checking
├── tenant-auth.ts          # Authentication service
├── superadmin-service.ts   # SuperAdmin management (Redis)
└── auth-middleware.ts      # Route protection middleware

app/
├── login/page.tsx          # Universal login page
├── admin/page.tsx          # SuperAdmin dashboard
└── api/auth/login/route.ts # Authentication API

scripts/
├── create-superadmin.ts    # SuperAdmin creation script
├── test-redis-superadmin.ts # Redis testing script
└── verify-superadmin.ts    # Verification script
```

## 🔧 Management Commands

### Create SuperAdmin
```bash
npx tsx scripts/create-superadmin.ts create [email] [password] [name]
npx tsx scripts/create-superadmin.ts create dirhamrozi@gmail.com 12345nabila "Super Administrator"
```

### List SuperAdmins
```bash
npx tsx scripts/create-superadmin.ts list
```

### Activate/Deactivate SuperAdmin
```bash
npx tsx scripts/create-superadmin.ts activate [email]
npx tsx scripts/create-superadmin.ts deactivate [email]
```

### Verify Setup
```bash
npx tsx scripts/verify-superadmin.ts
```

## 🔒 Security Features

### Password Security
- **Hashing:** bcrypt with salt rounds 12
- **Validation:** Minimum 8 characters, complexity requirements
- **Reset:** Secure token-based password reset

### Account Protection
- **Login Attempts:** Max 5 failed attempts before 30-minute lockout
- **Session Management:** Secure JWT with HTTP-only cookies
- **IP Tracking:** Security audit logs with IP addresses

### Access Control
- **Tenant Isolation:** Complete data separation between tenants
- **Permission Checking:** Granular permission system
- **Route Protection:** Middleware-based route protection

## 🌐 Access Patterns

### SuperAdmin Access
```typescript
// Can access any tenant
session.role === 'superadmin' && session.isSuperAdmin === true

// Platform-wide permissions
session.permissions.includes('*')

// Access all tenant data
AuthMiddleware.verifyTenantAccess() // Always returns true for SuperAdmin
```

### Tenant Access
```typescript
// Tenant-specific access
session.tenantId === currentTenantId

// Role-based permissions
RBAC.hasPermission(session, 'manage_bookings')

// Feature access
RBAC.canAccessFeature(session, 'analytics')
```

## 📊 Permission Matrix

| Feature | SuperAdmin | Owner | Admin | Staff | Receptionist |
|---------|------------|-------|-------|-------|--------------|
| Platform Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| All Tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Bookings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Customers | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Services | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Staff | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Send Messages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Settings | ✅ | ✅ | ✅ | ❌ | ❌ |

## 🚨 Troubleshooting

### SuperAdmin Login Issues
1. **Verify Redis Connection:**
   ```bash
   npx tsx scripts/verify-superadmin.ts
   ```

2. **Check Credentials:**
   - Email: `dirhamrozi@gmail.com`
   - Password: `12345nabila`

3. **Recreate SuperAdmin:**
   ```bash
   npx tsx scripts/create-superadmin.ts create dirhamrozi@gmail.com 12345nabila "Super Administrator" --force
   ```

### Tenant Login Issues
1. **Check Database Connection**
2. **Verify Tenant Exists**
3. **Check Password Hash**

### Permission Issues
1. **Check Role Assignment**
2. **Verify Permission Array**
3. **Check Middleware Configuration**

## 🔄 Future Enhancements

### Planned Features
- **Multi-Factor Authentication (MFA)**
- **Advanced Audit Logging**
- **Custom Role Creation**
- **Permission Templates**
- **Session Management Dashboard**

### Scalability Improvements
- **Redis Clustering**
- **Database Sharding**
- **Distributed Sessions**
- **Load Balancing**

## 📞 Support

Jika ada masalah dengan sistem SuperAdmin atau RBAC:

1. **Check Logs:** Lihat console logs untuk error messages
2. **Verify Setup:** Jalankan verification script
3. **Reset SuperAdmin:** Gunakan creation script dengan --force flag
4. **Contact Admin:** Hubungi system administrator

---

**Status:** ✅ **IMPLEMENTED & READY**  
**SuperAdmin:** `dirhamrozi@gmail.com` dengan password `12345nabila`  
**Access:** Platform-wide access ke semua tenant dan main website
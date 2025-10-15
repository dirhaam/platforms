# Dokumentasi: Panduan Lengkap Migrasi dari Prisma ke Drizzle dan dari D1/Redis ke Supabase

## 1. Ringkasan Migrasi

Dokumen ini memberikan panduan langkah-demi-langkah untuk menyelesaikan migrasi dari:
- **Prisma ke Drizzle ORM** (PostgreSQL)
- **Cloudflare D1/Redis ke Supabase PostgreSQL** 

Migrasi ini dirancang untuk mengatasi masalah connectivity dengan deployment di Vercel dan menyederhanakan arsitektur data aplikasi.

## 2. Prasyarat

- Lingkungan pengembangan telah disiapkan dengan Node.js dan pnpm
- Proyek saat ini berjalan dengan Prisma dan D1/Redis
- Akses ke database Supabase PostgreSQL

## 3. Langkah-Langkah Migrasi

### Bagian 1: Menyelesaikan Migrasi dari Prisma ke Drizzle ORM

#### 3.1. Update Sisa File dengan Drizzle

Anda perlu mengupdate file-file berikut untuk mengganti Prisma Client dengan Drizzle ORM. Seluruh definisi schema sudah terkonsolidasi di `lib/database/schema/index.ts`, dan konfigurasi Drizzle tersedia di `lib/database.ts` serta `drizzle.config.ts`.

**Langkah Umum:**
1. Pastikan seluruh import menggunakan utilitas baru:
```typescript
// Sebelum
import { prisma } from '@/lib/database';

// Sesudah
import { db } from '@/lib/database';
import { tenants /* atau tabel lain */ } from '@/lib/database/schema';
import { eq, and, lt, gte, desc } from 'drizzle-orm';
```

2. Ganti query Prisma ke Drizzle (lihat implementasi terbaru di `lib/auth/tenant-auth.ts`, `lib/auth/tenant-auth-drizzle.ts`, dan `lib/security/security-service.ts` sebagai referensi pola).
3. Hapus sisa ketergantungan ke `lib/database-prisma.ts` setelah semua modul memakai Drizzle sepenuhnya.

**File-file yang perlu diupdate:**
- `lib/booking/booking-service.ts`
- `lib/booking/customer-service.ts`
- `lib/booking/service-service.ts`
- `lib/dashboard/dashboard-service.ts`
- `lib/invoice/invoice-service.ts`
- `lib/invoice/financial-service.ts`
- `lib/location/service-area-service.ts`
- `lib/settings/settings-service.ts`
- `app/api/admin/tenants/route.ts`
- `app/api/auth/change-password/route.ts`
- dan file lain yang masih meng-import Prisma langsung.

**Contoh Konversi Query:**
```typescript
// Sebelum (Prisma)
const result = await prisma.tenant.findMany({
  where: {
    createdAt: {
      gte: startDate,
    },
  },
});

// Sesudah (Drizzle)
const result = await db.select().from(tenants).where(
  gte(tenants.createdAt, startDate)
);
```

#### 3.2. Testing Fungsi Aplikasi

Setelah semua query diganti:
1. Jalankan build aplikasi:
```bash
pnpm build
```

2. Lakukan testing manual pada fungsi-fungsi penting:
   - Autentikasi pengguna
   - Pembuatan dan pengelolaan tenant
   - Pembuatan dan pengelolaan booking
   - Fungsi admin dan manajemen

### Bagian 2: Menyelesaikan Migrasi dari D1/Redis ke Supabase PostgreSQL

#### 3.3. Update Service-service dengan Supabase

Ganti semua operasi D1/Redis di dalam aplikasi dengan operasi Supabase PostgreSQL. Implementasi client dasar tersedia di `lib/database-service.ts` (wrapper utilitas) yang menggantikan fungsionalitas D1. Untuk struktur tabel, lihat `lib/database/schema/index.ts`.

**Langkah Umum:**
1. Ganti import D1/Redis:
```typescript
// Sebelum
import { getTenant, setTenant, deleteTenant, 
         getCache, setCache, deleteCache,
         getSession, setSession, deleteSession } from '@/lib/d1';
import { redis } from '@/lib/redis';

// Sesudah
import { getTenant, setTenant, deleteTenant, 
         getCache, setCache, deleteCache,
         getSession, setSession, deleteSession } from '@/lib/database-service';
```

2. Ganti operasi D1/Redis ke Supabase:
```typescript
// Sebelum
await getTenant(subdomain);
await setTenant(subdomain, data);
await deleteTenant(subdomain);

// Sesudah
await getTenant(subdomain);
await setTenant(subdomain, data);
await deleteTenant(subdomain);
```

**File-file yang perlu diupdate:**
- `app/api/security/audit-logs/route.ts`
- `app/api/admin/monitoring/route.ts`
- `lib/subdomains.ts` (mungkin perlu diupdate untuk menggunakan database alih-alih Redis)
- `lib/auth/session-store.ts`
- `lib/cache/cache-service.ts`
- `lib/redis.ts`

#### 3.4. Konfigurasi Deployment untuk Supabase

1. Update environment variables untuk Supabase:
```
DATABASE_URL = "postgresql://[project_ref]:[password]@[project_ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL = "https://[project_ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "your_anon_key"
```

2. Update `lib/database.ts` untuk menggunakan koneksi Supabase PostgreSQL:
```typescript
import { drizzle, type DrizzlePg } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
```

3. Gunakan `drizzle-kit` untuk migrasi ke database Supabase:
```bash
pnpm db:push
```

#### 3.5. Hapus Dependensi D1 dan Redis

1. Hapus file-file D1/Redis:
```bash
rm lib/d1.ts
rm app/actions-d1.ts
rm app/api/admin/monitoring/route-d1.ts
rm lib/database/d1-schema.sql
rm scripts/migrate-redis-to-d1.ts
rm prisma/
```

2. Hapus dependensi D1 dan Redis dari workspace:
   - Update `pnpm-workspace.yaml` untuk menghapus referensi D1/Redis
   - Sesuaikan `drizzle.config.ts` untuk menggunakan Supabase

### Bagian 3: Testing dan Validasi

#### 3.6. Testing Fungsi Database dan Cache

1. Uji fungsi autentikasi:
   - Login/logout
   - Session expiration
   - Multi-user access

2. Uji fungsi cache:
   - Data disimpan dan diambil dengan benar
   - Data yang kadaluarsa dihapus

3. Uji fungsi tenant management:
   - Pembuatan dan penghapusan subdomain
   - Akses ke data tenant

#### 3.7. Dokumentasi dan Setup

Buat dokumentasi setup baru:

**Cara Setup Proyek (setelah migrasi selesai):**
1. Install dependensi:
```bash
pnpm install
```

2. Setup environment:
```bash
cp .env.example .env
# Isi variabel environment untuk Supabase
```

3. Setup migrasi database:
```bash
pnpm db:generate
pnpm db:push
```

4. Jalankan aplikasi:
```bash
pnpm dev
```

## 4. Catatan Penting

- **Migrasi data**: Pastikan data penting di-backup sebelum migrasi ke Supabase
- **Tipe data**: Pastikan tipe data sesuai dengan skema PostgreSQL Supabase
- **Backup**: Pastikan backup data sebelum menjalankan migrasi di production
- **Performance**: Uji kinerja aplikasi setelah migrasi karena Supabase memiliki karakteristik berbeda dari D1/Redis

## 5. Troubleshooting

- **Error saat build**: Pastikan semua import telah diupdate ke `@/lib/database-service`
- **Error saat runtime**: Cek semua operasi database telah diganti ke Supabase
- **Error koneksi Supabase**: Pastikan konfigurasi environment benar

Jalankan migrasi secara bertahap dan lakukan testing setiap langkah untuk menghindari masalah besar di akhir proses.

## 6. Validasi Akhir

Setelah semua migrasi selesai:
1. Jalankan semua test (jika ada)
2. Lakukan uji fungsionalitas secara menyeluruh
3. Periksa log aplikasi
4. Validasi kinerja aplikasi
5. Backup konfigurasi baru

Proses migrasi ini akan membantu mengatasi masalah connectivity Vercel yang Anda alami sebelumnya dengan Cloudflare D1 dan Redis Upstash.
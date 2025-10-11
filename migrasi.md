# Dokumentasi: Panduan Lengkap Migrasi dari Prisma ke Drizzle dan dari Redis ke Cloudflare D1

## 1. Ringkasan Migrasi

Dokumen ini memberikan panduan langkah-demi-langkah untuk menyelesaikan migrasi dari:
- **Prisma ke Drizzle ORM** (PostgreSQL)
- **Redis Upstash ke Cloudflare D1**

Migrasi ini dirancang untuk mengatasi masalah permission di Windows dan menyederhanakan arsitektur data aplikasi.

## 2. Prasyarat

- Lingkungan pengembangan telah disiapkan dengan Node.js dan pnpm
- Proyek saat ini berjalan dengan Prisma dan Redis
- Akses ke database PostgreSQL dan Cloudflare D1

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

### Bagian 2: Menyelesaikan Migrasi dari Redis ke Cloudflare D1

#### 3.3. Update Service-service dengan D1

Ganti semua operasi Redis di dalam aplikasi dengan operasi D1. Implementasi client dasar tersedia di `lib/d1.ts` (wrapper utilitas) dan `lib/database/d1-client.ts` (service yang berinteraksi langsung dengan D1). Untuk struktur tabel D1, lihat `lib/database/d1-schema.sql`.

**Langkah Umum:**
1. Ganti import Redis:
```typescript
// Sebelum
import { redis } from '@/lib/redis';

// Sesudah
import { getTenant, setTenant, deleteTenant, 
         getCache, setCache, deleteCache,
         getSession, setSession, deleteSession } from '@/lib/d1';
```

2. Ganti operasi Redis ke D1:
```typescript
// Sebelum
await redis.get(`subdomain:${subdomain}`);
await redis.set(`subdomain:${subdomain}`, data);
await redis.del(`subdomain:${subdomain}`);

// Sesudah
await getTenant(subdomain);
await setTenant(subdomain, data);
await deleteTenant(subdomain);
```

**File-file yang perlu diupdate:**
- `app/api/security/audit-logs/route.ts`
- `app/api/admin/monitoring/route.ts`
- `lib/subdomains.ts` (mungkin perlu diupdate untuk menggunakan database alih-alih Redis)
- `scripts/migrate-redis-to-d1.ts` (cek ulang logika migrasi agar sesuai dengan struktur kunci Redis di produksi)

#### 3.4. Konfigurasi Deployment untuk Cloudflare D1

1. Update wrangler.toml (jika menggunakan Cloudflare Workers):
```toml
[d1_databases]
DB = { binding = "D1_DATABASE", database_name = "booqing-platform", database_id = "your-database-id" }
```

2. Update environment variables di Cloudflare:
```
DATABASE_URL = "postgresql://..."
```

3. Terapkan schema D1 sebelum deployment pertama:
```bash
# Jalankan dari root proyek
wrangler d1 execute booqing-platform --file=./lib/database/d1-schema.sql
```
Sesuaikan `booqing-platform` dengan nama database D1 yang terdaftar pada Cloudflare.

#### 3.5. Hapus Dependensi Redis

1. Hapus dari package.json:
```json
// Hapus baris ini
"@upstash/redis": "^1.34.9",
```

2. Hapus file-file Redis:
```bash
rm lib/redis.ts
```

3. Update semua file yang mengimport redis.ts:
   - Ganti dengan import dari D1
   - Sesuaikan fungsi-fungsi yang digunakan
4. Bila masih memerlukan fallback selama fase transisi, dokumentasikan file mana yang masih memakai `lib/redis.ts` dan jadwalkan penghapusan final setelah skrip migrasi `scripts/migrate-redis-to-d1.ts` dan validasi selesai.

### Bagian 3: Testing dan Validasi

#### 3.6. Testing Fungsi Cache dan Session

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
# Isi variabel environment
```

3. Setup migrasi database:
```bash
pnpm db:generate
pnpm db:migrate
```

4. Jalankan aplikasi:
```bash
pnpm dev
```

5. (Opsional) Jalankan proses migrasi cache/session dari Redis ke D1 setelah koneksi diverifikasi:
```bash
pnpm tsx scripts/migrate-redis-to-d1.ts
```

## 4. Catatan Penting

- **Migrasi data**: Gunakan `scripts/migrate-redis-to-d1.ts` sebagai titik awal pemindahan cache/session; sesuaikan agar mencakup seluruh pola kunci Redis Anda.
- **Tipe data**: Pastikan tipe data yang disimpan di D1 sesuai dengan tabel pada `lib/database/d1-schema.sql`
- **Backup**: Pastikan backup data sebelum menjalankan migrasi di production
- **Performance**: Uji kinerja aplikasi setelah migrasi karena D1 memiliki karakteristik yang berbeda dari Redis

## 5. Troubleshooting

- **Error saat build**: Pastikan semua import telah diupdate
- **Error saat runtime**: Cek semua operasi database telah diganti
- **Error koneksi D1**: Pastikan konfigurasi Cloudflare Worker benar

Jalankan migrasi secara bertahap dan lakukan testing setiap langkah untuk menghindari masalah besar di akhir proses.

## 6. Validasi Akhir

Setelah semua migrasi selesai:
1. Jalankan semua test (jika ada)
2. Lakukan uji fungsionalitas secara menyeluruh
3. Periksa log aplikasi
4. Validasi kinerja aplikasi
5. Backup konfigurasi baru

Proses migrasi ini akan membantu mengatasi masalah permission Windows yang Anda alami sebelumnya dengan Prisma dan Redis Upstash.
# Sales Transactions Database Setup

## Overview
Sales Transactions table telah ditambahkan ke database schema untuk mendukung fitur Sales menu yang baru.

## Migration File
File migration: `drizzle/0002_moaning_marrow.sql`

## Cara Apply Migration

### Option 1: Menggunakan Supabase Dashboard (Recommended)
1. Buka [Supabase Dashboard](https://supabase.com)
2. Pilih project Anda
3. Pergi ke SQL Editor
4. Buat query baru
5. Copy isi dari `drizzle/0002_moaning_marrow.sql`
6. Jalankan query

### Option 2: Menggunakan Supabase CLI
```bash
supabase db push
```

### Option 3: Menggunakan PostgreSQL Client
```bash
psql $DATABASE_URL < drizzle/0002_moaning_marrow.sql
```

## Table Structure

### sales_transactions
Tabel untuk menyimpan transaksi penjualan dari Sales menu.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key to tenants |
| customer_id | UUID | Foreign key to customers |
| service_id | UUID | Foreign key to services |
| booking_id | UUID | Foreign key to bookings (optional, for FROM_BOOKING source) |
| source | text | ON_THE_SPOT atau FROM_BOOKING |
| service_name | text | Nama layanan saat transaksi dibuat |
| duration | integer | Durasi layanan (dalam menit) |
| is_home_visit | boolean | Apakah transaksi untuk home visit |
| home_visit_address | text | Alamat home visit (jika applicable) |
| total_amount | real | Jumlah total transaksi |
| payment_method | text | CASH, CARD, TRANSFER, atau QRIS |
| status | text | PENDING, COMPLETED, CANCELLED, atau REFUNDED |
| notes | text | Catatan tambahan |
| created_at | timestamp | Waktu pembuatan |
| updated_at | timestamp | Waktu update terakhir |

## Foreign Keys
- `tenant_id` → `tenants.id` (CASCADE on delete)
- `customer_id` → `customers.id` (CASCADE on delete)
- `service_id` → `services.id` (CASCADE on delete)
- `booking_id` → `bookings.id` (SET NULL on delete)

## Verification
Setelah apply migration, verify dengan query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'sales_transactions';
```

## Related Code
- Schema: `lib/database/schema/index.ts`
- Types: `types/sales.ts`
- Service: `lib/sales/sales-service.ts`
- API: `app/api/sales/**`
- UI: `app/tenant/admin/sales/**`

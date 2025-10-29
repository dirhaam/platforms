# Cara Menjalankan Database Migrations di Supabase

## 📋 Daftar Migrations

1. ✅ **MIGRATION 1**: Split Payment Support untuk Sales Transactions
   - File: `0007_add_multi_service_split_payment_support.sql`
   - Tables: `sales_transaction_items`, `sales_transaction_payments`
   - Columns: `payment_amount`, `invoice_id` di sales_transactions

2. ✅ **MIGRATION 2**: Down Payment Support untuk Bookings
   - File: `0008_add_booking_down_payment_support.sql`
   - Tables: `booking_payments`
   - Columns: `dp_amount`, `paid_amount`, `payment_method`, `payment_reference` di bookings

---

## 🚀 Langkah-Langkah Menjalankan Migrations

### Step 1: Buka Supabase Dashboard

1. Buka https://supabase.com
2. Login dengan akun Anda
3. Pilih project Anda

### Step 2: Masuk ke SQL Editor

1. Di sidebar sebelah kiri, cari **SQL Editor**
2. Klik **SQL Editor**
3. Klik **New Query** atau **+ New**

### Step 3: Copy & Paste SQL Code

Di file `/SUPABASE_MIGRATIONS.sql` berisi SEMUA migrations yang dibutuhkan.

**Option A: Jalankan Semua Sekaligus** (Recommended)
- Copy SELURUH isi dari `SUPABASE_MIGRATIONS.sql`
- Paste ke Supabase SQL Editor
- Klik **Run** (atau tekan Ctrl+Enter)

**Option B: Jalankan Satu Per Satu**

#### Migration 1: Split Payment untuk Sales
```sql
-- Copy dari MIGRATION 1 section di SUPABASE_MIGRATIONS.sql
-- Paste dan Run di Supabase
```

Tunggu selesai, kemudian:

#### Migration 2: Down Payment untuk Booking
```sql
-- Copy dari MIGRATION 2 section di SUPABASE_MIGRATIONS.sql
-- Paste dan Run di Supabase
```

### Step 4: Verifikasi Tables Berhasil Dibuat

Setelah migration selesai, verify di Supabase:

1. Buka **Database** di sidebar kiri
2. Expand **Tables**
3. Cek table berikut ada:

✅ Sales Transaction Tables:
- `sales_transaction_items` (baru)
- `sales_transaction_payments` (baru)
- `sales_transactions` (updated - ada 2 columns baru)

✅ Booking Tables:
- `booking_payments` (baru)
- `bookings` (updated - ada 4 columns baru)

### Step 5: Kembali ke Aplikasi

1. Refresh app Anda
2. Buka Chrome DevTools (F12) untuk lihat Console
3. Coba buat Sales Transaction dengan split payment
4. Seharusnya error sudah hilang! ✅

---

## 🔧 Jika Ada Error

### Error: "Table already exists"
**Solusi**: Table sudah ada di database sebelumnya. Abaikan error ini.

### Error: "Column already exists"
**Solusi**: Column sudah ditambahkan. Abaikan error ini.

### Error: "Foreign key constraint fails"
**Solusi**: 
- Pastikan parent tables sudah ada (`sales_transactions`, `bookings`, `invoices`, `services`)
- Jalankan migration urut: Migration 1 dulu, baru Migration 2

### Error: "syntax error"
**Solusi**: 
- Copy-paste code lagi dari file yang bersih
- Pastikan tidak ada character ganda atau typo

---

## 📝 SQL Code Ready to Copy

File: `/SUPABASE_MIGRATIONS.sql`

**Cara pakai:**
1. Buka file tersebut di teks editor
2. Copy ALL content
3. Paste ke Supabase SQL Editor
4. Run

---

## ✅ Setelah Migrations Berhasil

Fitur-fitur yang akan bekerja:

### 1. Sales Transaction - Split Payment
```
✅ Buat transaction dengan multiple services
✅ Bayar DP (down payment) saja dulu
✅ Track payment history
✅ Auto-calculate remaining balance
✅ Status otomatis: pending → partial → paid
```

### 2. Booking - Down Payment
```
✅ Booking dengan DP saat membuat booking
✅ Track payment history
✅ Bayar sisa kapan saja
✅ Remaining balance tracking
```

### 3. Invoice - Actual Payment Status
```
✅ Invoice show actual paid amount
✅ Status based on payment records
✅ Show payment history breakdown
```

---

## 🆘 Support

Jika ada masalah saat menjalankan migrations:

1. **Check error message** di Supabase
2. **Lihat database structure** untuk verify tables
3. **Run migrations satu per satu** untuk identify mana yang fail
4. **Copy-paste exact error message** untuk debugging

---

## 📚 Useful Supabase Links

- SQL Editor: https://supabase.com/docs/guides/database/sql-editor
- Migrations: https://supabase.com/docs/guides/migrations
- Tables: https://supabase.com/docs/guides/database/tables

Good luck! 🚀

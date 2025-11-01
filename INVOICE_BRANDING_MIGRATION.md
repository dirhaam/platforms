# Invoice Branding Settings - Migration Guide

## Latar Belakang
Pada update terbaru, ditambahkan fitur optional untuk menampilkan/menyembunyikan nama bisnis di invoice. Untuk menggunakan fitur ini, database perlu diupdate dengan kolom baru `show_business_name`.

## Langkah-langkah

### Option 1: Menggunakan Supabase Dashboard

1. Buka Supabase Dashboard untuk project Anda
2. Navigasi ke **SQL Editor**
3. Buat query baru dan jalankan SQL berikut:

```sql
ALTER TABLE invoice_branding_settings 
ADD COLUMN IF NOT EXISTS show_business_name BOOLEAN DEFAULT TRUE;
```

4. Klik **Execute** atau tekan `Cmd/Ctrl + Enter`
5. Selesai! Field sudah ditambahkan ke table.

### Option 2: Menggunakan SQL Migration File

1. File migration sudah tersedia di: `supabase/add_show_business_name.sql`
2. Jalankan melalui Supabase Dashboard atau CLI

```bash
# Jika menggunakan Supabase CLI
supabase db push
```

## Verifikasi

Untuk memverifikasi kolom sudah ditambahkan:

1. Di Supabase Dashboard, buka **Table Editor**
2. Cari table `invoice_branding_settings`
3. Lihat kolom `show_business_name` dengan tipe `boolean` dan default value `true`

## Setelah Migration

- Toggle "Tampilkan Nama Bisnis di Invoice" di Settings → Invoice Branding
- Setting akan tersimpan ke database
- Invoice preview akan menampilkan/menyembunyikan nama bisnis sesuai setting
- PDF invoice juga akan mengikuti setting ini

## Notes

- Default value adalah `TRUE` (menampilkan nama bisnis)
- Kolom dibuat dengan `IF NOT EXISTS` jadi aman untuk run berkali-kali
- Tidak ada data yang akan hilang

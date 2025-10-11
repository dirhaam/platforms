## Rencana Lanjutan Migrasi Stage 1

1. **Perbaiki kegagalan build Next.js**
   - Tambah/konfigurasi dependensi yang hilang (`drizzle-orm`, modul `drizzle-orm/pg-core`, `drizzle-orm/node-postgres`, dan `pg`).
   - Jalankan kembali `pnpm build` untuk memastikan masalah selesai.

2. **Tuntaskan konversi Prisma → Drizzle yang tersisa**
   - Layanan: `lib/location/service-area-service.ts`, utilitas migrasi di `lib/migration/*`, cache/performance services, serta `lib/subdomain/tenant-service.ts`.
   - API routes: `app/api/admin/tenants/route.ts`, `app/api/performance/metrics/route.ts`, dan endpoint lain yang masih mengandalkan Prisma.

3. **Review modul invoice**
   - Validasi ulang `invoice-service` dan `financial-service` setelah migrasi Drizzle.
   - Jalankan export (Excel/PDF) untuk memastikan data numerik tidak lagi mengandalkan `Decimal`.

4. **Uji menyeluruh**
   - Setelah semua konversi selesai, jalankan lint/build/test untuk memastikan tidak ada regresi.
   - Catat error baru (jika ada) sebagai tindak lanjut.

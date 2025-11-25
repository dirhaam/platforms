# Home Visit - Alur yang Disederhanakan

## Ringkasan

Home visit booking sekarang menggunakan **quota-based system** tanpa perlu assign staff.

---

## Cara Setup (2 Langkah)

### Langkah 1: Di Menu Services - Set Service Type

Buka **Services > Edit Service**, scroll ke bagian **Service Location Type**:

| Pilihan | Keterangan |
|---------|------------|
| `On Premise Only` | Service hanya di lokasi bisnis |
| `Home Visit Only` | Service hanya home visit |
| `Both` | Bisa pilih on premise atau home visit |

### Langkah 2: Di Menu Settings > Calendar > Home Visit Settings

Konfigurasi global untuk semua home visit:

| Setting | Keterangan | Default |
|---------|------------|---------|
| **Enable Home Visit** | Aktifkan/nonaktifkan fitur | On |
| **Daily Quota** | Maksimal booking home visit per hari | 3 |
| **Time Slots** | Slot waktu yang tersedia | 09:00, 13:00, 16:00 |
| **Require Address** | Wajib isi alamat | Yes |
| **Calculate Travel Surcharge** | Auto hitung biaya perjalanan | Yes |

---

## Alur Booking (Sederhana)

```
1. Customer/Admin pilih service yang support home visit
2. Centang "Home Visit"
3. Pilih tanggal
   └── Sistem otomatis cek:
       ├── Apakah tanggal di-block?
       └── Apakah quota hari itu masih ada?
4. Pilih time slot dari yang tersedia
5. Input alamat (jika diaktifkan)
6. Submit booking
   └── Backend validasi ulang quota
```

---

## Database Migration

Jalankan SQL ini di Supabase:

```sql
-- Tambah kolom home_visit_config ke tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS home_visit_config JSONB DEFAULT '{
  "enabled": true,
  "dailyQuota": 3,
  "timeSlots": ["09:00", "13:00", "16:00"],
  "requireAddress": true,
  "calculateTravelSurcharge": true
}'::jsonb;
```

---

## Perbedaan dengan Sistem Lama

| Aspek | Lama (Kompleks) | Baru (Sederhana) |
|-------|-----------------|------------------|
| Setup | Di setiap service | 1x di Settings > Calendar |
| Staff | Wajib/Auto-assign | Tidak perlu |
| Quota | Per staff per service | Global per hari |
| Time Slots | Dynamic dari business hours | Fixed slots yang bisa diatur |
| Travel Buffer | Blocking otomatis | Tidak ada blocking |
| Availability | Cek staff + leave + schedule | Cek quota saja |

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `components/settings/HomeVisitSettings.tsx` | UI komponen settings baru |
| `app/api/settings/home-visit/route.ts` | API untuk global settings |
| `app/api/bookings/home-visit-availability/route.ts` | Endpoint availability sederhana |
| `lib/booking/booking-service.ts` | Simplified validation |
| `components/services/home-visit-config.tsx` | Disederhanakan, hanya service type |
| `components/booking/NewBookingPOS/index.tsx` | Gunakan endpoint baru |

---

## FAQ

**Q: Apakah StaffAssignment masih ada?**
A: Ya, tetap ada di menu Services untuk kasus dimana Anda ingin membatasi staff mana yang bisa melayani service tertentu. Tapi ini opsional dan tidak mempengaruhi flow home visit sederhana.

**Q: Bagaimana jika ingin quota berbeda per service?**
A: Saat ini quota berlaku global. Jika butuh per-service, bisa dikembangkan lagi.

**Q: Travel surcharge masih dihitung?**
A: Ya, jika opsi "Calculate Travel Surcharge" diaktifkan di Settings.

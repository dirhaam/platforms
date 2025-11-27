# Home Visit Staff Assignment System

Dokumentasi lengkap sistem penugasan staff untuk layanan home visit.

## Daftar Isi

1. [Overview](#overview)
2. [Flow Diagram](#flow-diagram)
3. [Konfigurasi Staff](#konfigurasi-staff)
4. [Auto-Assignment Logic](#auto-assignment-logic)
5. [Staff Portal](#staff-portal)
6. [Admin Dashboard](#admin-dashboard)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)

---

## Overview

Sistem ini memungkinkan:
- **Auto-assignment**: Staff otomatis ditugaskan ke booking home visit berdasarkan ketersediaan
- **Per-staff configuration**: Setiap staff memiliki pengaturan home visit sendiri (kuota, jarak)
- **Staff Portal**: Staff dapat melihat booking yang ditugaskan kepada mereka
- **Admin Dashboard**: Admin dapat memonitor dan reassign staff jika diperlukan

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

Customer → Landing Page → Pilih Service (Home Visit)
                              │
                              ▼
                    ┌─────────────────────┐
                    │ GET /api/bookings/  │
                    │ home-visit-         │
                    │ availability        │
                    └─────────┬───────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │ Check per time slot:              │
              │ 1. Daily quota tersedia?          │
              │ 2. Staff tersedia? (jika require) │
              │ 3. Slot belum dibooking?          │
              └───────────────┬───────────────────┘
                              │
                              ▼
                    Customer pilih slot
                              │
                              ▼
                    ┌─────────────────────┐
                    │ POST /api/bookings  │
                    │ (create booking)    │
                    └─────────┬───────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │ validateHomeVisit()               │
              │ - Check availability              │
              │ - Auto-assign staff (if required) │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │ findAvailableStaffForHomeVisit()  │
              │ - Filter: canDoHomeVisit = true   │
              │ - Check: tidak cuti               │
              │ - Check: jadwal kerja hari itu    │
              │ - Check: slot dalam jam kerja     │
              │ - Check: tidak ada konflik        │
              │ - Check: kuota belum penuh        │
              │ - Score: prefer yg paling sedikit │
              └───────────────┬───────────────────┘
                              │
                              ▼
                    Booking Created
                    (dengan staff_id terisi)
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌─────────────────┐            ┌─────────────────┐
     │  Staff Portal   │            │ Admin Dashboard │
     │  (lihat tugas)  │            │ (monitor/assign)│
     └─────────────────┘            └─────────────────┘
```

---

## Konfigurasi Staff

### Lokasi Menu
```
Admin Panel → Staff → Edit Staff → Tab "Home Visit"
```

### URL
```
/tenant/admin/staff/[id]?subdomain={subdomain}
```

### Pengaturan yang Tersedia

| Setting | Deskripsi | Default | Range |
|---------|-----------|---------|-------|
| `canDoHomeVisit` | Toggle apakah staff bisa melayani home visit | `true` | on/off |
| `maxDailyHomeVisits` | Kuota maksimal home visit per hari | `3` | 1-10 |
| `maxTravelDistanceKm` | Radius maksimal perjalanan (km) | `20` | 5-50 |

### Contoh Konfigurasi di Database

```json
// staff.home_visit_config (JSONB)
{
  "canDoHomeVisit": true,
  "maxDailyHomeVisits": 5,
  "maxTravelDistanceKm": 30,
  "preferredAreas": []
}
```

### API untuk Update Config

```http
PUT /api/staff/{staffId}/schedule
Content-Type: application/json
X-Tenant-ID: {subdomain}

{
  "schedule": [...],
  "homeVisitConfig": {
    "canDoHomeVisit": true,
    "maxDailyHomeVisits": 5,
    "maxTravelDistanceKm": 30
  }
}
```

---

## Auto-Assignment Logic

### Kriteria Staff Tersedia

Staff dianggap **tersedia** jika memenuhi SEMUA kriteria:

1. **canDoHomeVisit = true** - Staff mengaktifkan layanan home visit
2. **Tidak sedang cuti** - Tidak ada record di `staff_leaves` untuk tanggal tersebut
3. **Bekerja di hari itu** - `staff_schedule.is_available = true` untuk day_of_week
4. **Slot dalam jam kerja** - Waktu booking antara `start_time` dan `end_time`
5. **Tidak ada konflik** - Tidak ada booking lain yang overlap (dengan travel buffer)
6. **Kuota belum penuh** - `homeVisitCount < maxDailyHomeVisits`

### Scoring & Selection

Jika ada multiple staff tersedia:
- **Score** = `maxDailyHomeVisits - currentHomeVisitCount`
- Staff dengan score **tertinggi** dipilih (prefer yang paling sedikit booking hari itu)
- Tujuan: **Load balancing** antar staff

### Contoh Skenario

```
Staff A: 2/5 home visit hari ini → Score = 3
Staff B: 4/5 home visit hari ini → Score = 1
Staff C: 3/5 home visit hari ini → Score = 2

→ Staff A dipilih (score tertinggi)
```

### Code Reference

```typescript
// lib/booking/staff-availability-service.ts
StaffAvailabilityService.findAvailableStaffForHomeVisit(
  tenantId: string,
  serviceId: string,
  scheduledAt: Date,
  serviceDuration: number,
  travelBufferMinutes: number = 30
)
```

---

## Staff Portal

### URL
```
/tenant/staff/login?subdomain={subdomain}  → Login
/tenant/staff?subdomain={subdomain}        → Dashboard
/tenant/staff/bookings?subdomain={subdomain} → All Bookings
```

### Fitur Dashboard
- **Statistik hari ini**: Total, Menunggu, Selesai, Home Visit
- **List booking hari ini**: Dengan detail waktu, customer, layanan
- **Modal detail**: Info customer, alamat, catatan
- **Quick actions**:
  - Telepon customer
  - WhatsApp customer
  - Navigasi Google Maps (untuk home visit)

### Fitur All Bookings
- Filter by tanggal
- Filter by status (Aktif, Menunggu, Dikonfirmasi, Selesai, Dibatalkan)
- Group by tanggal
- Same detail modal

### Screenshot Flow
```
Login → Dashboard (Today) → Click Booking → Detail Modal → Actions
                ↓
         All Bookings → Filter → Click Booking → Detail Modal
```

---

## Admin Dashboard

### URL
```
/tenant/admin/bookings/home-visits?subdomain={subdomain}
```

### Fitur
- **Statistik**: Total, Assigned, Unassigned, Completed
- **Filter**:
  - Tanggal
  - Status (Aktif, Menunggu, Dikonfirmasi, Selesai)
  - Assignment (Semua, Sudah Assign, Belum Assign)
- **Table booking** dengan kolom:
  - Waktu
  - Customer
  - Layanan
  - Alamat (dengan link ke Google Maps)
  - Staff (badge jika belum assign)
  - Status
  - Aksi (reassign button)

### Reassign Flow
```
Click "Assign" button
    ↓
Modal opens
    ↓
Fetch available staff (GET /api/bookings/{id}/available-staff)
    ↓
Show staff list dengan:
  - Nama
  - Current home visit count / max
  - Availability status
  - Unavailable reason (jika tidak tersedia)
    ↓
Click staff → POST /api/bookings/{id}/assign-staff
    ↓
Refresh table
```

---

## API Endpoints

### Home Visit Availability (Customer-facing)

```http
GET /api/bookings/home-visit-availability
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | Yes | Service ID |
| `date` | string | Yes | Date (YYYY-MM-DD) |

**Response:**
```json
{
  "date": "2024-01-15",
  "serviceId": "...",
  "serviceName": "Home Massage",
  "serviceDuration": 60,
  "isHomeVisitSupported": true,
  "requiresStaff": true,
  "dailyQuota": 5,
  "bookedCount": 2,
  "remainingQuota": 3,
  "slots": [
    {
      "time": "09:00",
      "start": "2024-01-15T09:00:00.000Z",
      "end": "2024-01-15T10:00:00.000Z",
      "available": true,
      "isBooked": false,
      "staffAvailable": 2,
      "staffNames": ["John", "Jane"]
    }
  ],
  "availableSlots": 3
}
```

### Home Visit Bookings (Admin)

```http
GET /api/bookings/home-visits
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `date` | string | Filter by date (YYYY-MM-DD) |
| `status` | string | `all`, `active`, `pending`, `confirmed`, `completed` |
| `assignment` | string | `all`, `assigned`, `unassigned` |

**Response:**
```json
{
  "bookings": [
    {
      "id": "...",
      "scheduledAt": "2024-01-15T09:00:00.000Z",
      "status": "confirmed",
      "customerName": "John Doe",
      "customerPhone": "08123456789",
      "serviceName": "Home Massage",
      "serviceDuration": 60,
      "staffId": "...",
      "staffName": "Jane Staff",
      "homeVisitAddress": "Jl. Example No. 123",
      "homeVisitLatitude": -6.123,
      "homeVisitLongitude": 106.456
    }
  ],
  "stats": {
    "total": 10,
    "assigned": 8,
    "unassigned": 2,
    "completed": 5
  }
}
```

### Available Staff for Booking

```http
GET /api/bookings/{bookingId}/available-staff
```

**Response:**
```json
{
  "staff": [
    {
      "id": "...",
      "name": "Jane Staff",
      "email": "jane@example.com",
      "homeVisitCount": 2,
      "maxHomeVisits": 5,
      "isAvailable": true,
      "unavailableReason": null
    },
    {
      "id": "...",
      "name": "John Staff",
      "email": "john@example.com",
      "homeVisitCount": 5,
      "maxHomeVisits": 5,
      "isAvailable": false,
      "unavailableReason": "Kuota penuh (5/5)"
    }
  ]
}
```

### Assign Staff to Booking

```http
POST /api/bookings/{bookingId}/assign-staff
Content-Type: application/json

{
  "staffId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff Jane berhasil di-assign",
  "staffId": "...",
  "staffName": "Jane"
}
```

### Staff My Bookings

```http
GET /api/staff/my-bookings
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `date` | string | Filter by date (YYYY-MM-DD) |
| `status` | string | `active`, `pending`, `confirmed`, `completed`, `cancelled` |

**Response:**
```json
{
  "bookings": [...],
  "total": 5
}
```

### Staff Schedule

```http
GET /api/staff/{staffId}/schedule
```

**Response:**
```json
{
  "staffId": "...",
  "schedule": [
    {
      "id": "...",
      "dayOfWeek": 1,
      "dayName": "Monday",
      "startTime": "08:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ],
  "homeVisitConfig": {
    "canDoHomeVisit": true,
    "maxDailyHomeVisits": 5,
    "maxTravelDistanceKm": 30
  }
}
```

```http
PUT /api/staff/{staffId}/schedule
Content-Type: application/json

{
  "schedule": [...],
  "homeVisitConfig": {
    "canDoHomeVisit": true,
    "maxDailyHomeVisits": 5,
    "maxTravelDistanceKm": 30
  }
}
```

---

## Database Schema

### Table: `staff`

```sql
-- Home visit config column
home_visit_config JSONB DEFAULT NULL

-- Example JSON structure:
-- {
--   "canDoHomeVisit": true,
--   "maxDailyHomeVisits": 3,
--   "maxTravelDistanceKm": 20,
--   "preferredAreas": []
-- }
```

### Table: `staff_schedule`

```sql
CREATE TABLE staff_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TEXT NOT NULL,     -- "08:00"
  end_time TEXT NOT NULL,       -- "17:00"
  is_available BOOLEAN DEFAULT true,
  break_start TEXT,             -- "12:00" (optional)
  break_end TEXT,               -- "13:00" (optional)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);
```

### Migration SQL

```sql
-- Add home_visit_config to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS home_visit_config JSONB DEFAULT NULL;

-- Add break columns to staff_schedule
ALTER TABLE staff_schedule 
ADD COLUMN IF NOT EXISTS break_start TEXT DEFAULT NULL;

ALTER TABLE staff_schedule 
ADD COLUMN IF NOT EXISTS break_end TEXT DEFAULT NULL;

-- Add unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'staff_schedule_staff_id_day_of_week_key'
  ) THEN
    ALTER TABLE staff_schedule 
    ADD CONSTRAINT staff_schedule_staff_id_day_of_week_key 
    UNIQUE (staff_id, day_of_week);
  END IF;
END $$;
```

### Table: `staff_leaves`

```sql
CREATE TABLE staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'approved', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `bookings` (relevant columns)

```sql
-- Home visit related columns
is_home_visit BOOLEAN DEFAULT false,
home_visit_address TEXT,
home_visit_latitude DECIMAL(10, 8),
home_visit_longitude DECIMAL(11, 8),
staff_id UUID REFERENCES staff(id), -- Auto-assigned or manual
```

---

## Troubleshooting

### Slot menunjukkan tidak ada staff tersedia

**Kemungkinan penyebab:**
1. Semua staff dengan `canDoHomeVisit=true` sudah mencapai kuota harian
2. Staff tidak bekerja di hari tersebut (check `staff_schedule`)
3. Slot di luar jam kerja staff
4. Staff sedang cuti (check `staff_leaves`)
5. Staff memiliki booking lain yang konflik

**Cara debug:**
```http
GET /api/bookings/{bookingId}/available-staff
```
Response akan menunjukkan `unavailableReason` untuk setiap staff.

### Booking dibuat tapi staff tidak ter-assign

**Kemungkinan penyebab:**
1. Service tidak memiliki `requires_staff_assignment=true`
2. Auto-assign dimatikan di request
3. Error saat finding available staff

**Cara fix manual:**
Gunakan Admin Dashboard untuk assign staff secara manual.

---

## File References

| File | Deskripsi |
|------|-----------|
| `lib/booking/staff-availability-service.ts` | Service untuk cek staff availability |
| `lib/booking/booking-service/validation.ts` | Validasi home visit dengan auto-assign |
| `lib/booking/booking-service/create.ts` | Create booking dengan staff assignment |
| `app/api/bookings/home-visit-availability/route.ts` | API slot availability |
| `app/api/bookings/home-visits/route.ts` | API list home visit bookings |
| `app/api/bookings/[id]/available-staff/route.ts` | API available staff |
| `app/api/bookings/[id]/assign-staff/route.ts` | API assign staff |
| `app/api/staff/my-bookings/route.ts` | API staff bookings |
| `app/api/staff/[id]/schedule/route.ts` | API staff schedule |
| `components/staff/staff-schedule.tsx` | UI staff schedule |
| `app/tenant/staff/page.tsx` | Staff dashboard |
| `app/tenant/admin/bookings/home-visits/content.tsx` | Admin assignment dashboard |

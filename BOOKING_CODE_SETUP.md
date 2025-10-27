# Booking Code (Booking Number) Database Setup

## Overview
Added `bookingNumber` field to bookings table untuk memberikan unique identifier pada setiap booking, mirip dengan transaction code di Sales menu.

## Migration File
File migration: `drizzle/0003_futuristic_the_leader.sql`

## Cara Apply Migration

### Option 1: Menggunakan Supabase Dashboard (Recommended)
1. Buka [Supabase Dashboard](https://supabase.com)
2. Pilih project Anda
3. Pergi ke SQL Editor
4. Buat query baru
5. Copy isi dari `drizzle/0003_futuristic_the_leader.sql`
6. Jalankan query

### Option 2: Menggunakan Supabase CLI
```bash
supabase db push
```

## Schema Update

### Field yang Ditambahkan
| Column | Type | Description |
|--------|------|-------------|
| booking_number | text | Unique booking identifier (e.g., "BK-20241027-0001") |

## Verification
Setelah apply migration, verify dengan query:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'booking_number';
```

## UI Updates

### Schedule Tab Improvements
- Tampilan booking sekarang lebih detailed seperti Sales menu
- Menampilkan booking code/number di setiap booking item
- Format data lebih rapi dengan grid layout
- Payment status badge ditambahkan
- Hover effect dan clickable untuk detail

### Day View
Menampilkan:
- Nama customer + booking number
- Service name
- Duration (menit)
- Time
- Total amount
- Status + Payment status badges

### Week View
Menampilkan:
- Nama customer + booking number
- Date
- Service name
- Time
- Duration (menit)
- Total amount
- Status + Payment status badges

## Integration dengan Reminder
Booking number akan dikirimkan di reminder template untuk customer reference.

Update template reminder untuk include booking code:
```text
Hi {customer_name},

Your booking is confirmed!
Booking Code: {booking_number}
Service: {service_name}
Date & Time: {scheduled_at}
Duration: {duration} minutes

...
```

## Related Code
- Schema: `lib/database/schema/index.ts`
- Types: `types/booking.ts`
- UI Component: `components/booking/BookingManagement.tsx`
- Reminder Service: `lib/reminder/reminder-service.ts`

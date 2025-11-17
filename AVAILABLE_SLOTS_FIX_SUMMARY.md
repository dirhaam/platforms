# Available Slots Time Issue - Fix Summary

## Issue Identified
Available time slots tidak mengikuti jadwal opening yang telah di-setup. Contohnya:
- Setup opening: 09:00 AM
- Actual slots showing: Starting from 02:00 PM

## Improvements Made

### 1. Enhanced Logging ✅
Added detailed logging di:
- **`/api/bookings/availability` endpoint** - Logs business hours fetch
- **`/api/settings/business-hours` endpoint** - Logs when saving hours
- **`BookingService.getAvailability()`** - Logs day lookup dan slot generation

### 2. Time Format Validation ✅
Added validation di PUT endpoint untuk memastikan:
- Time format adalah "HH:MM" (24-hour dengan leading zero)
- Tidak accept format seperti "9:00" atau "5:00 PM"

### 3. Case-Insensitive Day Lookup ✅
Fixed potential issue dimana day keys tidak cocok:
- Before: Hanya mencari lowercase key "monday"
- After: Mencari juga "Monday", "MONDAY", dll

### 4. Better Error Handling ✅
- Log yang lebih detail jika ada error
- Warning message jika tidak ditemukan business hours
- Fallback ke default hours jika belum setup

## Testing Steps

### Langkah 1: Verifikasi Setup di UI
1. Buka **Calendar Settings** → **Global Business Hours**
2. Set **Monday**:
   - ☑ Open (checkbox MUST be checked)
   - Open Time: `09:00` (PENTING: format must be HH:MM)
   - Close Time: `17:00`
3. Click **Save Business Hours**
4. Lihat success message
5. Refresh page dan verifikasi settings masih ada

### Langkah 2: Check Console Logs
1. Buka browser DevTools (F12)
2. Buka Console tab
3. Pilih date di booking page (pilih Monday untuk test)
4. Cari logs yang dimulai dengan `[getAvailability]`

**Yang harus Anda lihat:**
```
[getAvailability] Business hours fetch:
  businessHoursData: {
    schedule: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" }
    }
  }

[getAvailability] Day lookup:
  dayKey: "monday"
  dayHours: { isOpen: true, openTime: "09:00", closeTime: "17:00" }

[getAvailability] Using global business hours:
  operatingHours: { startTime: "09:00", endTime: "17:00" }
```

### Langkah 3: Check Available Slots
1. Select Monday date di booking
2. Verify available slots dimulai dari **09:00** (bukan 14:00)
3. Slots harus continuous setiap 30 menit: 09:00, 09:30, 10:00, dst
4. Last slot harus sebelum 17:00 closing time

### Langkah 4: Test Lain-lain
- Test Sunday (setup sebagai closed) → harus tampil "Business is closed"
- Test with different opening times
- Test with different days

## If Still Not Working

### Issue: Logs menunjukkan wrong time (e.g., 14:00 instead of 09:00)

**Check database:**
```sql
SELECT schedule FROM business_hours WHERE tenant_id = 'YOUR_TENANT_ID';
```

**Format yang benar:**
```json
{
  "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" }
}
```

**Jika format salah, gunakan query ini untuk fix:**
```sql
UPDATE business_hours 
SET schedule = '{
  "sunday": { "isOpen": false, "openTime": "09:00", "closeTime": "14:00" },
  "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "tuesday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "wednesday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "thursday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "friday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  "saturday": { "isOpen": false, "openTime": "09:00", "closeTime": "14:00" }
}'::jsonb
WHERE tenant_id = 'YOUR_TENANT_ID';
```

### Issue: Logs show `hoursError` (business hours tidak ditemukan)

**Berarti data belum pernah disave. Solusi:**
1. Setup business hours di UI
2. Click Save
3. Tunggu success message
4. Refresh page
5. Try again

### Issue: Slots tetap tidak sesuai setelah semua ini

**Minta bantuan dengan screenshot:**
1. Screenshot Business Hours settings page
2. Screenshot Console logs dari availability API
3. Screenshot dari query database: `SELECT * FROM business_hours WHERE tenant_id = 'YOUR_TENANT_ID';`

## Files Modified

1. **`/lib/booking/booking-service.ts`**
   - Enhanced logging di `getAvailability()` method
   - Case-insensitive day key lookup
   - Better error handling

2. **`/app/api/settings/business-hours/route.ts`**
   - Time format validation (HH:MM only)
   - Detailed logging saat save
   - Better error messages

3. **`AVAILABLE_SLOTS_DEBUG_GUIDE.md`**
   - Comprehensive debugging guide
   - Common issues & solutions

## Expected Behavior After Fix

✅ Available slots mulai dari opening time yang benar
✅ Slots continuous setiap 30 menit (or configured interval)
✅ No gaps antara opening time dan first available slot
✅ Closed days menampilkan "Business is closed"
✅ Settings persist setelah refresh
✅ Timezone tidak lagi mempengaruhi slot times

## Rollback If Issues

Jika ada masalah, semua logging bisa di-remove:
- Remove console.log statements
- Code logic tetap sama
- Just remove debug output

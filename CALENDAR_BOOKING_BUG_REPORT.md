# Calendar Management & Booking System - Bug Report

## Issues Identified

### 1. ⚠️ CRITICAL: Day-of-Week Off-by-One Error in Availability API
**Location**: `lib/booking/booking-service.ts` → `getAvailability()` method  
**Severity**: CRITICAL - This explains why Sunday settings affect Monday

```typescript
// PROBLEMATIC CODE (Line ~200):
const bookingDate = new Date(request.date);  // request.date is YYYY-MM-DD string
const dayOfWeek = bookingDate.getDay();
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayKey = dayNames[dayOfWeek];
```

**Issue**: When a date string like "2025-11-17" is passed without timezone info, JavaScript's `Date.getDay()` returns the UTC day, NOT the local day. This causes:
- If backend is in a different timezone than expected
- Sunday (UTC) might be interpreted as Saturday or Monday locally
- This is WHY Monday gets Sunday's settings

**Evidence**: 
- When user sets Sunday as closed → Monday shows closed (off by one day)
- When user sets Sunday as open → Monday becomes available

---

### 2. ⚠️ CRITICAL: Timezone Mismatch in Date Parsing
**Location**: `app/api/bookings/availability/route.ts` → date query parameter handling

```typescript
const dateStr = selectedDate.toISOString().split('T')[0]; // Returns UTC date
// API receives: "2025-11-17" (could be wrong day in local timezone)
```

**Issue**: 
- Frontend sends date in ISO format (UTC)
- Backend receives it without timezone context
- `new Date("2025-11-17")` treats it as UTC midnight, then `getDay()` uses UTC timezone
- Should use local timezone when available

---

### 3. ⚠️ HIGH: Incorrect Slot Time Calculation 
**Location**: `lib/booking/booking-service.ts` → `getAvailability()` method (line ~220-245)

**Issue**: Available time slots don't match calendar settings because:

```typescript
// Current code generates slots based on slotDurationMinutes
let currentTime = new Date(startDate);

while (currentTime < endDate) {
  const slotStart = new Date(currentTime);
  const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);  // Uses serviceDuration
  
  // Check if slot would go past business hours
  if (slotEnd > endDate) {
    break;
  }
  
  currentTime = new Date(currentTime.getTime() + slotDurationMinutes * 60000);  // Increments by slotDurationMinutes
}
```

**Problem**: 
- Uses `slotDurationMinutes` for INCREMENTING time (e.g., every 30 min)
- Uses `serviceDuration` for SLOT LENGTH (e.g., 60 min)
- If slotDuration = 30min but serviceDuration = 60min:
  - Slot at 08:00 goes to 09:00
  - Next slot starts at 08:30 (overlaps!)
  - This creates incorrect availability display

**Expected behavior**: Slots should show actual available durations matching the service duration, not slot duration.

---

### 4. ⚠️ HIGH: Hourly Quota Logic Flaw
**Location**: `lib/booking/booking-service.ts` → `getAvailability()` method (line ~225-245)

```typescript
// Current implementation:
const bookingsInThisHour = bookingsPerHour.get(hourKey) || 0;

if (bookingsInThisHour < hourlyQuota) {
  isAvailable = true;
  
  // Then checks for direct conflicts
  const conflictingBooking = (bookings || []).find(b => {
    const bookingStart = new Date(b.scheduled_at);
    const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
    return slotStart < bookingEnd && slotEnd > bookingStart;
  });
  
  if (conflictingBooking) {
    isAvailable = false;
  }
}
```

**Issue**: 
- Only counts bookings from "bookings" array where status === CONFIRMED
- But doesn't filter by service_id properly in the initial fetch
- If multiple services share the same time, quota check becomes inaccurate

---

### 5. ⚠️ MEDIUM: Business Hours Display Order Confusion
**Location**: `components/subdomain/BusinessHoursDisplay.tsx` (line ~31-34)

```typescript
const dayOrder: Array<keyof typeof dayNames> = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];
```

**Issue**: While display order is fine, the component doesn't match JavaScript's `getDay()` convention (0 = Sunday). Could cause UI confusion.

---

### 6. ⚠️ MEDIUM: No Service-Specific Filtering in Availability Query
**Location**: `lib/booking/booking-service.ts` → `getAvailability()` (line ~200)

```typescript
const { data: bookings, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('service_id', request.serviceId)  // ✓ Good
  .eq('status', BookingStatus.CONFIRMED)
  .gte('scheduled_at', startOfDay.toISOString())
  .lte('scheduled_at', endOfDay.toISOString());
```

**Issue**: While filtering is done, the booking counts per hour could be more accurate with better data structure.

---

## Root Cause Analysis

The primary issue is a **TIMEZONE HANDLING BUG**:

1. User sets business hours in their local timezone (e.g., Asia/Jakarta)
2. Frontend sends date as ISO string: `"2025-11-17"` (UTC midnight)
3. Backend receives it and does: `new Date("2025-11-17").getDay()` 
4. This returns UTC day, which might be different from local day
5. Result: Sunday settings apply to Monday slot generation

**Example Timeline**:
- User in Jakarta (UTC+7): Sets Sunday (Nov 17) as closed
- Frontend sends: `"2025-11-17"` 
- Backend: `new Date("2025-11-17")` = UTC midnight = Nov 16 at 17:00 Jakarta time
- `getDay()` on Nov 16 UTC = 16th is Monday in UTC
- Backend looks up Monday hours = finds Sunday's settings!

---

## Recommended Fixes

### Fix 1: Proper Timezone-Aware Date Handling ⭐ CRITICAL
```typescript
// In getAvailability()
const bookingDate = new Date(request.date + 'T00:00:00'); // Local midnight
// OR send timezone with request
// OR parse manually: YYYY-MM-DD → new Date(year, month-1, day)
```

### Fix 2: Correct Slot Generation Logic
- Use `serviceDuration` for both slot length AND increment
- Use `slotDurationMinutes` ONLY for generating multiple slots within service duration

### Fix 3: Better Timezone Propagation
- Add timezone to all API requests
- Store user's timezone preference with business hours
- Always parse dates in local timezone context

### Fix 4: Improved Hourly Quota Validation
- More precise hour boundary checking
- Better overlap detection

---

## Testing Recommendations

1. Test setting Sunday as closed, verify Monday shows open
2. Test all 7 days to ensure no cross-day contamination
3. Test across timezone boundaries (UTC±12, UTC-12)
4. Test slot availability with various durations and quotas
5. Test with bookings that span multiple hours

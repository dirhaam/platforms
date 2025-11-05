# Debug Travel Surcharge Issue

## Problem
- Travel surcharge calculated & shows during booking creation
- But disappears when viewing booking details later

## Root Causes to Check

### 1. DATABASE MIGRATION NOT RUN
**Check if columns exist:**
```sql
-- Connect to Supabase PostgreSQL and run:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('travel_surcharge_amount', 'travel_distance', 'travel_duration');
```

**If columns missing - run migration:**
```bash
npm run db:migrate
# or
npx drizzle-kit migrate
```

---

### 2. CHECK RESPONSE FROM CREATE BOOKING
**Browser DevTools > Network Tab:**
1. Create a booking with home visit
2. Check POST /api/bookings response
3. Look for `travelSurchargeAmount`, `travelDistance`, `travelDuration` fields
4. **If missing** → Backend not saving these fields

**Example good response:**
```json
{
  "booking": {
    "id": "...",
    "bookingNumber": "...",
    "totalAmount": 500000,
    "travelSurchargeAmount": 79293,     ← ✅ Should be here
    "travelDistance": 12.5,             ← ✅ Should be here
    "travelDuration": 25,               ← ✅ Should be here
    ...
  }
}
```

---

### 3. CHECK RESPONSE FROM FETCH BOOKINGS  
**Browser DevTools > Network Tab:**
1. Open Bookings page (admin)
2. Check GET /api/bookings response
3. Look for fields in each booking object
4. **If missing** → API not returning these fields

**Debug script - paste in console:**
```javascript
const res = await fetch('/api/bookings?tenantId=<your-tenant-id>', {
  headers: { 'x-tenant-id': '<your-tenant-id>' }
});
const data = await res.json();
const booking = data.bookings[0];
console.log('Booking fields:', {
  hasTravel: !!booking.travelSurchargeAmount,
  travelSurchargeAmount: booking.travelSurchargeAmount,
  travelDistance: booking.travelDistance,
  travelDuration: booking.travelDuration,
  allFields: Object.keys(booking)
});
```

---

### 4. CHECK LOGS DURING BOOKING CREATION
**Browser Console > check for:**
- `[BookingService] Calculating travel from:`
- `[BookingService] Travel calculated:`
- Any errors in red

**If errors** → Copy & share full error message

---

## Step-by-Step Fix

### Step 1: Run Migration
```bash
cd D:\boq\platforms
npx drizzle-kit migrate
```

### Step 2: Verify Database Columns
- Connect to Supabase > SQL Editor
- Run: `SELECT * FROM bookings LIMIT 1;`
- Check if `travel_surcharge_amount`, `travel_distance`, `travel_duration` columns exist

### Step 3: Test Create Booking
1. Create booking with home visit
2. Check console for `[BookingService] Travel calculated:` logs
3. Verify response has travel fields

### Step 4: Test Fetch Booking Details
1. Refresh page / go to bookings list
2. Click booking to open details
3. Check if travel surcharge displays in "Amount Breakdown"

---

## Files to Review

**If problem persists after migration:**

1. **Check booking is saved correctly:**
   ```
   D:\boq\platforms\lib\booking\booking-service.ts
   Look for: insert into bookings with travel_surcharge_amount, travel_distance, travel_duration
   ```

2. **Check display logic:**
   ```
   D:\boq\platforms\components\booking\UnifiedBookingPanel.tsx
   Look for: travel surcharge display at line ~585
   ```

3. **Check fetch enrichment:**
   ```
   D:\boq\platforms\components\booking\BookingDashboard.tsx
   Look for: enrichedBookings mapping at line ~175
   Ensure ALL fields from API response are preserved
   ```

---

## Expected Fix Timeline

1. ✅ Migration run → columns exist
2. ✅ Create booking → travel fields saved
3. ✅ Fetch booking → travel fields returned
4. ✅ Display booking details → travel surcharge visible

If stuck at any step → Share logs from that step!

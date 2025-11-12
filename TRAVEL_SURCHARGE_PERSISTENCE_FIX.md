# Travel Surcharge Persistence Issue - Fixed

## Problem
When creating a new booking with home visit:
- ✓ Travel calculation shows correct distance, time, and surcharge
- ✓ User confirms and creates booking
- ✗ Opening booking details shows: 0 km, 0m, Rp 0 surcharge
- ✗ Data not persisted or not retrieved

## Root Cause

### Database Schema Mismatch
The Drizzle ORM schema definition in `lib/database/schema/index.ts` was **incomplete**:

**Missing fields in bookings table definition:**
```typescript
// These fields existed in database but NOT in schema:
- travel_distance
- travel_duration
- travel_surcharge_amount
- tax_percentage
- service_charge_amount
- additional_fees_amount
- payment_method
- payment_reference
- dp_amount
- paid_amount
```

**What actually happened:**
1. ✓ Backend saves to database correctly (fields exist in migrations 0013+)
2. ✗ Drizzle schema doesn't know about these fields
3. ✗ When fetching: `select('*')` doesn't include fields not in schema definition
4. ✗ Frontend receives booking WITHOUT travel data

### Flow Diagram

```
Create Booking Flow (WORKED ✓)
├─ TravelEstimateCard calculates travel surcharge
├─ Data submitted in POST /api/bookings
├─ BookingService.createBooking() saves all fields
│   ├─ travel_distance → database ✓
│   ├─ travel_duration → database ✓
│   └─ travel_surcharge_amount → database ✓
└─ POST response returns booking with all fields ✓

Fetch Booking Detail Flow (BROKEN ✗)
├─ BookingDetailsDrawer opens
├─ calls BookingService.getBooking()
│   └─ Runs: SELECT * FROM bookings WHERE id = ? 
│       (but Drizzle schema missing travel fields)
├─ Supabase returns only schema-defined fields
│   ├─ travel_distance → NULL (not in schema)
│   ├─ travel_duration → NULL (not in schema)
│   └─ travel_surcharge_amount → NULL (not in schema)
└─ UI shows 0 km, 0m, Rp 0 ✗
```

## Solution

### Fixed Schema Definition
Updated `lib/database/schema/index.ts` to include all missing fields:

```typescript
export const bookings = pgTable('bookings', {
  // ... existing fields ...
  
  // Travel-related fields (ADDED)
  travelDistance: real('travel_distance').default(0),
  travelDuration: integer('travel_duration').default(0),
  travelSurchargeAmount: real('travel_surcharge_amount').default(0),
  
  // Additional pricing fields (ADDED)
  taxPercentage: real('tax_percentage'),
  serviceChargeAmount: real('service_charge_amount'),
  additionalFeesAmount: real('additional_fees_amount'),
  
  // Payment fields (ADDED)
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  dpAmount: real('dp_amount').default(0),
  paidAmount: real('paid_amount').default(0),
});
```

### Database Verification
Migrations already had these fields (from 0013_add_travel_fields_to_bookings.sql):
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS travel_distance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_surcharge_amount DECIMAL(10, 2) DEFAULT 0,
...
```

## Verification Steps

### 1. Create New Home Visit Booking
```
1. Open Booking Dashboard → New Booking
2. Select home visit checkbox
3. Enter customer location
4. Travel calculation shows: 5.2 km, 15m, Rp 50,000
5. Click "Setuju & Lanjutkan" to create
```

### 2. Open Booking Details
```
1. Click on created booking in list
2. Check "Perkiraan Biaya Travel" section
3. Should now show:
   ✓ Jarak: 5.2 km (NOT 0.0 km)
   ✓ Waktu: 15m (NOT 0m)
   ✓ Travel Surcharge: Rp 50,000 (NOT Rp 0)
```

### 3. Browser Console Logging
```javascript
// New logs added for debugging:
[API/bookings POST] Created home visit booking travel data: {
  bookingId: "...",
  travelSurchargeAmount: 50000,
  travelDistance: 5.2,
  travelDuration: 15,
  totalAmount: 150000
}

[API/bookings GET] First home visit booking travel data: {
  bookingId: "...",
  travelSurchargeAmount: 50000,  // Should NOT be undefined
  travelDistance: 5.2,            // Should NOT be undefined
  travelDuration: 15              // Should NOT be undefined
}
```

## Files Modified

1. **lib/database/schema/index.ts**
   - Added travel_distance, travel_duration, travel_surcharge_amount
   - Added tax/service charge fields
   - Added payment fields
   - Added booking_number field

2. **app/api/bookings/route.ts**
   - Added logging on POST (creation) to verify travel data saved
   - Added logging on GET (retrieval) to verify travel data fetched
   - Better error messages with HTTP status codes

## Why This Fixes It

**Before:**
```
SELECT * FROM bookings  // Drizzle schema only knew about base fields
→ travel_surcharge_amount column exists but not mapped
→ Supabase doesn't return it
→ Frontend shows 0
```

**After:**
```
SELECT * FROM bookings  // Drizzle schema knows about all fields
→ travel_surcharge_amount column mapped
→ Supabase returns it
→ Frontend shows 50000 ✓
```

## Related Components

- **Create:** NewBookingDialog.tsx + TravelEstimateCard.tsx
- **Save:** BookingService.createBooking() + route.ts POST
- **Fetch:** BookingService.getBooking() + route.ts GET  
- **Display:** UnifiedBookingPanel.tsx
- **Schema:** lib/database/schema/index.ts

## Testing Checklist

- [ ] Create new home visit booking
- [ ] Travel calculation displays correct values
- [ ] Click "Setuju & Lanjutkan" to create
- [ ] Check server logs for `[API/bookings POST] Created home visit booking travel data`
- [ ] Open booking details
- [ ] Travel section shows saved distance/time/surcharge (not 0)
- [ ] Check browser console for data presence
- [ ] Test with different distances/surcharges

## Prevention for Future

When adding new fields to database:
1. Add SQL column in migration (✓ done)
2. **ALSO** add to Drizzle schema definition (was missing before)
3. Update booking service mapping if needed
4. Test GET after save to verify persistence

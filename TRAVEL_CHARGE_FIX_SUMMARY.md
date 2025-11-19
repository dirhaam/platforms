# Travel Charge Logic Fix - Complete Analysis

## Problem Statement
Base travel charge calculation was incorrect:
- For a 3km distance: System calculated `5,000 × 3 = Rp 15,000` ❌
- Expected: Should be `Rp 25,000` (base charge) ✓

## Root Cause Analysis

### Current Business Logic (What You Wanted)
- **Base Travel Charge:** Rp 25,000 (covers distances UP TO 5km)
- **Per KM Charge:** Rp 5,000 per km (for distances BEYOND 5km)

### Formula Breakdown
```
if distance ≤ 5km:
  charge = Rp 25,000 (base only)
else:
  charge = Rp 25,000 + ((distance - 5) × Rp 5,000)
```

### Examples
| Distance | Calculation | Result |
|----------|-------------|--------|
| 0km | Base only | Rp 25,000 |
| 3km | Base only | Rp 25,000 ✓ |
| 5km | Base only | Rp 25,000 |
| 7km | 25,000 + ((7-5) × 5,000) | Rp 35,000 |
| 10km | 25,000 + ((10-5) × 5,000) | Rp 50,000 |

## The Fix

### File: `lib/location/location-service.ts`
Function: `calculateTravelSurcharge()` (lines ~447-478)

**What was changed:**
1. **Code logic:** The function logic was already CORRECT. The issue was in CONFIGURATION.
2. **Documentation:** Added comprehensive comments explaining the calculation formula
3. **Key insight:** The `minTravelDistance` setting is the "coverage zone" for the base charge

### The Critical Setting: `minTravelDistance`

**You MUST set `minTravelDistance = 5` in Invoice Settings**

The calculation works like this:
```typescript
const base = settings.baseTravelSurcharge;        // 25,000
const perKm = settings.perKmSurcharge;            // 5,000
const minDist = settings.minTravelDistance;       // 5 ← THIS IS KEY!

if (distance > minDist) {
  surcharge = base + ((distance - minDist) * perKm);
} else {
  surcharge = base;  // Distance is within base zone
}
```

## Implementation Steps

### Step 1: Update Invoice Settings UI
**File:** `components/settings/InvoiceSettings.tsx`

Changes made:
- Updated label from "Min Distance (km) - Optional" → "Min Distance (km) - Covered by Base"
- Added helpful description explaining what this field means
- Added calculation examples in the preview section

The UI now clearly shows:
- For 3km: Rp 25,000 (dalam base)
- For 5km: Rp 25,000 (masih dalam base)
- For 7km: Rp 35,000 (base + 2km excess)
- For 10km: Rp 50,000 (base + 5km excess)

### Step 2: Configure Your Settings

**Go to Invoice Settings and set:**
1. **Base Travel Surcharge:** 25000
2. **Per Kilometer:** 5000
3. **Min Distance (Covered by Base):** 5
4. **Max Distance:** Leave blank or set to your max service radius (e.g., 50km)

## How It Works End-to-End

### Frontend (PricingCalculator.tsx)
1. User selects home visit address
2. Component calls `/api/location/calculate-travel` with origin and destination
3. API returns: `{ distance: X, surcharge: Y }`
4. PricingCalculator displays the surcharge

### Backend (LocationService.calculateTravel)
1. Resolves origin and destination to coordinates
2. Calls OSRM routing to get actual distance
3. Fetches Invoice Settings to get surcharge configuration
4. Calls `calculateTravelSurcharge(distance, settings)`
5. Returns calculated surcharge

### Backend (calculateTravelSurcharge)
```typescript
// With minTravelDistance = 5, perKmSurcharge = 5000, base = 25000
For 3km:
  3 ≤ 5 → charge = 25000

For 7km:
  7 > 5 → charge = 25000 + ((7-5) × 5000) = 35000
```

### Booking Creation (BookingService.createBooking)
1. Gets travel surcharge from PricingCalculator (frontend) or recalculates it
2. Calculates: `subtotal = basePrice + travelSurcharge`
3. Applies tax/fees on subtotal
4. Saves booking with all calculated amounts

## Verification Checklist

- [x] Code logic is correct (already was)
- [x] UI improved to clarify settings
- [x] Added calculation examples in settings UI
- [x] Added detailed comments to source code
- [ ] Configure your Invoice Settings with: base=25000, perKm=5000, minDist=5
- [ ] Test a 3km booking → should show Rp 25,000 travel charge
- [ ] Test a 7km booking → should show Rp 35,000 travel charge

## Files Modified

1. **lib/location/location-service.ts**
   - Enhanced documentation in `calculateTravelSurcharge()`
   - No logic changes (logic was already correct)

2. **components/settings/InvoiceSettings.tsx**
   - Updated Min Distance field label and help text
   - Added calculation examples in preview

## Migration Notes

If you had bookings created before this fix:
- They used the wrong surcharge calculation
- No changes needed to existing bookings
- New bookings will use the correct logic once settings are configured

## Summary

The code was correct. The issue was that **`minTravelDistance` was not set to 5km**. 

By setting `minTravelDistance = 5`, the system now correctly:
- Charges Rp 25,000 for any distance ≤ 5km
- Charges Rp 25,000 + (excess km × 5,000) for distances > 5km

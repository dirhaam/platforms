# Travel Surcharge Validation & Fix - Complete Documentation

## What Was Fixed

### Problem 1: Missing `minTravelDistance` Default
**Before:** When travel surcharge was enabled but `minTravelDistance` not set, it defaulted to `undefined`, then became `0` in calculations, causing wrong surcharge calculation.

**Example of wrong calculation:**
- Settings: base=25000, perKm=5000, minTravelDistance=undefined (→0)
- For 3km: surcharge = 25000 + (3 × 5000) = **Rp 40,000** ❌ WRONG

### Problem 2: No UI Validation Warning
**Before:** User could enable travel surcharge without filling required fields, leading to incorrect calculations in bookings.

### Problem 3: Confusing Default State
**Before:** Default state had `travelSurchargeRequired=true` even when never configured, leading to confusion.

## Changes Made

### 1. File: `lib/invoice/invoice-settings-service.ts`

**Change:** Set explicit defaults for travel surcharge
```typescript
// Before:
minTravelDistance: travelSurchargeData.min_travel_distance ?? undefined,
travelSurchargeRequired: travelSurchargeData.travel_surcharge_required ?? true,

// After:
minTravelDistance: travelSurchargeData.min_travel_distance ?? 0,
travelSurchargeRequired: travelSurchargeData.travel_surcharge_required ?? true,

// And for default when no settings exist:
// Before:
{ baseTravelSurcharge: 0, perKmSurcharge: 5000, travelSurchargeRequired: true }

// After:
{ baseTravelSurcharge: 0, perKmSurcharge: 5000, minTravelDistance: 0, travelSurchargeRequired: false }
```

**Why:** Ensures `minTravelDistance` is never `undefined`, preventing calculation errors.

### 2. File: `components/settings/InvoiceSettings.tsx`

#### Change A: Added Travel Surcharge Validation Function
```typescript
const isTravelSurchargeValid = useMemo(() => {
  if (!form.travelSurcharge.travelSurchargeRequired) {
    return true; // Not required, so always valid
  }
  
  // If required, must have these fields configured
  const hasBase = form.travelSurcharge.baseTravelSurcharge > 0;
  const hasMinDistance = form.travelSurcharge.minTravelDistance !== undefined && 
                         form.travelSurcharge.minTravelDistance !== null;
  
  return hasBase && hasMinDistance;
}, [form.travelSurcharge]);
```

#### Change B: Added Status Badge
Shows whether Travel Surcharge is "Aktif" (Active) or "Nonaktif" (Inactive)

#### Change C: Added Warning Box
When travel surcharge is enabled but configuration is incomplete, shows:
```
⚠️ Konfigurasi Tidak Lengkap
• Base Travel Surcharge belum diisi (harus > 0)
• Min Distance belum diisi (jarak yang termasuk dalam base charge)
```

#### Change D: Disabled Save Button
Button is disabled with tooltip if `isTravelSurchargeValid` is false:
```
"Silakan lengkapi konfigurasi Travel Surcharge terlebih dahulu"
(Please complete Travel Surcharge configuration first)
```

#### Change E: Improved Field Labels & Help Text
```
// Before:
Min Distance (km) - Optional

// After:
Min Distance (km) - Covered by Base
[Help text] Jarak maksimal yang termasuk dalam Base Travel Surcharge. 
Contoh: Jika 5km, maka jarak 3km tetap dikenakan Base Surcharge penuh.
```

## Calculation Logic (Unchanged - Already Correct)

```typescript
function calculateTravelSurcharge(distance, settings) {
  const base = settings.baseTravelSurcharge;
  const perKm = settings.perKmSurcharge;
  const minDist = settings.minTravelDistance;  // Now guaranteed to be a number, not undefined
  
  if (distance > minDist) {
    return base + ((distance - minDist) * perKm);
  } else {
    return base;
  }
}
```

## Test Scenarios

### Scenario A: Initial Setup (Never Configured Before)

**Setup:** User opens Invoice Settings for first time

**Expected Behavior:**
- Travel Surcharge shows "Nonaktif" (Inactive) ✓
- All fields are empty or have defaults
- Save button is enabled (no changes, no incomplete config) ✓

### Scenario B: Enable Travel Surcharge Without Completing Config

**Setup:** 
1. Check "Travel Surcharge Wajib" checkbox
2. Do NOT fill Base Travel Surcharge
3. Do NOT fill Min Distance
4. Try to Save

**Expected Behavior:**
- Warning box appears: "⚠️ Konfigurasi Tidak Lengkap"
- Lists which fields need to be filled:
  - Base Travel Surcharge belum diisi
  - Min Distance belum diisi
- Save button is DISABLED ✓
- User cannot save incomplete configuration

### Scenario C: Partially Complete Configuration

**Setup:**
1. Check "Travel Surcharge Wajib"
2. Fill Base = 25000
3. Do NOT fill Min Distance
4. Try to Save

**Expected Behavior:**
- Warning box shows: "Min Distance belum diisi"
- Save button DISABLED ✓
- User must fill Min Distance before saving

### Scenario D: Complete Configuration

**Setup:**
1. Check "Travel Surcharge Wajib"
2. Fill Base = 25000
3. Fill Per KM = 5000
4. Fill Min Distance = 5
5. Save

**Expected Behavior:**
- No warning
- Save button ENABLED ✓
- Configuration saved successfully
- Status shows "Aktif" (Active) ✓

### Scenario E: Disable Travel Surcharge

**Setup:**
1. Travel Surcharge is currently enabled with incomplete config
2. Uncheck "Travel Surcharge Wajib"

**Expected Behavior:**
- Warning disappears immediately ✓
- Save button becomes ENABLED (even with incomplete fields) ✓
- User can save disabled state
- Status shows "Nonaktif" (Inactive) ✓

## Calculation Verification

### With Configuration: base=25000, perKm=5000, minDist=5

| Distance | Formula | Result | Status |
|----------|---------|--------|--------|
| 0km | base | Rp 25,000 | ✓ |
| 1km | base | Rp 25,000 | ✓ |
| 3km | base (3 ≤ 5) | Rp 25,000 | ✓ |
| 5km | base (5 ≤ 5) | Rp 25,000 | ✓ |
| 6km | base + (1 × 5000) | Rp 30,000 | ✓ |
| 7km | base + (2 × 5000) | Rp 35,000 | ✓ |
| 10km | base + (5 × 5000) | Rp 50,000 | ✓ |

### With Configuration: base=25000, perKm=5000, minDist=0 (pure per-km)

| Distance | Formula | Result | 
|----------|---------|--------|
| 0km | base | Rp 25,000 |
| 3km | base + (3 × 5000) | Rp 40,000 |
| 5km | base + (5 × 5000) | Rp 50,000 |
| 7km | base + (7 × 5000) | Rp 60,000 |

## User Flow Diagram

```
Open Invoice Settings
    ↓
Go to Charges Tab
    ↓
Check "Travel Surcharge Wajib"?
    ├─ No → Status: "Nonaktif" → Can save (if no other changes)
    └─ Yes → Status: "Aktif" (badge appears)
        ↓
    Fill all required fields:
    ├─ Base Travel Surcharge (must > 0)
    ├─ Per Kilometer
    └─ Min Distance (must be filled)
        ↓
    All fields valid?
    ├─ No → Warning box appears, Save DISABLED
    └─ Yes → No warning, Save ENABLED
        ↓
    Click Save
        ↓
    Configuration saved for all future bookings
```

## For Tenant Setup Instructions

### Complete Setup Steps

1. **Go to Settings → Invoice Settings**

2. **Click "Pajak & Biaya" Tab**

3. **In Travel Surcharge Section:**
   - Check "Travel Surcharge Wajib" checkbox
   - Base Travel Surcharge: Enter `25000`
   - Per Kilometer: Enter `5000`
   - Min Distance: Enter `5` ← **Must be filled when enabled**
   - Max Distance: Enter `50` (or your service area limit)

4. **Verify Status:**
   - Should show "Aktif" badge (green)
   - No warning messages

5. **Click "Simpan Pengaturan"**

6. **Test:**
   - Create a home visit booking for 3km distance
   - Verify travel surcharge shows Rp 25,000
   - Create a home visit booking for 7km distance
   - Verify travel surcharge shows Rp 35,000

## Code Location Summary

| Component | Purpose | Changes |
|-----------|---------|---------|
| `lib/invoice/invoice-settings-service.ts` | Backend settings retrieval | Fixed default values for minTravelDistance |
| `components/settings/InvoiceSettings.tsx` | Frontend UI | Added validation, warnings, status badge, disabled save button |
| `lib/location/location-service.ts` | Calculation logic | No changes (already correct) |
| `lib/booking/booking-service.ts` | Booking creation | No changes (uses LocationService) |

## Benefits

✓ **Prevents Misconfiguration:** User cannot accidentally enable without proper setup
✓ **Clear Feedback:** Warning message tells exactly what's missing
✓ **Data Integrity:** All bookings will have correct calculation when enabled
✓ **Flexible:** Each tenant can configure their own rates
✓ **Easy Testing:** Status badge shows if feature is active

# Travel Charge Configuration Guide

## What Was Fixed

The travel charge calculation logic is now fully documented with improved UI help text to prevent confusion.

**The Issue:** Without proper configuration of `minTravelDistance`, the system would calculate travel charges incorrectly.

## Correct Configuration

You need to set up your Invoice Settings as follows:

### Location: Settings → Invoice Settings → Pajak & Biaya (Charges) Tab

**Travel Surcharge Section:**

| Field | Value | Explanation |
|-------|-------|-------------|
| **Base Travel Surcharge (Rp)** | 25000 | Flat fee for any home visit (covers up to min distance) |
| **Per Kilometer (Rp/km)** | 5000 | Additional charge per km beyond min distance |
| **Min Distance (km) - Covered by Base** | 5 | Distance zone covered by base charge |
| **Max Distance (km) - Optional** | 50 | (or your service area radius) |
| **Travel Surcharge Wajib** | ✓ Checked | Enable travel surcharge for all home visits |

## How It Calculates

### Formula
```
if distance ≤ minTravelDistance:
  charge = baseTravelSurcharge
else:
  charge = baseTravelSurcharge + ((distance - minTravelDistance) × perKmSurcharge)
```

### Real Examples (with above config)

| Distance | Calculation | Charge |
|----------|-------------|--------|
| **1 km** | ≤ 5km → base only | **Rp 25,000** |
| **3 km** | ≤ 5km → base only | **Rp 25,000** ✓ |
| **5 km** | = 5km → base only | **Rp 25,000** |
| **6 km** | 6 > 5 → 25,000 + (1 × 5,000) | **Rp 30,000** |
| **7 km** | 7 > 5 → 25,000 + (2 × 5,000) | **Rp 35,000** |
| **10 km** | 10 > 5 → 25,000 + (5 × 5,000) | **Rp 50,000** |
| **15 km** | 15 > 5 → 25,000 + (10 × 5,000) | **Rp 75,000** |
| **51 km** | > max (50) → Not allowed | **Not permitted** |

## Step-by-Step Setup

1. **Go to Settings**
   - Click Settings menu → Invoice Settings

2. **Navigate to Charges Tab**
   - Click "Pajak & Biaya" tab

3. **Configure Travel Surcharge**
   - Base Travel Surcharge: Enter `25000`
   - Per Kilometer: Enter `5000`
   - Min Distance: Enter `5` ← **This is critical!**
   - Max Distance: Enter `50` (or your service area limit)
   - Check "Travel Surcharge Wajib" if you want it mandatory

4. **View the Example**
   - In the right preview panel, you'll see:
     - 3km: Rp 25,000 (dalam base)
     - 5km: Rp 25,000 (masih dalam base)
     - 7km: Rp 35,000 (base + 2km excess)
     - 10km: Rp 50,000 (base + 5km excess)

5. **Save**
   - Click "Simpan Pengaturan" button

## Verification

### Test Case 1: 3km booking (should be Rp 25,000)
1. Create a new booking with home visit
2. Enter a destination 3km away
3. Check the PricingCalculator shows "Travel surcharge: Rp 25,000"
4. Verify total includes this amount

### Test Case 2: 7km booking (should be Rp 35,000)
1. Create a new booking with home visit
2. Enter a destination 7km away
3. Check the PricingCalculator shows "Travel surcharge: Rp 35,000"
4. Verify total includes this amount

## Customization Examples

### Different Configuration A: Smaller coverage zone
- Min Distance: 3km
- Base: 25,000
- Per KM: 5,000

Results:
- 2km: Rp 25,000
- 3km: Rp 25,000
- 4km: Rp 30,000 (1km excess)
- 5km: Rp 35,000 (2km excess)

### Different Configuration B: Larger coverage zone
- Min Distance: 10km
- Base: 30,000
- Per KM: 3,000

Results:
- 5km: Rp 30,000
- 10km: Rp 30,000
- 15km: Rp 45,000 (5km excess)

### Different Configuration C: No minimum (charge per km only)
- Min Distance: 0km
- Base: 10,000
- Per KM: 5,000

Results:
- 3km: Rp 25,000 (10k + 3×5k)
- 5km: Rp 35,000 (10k + 5×5k)
- 7km: Rp 45,000 (10k + 7×5k)

## Important Notes

1. **Min Distance is NOT the starting point** - it's the distance zone covered by base charge
   - Wrong understanding: "Don't charge until 5km"
   - Correct understanding: "5km is covered by the flat base charge"

2. **This setting affects all home visit bookings** - if "Travel Surcharge Wajib" is checked

3. **Existing bookings are not affected** - only new bookings use the new settings

4. **The calculation happens on both frontend and backend**
   - Frontend: PricingCalculator shows preview
   - Backend: BookingService ensures accuracy

## System Flow

```
User creates booking with home visit
    ↓
Frontend calculates travel distance and surcharge
    ↓
Shows PricingCalculator with breakdown
    ↓
User confirms
    ↓
Backend recalculates to ensure accuracy
    ↓
Booking is created with final amounts
    ↓
Invoice is generated with travel charge
```

## Database Storage

The settings are stored in table: `invoice_travel_surcharge_settings`

Columns:
- `tenant_id`: Your business ID
- `base_travel_surcharge`: 25000
- `per_km_surcharge`: 5000
- `min_travel_distance`: 5
- `max_travel_distance`: 50
- `travel_surcharge_required`: true

## Troubleshooting

### Issue: Travel charge not showing
- Check if "Travel Surcharge Wajib" is checked
- Verify `minTravelDistance` is set to a value (e.g., 5)
- Check if destination is within `maxTravelDistance`

### Issue: Wrong amount for short distances
- Ensure `minTravelDistance` is correctly set to 5
- For 3km: Should show Rp 25,000, not Rp 15,000

### Issue: "Min Distance" UI unclear
- The field is now labeled "Min Distance (km) - Covered by Base"
- Help text explains it covers distances UP TO this value
- Examples show how 3km is still charged the full base amount when min is 5

## Related Files

- **Backend Logic:** `lib/location/location-service.ts` (function `calculateTravelSurcharge`)
- **UI Settings:** `components/settings/InvoiceSettings.tsx`
- **Booking Creation:** `lib/booking/booking-service.ts`
- **Frontend Calculator:** `components/booking/PricingCalculator.tsx`

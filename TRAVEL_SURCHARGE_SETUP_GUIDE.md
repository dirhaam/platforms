# Travel Surcharge Setup & "Luar Area" Issue - Complete Guide

## Overview
Travel surcharge configuration ada di **Invoice Settings** → **Pajak & Biaya** (Tax & Fees)

## Problem: "Luar Area" dengan 0 km, 0m, Rp 0

### Symptoms:
```
Perkiraan Biaya Travel
├─ Luar Area
├─ Jarak: 0.0 km
├─ Waktu: 0m
├─ Travel Surcharge: Rp 0
└─ Lokasi di luar area layanan utama. Surcharge tambahan mungkin berlaku.
```

## Root Cause Checklist

### 1. ❌ Homebase Coordinates Tidak Di-Set

**Issue:** `businessLatitude` & `businessLongitude` kosong di Invoice Settings

**Effect:**
- Origin coordinates = undefined
- Travel calculation gagal (error "Origin dan destination diperlukan")
- TravelEstimateCard tidak muncul

**Fix:**
```
Invoice Settings → Branding
├─ Business Address: [isi alamat bisnis]
├─ Business Latitude: -6.2088
└─ Business Longitude: 106.8456
```

**Verify di console:**
```javascript
[NewBookingDialog] Setting business coordinates for travel: {
  lat: -6.2088,
  lng: 106.8456  // ✓ Should have values, not undefined
}
```

---

### 2. ❌ Travel Surcharge Settings Tidak Dikonfigurasi

**Issue:** Settings di `invoice_travel_surcharge_settings` kosong

**Effect:**
- Distance calculated but surcharge = 0
- Surcharge tidak ditambahkan ke total amount

**Fix - Setup Travel Surcharge:**

**Invoice Settings → Pajak & Biaya:**
```
Travel Surcharge Configuration
├─ Base Travel Surcharge: 10000 (Rp)
├─ Per KM Surcharge: 5000 (Rp per km)
├─ Min Travel Distance: 0 (km)
├─ Max Travel Distance: 100 (km)
└─ Travel Surcharge Required: ✓ Enabled
```

**Verify di database:**
```sql
SELECT * FROM invoice_travel_surcharge_settings 
WHERE tenant_id = 'your-tenant-id';

-- Should return:
-- base_travel_surcharge: 10000
-- per_km_surcharge: 5000
-- travel_surcharge_required: true
```

**Verify di console:**
```javascript
[LocationService.calculateTravel] Invoice settings travel config: {
  baseTravelSurcharge: 10000,
  perKmSurcharge: 5000,
  travelSurchargeRequired: true
}

[LocationService.calculateTravel] Calculated surcharge from invoice settings: 35000
// Formula: 10000 + (5 km * 5000) = 35000 ✓
```

---

### 3. ❌ Lokasi Benar-benar Di Luar Service Area

**Issue:** Koordinat customer berada di luar service area yang didefinisikan

**Effect:**
- `isWithinServiceArea: false`
- Pesan "Luar Area Layanan Utama" muncul
- Tapi surcharge masih harus dihitung dari invoice settings

**Verify:**
```javascript
[LocationService.calculateTravel] Service area check: {
  isWithinArea: false,  // ← Outside service area
  surcharge: 0,
  serviceAreaId: null
}

// Then should fallback to invoice settings:
[LocationService.calculateTravel] Invoice settings travel config: {...}
[LocationService.calculateTravel] Calculated surcharge from invoice settings: 35000
```

**Fix:**
- Add service area yang cover lokasi customer
- OR expand existing service area
- OR don't use service areas (rely on invoice settings surcharge)

---

### 4. ❌ OSRM API Timeout (0 km berarti distance calculation gagal)

**Issue:** OSRM API timeout atau error

**Effect:**
- distance = 0
- duration = 0
- surcharge = 0
- Fallback ke straight-line calculation

**Verify di console:**
```javascript
[LocationService] OSRM routing error: Error: Failed to fetch OSRM route
// OR
[LocationService] Calling OSRM route: {...}
// Tapi tidak ada log OSRM route success

[LocationService.calculateTravel] Resolved coordinates: {
  origin: { lat: -6.2088, lng: 106.8456 },
  destination: undefined  // ← Destination resolving failed!
}
```

**Fix:**
- Pastikan address yang diinput valid dan di Indonesia
- Cek apakah OSRM service up: https://router.project-osrm.org
- Verify coordinates format

---

## Complete Debugging Flow

### Step 1: Open Browser Console (F12)

Lihat logs saat buka New Booking Dialog:

```javascript
✓ SUCCESS:
[NewBookingDialog] Invoice settings loaded: {...}
[NewBookingDialog] Setting business coordinates for travel: {
  lat: -6.2088,
  lng: 106.8456
}

✗ FAILURE:
[NewBookingDialog] No business coordinates in invoice settings: {
  businessLatitude: undefined,
  businessLongitude: undefined
}
```

### Step 2: Input Home Address

User ketik alamat customer, pilih dari suggestions

```javascript
✓ HomeVisitAddressSelector fetches address
✓ Coordinates auto-filled
✓ TravelEstimateCard shows
```

### Step 3: Travel Calculation Triggered

User lihat "Hitung Ulang" button, calculation start:

```javascript
[TravelEstimateCard] Calculating travel: {
  origin: { lat: -6.2088, lng: 106.8456 },
  destination: "Jl. Sudirman 123, Jakarta",
  tenantId: "xxx"
}
```

### Step 4: Backend Processing

Server logs:

```javascript
[API/calculate-travel] Request received: {
  origin: { lat, lng },
  destination: "...",
  tenantId: "xxx"
}

[LocationService.calculateTravel] Request: {...}
[LocationService.calculateTravel] Resolved coordinates: {
  origin: { lat: -6.2088, lng: 106.8456 },
  destination: { lat: -6.3000, lng: 106.9000 }
}

[LocationService] Calling OSRM route: {...}
[LocationService] OSRM route success: {
  distance: 5.2,
  duration: 15,
  polylinePoints: 350
}

[LocationService.calculateTravel] Service area check: {
  isWithinArea: false,
  surcharge: 0
}

[LocationService.calculateTravel] Invoice settings travel config: {
  baseTravelSurcharge: 10000,
  perKmSurcharge: 5000
}

[LocationService.calculateTravel] Calculated surcharge from invoice settings: 35000
// Formula: 10000 + (5.2 km * 5000) = 36000

[API/calculate-travel] Calculation result: {
  distance: 5.2,
  duration: 15,
  surcharge: 36000,
  isWithinServiceArea: false
}
```

### Step 5: Frontend Display

```javascript
[TravelEstimateCard] Calculation result: {
  distance: 5.2,
  duration: 15,
  route: [{...}, ...],
  surcharge: 36000,
  isWithinServiceArea: false
}
```

**Should display:**
```
Perkiraan Biaya Travel
├─ Luar Area
├─ Jarak: 5.2 km
├─ Waktu: 15m
└─ Travel Surcharge: Rp 36,000
```

---

## Configuration Details

### Invoice Settings Fields

**Pajak & Biaya → Travel Surcharge:**

| Field | Type | Default | Example | Purpose |
|-------|------|---------|---------|---------|
| Base Travel Surcharge | Number | 0 | 10000 | Fixed surcharge untuk setiap booking |
| Per KM Surcharge | Number | 5000 | 5000 | Biaya per kilometer perjalanan |
| Min Travel Distance | Number | 0 | 0 | Jarak minimum (tidak ada biaya jika < ini) |
| Max Travel Distance | Number | ∞ | 100 | Jarak maksimum (tidak ada biaya jika > ini) |
| Travel Surcharge Required | Boolean | true | true | Wajib hitung atau optional |

### Surcharge Calculation Formula

```
IF distance < minTravelDistance OR distance > maxTravelDistance:
  surcharge = 0
ELSE:
  surcharge = baseTravelSurcharge + (distance * perKmSurcharge)

Example:
  baseTravelSurcharge = 10000
  perKmSurcharge = 5000
  distance = 5.2 km
  
  surcharge = 10000 + (5.2 * 5000) = 36000
```

---

## Service Area vs Invoice Settings

### Service Area (Optional)
- Define geographic boundaries
- Per-area surcharge rates
- Used if defined
- Overrides invoice settings if inside area

### Invoice Settings (Always Available)
- Global surcharge configuration
- Fallback when outside service area
- Fallback when no service area defined

### Priority:
```
1. IF location inside service area → use service area surcharge
2. ELSE → use invoice settings surcharge
3. IF both empty → surcharge = 0
```

---

## Testing Checklist

### Setup:
- [ ] Invoice Settings → Branding has businessLatitude & businessLongitude
- [ ] Invoice Settings → Pajak & Biaya has Travel Surcharge configured
- [ ] At least one of:
  - [ ] Service area defined (optional)
  - [ ] Or rely on invoice settings surcharge

### Test "New Booking":
- [ ] Open New Booking Dialog
- [ ] Check console: `[NewBookingDialog] Setting business coordinates`
- [ ] Toggle "Home Visit Service" checkbox
- [ ] Enter customer address (e.g., "Jl. Sudirman")
- [ ] Select from suggestions
- [ ] Verify TravelEstimateCard appears
- [ ] Check console: `[TravelEstimateCard] Calculating travel`
- [ ] Result should show:
  - [ ] Distance > 0 (not 0.0 km)
  - [ ] Time > 0 (not 0m)
  - [ ] Surcharge > 0 (not Rp 0)

### Verify Backend:
- [ ] Server logs show OSRM success
- [ ] Service area check completed
- [ ] Invoice settings fetched
- [ ] Surcharge calculated correctly

---

## Common Scenarios

### Scenario 1: Inside Service Area with Area-Specific Surcharge
```
Location inside service area boundary
↓
Use service area surcharge (overrides invoice settings)
↓
Result: Correct surcharge shown, NOT "Luar Area"
```

### Scenario 2: Outside Service Area
```
Location outside all service areas
↓
isWithinServiceArea = false → "Luar Area" message
↓
Fallback to invoice settings surcharge
↓
Result: "Luar Area" message shown BUT surcharge calculated
```

### Scenario 3: No Service Area Defined
```
No service areas configured at all
↓
Always use invoice settings surcharge
↓
Result: No "Luar Area" message, normal surcharge shown
```

### Scenario 4: Empty Settings
```
No invoice travel surcharge configured
AND no service areas defined
↓
surcharge = 0 (Rp 0)
↓
Result: Travel shown but 0 surcharge (expected behavior)
```

---

## Related Documentation

- `HOMEBASE_ROUTE_GUIDE.md` - Homebase data setup
- `TRAVEL_SURCHARGE_PERSISTENCE_FIX.md` - Data persistence issue
- `ROUTE_DEBUGGING_GUIDE.md` - Route polyline issues
- Invoice Settings UI - Where to configure

---

## Support

If travel calculation shows 0 with "Luar Area":

1. Check **Invoice Settings** has businessLatitude/Longitude
2. Check **Pajak & Biaya** has travel surcharge configured
3. Check browser console for logs
4. Verify address is in Indonesia
5. Check OSRM is accessible

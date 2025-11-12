# Travel Calculation Troubleshooting - "0 km, 0m" Issue

## Problem
Travel Estimate Card shows:
- Jarak: 0.0 km
- Waktu: 0m
- Travel Surcharge: Rp 0
- Message: "Lokasi di luar area layanan utama"

## Root Causes

### 1. Homebase Coordinates Not Loaded ❌
**Symptom:** Shows 0 km even for nearby locations

**Check:**
```javascript
// Open Browser Console (F12)
// Look for these logs:

[BookingDashboard] Business location loaded: { addr, lat, lng }
[HomeVisitBookingManager] Using provided businessCoordinates: {...}

// If missing → coordinates not loaded from invoice settings
```

**Solution:**
1. Go to Invoice Settings
2. Ensure `businessLatitude` and `businessLongitude` are filled
3. Values should be numbers, e.g., -6.2088, 106.8456
4. NOT null or empty string

---

### 2. Origin Not Passed to TravelEstimateCard ❌
**Symptom:** Component shows 0km, error in console

**Check:**
```javascript
[TravelEstimateCard] Calculating travel: { origin, destination, tenantId }

// If origin is undefined or empty → API call will fail
```

**Solution:**
- Ensure `businessCoordinates` is passed from parent component
- Check NewBookingDialog or component using TravelEstimateCard
- Verify businessCoordinates is loaded before rendering card

---

### 3. API Request Fails ❌
**Symptom:** Empty result, surcharge = 0

**Check Server Logs:**
```
[API/calculate-travel] Request received: { origin, destination, ... }
[API/calculate-travel] Validation failed: { origin: undefined }
```

**Solution:**
- Verify origin/destination are valid coordinates or addresses
- Check if tenantId is correct
- Look for any error message in logs

---

### 4. Outside Service Area 🚨
**Symptom:** Shows "Lokasi di luar area layanan utama"

**Check:**
```javascript
[API/calculate-travel] Calculation result: {
  distance: 5.2,
  isWithinServiceArea: false,  // ← False means outside area
  surcharge: 0
}
```

**Solution:**
- Check Service Area boundaries in settings
- Verify customer location is within defined area
- Or disable service area restrictions if not needed

---

## Complete Debugging Flow

### Step 1: Check Browser Console
```javascript
// F12 → Console tab

// Search for [TravelEstimateCard] logs
[TravelEstimateCard] Calculating travel: { 
  origin: { lat: -6.2088, lng: 106.8456 },  // ✓ Should have values
  destination: "Jl. Sudirman 123",
  tenantId: "xxx"
}

// Expected result:
[TravelEstimateCard] Calculation result: {
  distance: 5.2,
  duration: 15,
  route: [{...}, ...],      // Array of polyline points
  surcharge: 50000,
  isWithinServiceArea: true
}
```

### Step 2: Check Server Logs
```
# Terminal / Vercel logs

[API/calculate-travel] Request received: {
  origin: { lat, lng },
  destination: "address",
  tenantId: "xxx"
}

[LocationService] Calling OSRM route: { origin, destination }
[LocationService] OSRM route success: { 
  distance: 5.2,
  duration: 15,
  polylinePoints: 350
}

[API/calculate-travel] Calculation result: {
  distance: 5.2,
  duration: 15,
  surcharge: 50000,
  polylinePoints: 350,
  isWithinServiceArea: true
}
```

### Step 3: Check Network Tab
```
Browser DevTools → Network tab
Filter: calculate-travel

Request:
POST /api/location/calculate-travel
{
  origin: {...},
  destination: "...",
  tenantId: "..."
}

Response (should NOT be 0):
{
  distance: 5.2,
  duration: 15,
  route: [...],
  surcharge: 50000,
  isWithinServiceArea: true
}
```

---

## Possible Values for Each Field

| Field | Good Value | Bad Value | Issue |
|-------|-----------|-----------|-------|
| `distance` | 5.2 | 0.0 | Origin/destination same or not loaded |
| `duration` | 15 | 0 | OSRM call failed |
| `surcharge` | 50000 | 0 | Outside service area or no surcharge config |
| `route` | [{lat,lng}, ...] | [] | OSRM didn't return polyline |
| `isWithinServiceArea` | true | false | Location outside defined area |

---

## Checklist Before Debugging

- [ ] Business coordinates saved in Invoice Settings (businessLatitude/Longitude)
- [ ] Business coordinates are valid numbers (not null/string)
- [ ] Customer location is filled (homeVisitAddress)
- [ ] Check browser console for [TravelEstimateCard] logs
- [ ] Check server logs for [API/calculate-travel] logs
- [ ] Network tab shows 200 OK response (not 400/500)
- [ ] Response contains distance > 0
- [ ] OSRM API is responding (online.project-osrm.org works?)

---

## Common Issues & Fixes

### Issue: "Origin dan destination diperlukan"
```
[TravelEstimateCard] Error: Origin dan destination diperlukan
```
**Fix:** 
- Ensure businessCoordinates passed from parent
- Ensure homeVisitAddress is filled

---

### Issue: HTTP Error in Response
```
[TravelEstimateCard] Error: Travel calculation failed: HTTP 400
```
**Fix:**
- Check server logs for validation error
- Verify tenantId is correct UUID format

---

### Issue: "Lokasi di luar area layanan utama"
```
isWithinServiceArea: false
```
**Fix:**
- Check Service Area settings
- Add customer location to service area
- Or set surcharge for outside areas in invoice settings

---

### Issue: Distance shows but surcharge is 0
```
distance: 5.2,
surcharge: 0
```
**Fix:**
- Configure travel surcharge in Invoice Settings
- Set surcharge per km or fixed rate
- Check service area surcharge settings

---

## Testing with Mock Data

```javascript
// In browser console, test with known coordinates:

const origin = { lat: -6.2088, lng: 106.8456 };  // Sudirman Jakarta
const dest = { lat: -6.3000, lng: 106.9000 };    // Somewhere else

fetch('/api/location/calculate-travel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin,
    destination: 'Test Location',
    tenantId: 'your-tenant-id'
  })
})
.then(r => r.json())
.then(data => console.log(data));

// Should return distance > 0 if successful
```

---

## Reference Documentation

- **HOMEBASE_ROUTE_GUIDE.md** - How homebase data flows
- **ROUTE_DEBUGGING_GUIDE.md** - Route polyline issues
- **Invoice Settings** - Where to configure business coordinates
- **Service Area Settings** - Where to define service boundaries

---

## Next Steps if Still Issues

1. Share server logs from `/api/location/calculate-travel`
2. Share browser console output from TravelEstimateCard
3. Verify business coordinates in Invoice Settings UI
4. Test with different customer locations
5. Check if OSRM API is up: https://router.project-osrm.org

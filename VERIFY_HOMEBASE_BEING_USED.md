# Verify Homebase is Used in Travel Calculation - Debug Guide

## Problem Statement
User reports: "Kok calculate based on Jakarta not my homebase?"

But logs show homebase coordinates ARE loaded correctly.

## Verification Checklist

### Step 1: Check Frontend Logs

**Browser Console (F12):**

```javascript
✓ GOOD - Homebase loaded:
[NewBookingDialog] Setting business coordinates for travel: {
  lat: -7.2592055,      // Your homebase (Surabaya)
  lng: 112.7470786      // NOT Jakarta (-6.2088, 106.8456)
}

[BookingDashboard] Setting business location coordinates: {
  lat: -7.2592055,
  lng: 112.7470786
}

✓ GOOD - Sent to backend:
[TravelEstimateCard] Calculating travel: {
  origin: { lat: -7.2592055, lng: 112.7470786 },  // Your homebase!
  destination: "masjid al falah surabay",
  tenantId: "test-demo"
}

✗ BAD - Jakarta default:
[TravelEstimateCard] Calculating travel: {
  origin: { lat: -6.2088, lng: 106.8456 },  // Jakarta fallback!
  destination: "...",
  ...
}
```

### Step 2: Check Backend Logs (Vercel/Console)

**When travel calculation is triggered:**

```
[API/calculate-travel] Request received: {
  origin: { lat: -7.2592055, lng: 112.7470786 },  // ← Should be YOUR coords!
  originLat: -7.2592055,      // ← Double-check here
  originLng: 112.7470786,     // ← Should be your homebase
  destination: "...",
  tenantId: "test-demo"
}

[LocationService.calculateTravel] Resolved coordinates: {
  origin: {lat: -7.2592055, lng: 112.7470786},  // ← Still correct?
  destination: {lat: -7.25..., lng: 112.74...},
  originValid: true,
  destinationValid: true
}

[LocationService] Calling OSRM route: {
  origin: { lat: -7.2592055, lng: 112.7470786 },  // ← Used in OSRM
  destination: { lat: -7.25..., lng: 112.74... }
}
```

### Step 3: Check OSRM Request

**OSRM URL Pattern:**
```
https://router.project-osrm.org/route/v1/driving/{origin.lng},{origin.lat};{dest.lng},{dest.lat}?overview=full&geometries=geojson
```

**Example with YOUR homebase:**
```
✓ CORRECT (Surabaya to customer):
https://router.project-osrm.org/route/v1/driving/112.7470786,-7.2592055;112.74,-7.25?...

✗ WRONG (Jakarta to customer):
https://router.project-osrm.org/route/v1/driving/106.8456,-6.2088;112.74,-7.25?...
```

**Check in browser Network tab:**
1. Open DevTools → Network tab
2. Filter: `router.project-osrm.org` or `calculate-travel`
3. Click on request
4. Check URL has your homebase coordinates

### Step 4: Trace Full Request/Response

**Network Tab Details:**

```
Request URL: POST /api/location/calculate-travel
Request Body:
{
  "origin": { "lat": -7.2592055, "lng": 112.7470786 },  // ← Check this!
  "destination": "Masjid Al-Falah...",
  "tenantId": "test-demo"
}

Response:
{
  "distance": 5.2,      // ← Should show actual distance
  "duration": 15,       // ← Not 0
  "surcharge": 35000,   // ← Not 0
  "route": [...],
  "isWithinServiceArea": false
}
```

## Common Issues & Fixes

### Issue 1: Logs Show Jakarta Coordinates

```javascript
[TravelEstimateCard] Calculating travel: {
  origin: { lat: -6.2088, lng: 106.8456 },  // ✗ Jakarta!
  ...
}
```

**Cause:** `businessCoordinates` not loaded from invoice settings

**Fix:**
1. Go to **Invoice Settings → Branding**
2. Verify **Business Latitude** & **Longitude** are set
3. Values should be YOUR homebase, not empty
4. Save settings
5. Refresh page
6. Check console: Should now show YOUR coordinates

---

### Issue 2: Logs Show Correct Frontend, But Backend Gets Jakarta

```javascript
// Frontend CORRECT:
[TravelEstimateCard] origin: { lat: -7.2592055, lng: 112.7470786 }

// Backend WRONG:
[API/calculate-travel] origin: { lat: -6.2088, lng: 106.8456 }
```

**Cause:** API endpoint receiving wrong data (corruption during transmission)

**Fix:**
1. Check network tab for POST request body
2. Verify origin in request matches frontend
3. If different: Network issue or proxy modifying data
4. Try different browser/network
5. Check proxy/VPN settings

---

### Issue 3: Backend Receives Correct Coords, But Calculation is Wrong

```javascript
// API receives correct:
[API/calculate-travel] originLat: -7.2592055, originLng: 112.7470786

// But calculation uses different origin:
[LocationService] Calling OSRM route: {
  origin: { lat: -6.2088, lng: 106.8456 },  // ✗ Wrong!
}
```

**Cause:** Code bug (origin parameter being overwritten)

**Fix:**
1. Check LocationService.calculateTravel() source
2. Verify `origin` parameter not being modified
3. Look for any hardcoded fallback logic
4. File bug report with exact logs

---

## Expected Behavior - Full Trace

### Scenario: Surabaya to Mosque

```
USER ACTION:
- New Booking Dialog opens
- User enters home visit address: "Masjid Al-Falah"

FRONTEND:
[NewBookingDialog] Invoice settings loaded: {...}
[NewBookingDialog] Setting business coordinates: {lat: -7.2592055, lng: 112.7470786}
[TravelEstimateCard] Calculating travel: {
  origin: {lat: -7.2592055, lng: 112.7470786},  // ← Your homebase
  destination: "Masjid Al-Falah",
  tenantId: "test-demo"
}

BACKEND:
[API/calculate-travel] Request received: {
  originLat: -7.2592055,        // ← Verify here!
  originLng: 112.7470786,       // ← Verify here!
  destination: "Masjid Al-Falah"
}

[LocationService.calculateTravel] Resolved coordinates: {
  origin: {lat: -7.2592055, lng: 112.7470786},    // ← Still correct?
  destination: {lat: -7.25, lng: 112.74}
}

[LocationService] Calling OSRM route: {
  origin: {lat: -7.2592055, lng: 112.7470786},    // ← Used here
  destination: {lat: -7.25, lng: 112.74}
}

[LocationService] OSRM route success: {
  distance: 5.2,        // ← Actual distance FROM homebase
  duration: 15,
  polylinePoints: 350
}

[LocationService.calculateTravel] Calculated surcharge: 35000
// Formula: 10000 + (5.2 * 5000) = 36000

RESPONSE:
{
  distance: 5.2,        // ← Distance FROM Surabaya homebase
  duration: 15,
  surcharge: 35000,
  route: [...]
}

FRONTEND:
[TravelEstimateCard] Calculation result: {
  distance: 5.2,        // ← From Surabaya
  duration: 15,
  surcharge: 35000
}

UI DISPLAY:
✓ Jarak: 5.2 km
✓ Waktu: 15m
✓ Travel Surcharge: Rp 35,000
```

## Troubleshooting Checklist

- [ ] Frontend logs show YOUR homebase coordinates (not -6.2088, 106.8456)
- [ ] `[TravelEstimateCard] Calculating travel` shows correct origin
- [ ] Server logs show `[API/calculate-travel] originLat/Lng` are your coords
- [ ] OSRM URL in Network tab uses your homebase coordinates
- [ ] Final distance is reasonable (not 0, not tiny)
- [ ] Surcharge calculation makes sense

## If Still Showing Jakarta

**Check these in order:**

1. **Invoice Settings:**
   ```
   Invoice Settings → Branding
   ├─ Business Latitude: -7.2592055  (your homebase)
   └─ Business Longitude: 112.7470786 (your homebase)
   NOT: -6.2088, 106.8456 (Jakarta)
   ```

2. **Refresh Page:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clears cache
   - Reloads settings

3. **Check Console:**
   - Open F12 → Console
   - Look for [NewBookingDialog] logs
   - Verify coordinates match YOUR homebase

4. **Network Tab:**
   - Open F12 → Network
   - Create new booking
   - Find POST to `/api/location/calculate-travel`
   - Check Request Body → origin coordinates

5. **Server Logs:**
   - Go to Vercel/deployment logs
   - Search for: `[API/calculate-travel]`
   - Check if `originLat` matches your homebase

## Related Files

- `lib/database/schema/index.ts` - Booking schema with travel fields
- `lib/invoice/invoice-settings-service.ts` - How settings loaded
- `lib/location/location-service.ts` - Core calculation logic
- `components/booking/NewBookingDialog.tsx` - Frontend booking creation
- `app/api/location/calculate-travel/route.ts` - API endpoint

## Summary

**Your homebase SHOULD be used automatically:**
1. Invoice Settings has coordinates
2. NewBookingDialog loads them
3. Sent to backend as `origin`
4. Used in OSRM routing
5. Distance calculated from homebase

**If showing Jakarta:** One of these steps is failing. Use logs to identify which one!

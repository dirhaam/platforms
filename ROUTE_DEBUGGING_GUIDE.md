# Route Debugging Guide - Why Routes Don't Follow Roads

## Problem
Routes appear as straight lines (crow flies) instead of following actual road networks.

## Root Cause Analysis

### Flow 1: Route with Polyline Data (Ideal)
```
Backend: calculateTravel()
  ↓
Call OSRM API
  ↓
Get polyline coordinates (route.geometry.coordinates)
  ↓
Return: { distance, duration, route: [...polyline points] }
  ↓
Frontend: RouteMiniMap receives route prop
  ↓
Draw polyline on map (follows real roads ✓)
```

### Flow 2: Route without Polyline (Fallback)
```
No route data provided
  ↓
RouteMiniMap fetches OSRM directly
  ↓
Draw polyline from response
  ↓
If OSRM fails/times out
  ↓
Draw straight dashed line (fallback ✗)
```

## Debugging Steps

### Step 1: Check Browser Console

Open DevTools (F12) → Console tab and look for:

```javascript
// ✓ These logs mean routing is working:
[LocationService] Calling OSRM route: { origin: {...}, destination: {...} }
[LocationService] OSRM route success: { distance: X.XX, duration: Y, polylinePoints: 500+ }

[RouteMiniMap] Drawing provided route polyline with 500+ points
```

```javascript
// ✗ These logs mean routing is failing:
[LocationService] OSRM routing error: [error details]
[RouteMiniMap] No route provided, fetching from OSRM
[RouteMiniMap] Failed to fetch OSRM route, using fallback
[RouteMiniMap] No valid OSRM route, using fallback
```

### Step 2: Verify Route Data Flow

In browser console, check:

```javascript
// 1. Check if travelCalculation has route data
$0.travelCalculation  // In booking card

// Should see:
{
  distance: 5.2,
  duration: 15,
  route: [{lat: -6.2088, lng: 106.8456}, ...],  // ✓ Has polyline
  surcharge: 50000
}
```

### Step 3: Test OSRM Directly

If route polyline is empty, test OSRM API directly:

```javascript
// In browser console:
const origin = { lat: -6.2088, lng: 106.8456 };
const dest = { lat: -6.3000, lng: 106.9000 };
const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

fetch(url)
  .then(r => r.json())
  .then(data => {
    console.log('Routes:', data.routes.length);
    console.log('Polyline points:', data.routes[0].geometry.coordinates.length);
  });
```

**Expected Response:**
```json
{
  "routes": [{
    "distance": 5200,           // meters
    "duration": 900,            // seconds
    "geometry": {
      "coordinates": [          // Many coordinate pairs!
        [106.8456, -6.2088],
        [106.8460, -6.2095],
        ...500+ points...
        [106.9000, -6.3000]
      ]
    }
  }]
}
```

## Common Issues & Solutions

### Issue 1: "Using Fallback" Messages
**Symptom:** Route shows as dashed line
**Cause:** OSRM API request failed or timed out

**Solutions:**
1. Check internet connectivity
2. OSRM might be slow - try again
3. Verify coordinates are valid (within Indonesia)
4. Check browser console for specific error

```javascript
// In RouteMiniMap, look for:
[RouteMiniMap] Failed to fetch OSRM route: [error]
```

### Issue 2: Empty Polyline Points
**Symptom:** Route data returns but has no polyline
**Cause:** Backend not extracting coordinates from OSRM response

**Check:**
```javascript
// In backend log, verify:
[LocationService] OSRM route success: { 
  polylinePoints: 450  // Should be > 10
}

// If polylinePoints is 0, coordinates weren't extracted
```

### Issue 3: Coordinates Out of Order
**Symptom:** Route shows but has weird jumps
**Cause:** Lat/Lng might be swapped somewhere

**Verify:**
```javascript
// OSRM returns: [lng, lat]
// We convert to: {lat: lng, lng: lat}  ← Check this!

const coord = [106.8456, -6.2088];  // [lng, lat]
const point = {
  lat: coord[1],  // -6.2088 ✓
  lng: coord[0]   // 106.8456 ✓
};
```

## Key Configuration

**OSRM Parameters Matter:**

| Parameter | Value | Effect |
|-----------|-------|--------|
| `overview` | `simplified` | Fast, few points (older) |
| `overview` | `full` | Accurate, many points (current) |
| `geometries` | `geojson` | Returns coordinates directly |

**Current Setup (correct):**
```
overview=full&geometries=geojson
```

## Expected Behavior

✓ **Route Following Real Roads:**
- Blue solid line on map
- Multiple waypoints (50-500+ points)
- Follows visible road network
- Matches Google Maps / Apple Maps

✗ **Fallback Straight Line:**
- Dashed gray line
- Only 2 points (origin → destination)
- Cuts through buildings/water
- Indicates OSRM call failed

## Performance Impact

**With Full Polyline:**
- More accurate distance/time estimates
- Shows realistic travel path
- Slightly slower rendering (but negligible)
- ~2-5KB payload per route

## Troubleshooting Checklist

- [ ] Check browser console for [LocationService] and [RouteMiniMap] logs
- [ ] Verify `polylinePoints` count is > 10
- [ ] Test OSRM API directly in browser console
- [ ] Confirm coordinates are {lat: number, lng: number}
- [ ] Check if fallback log appears (means OSRM failed)
- [ ] Verify network tab shows OSRM requests succeeding
- [ ] Try different origin/destination coordinates

## Related Files

- `lib/location/location-service.ts` - Backend routing (OSRM call)
- `components/location/RouteMiniMap.tsx` - Frontend rendering
- `types/location.ts` - TravelCalculation interface (has route field)

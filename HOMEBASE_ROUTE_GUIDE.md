# Homebase Route Marker - Flow Guide

## Overview
Rute home visit sekarang dimulai dari homebase (bukan Jakarta hardcoded). Data homebase disimpan di Invoice Settings dan diload untuk membuat route marker.

## Flow Diagram

```
BookingDashboard (fetchBookings)
  ↓
  ├─→ Fetch Invoice Settings (/api/settings/invoice-config)
  │    ├─ businessAddress (string)
  │    ├─ businessLatitude (number)
  │    └─ businessLongitude (number)
  │
  ├─→ Set states: businessLocation, businessLocationCoords
  │
  └─→ Pass to HomeVisitBookingManager
       ├─ businessLocation (string)
       ├─ businessCoordinates (object with lat/lng)
       │
       └─→ HomeVisitBookingManager
            ├─ If businessCoordinates provided → Use it directly
            ├─ Else if businessLocation (string) → Geocode to get coordinates
            │   └─→ /api/location/geocode
            │
            └─→ Pass to Maps (LeafletMap)
                 ├─ Show business location marker
                 ├─ Calculate travel distance from homebase
                 └─ Show route polyline
```

## Data Storage

**Invoice Settings (Database)**
```sql
branding table:
  - business_address (string)          -- e.g., "Jl. Sudirman 123, Jakarta"
  - business_latitude (float)          -- e.g., -6.2088
  - business_longitude (float)         -- e.g., 106.8456
```

## Component Flow

### 1. BookingDashboard.tsx
- Fetches invoice settings from `/api/settings/invoice-config`
- Extracts business coordinates from `branding.businessLatitude/Longitude`
- Passes `businessLocationCoords` to HomeVisitBookingManager

```typescript
// In fetchBookings():
const settingsData = await fetch('/api/settings/invoice-config');
const lat = settingsData.settings?.branding?.businessLatitude;
const lng = settingsData.settings?.branding?.businessLongitude;
setBusinessLocationCoords({ lat, lng });
```

### 2. HomeVisitBookingManager.tsx
- Receives `businessCoordinates` and `businessLocation` from parent
- Uses coordinates for travel calculations
- Falls back to geocoding if only address is available

```typescript
// Priority: coords > geocoding address > no marker
useEffect(() => {
  if (businessCoordinates) {
    setBusinessCoords(businessCoordinates); // Use directly
  } else if (businessLocation) {
    geocodeBusinessLocation(); // Geocode address
  }
}, [businessCoordinates, businessLocation]);
```

### 3. LeafletMap.tsx
- Receives `businessLocation` (coordinates object)
- Renders blue business marker
- Centers map on homebase

```typescript
// Add business location marker
if (businessLocation) {
  window.L.marker([businessLocation.lat, businessLocation.lng])
    .bindPopup('Business Location')
    .addTo(map);
}
```

### 4. Travel Calculation
- When user creates/views home visit booking
- Calculates from `businessCoords` (homebase) to customer address
- Shows travel distance, duration, and surcharge

## Debugging

### Check Browser Console Logs
```javascript
// BookingDashboard logs:
[BookingDashboard] Business location loaded: { addr, lat, lng }
[BookingDashboard] Setting business location coordinates: { lat, lng }

// HomeVisitBookingManager logs:
[HomeVisitBookingManager] Using provided businessCoordinates: {...}
[HomeVisitBookingManager] Geocoding business location: "..."
[HomeVisitBookingManager] Geocoding successful: {...}
```

### Common Issues

**Issue 1: No homebase marker on map**
- Check: Is `businessCoordinates` passed from BookingDashboard?
- Check: Are `businessLatitude` and `businessLongitude` saved in invoice settings?
- Check: Is the value numeric (not null)?

**Issue 2: Incorrect route start location**
- Verify invoice settings have correct coordinates
- Check if coordinates are being loaded (see console logs)
- Confirm coordinates are valid (within Indonesia bounds)

**Issue 3: Geocoding failing**
- Ensure business address is clear and specific
- Add coordinates directly to invoice settings to bypass geocoding
- Check `/api/location/geocode` endpoint is working

## Testing Steps

1. **Open Booking Dashboard** → Home Visits tab
2. **Check Browser Console** for logs:
   ```
   [BookingDashboard] Business location loaded
   [HomeVisitBookingManager] Using provided businessCoordinates
   ```
3. **Verify Map Shows**:
   - Blue marker at homebase
   - Customer location markers
   - Route polyline connecting them

4. **Check Travel Info**:
   - Distance shows from homebase to customer
   - Travel time is calculated
   - Surcharge includes travel component

## Related Files

- `components/booking/BookingDashboard.tsx` - Entry point, loads settings
- `components/booking/HomeVisitBookingManager.tsx` - Coordinate resolution
- `components/location/LeafletMap.tsx` - Map rendering
- `components/location/RouteMiniMap.tsx` - Mini route display
- `lib/location/location-service.ts` - Backend geocoding
- `lib/invoice/invoice-settings-service.ts` - Settings schema

## API Endpoints

**Get Invoice Settings**
```
GET /api/settings/invoice-config?tenantId={tenantId}

Response:
{
  "settings": {
    "branding": {
      "businessAddress": "Jl. Sudirman 123",
      "businessLatitude": -6.2088,
      "businessLongitude": 106.8456
    }
  }
}
```

**Geocode Address**
```
POST /api/location/geocode

Request:
{
  "address": "Jl. Sudirman 123, Jakarta",
  "tenantId": "xxx"
}

Response:
{
  "isValid": true,
  "address": {
    "coordinates": { "lat": -6.2088, "lng": 106.8456 }
  }
}
```

## Route Polyline (Following Real Roads)

Routes now use **OSRM (Open Source Routing Machine)** to follow actual road networks:

```
Backend receives travel request
  ↓
Calls OSRM API with origin/destination
  ↓
Gets detailed route with 100-500+ waypoints
  ↓
Returns polyline coordinates
  ↓
Frontend renders blue line following roads
```

**Key Changes:**
- `overview=full` for detailed road-following polylines
- `geometries=geojson` for coordinate extraction
- Polyline stored in TravelCalculation.route field

**Debugging:** If routes show as dashed straight lines, see `ROUTE_DEBUGGING_GUIDE.md`

## Migration Notes

Previously: Routes started from Jakarta hardcoded (lat: -6.2088, lng: 106.8456)
Now: Routes start from actual homebase coordinates stored in invoice settings

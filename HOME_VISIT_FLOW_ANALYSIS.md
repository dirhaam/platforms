# Home Visit Feature - Complete Flow & Implementation Analysis

## Overview

Home Visit adalah fitur yang memungkinkan service untuk ditawarkan ke lokasi customer (home visit) daripada di salon/clinic. Sistem ini terintegrasi dengan:
- Location/Geocoding services
- Travel calculation & route optimization
- Dynamic surcharge calculation
- Scheduling conflict detection

---

## 🔄 ALUR HOME VISIT

### 1️⃣ **Service Configuration (Setup Phase)**

```
Admin Panel → Services → Create/Edit Service
├─ homeVisitAvailable: boolean (checkbox)
└─ homeVisitSurcharge: number (fixed amount)

Example:
Service: Haircut (Rp 350.000)
├─ homeVisitAvailable: true
└─ homeVisitSurcharge: Rp 75.000
```

**Files:**
- Service table: `homeVisitAvailable`, `homeVisitSurcharge` columns
- API: `/api/services/[id]` (update service)

---

### 2️⃣ **Booking Creation (Booking Phase)**

```
User/Admin creates booking:

NewBookingDialog / BookingDashboard
│
├─ Select Service
│  └─ If homeVisitAvailable = true, show Home Visit checkbox
│
├─ Check "Home Visit Service"
│  └─ Show address input field
│
├─ Enter Customer Home Address
│  ├─ Real-time geocoding using AddressInput
│  └─ Store coordinates (lat, lng)
│
└─ Calculate Amount Breakdown:
   ├─ Base: service.price
   ├─ Home Visit Surcharge: service.homeVisitSurcharge (IF selected)
   ├─ Tax: (base + surcharge) × tax%
   ├─ Service Charge: (base + surcharge) × charge% or fixed
   ├─ Additional Fees: (base + surcharge) × fees% or fixed
   └─ Total: base + surcharge + tax + charge + fees
```

**Form Fields:**
```typescript
isHomeVisit: boolean                    // Checkbox
homeVisitAddress: string                // Text input
homeVisitCoordinates: {lat, lng}        // Auto from geocoding
```

**Components:**
- `components/booking/NewBookingDialog.tsx` - Admin booking form
- `components/booking/BookingDialog.tsx` - Landing page booking
- `components/location/AddressInput.tsx` - Geocoding autocomplete

---

### 3️⃣ **Booking Stored in Database**

```sql
-- bookings table
INSERT INTO bookings (
  id,
  tenant_id,
  customer_id,
  service_id,
  scheduled_at,
  is_home_visit,              -- true/false
  home_visit_address,         -- "Jln. Sudirman No. 123, Jakarta"
  home_visit_coordinates,     -- {"lat": -6.2088, "lng": 106.8456}
  total_amount,               -- base + surcharge + tax + fees
  tax_percentage,
  service_charge_amount,
  additional_fees_amount
)
```

---

### 4️⃣ **Travel Calculation (Optional - Advanced Feature)**

```
HomeVisitBookingManager
│
├─ Filter bookings: is_home_visit = true
├─ Filter by date
│
├─ For each booking:
│  ├─ POST /api/location/calculate-travel
│  │  ├─ origin: business_location
│  │  └─ destination: booking.home_visit_address
│  │
│  └─ Response: TravelCalculation
│     ├─ distance: km
│     ├─ duration: minutes
│     ├─ surcharge: amount (based on distance/outside service area)
│     └─ isWithinServiceArea: boolean
│
├─ Check Scheduling Conflicts:
│  ├─ Insufficient travel time between bookings
│  └─ Overlapping bookings
│
└─ Optional: Optimize Route
   └─ Reorder bookings untuk minimize total travel
```

**API: `/api/location/calculate-travel`**
```typescript
POST /api/location/calculate-travel
{
  origin: "Jln. ABC, Jakarta",          // business address
  destination: "Jln. XYZ, Jakarta",     // customer address
  tenantId: "abc-123",
  serviceId: "service-456"
}

Response:
{
  distance: 15.5,                       // km
  duration: 25,                         // minutes
  surcharge: 50000,                     // Rp (IF outside service area)
  isWithinServiceArea: true,
  route: [...coordinates],
  serviceAreaId: "area-123"
}
```

**Implementation:**
- `components/location/TravelCalculator.tsx` - Travel calculation UI
- `components/booking/HomeVisitBookingManager.tsx` - Manage home visit bookings
- `lib/location/location-service.ts` - Business logic

---

### 5️⃣ **Geocoding & Location Resolution**

```
LocationService.resolveLocation()
│
├─ Input: address string atau coordinates object
│
├─ If coordinates already exist → return as is
├─ If address string → Geocode:
│  │
│  └─ Using Nominatim (OpenStreetMap) by default
│     ├─ API: https://nominatim.openstreetmap.org/search
│     ├─ Returns: lat, lng, full address, suggestions
│     └─ Cached for 1 hour
│
└─ Output: 
   {
     lat: -6.2088,
     lng: 106.8456
   }
```

**Geocoding Providers:**
- **Nominatim** (Default - Free) ✅
- **Google Maps** (Requires API key) - Not yet implemented
- **Mapbox** (Requires API key) - Not yet implemented

---

### 6️⃣ **Routing & Travel Time**

```
LocationService.getRouteInfo()
│
├─ Using OSRM (Open Source Routing Machine) by default
│  └─ API: https://router.project-osrm.org/route/v1/driving/
│
├─ Input: origin {lat, lng}, destination {lat, lng}
│
├─ OSRM calculates:
│  ├─ Actual driving distance (km)
│  ├─ Estimated travel time (minutes)
│  └─ Route coordinates (for mapping)
│
└─ Fallback:
   └─ Haversine distance calculation (straight-line)
   └─ Estimate time: distance × 2 minutes/km
```

**Routing Providers:**
- **OSRM** (Default - Free) ✅
- **Google Directions** - Not yet implemented
- **Mapbox** - Not yet implemented

---

### 7️⃣ **Service Area Coverage Check**

```
checkServiceAreaCoverage()
│
├─ Input: destination coordinates, tenantId, serviceId
│
├─ Check against service_areas table:
│  ├─ Is destination within service area?
│  └─ Calculate surcharge (if outside area)
│
└─ Output:
   {
     isWithinArea: true/false,
     surcharge: 0 or amount,
     serviceAreaId: "..."
   }
```

**Note:** Belum fully implemented, currently returns default `isWithinArea: true, surcharge: 0`

---

### 8️⃣ **Invoice Generation for Home Visit**

```
Booking dengan home visit
└─ Generate Invoice
   │
   ├─ Extract booking breakdown:
   │  ├─ base: service.price
   │  ├─ surcharge: service.homeVisitSurcharge
   │  ├─ tax: booking.tax_percentage
   │  ├─ service_charge: booking.service_charge_amount
   │  └─ additional_fees: booking.additional_fees_amount
   │
   ├─ Calculate base amount (reverse calculation):
   │  └─ base = (total - surcharge - fees) / (1 + tax%)
   │
   ├─ Create invoice items:
   │  └─ [{description: "Service Name", quantity: 1, unitPrice: base}]
   │
   ├─ Pass pre-calculated values:
   │  ├─ preTaxPercentage: tax%
   │  ├─ preServiceChargeAmount: amount
   │  └─ preAdditionalFeesAmount: amount
   │
   └─ Invoice total = base + surcharge + tax + service_charge + additional_fees
```

**Prevention of double charge:** Home visit surcharge di-include dalam booking.total_amount sudah, jadi:
- Base amount + home visit surcharge = subtotal
- Invoice dihitung dari breakdown yang sudah disimpan, bukan recalculate dari settings

---

## 📊 DATA MODEL

### Service Table
```typescript
{
  id: string;
  name: string;
  price: number;
  category: string;
  
  // Home Visit Fields
  homeVisitAvailable: boolean;           // Can be offered as home visit
  homeVisitSurcharge?: number;           // Fixed surcharge for home visit
  
  // Location
  images: string[];
  requirements: string[];
}
```

### Booking Table
```typescript
{
  id: string;
  customer_id: string;
  service_id: string;
  scheduled_at: Date;
  duration: number;                       // minutes
  
  // Home Visit Fields
  is_home_visit: boolean;                 // Whether this is a home visit
  home_visit_address?: string;            // Customer's address
  home_visit_coordinates?: {              // Geocoded coordinates
    lat: number;
    lng: number;
  };
  
  // Pricing Breakdown
  total_amount: number;                   // Final amount including all surcharges
  tax_percentage: number;                 // Tax % applied
  service_charge_amount: number;          // Service charge amount
  additional_fees_amount: number;         // Additional fees amount
}
```

### Service Areas Table (Not yet fully used)
```typescript
{
  id: string;
  tenant_id: string;
  name: string;
  coordinates: {lat, lng}[];             // Polygon of service area
  baseSurcharge?: number;                 // Surcharge for outside area
  priority: number;
}
```

### Travel Calculation Cache
```typescript
{
  cacheKey: "travel_calc:{lat1},{lng1}:{lat2},{lng2}";
  value: {
    distance: number;                     // km
    duration: number;                     // minutes
    surcharge: number;                    // Rp
    isWithinServiceArea: boolean;
    route: {lat, lng}[];
  };
  ttl: 3600;                              // 1 hour
}
```

---

## 🎯 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOME VISIT COMPLETE FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Step 1: Admin Setup
├─ Create Service
├─ homeVisitAvailable = true
└─ homeVisitSurcharge = 75.000

Step 2: Customer Booking (Landing Page / Admin)
├─ Select Service (must have homeVisitAvailable = true)
├─ Check "Home Visit Service"
├─ Enter home address
│  └─ AddressInput auto-geocodes → get coordinates
├─ System calculates:
│  ├─ Base: 350.000
│  ├─ Home Visit Surcharge: 75.000 → Subtotal: 425.000
│  ├─ Tax (10%): 42.500
│  ├─ Service Charge (7%): 29.750
│  ├─ Additional Fees: varies
│  └─ TOTAL: ~515.000
└─ Create booking

Step 3: Booking Storage
└─ INSERT into bookings:
   ├─ is_home_visit: true
   ├─ home_visit_address: "Jln..."
   ├─ home_visit_coordinates: {lat, lng}
   ├─ total_amount: 515.000
   └─ tax_percentage: 10, service_charge_amount: 29.750, etc.

Step 4: Optional - Travel Calculation (Admin View)
├─ Admin sees HomeVisitBookingManager
├─ System calls /api/location/calculate-travel
│  └─ Calculate drive time, distance, additional surcharge if needed
├─ Check scheduling conflicts
└─ Optional: Optimize route for multiple home visits

Step 5: Invoice Generation
├─ Extract pre-calculated breakdown from booking
├─ Calculate: base = (515.000 - 75.000 - fees) / 1.10
├─ Create invoice with base amount only
├─ Pass pre-calculated values (tax%, service_charge_amount)
└─ Invoice total = booking.total_amount (same as booking)

Step 6: Payment & Completion
├─ Record payments
├─ Mark booking as completed
└─ Generate final invoice if needed
```

---

## 🛠️ IMPLEMENTATION COMPONENTS

### Frontend Components
```
components/booking/
├─ NewBookingDialog.tsx          → Admin create booking (modal)
├─ BookingDialog.tsx              → Landing page booking
├─ PricingCalculator.tsx          → Calculate pricing with travel surcharge
├─ HomeVisitBookingManager.tsx     → Manage home visits (scheduling, conflicts)
└─ BookingDashboard.tsx           → Main booking management

components/location/
├─ TravelCalculator.tsx           → UI for travel calculations
├─ AddressInput.tsx               → Geocoding autocomplete for addresses
└─ LocationMap.tsx                → Display home visit locations
```

### Backend Services
```
lib/location/
├─ location-service.ts            → Core location operations
│  ├─ validateAddress()           → Geocode and validate addresses
│  ├─ calculateTravel()           → Calculate travel time/distance/surcharge
│  ├─ optimizeRoute()             → Optimize route for multiple bookings
│  ├─ geocodeWithNominatim()      → OpenStreetMap geocoding
│  └─ getRouteWithOSRM()          → OSRM routing

lib/booking/
├─ booking-service.ts            → Create/update bookings with home visit

lib/cache/
├─ cache-service.ts              → Cache travel calculations
```

### APIs
```
/api/location/
├─ calculate-travel               → POST travel calculation
├─ validate-address               → POST address validation
└─ optimize-route                 → POST route optimization

/api/bookings/
├─ [id]/
│  ├─ details/                   → GET booking with related data
│  └─ payments/                  → POST payment records
```

---

## ✨ CURRENT FEATURES

✅ **Implemented:**
- Service configuration (homeVisitAvailable, homeVisitSurcharge)
- Booking creation with home visit option
- Address geocoding (Nominatim/OpenStreetMap)
- Travel calculation (OSRM routing)
- Home visit booking management UI
- Scheduling conflict detection
- Invoice generation with home visit surcharge
- Amount breakdown calculation

⚠️ **Partial/Limited:**
- Service area coverage check (returns default, not database-driven)
- Route optimization (basic nearest-neighbor, not full optimization)
- Google Maps / Mapbox support (not implemented)

❌ **Not Implemented:**
- Real-time location tracking
- Staff assignment for home visits
- Customer notification about arrival time
- Dynamic surcharge based on distance
- Mobile app for field staff

---

## 🔍 POTENTIAL ISSUES & IMPROVEMENTS

### Current Issues:
1. **Travel surcharge not applied automatically**
   - Calculated by HomeVisitBookingManager but manual update needed
   - Should auto-apply when booking is created

2. **Service area check returns default values**
   - Not actually checking against database
   - Surcharge is hardcoded to 0

3. **No staff assignment for home visits**
   - System doesn't track which staff member does the home visit
   - No scheduling for staff availability

4. **Limited geolocation precision**
   - Nominatim can return imprecise results for Indonesia addresses
   - Should validate coordinate accuracy

### Recommended Improvements:
1. Auto-calculate and apply travel surcharge during booking creation
2. Implement proper service area coverage check from database
3. Add staff assignment & availability check for home visits
4. Implement staff tracking/routing
5. Add customer arrival notifications
6. Support multiple routing providers (Google Maps, Mapbox)
7. Add dynamic pricing based on actual distance
8. Implement real-time traffic considerations

---

## 📝 EXAMPLE WORKFLOW

### Scenario: Barber booking home visit

```
Step 1: Admin creates service
├─ Name: Haircut
├─ Price: 350.000
├─ homeVisitAvailable: true
└─ homeVisitSurcharge: 75.000

Step 2: Customer books via landing page
├─ Selects: Haircut service
├─ Checks: Home Visit Service
├─ Enters: "Jln. Sudirman No. 123, Jakarta Selatan"
│  └─ System geocodes to: {lat: -6.2088, lng: 106.8456}
├─ Sees breakdown:
│  ├─ Base: 350.000
│  ├─ Home Visit: 75.000
│  ├─ Tax (10%): 42.500
│  ├─ Service Charge (7%): 29.750
│  └─ Total: 497.250
└─ Creates booking

Step 3: Admin views booking details
├─ Sees booking is home visit
├─ Address: Jln. Sudirman No. 123
├─ Can calculate travel:
│  └─ /api/location/calculate-travel
│     ├─ From: "Jln. ABC (salon location)"
│     └─ To: "Jln. Sudirman No. 123"
│        ├─ Distance: 5.2 km
│        ├─ Duration: 12 minutes
│        └─ Surcharge: 0 (within service area)
└─ Confirms booking

Step 4: Payment collected
├─ Amount: 497.250
└─ Recorded in system

Step 5: Invoice generated
├─ Items: Haircut
├─ Amount: 497.250 (same as booking)
├─ Breakdown shows all surcharges
└─ Sent to customer

Step 6: Service performed
├─ Staff travels to customer location
├─ Provides haircut service
└─ Marks booking as completed
```

---

## 🎓 KEY TAKEAWAYS

1. **Home Visit = Service at Customer's Location**
   - Requires address input and geocoding
   - Has additional surcharge
   - Affects scheduling and routing

2. **Two Surcharge Types:**
   - **Fixed Surcharge** (service.homeVisitSurcharge) - always applied
   - **Distance Surcharge** (from travel calculation) - optional, based on distance

3. **Booking Stores Everything**
   - Breakdown calculated at creation time
   - Stored in booking.total_amount with all surcharges included
   - Invoice generation reuses these values to prevent double charge

4. **Location Services**
   - Geocoding converts address → coordinates
   - Routing calculates travel time and distance
   - Service areas define where surcharge applies

5. **Integration Points**
   - Booking creation (customer side)
   - Booking management (admin side)
   - Travel planning (optional staff management)
   - Invoice generation (automatic)

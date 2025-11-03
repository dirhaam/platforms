# Home Visit - Quick Summary

## 🎯 What is Home Visit?

Service yang ditawarkan ke lokasi customer (rumah/kantor), bukan di lokasi bisnis.

Example:
- Normal haircut: Rp 350.000 (di salon)
- Home visit haircut: Rp 350.000 + Rp 75.000 surcharge (di rumah customer)

---

## 🔄 Flow Diagram (Simple)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ADMIN SETUP PHASE                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Create Service (e.g., "Haircut")                              │
│  ├─ Price: 350.000                                             │
│  ├─ homeVisitAvailable: ✓ (enable checkbox)                    │
│  └─ homeVisitSurcharge: 75.000                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. CUSTOMER BOOKING PHASE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer atau Admin buat booking:                             │
│  ├─ Select Service (Haircut)                                   │
│  ├─ ☑ Check "Home Visit Service"                               │
│  ├─ Input Address: "Jln. Sudirman No. 123"                     │
│  │  └─ Auto-geocode → {lat: -6.20, lng: 106.84}              │
│  └─ System calculate:                                          │
│     ├─ Base: 350.000                                           │
│     ├─ Home Visit Surcharge: 75.000                            │
│     ├─ Tax (10%): 42.500                                       │
│     ├─ Service Charge (7%): 29.750                             │
│     └─ TOTAL: 497.250 ✓                                        │
│                                                                 │
│  CREATE BOOKING with is_home_visit = true                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. OPTIONAL - TRAVEL CALCULATION (Admin Dashboard)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin dapat:                                                  │
│  ├─ Calculate travel time from salon to customer               │
│  │  ├─ From: "Salon address" (stored in tenant)               │
│  │  └─ To: "Jln. Sudirman No. 123" (from booking)             │
│  ├─ Get route info:                                            │
│  │  ├─ Distance: 5.2 km                                        │
│  │  ├─ Duration: 12 minutes                                    │
│  │  └─ Route: [lat, lng coordinates]                          │
│  ├─ Check scheduling conflicts:                               │
│  │  ├─ Enough time between bookings?                          │
│  │  └─ Staff availability?                                    │
│  └─ Optional: Optimize route (if multiple home visits)         │
│                                                                 │
│  APIs used:                                                    │
│  ├─ POST /api/location/calculate-travel                        │
│  └─ POST /api/location/optimize-route                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. INVOICE GENERATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When admin generates invoice from booking:                    │
│  ├─ Extract stored breakdown from booking:                     │
│  │  ├─ total_amount: 497.250                                   │
│  │  ├─ tax_percentage: 10                                      │
│  │  ├─ service_charge_amount: 29.750                           │
│  │  └─ (already includes home visit surcharge)                │
│  ├─ Create invoice with pre-calculated values                  │
│  │  └─ Prevents double charge ✓                               │
│  └─ Invoice total = booking.total_amount (497.250)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. PAYMENT & COMPLETION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ├─ Record payment: 497.250                                    │
│  ├─ Mark booking as completed                                  │
│  └─ Final invoice sent to customer                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Amount Calculation Example

```
BASE SERVICE
  ↓ (Haircut) = Rp 350.000
  
ADD HOME VISIT SURCHARGE
  ↓ (+Rp 75.000 from service config)
  = Rp 425.000 (SUBTOTAL)

ADD TAX (10%)
  ↓ (425.000 × 10%)
  = +Rp 42.500
  
ADD SERVICE CHARGE (7%)
  ↓ (425.000 × 7%)
  = +Rp 29.750

ADD OPTIONAL FEES
  ↓ (varies)
  = +Rp 0

TOTAL AMOUNT = 497.250
```

---

## 🛠️ Key Implementation

### 1. **Service Configuration**
```typescript
// Type: Service
{
  homeVisitAvailable: boolean;      // Can offer home visit
  homeVisitSurcharge?: number;      // Fixed surcharge (e.g., 75.000)
}
```

### 2. **Booking with Home Visit**
```typescript
// Type: Booking
{
  isHomeVisit: boolean;
  homeVisitAddress?: string;        // "Jln. Sudirman No. 123"
  homeVisitCoordinates?: {
    lat: number;                     // -6.2088
    lng: number;                     // 106.8456
  };
  total_amount: number;             // Includes surcharge
}
```

### 3. **Address Geocoding**
```
AddressInput Component
  ↓ User types address
  ↓ Calls: /api/location/validate-address
  ↓ Uses: Nominatim (OpenStreetMap) - FREE
  ↓ Returns: coordinates {lat, lng}
  ↓ Stored in: booking.homeVisitCoordinates
```

### 4. **Travel Calculation (Optional)**
```
HomeVisitBookingManager
  ↓ For each home visit booking:
  ↓ POST /api/location/calculate-travel
  │  ├─ origin: business address (tenant)
  │  └─ destination: booking.homeVisitAddress
  ↓ Uses: OSRM (Open Source Routing Machine) - FREE
  ↓ Returns:
     ├─ distance (km)
     ├─ duration (minutes)
     ├─ surcharge (if outside service area)
     └─ isWithinServiceArea
```

### 5. **Location Services (Backend)**
```
LocationService
  ├─ validateAddress()              → Geocode address to coordinates
  ├─ calculateTravel()              → Get travel time/distance
  ├─ optimizeRoute()                → Reorder multiple bookings
  ├─ getRouteInfo()                 → Use OSRM routing
  └─ checkServiceAreaCoverage()     → Check surcharge zone
```

---

## 📁 Frontend Components

| Component | Purpose | File |
|-----------|---------|------|
| `NewBookingDialog` | Admin creates booking with home visit option | `components/booking/NewBookingDialog.tsx` |
| `BookingDialog` | Landing page booking with home visit | `components/booking/BookingDialog.tsx` |
| `AddressInput` | Geocoding autocomplete for address | `components/location/AddressInput.tsx` |
| `TravelCalculator` | Calculate travel time between locations | `components/location/TravelCalculator.tsx` |
| `HomeVisitBookingManager` | Manage home visit bookings, detect conflicts | `components/booking/HomeVisitBookingManager.tsx` |
| `PricingCalculator` | Calculate final price with travel surcharge | `components/booking/PricingCalculator.tsx` |

---

## 📡 Backend APIs

| Endpoint | Method | Purpose | Uses |
|----------|--------|---------|------|
| `/api/location/validate-address` | POST | Geocode address | Nominatim |
| `/api/location/calculate-travel` | POST | Calculate travel time/distance | OSRM |
| `/api/location/optimize-route` | POST | Optimize route for multiple stops | OSRM |
| `/api/bookings` | POST | Create booking with home visit | BookingService |

---

## 💡 Key Features

✅ **Working:**
- Service can be marked as "home visit available"
- Customers can select home visit during booking
- Address auto-geocoding using OpenStreetMap
- Amount breakdown with home visit surcharge
- Travel calculation (distance, time, route)
- Scheduling conflict detection
- Invoice generation with pre-calculated values

⚠️ **Limited:**
- Service area check (returns default, not data-driven)
- Route optimization (basic nearest-neighbor)

---

## ❓ How Does Payment Work?

1. **Booking Created**: total_amount = 497.250 (includes home visit surcharge)
2. **Invoice Generated**: Uses booking.total_amount directly
3. **Payment Recorded**: Accepts payment for 497.250
4. **Breakdown Shown**:
   - Base: 350.000
   - Home Visit: 75.000
   - Tax + Fees: 72.250
   - **Total: 497.250** ✓

---

## 🚀 Usage Flow

### For Admin:
1. Create service → Enable "Home Visit" + Set surcharge
2. Customer requests home visit
3. Admin sees booking with address
4. Optional: Calculate travel time
5. Generate invoice
6. Collect payment
7. Mark as completed

### For Customer (Landing Page):
1. Select service
2. Check "Home Visit Service"
3. Enter home address
4. See final price breakdown
5. Confirm booking

---

## 🎓 Important Notes

1. **Home Visit Surcharge is FIXED** (per service)
   - Not dynamic based on distance (yet)
   - Configured once during service setup

2. **Distance Surcharge is OPTIONAL**
   - Only if location is outside service area
   - Calculated dynamically during travel calculation

3. **Coordinates Are Geocoded**
   - From address using Nominatim (free service)
   - Used for travel calculation and mapping
   - Cached for 1 hour

4. **Double Charge Prevention**
   - Booking stores final amount with all surcharges
   - Invoice uses stored values, doesn't recalculate
   - Tax and fees apply to: base + home visit surcharge

5. **No Staff Assignment (Yet)**
   - System doesn't track who does the home visit
   - Future feature: assign staff to home visit bookings

---

## 🔍 Files to Review

```
components/
├─ booking/
│  ├─ NewBookingDialog.tsx           → Home visit checkbox + address input
│  ├─ BookingDialog.tsx              → Landing page version
│  ├─ HomeVisitBookingManager.tsx     → Travel calculation & conflicts
│  └─ PricingCalculator.tsx          → Calculate with travel surcharge
└─ location/
   ├─ AddressInput.tsx               → Geocoding input
   ├─ TravelCalculator.tsx           → Travel calculation UI
   └─ LocationMap.tsx                → Display on map

lib/
├─ location/
│  └─ location-service.ts            → Geocoding, routing, calculations
└─ booking/
   └─ booking-service.ts             → Booking creation with home visit

app/api/
├─ location/
│  ├─ calculate-travel/route.ts
│  ├─ validate-address/route.ts
│  └─ optimize-route/route.ts
└─ bookings/
   └─ route.ts                        → Create booking API
```

---

Generated: 2025-11-03
Analysis Scope: Home Visit Feature Complete Flow & Implementation

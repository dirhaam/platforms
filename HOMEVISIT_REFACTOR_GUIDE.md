# Home Visit Booking UI Refactor - Implementation Guide

## 🎯 Overview

Refactored Home Visit booking workflow dari model "calculate on view" menjadi "calculate on booking creation" (seperti Gojek/Grab), dengan UI list yang lebih rapi dan collapsible.

---

## 📋 Changes Made

### 1. **Updated Booking Interface** (`types/booking.ts`)

Added travel/route details fields:
```typescript
// Travel & Route Details (for home visit)
travelDistance?: number;              // Distance in km
travelDuration?: number;              // Duration in minutes
travelRoute?: Array<{ lat: number; lng: number }>; // Route coordinates
```

### 2. **Created TravelEstimateCard Component** (`components/location/TravelEstimateCard.tsx`)

- ✅ Auto-calculates travel when address + origin provided
- ✅ Shows distance, duration, and travel surcharge
- ✅ Displays Gojek-like UI with:
  - Grid layout showing 3 main metrics
  - Status badge (dalam/luar area)
  - "Setuju & Lanjutkan" button to confirm
  - "Hitung Ulang" button to recalculate
- ✅ Callback: `onConfirm()` stores calculation in booking state

### 3. **Updated NewBookingDialog** (`components/booking/NewBookingDialog.tsx`)

**New Features:**
- ✅ Shows `TravelEstimateCard` after address is entered and coordinates filled
- ✅ Auto-triggers travel calculation (no manual click needed)
- ✅ Travel surcharge auto-included in amount breakdown
- ✅ Total amount recalculated with travel surcharge
- ✅ Travel data (distance, duration, surcharge, route) stored in booking state

**Flow:**
```
1. User fills form → selects service, date/time
2. Checks "Home Visit Service" ✓
3. Enters address or selects from suggestions
4. Coordinates auto-filled (from geocoding)
5. TravelEstimateCard APPEARS → auto-calculates ✓
6. Shows: distance, time, surcharge
7. User reviews and clicks "Setuju & Lanjutkan"
8. Form submits with travel data included
```

**Form Enhancement:**
```
Amount Breakdown now shows:
├─ Base Service Amount
├─ Home Visit Surcharge (fixed)
├─ Travel Surcharge (from calculation) ← NEW
├─ Tax
├─ Service Charge
├─ Additional Fees
└─ Total Amount (includes travel)
```

### 4. **Created HomeVisitBookingList Component** (`components/booking/HomeVisitBookingList.tsx`)

**Compact Collapsible List UI:**
- ✅ List items show summary: name, service, status, travel time, surcharge
- ✅ Click to expand → shows full details
- ✅ Collapsed view:
  ```
  │ Customer Name              CONFIRMED │
  │ Service Name                         │
  │ 📅 Date  ⏱️ Travel Time  💰 Surcharge │
  ```
- ✅ Expanded view shows:
  - Full address & coordinates
  - Travel info (distance, duration, surcharge)
  - Amount breakdown
  - Payment status
  - Customer contact info
  - Notes
  - Action buttons (Edit, View Map)

### 5. **Updated HomeVisitBookingManager** (`components/booking/HomeVisitBookingManagerNew.tsx`)

**Now a Display-Only Component:**
- ✅ No more calculation logic (already done at booking creation)
- ✅ Simply loads and displays bookings
- ✅ Uses `HomeVisitBookingList` for collapsible view
- ✅ Shows warning if bookings missing travel data
- ✅ Map view (optional, if coordinates available)
- ✅ Quick stats: total bookings count

---

## 🔄 Data Flow

### **Booking Creation Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│          NEW BOOKING FORM (GOJEK-LIKE EXPERIENCE)               │
└─────────────────────────────────────────────────────────────────┘

Step 1: User fills booking form
        ├─ Customer: Selected
        ├─ Service: Selected
        ├─ Date/Time: Filled
        └─ Amount breakdown calculated

Step 2: User checks "Home Visit Service"
        └─ Show address input field

Step 3: User enters address
        ├─ AddressInput geocodes → get coordinates
        ├─ Coordinates auto-filled
        └─ TravelEstimateCard auto-triggers

Step 4: TravelEstimateCard calculates
        └─ Call: /api/location/calculate-travel
           ├─ origin: businessCoordinates
           ├─ destination: homeVisitAddress
           └─ Response: { distance, duration, surcharge, route }

Step 5: TravelEstimateCard displays result
        ├─ Shows: 5.2 km, 12 min, Rp 51.000
        ├─ User reviews
        └─ Clicks "Setuju & Lanjutkan"

Step 6: Booking state updated
        ├─ travelCalculation stored
        ├─ Amount breakdown recalculated
        ├─ Total amount updated (includes travel)
        └─ Display updated

Step 7: User submits form
        └─ POST /api/bookings
           └─ body includes:
              ├─ customerId, serviceId, scheduledAt
              ├─ isHomeVisit: true
              ├─ homeVisitAddress, homeVisitCoordinates
              ├─ travelDistance: 5.2
              ├─ travelDuration: 12
              ├─ travelRoute: [...coordinates]
              ├─ travelSurchargeAmount: 51000 ← NEW
              └─ notes, paymentMethod, dpAmount

Step 8: API creates booking
        └─ INSERT into bookings with all travel data

┌─────────────────────────────────────────────────────────────────┐
│          HOME VISIT MENU → DISPLAY ONLY (NO CALC)               │
└─────────────────────────────────────────────────────────────────┘

Step 1: Load bookings from database
        └─ travelDistance, travelDuration, travelRoute already stored

Step 2: Display as collapsible list
        ├─ Collapsed: Quick summary
        └─ Expanded: All details including travel info

Step 3: Map view (optional)
        └─ Show all locations on map (using travelRoute)

✓ No more calculations, just display stored data
✓ Much faster and cleaner UI
✓ No HomeVisitBookingManager computing needed
```

---

## 📝 Files Modified/Created

```
✨ NEW FILES:
├─ components/location/TravelEstimateCard.tsx
├─ components/booking/HomeVisitBookingList.tsx
├─ components/booking/HomeVisitBookingManagerNew.tsx
└─ HOMEVISIT_REFACTOR_GUIDE.md (this file)

✏️ MODIFIED FILES:
├─ types/booking.ts
│  └─ Added: travelDistance, travelDuration, travelRoute fields
│
└─ components/booking/NewBookingDialog.tsx
   ├─ Added: TravelEstimateCard import
   ├─ Added: showTravelCalculation, businessCoordinates state
   ├─ Added: TravelEstimateCard in JSX (after address)
   ├─ Updated: handleSubmit to include travel data in POST body
   └─ Updated: amount breakdown to show travel surcharge

⚠️ TO BE UPDATED:
├─ lib/booking/booking-service.ts
│  └─ Accept travelDistance, travelDuration, travelRoute, travelSurchargeAmount
│  └─ Store in database (if not already)
│
└─ app/api/bookings (POST endpoint)
   └─ Handle new travel fields in request body
```

---

## 🚀 Implementation Steps

### Step 1: Database Migration (if needed)

Check if these columns exist in `bookings` table:
- `travel_distance` (DECIMAL)
- `travel_duration` (INTEGER)
- `travel_route` (JSON/TEXT)
- `travel_surcharge_amount` (DECIMAL) - already exists

If missing, create migration:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_distance DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_duration INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_route JSON;
```

### Step 2: Update BookingService (`lib/booking/booking-service.ts`)

```typescript
// In createBooking method, update the INSERT statement:
const bookingData = {
  // ... existing fields ...
  travel_distance: data.travelDistance || null,
  travel_duration: data.travelDuration || null,
  travel_route: data.travelRoute ? JSON.stringify(data.travelRoute) : null,
  travel_surcharge_amount: data.travelSurchargeAmount || 0,
};
```

Also update the mapping function to include new fields:
```typescript
travelDistance: dbData.travel_distance,
travelDuration: dbData.travel_duration,
travelRoute: dbData.travel_route ? JSON.parse(dbData.travel_route) : undefined,
```

### Step 3: Update API Endpoint (`app/api/bookings`)

Accept new fields in request:
```typescript
// Already has travelSurchargeAmount from existing code
// Add these:
const {
  travelDistance,
  travelDuration,
  travelRoute,
  travelSurchargeAmount
} = req.body;

// Pass to BookingService.createBooking()
```

### Step 4: Replace Old HomeVisitBookingManager

In the page/component that uses HomeVisitBookingManager:

```typescript
// OLD:
import { HomeVisitBookingManager } from '@/components/booking/HomeVisitBookingManager';

// NEW:
import { HomeVisitBookingManager } from '@/components/booking/HomeVisitBookingManagerNew';
```

Or just update the import if same location.

### Step 5: Test

1. ✅ Create new booking with home visit
2. ✅ Verify travel calculation triggers after address entry
3. ✅ Verify amount breakdown includes travel surcharge
4. ✅ Verify booking saves with all travel data
5. ✅ Open Home Visit menu → verify list displays correctly
6. ✅ Click to expand → verify all data shows

---

## 🎨 UI Comparison

### BEFORE (Old UI)
```
┌─ Home Visit Booking Manager ──────────┐
│                                       │
│ [Card View - Many cards]              │
│ ┌─────────────────────────────────┐  │
│ │ Customer Name                   │  │
│ │ Service Name • Time • Duration  │  │
│ │ [Calculate Travel Button]       │  │
│ │ ⏳ Calculating...               │  │
│ │ Distance: 5.2 km               │  │
│ │ Time: 12 min                    │  │
│ │ Surcharge: Rp 51.000           │  │
│ │ ⚠️ Scheduling Conflict?         │  │
│ │ [Mini Map]                      │  │
│ └─────────────────────────────────┘  │
│                                       │
│ ┌─ More Cards...                  ┐  │
│ ...                                 ...
```

### AFTER (New UI - Collapsible List)
```
┌─ Home Visit Schedule ──────────────────┐
│ 📍 3 bookings          [3 bookings]    │
├────────────────────────────────────────┤
│                                        │
│ ┌─ Customer Name  CONFIRMED ──────┐   │
│ │ Service Name                     │▼  │
│ │ 📅 Date  ⏱️ 12 min  💰 Rp 51k    │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌─ Another Customer  CONFIRMED ───┐   │
│ │ Service Name                     │▼  │
│ │ 📅 Date  ⏱️ 8 min   💰 Rp 30k    │   │
│ └──────────────────────────────────┘   │
│                                        │
│ [Click to expand...]                   │
│ ┌─────────────────────────────────┐   │
│ │ Expanded Details                │▲  │
│ ├─────────────────────────────────┤   │
│ │ 📍 Full Address                 │   │
│ │    Coordinates: -6.2, 106.8     │   │
│ ├─────────────────────────────────┤   │
│ │ ✈️ Informasi Perjalanan         │   │
│ │ ┌─────┐┌─────┐┌─────────┐      │   │
│ │ │5.2km││12min││Rp 51.000│      │   │
│ │ └─────┘└─────┘└─────────┘      │   │
│ ├─────────────────────────────────┤   │
│ │ 💰 Breakdown Biaya              │   │
│ │ Base: Rp 350.000                │   │
│ │ + Home Visit: Rp 75.000         │   │
│ │ + Travel: Rp 51.000             │   │
│ │ + Tax: Rp 42.600                │   │
│ │ ───────────────────────         │   │
│ │ Total: Rp 518.600               │   │
│ ├─────────────────────────────────┤   │
│ │ 📞 Contact: +62812...           │   │
│ │ [Edit] [View Map]               │   │
│ └─────────────────────────────────┘   │
│                                        │
│ 🗺️ Map View (all locations)            │
│ [Map display here]                     │
└────────────────────────────────────────┘
```

**Benefits:**
- ✅ Cleaner, less cluttered
- ✅ Faster to scan list
- ✅ Details hidden until needed
- ✅ Professional, Gojek-like experience
- ✅ No lag from calculations
- ✅ Better for mobile view

---

## ⚙️ Config/Settings

Travel surcharge configured in:
- **Invoice Settings → Pajak & Biaya tab**
  - Base Travel Surcharge
  - Per Kilometer rate
  - Min/Max distance
  - Required toggle

---

## 📌 Next Steps

1. ✅ Files are ready
2. ⏳ Run database migration (if needed)
3. ⏳ Update BookingService.createBooking()
4. ⏳ Update POST /api/bookings endpoint
5. ⏳ Replace old HomeVisitBookingManager import
6. ⏳ Test complete flow
7. ⏳ Deploy

---

## 🔍 Testing Checklist

- [ ] Create new booking with home visit
- [ ] Address entry triggers auto-calculation
- [ ] TravelEstimateCard displays correctly
- [ ] User can review and confirm travel
- [ ] Amount breakdown includes travel surcharge
- [ ] Booking saves with all travel data
- [ ] Home Visit menu loads bookings
- [ ] List displays with correct summary info
- [ ] Click to expand shows all details
- [ ] Map view works (if enabled)
- [ ] All data persists after page refresh

---

**Status:** ✅ Components Ready | ⏳ API Integration Needed

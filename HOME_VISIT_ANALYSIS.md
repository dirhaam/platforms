# 🏠 Analisis Mendalam: Home Visit Functionality

## Executive Summary

Home Visit feature punya **15+ issues kritis** yang bisa menyebabkan:
- Incorrect surcharge calculation
- Travel cost discrepancies
- Customer confusion & disputes
- Double billing scenarios
- Service area bypass

---

## 1. SURCHARGE CONFUSION - TWO SOURCES OF TRUTH

### Current Implementation

**Source 1: Service-Level Surcharge**
```typescript
// service-service.ts
homeVisitAvailable: boolean;       // Can this service be delivered at home?
homeVisitSurcharge: number | null; // Fixed surcharge for home visit
```

**Source 2: Travel-Based Surcharge**
```typescript
// location-service.ts calculateRoute()
const invoiceSettings = await InvoiceSettingsService.getSettings(tenantId);
const surcharge = this.calculateTravelSurcharge(
  distance,
  invoiceSettings.travelSurcharge // perKmSurcharge, baseTravelSurcharge, etc
);
```

### 🚨 CRITICAL ISSUE #1: Two Competing Surcharge Systems

```typescript
// booking-service.ts createBooking() - What happens?
const basePrice = Number(service.price);

// Travel surcharge calculated from distance
let travelSurcharge = data.travelSurchargeAmount ?? 0;

// But: homeVisitSurcharge from service is NEVER used!
// service.homeVisitSurcharge is fetched but never applied to billing

// Result:
const subtotal = basePrice + travelSurcharge;  // homeVisitSurcharge IGNORED!
// ✗ If service has fixed homeVisitSurcharge of Rp 100,000
// ✗ But travel distance is 0km
// ✗ Customer charged Rp 0 travel surcharge (should be Rp 100,000!)
```

**Real Scenario:**
```
Service: "Consultation"
- price: Rp 500,000
- homeVisitAvailable: true
- homeVisitSurcharge: Rp 150,000 ← THIS IS IGNORED!

Travel Settings:
- baseTravelSurcharge: Rp 25,000
- perKmSurcharge: Rp 5,000

Customer home visit at 0km away:
Expected charge: Rp 500,000 + Rp 150,000 = Rp 650,000
Actual charge: Rp 500,000 + Rp 0 (no travel calculated) = Rp 500,000
Loss: Rp 150,000 per booking!
```

### 🚨 CRITICAL ISSUE #2: Conflicting Surcharge Policies

```typescript
// Which rule should apply?
// Option A: Service homeVisitSurcharge (fixed)
// Option B: Travel distance-based (variable)
// Option C: Whichever is higher?
// Option D: Both?

// Current: Only Option B works, Option A is ghost code
```

---

## 2. SERVICE AVAILABILITY CHECK - MISSING

### Current Code
```typescript
// booking-service.ts createBooking()
const { data: serviceData, error: serviceError } = await supabase
  .from('services')
  .select('*')
  .eq('id', data.serviceId)
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .single();

// ✓ Fetches service data
// ✓ Has homeVisitAvailable field
// ✗ NEVER checks it!

if (data.isHomeVisit && !service.homeVisitAvailable) {
  return { error: 'This service cannot be delivered at home' };
}
// ← THIS CHECK DOESN'T EXIST!
```

**Result:** Users can book home visit for services that don't offer it!

```
Service: "Salon Haircut" - homeVisitAvailable: false
User tries: Book home visit haircut
Current: ✓ Booking created successfully
Should be: ✗ Error: Service doesn't support home visit
```

---

## 3. TRAVEL CALCULATION - TIMING & ACCURACY ISSUES

### Issue #1: Frontend vs Backend Travel Calculation Mismatch

```typescript
// booking-service.ts line ~158
const hasFrontendTravelData = 'travelSurchargeAmount' in data 
                           || 'travelDistance' in data 
                           || 'travelDuration' in data;

if (data.isHomeVisit && data.homeVisitAddress && !hasFrontendTravelData) {
  // Recalculate travel server-side
  const travelCalc = await LocationService.calculateTravel({
    origin: businessLocation,
    destination: data.homeVisitAddress,
    tenantId,
    serviceId: data.serviceId
  });
}

// PROBLEM: Two different calculations possible:
// 1. Frontend calculates at time of booking (user sees price)
// 2. Backend recalculates at confirmation (actual charge)
// → Can differ if distance changed or routing provider updated
```

### Issue #2: OSRM API Timeout Not Handled Gracefully

```typescript
// location-service.ts getRouteWithOSRM()
const url = `https://router.project-osrm.org/route/v1/...`;
const response = await fetch(url);

// If OSRM times out:
// - No explicit timeout
// - Falls back to haversine + buffer
// - Silent failure, user not notified
// - Surcharge might be 0 if error occurs

const catch (error) {
  return {
    distance,
    duration: Math.ceil(distance * 2.4),
    surcharge: 0,  // ← FREE if OSRM fails!
    isWithinServiceArea: false
  };
}
```

**Attack scenario:**
```
Admin could temporarily disable OSRM to get free deliveries ✗
```

### Issue #3: Haversine Distance ≠ Actual Driving Distance

```typescript
// Haversine = straight line
// Example:
// - Haversine: 10km
// - Actual road: 22km (had to go around river/obstacles)
// - Surcharge calculated on 10km (UNDERCHARGED)

// Current: Only OSRM has road-aware calculation
// Fallback: Uses haversine straight-line
```

---

## 4. SERVICE AREA LOGIC - CRITICAL GAPS

### Issue #1: Service Area Doesn't Block Booking, Only Warns

```typescript
// location-service.ts checkServiceAreaCoverage()
return {
  isWithinArea: false,  // ← Says NOT in area
  surcharge: minSurcharge,
  serviceAreaId: undefined
};

// booking-service.ts
const result = await LocationService.calculateTravel(...);
// ✓ Returns isWithinServiceArea: false
// ✗ But booking creation DOESN'T check this!

// Result: Customer outside service area can still book!
```

### Issue #2: Service Area Surcharge vs Travel Surcharge Confusion

```typescript
// Two surcharge sources again:
// 1. service_areas.base_travel_surcharge
// 2. invoice_settings.travelSurcharge

// Logic:
// PRIMARY: Use invoice settings
// FALLBACK: Only service area if no invoice settings

// PROBLEM: What if:
// - Service area has surcharge: Rp 50,000
// - Invoice settings has: perKmSurcharge: Rp 5,000
// - Distance: 5km

// invoice settings applies: 25,000 + (5 × 5,000) = Rp 50,000
// Service area surcharge ignored!

// If intended was "at least Rp 50,000":
// - Need to take max(serviceAreaSurcharge, calculatedSurcharge)
// - Current code doesn't do this
```

### Issue #3: Service Area Polygon Validation - Weak

```typescript
// isPointInPolygon() uses ray-casting
// But:
// - No validation polygon is actually valid GeoJSON
// - No error handling for malformed boundaries
// - Can return false for VALID points if polygon corrupted

private static isPointInPolygon(point: Coordinates, polygon: any): boolean {
  if (!polygon || (!Array.isArray(polygon) && 
      (!polygon.coordinates || !Array.isArray(polygon.coordinates)))) {
    return false;  // ← Silent fail, returns not-in-area
  }
  
  // If admin enters invalid polygon, all deliveries show "outside area"
  // Users get confused about surcharges
}
```

---

## 5. COORDINATES & ADDRESS VALIDATION

### Issue #1: Missing Coordinates Handling

```typescript
// When user books home visit:
if (!data.homeVisitCoordinates) {
  // What happens?
  // Option A: Geocode the address
  // Option B: Use 0,0 (WRONG!)
  // Option C: Reject booking (no, system doesn't)
  
  // Current: Silently accepts, stores NULL coordinates
  // home_visit_coordinates: null
}

// Later: Travel calculation
if (!origin || !destination) {
  throw new Error('Invalid origin or destination coordinates');
}
// ← But destination might be null!
```

**Bug Scenario:**
```
1. User enters address: "Jl. Gatot Subroto No. 12, Jakarta"
2. Frontend doesn't validate/geocode
3. Booking created with coordinates: null
4. System can't calculate actual distance
5. Falls back to Haversine with null
```

### Issue #2: Indonesia-Only Coordinate Validation

```typescript
// isValidIndonesiaCoordinate() is HARDCODED
const MIN_LAT = -11;
const MAX_LAT = 6;
const MIN_LNG = 95;
const MAX_LNG = 141;

// Issues:
// 1. Only works for Indonesia tenants
// 2. International expansion would break
// 3. Even within Indonesia, zones outside this range excluded
//    (e.g., some disputed territories)
```

---

## 6. GEOCODING ISSUES - NOMINATIM SPECIFIC

### Issue #1: Rate Limiting Not Respected

```typescript
// geocodeWithNominatim() makes direct HTTP calls
// Nominatim has strict rate limits:
// - 1 request/second per IP
// - Burst limit: 10 requests/minute

// Current code:
// - No request queuing
// - No rate limit tracking
// - Multiple rapid home visit bookings → all fail with timeout

// Result: Multiple users book home visit simultaneously
// → Geocoding API returns 429 Too Many Requests
// → System falls back to NULL coordinates
// → Surcharge broken
```

### Issue #2: Free Nominatim Service Unreliable

```typescript
// Production using free Nominatim:
// - No SLA
// - Can timeout randomly
// - Results can be inaccurate

// Fallback behavior:
const catch (error) {
  if (errorMessage.includes('timeout')) {
    return {
      isValid: false,
      error: 'Geocoding service request timeout'
    };
  }
}

// What does frontend do on timeout?
// → Booking form shows error
// → User can't complete booking
// → Revenue loss
```

---

## 7. ADDRESS PARSING - FRAGILE

```typescript
// geocodeWithNominatim()
const parsedAddress: Address = {
  street: result.display_name.split(',')[0] || '',  // ← Fragile!
  city: result.address?.city || result.address?.town || '',
  state: result.address?.state || '',
  // ...
};

// Example Nominatim responses vary widely:
// Response 1: "Jl. Gatot Subroto 12, Senayan, Jakarta Selatan, DKI Jakarta, 12950, Indonesia"
// → split(',')[0] = "Jl. Gatot Subroto 12" ✓

// Response 2: "Block A, Komplek Sentosa Utama, Senayan, Jakarta Selatan, ..."
// → split(',')[0] = "Block A" ✗ (misses street name)

// Result: Address display shows incomplete info
```

---

## 8. HOME VISIT + INVOICE GENERATION ISSUE

### Issue: Surcharge Not Shown Clearly on Invoice

```typescript
// Invoice generation (pdf-generator.ts):
const travelSurchargeAmount = invoice.travelSurchargeAmount || 0;

// Problem: 
// - Shows under "Travel Surcharge"
// - But if homeVisitSurcharge was applied instead, label is wrong
// - Customer sees "Travel Surcharge: Rp 0" but charged Rp 150,000
// - Confusion about what they're paying for
```

---

## 9. MULTI-STOP ROUTE OPTIMIZATION - EXPERIMENTAL

```typescript
// nearestNeighborOptimization() uses simple greedy algorithm
// Issues:
// - Not optimal (nearest neighbor is O(n²), doesn't find best route)
// - Only works if all bookings have valid coordinates
// - Fails silently if any geocoding fails
// - No consideration for time windows

// Scenario: 3 home visits
// Actual optimal order: A → C → B (20km total)
// Nearest neighbor gives: A → B → C (25km total)
// Result: Overcharged Rp 25,000
```

---

## 10. RACE CONDITIONS - HOME VISIT SPECIFIC

### Race Condition: Address Deleted After Geocoding

```
Timeline:
T1: User enters address "Jl. Gatot Subroto 12" → geocoded to coords(1,2)
T2: Admin disables service area containing those coords
T3: User submits booking
T4: Booking created with address in now-INVALID area
T5: Service area check fails, customer confused about surcharge
```

### Race Condition: Service Availability Changed

```
T1: User sees service available for home visit
T2: Admin uncheck homeVisitAvailable flag
T3: User submits booking
T4: Booking created for service that shouldn't support home visit
```

---

## 11. MISSING FEATURES

| Feature | Implemented | Impact |
|---------|-------------|--------|
| Validate homeVisitAvailable before booking | ❌ | Can book unavailable services |
| Apply homeVisitSurcharge from service | ❌ | Lost revenue |
| Validate coordinates provided | ❌ | Null coordinates break system |
| Queue geocoding requests (rate limit) | ❌ | API timeouts |
| Confirm service area before billing | ❌ | Charge wrong areas |
| Show surcharge clearly on invoice | ⚠️ Partial | Customer confusion |
| Save travel route polyline | ⚠️ Partial | Can't track driver route |
| Prevent out-of-area bookings | ❌ | Service overflow |
| Multiple stop optimization | ⚠️ Experimental | Suboptimal routing |
| Driver assignment | ❌ | Can't assign to specific driver |
| Driver location tracking | ❌ | Can't verify actual travel |
| Real-time ETA updates | ❌ | No arrival notification |

---

## 12. INVOICE SETTINGS CONNECTION

```typescript
// Home visit doesn't check InvoiceSettingsService for:
// - travelSurchargeRequired boolean
// - maxTravelDistance
// - minTravelDistance for free delivery threshold

// Example:
const settings = await InvoiceSettingsService.getSettings(tenantId);

if (!settings?.travelSurchargeRequired) {
  // Should disable home visit surcharge
  // But system doesn't check this!
}

if (distance > settings?.travelSurcharge?.maxTravelDistance) {
  // Should reject booking
  // But currently just returns surcharge 0
}
```

---

## 📋 RECOMMENDED FIXES (Priority Order)

### P0 - CRITICAL (Revenue/Functionality)

#### 1. Add homeVisitAvailable Check

```typescript
// In booking-service.ts createBooking()
if (!service.homeVisitAvailable && data.isHomeVisit) {
  return { error: 'This service is not available for home visits' };
}
```

#### 2. Apply homeVisitSurcharge Properly

```typescript
// Decide: Fixed surcharge or distance-based?
// Recommendation: Use MAX(homeVisitSurcharge, travelSurcharge)

let homeVisitFee = 0;
if (data.isHomeVisit && service.homeVisitAvailable) {
  // Apply service's fixed home visit surcharge if set
  if (service.homeVisitSurcharge) {
    homeVisitFee = service.homeVisitSurcharge;
  }
}

// Travel surcharge calculated separately
const travelSurcharge = await calculateTravel(...);

// Use the higher value
const totalSurcharge = Math.max(homeVisitFee, travelSurcharge);

// Or if both should apply:
const totalSurcharge = homeVisitFee + travelSurcharge;
```

#### 3. Validate/Geocode Address Before Booking

```typescript
if (data.isHomeVisit && data.homeVisitAddress) {
  // Validate address exists
  const validation = await LocationService.validateAddress({
    tenantId,
    address: data.homeVisitAddress
  });
  
  if (!validation.isValid) {
    return { error: `Invalid address: ${validation.error}` };
  }
  
  // Use validated coordinates
  if (!data.homeVisitCoordinates && validation.address?.coordinates) {
    data.homeVisitCoordinates = validation.address.coordinates;
  }
}
```

#### 4. Check Service Area Coverage & Block if Outside

```typescript
if (data.isHomeVisit && data.homeVisitCoordinates) {
  const areaCheck = await LocationService.checkServiceAreaCoverage(
    data.homeVisitCoordinates,
    tenantId,
    data.serviceId
  );
  
  if (!areaCheck.isWithinArea && !allowOutsideServiceArea) {
    return { error: 'Delivery location is outside our service area' };
  }
}
```

### P1 - HIGH (Data Integrity)

#### 5. Implement Surcharge Priority Logic

```typescript
// Decide on single source of truth
// Option A: Service surcharge (fixed)
// Option B: Travel surcharge (variable)
// Option C: Max of both
// Option D: Sum of both

// Recommendation: Configurable per tenant
const surchargeMode = settings?.homeVisitSurchargeMode; 
// 'fixed' | 'distance' | 'max' | 'sum'

switch (surchargeMode) {
  case 'fixed':
    surcharge = service.homeVisitSurcharge || 0;
    break;
  case 'distance':
    surcharge = travelSurcharge;
    break;
  case 'max':
    surcharge = Math.max(service.homeVisitSurcharge || 0, travelSurcharge);
    break;
  case 'sum':
    surcharge = (service.homeVisitSurcharge || 0) + travelSurcharge;
    break;
}
```

#### 6. Add Geocoding Rate Limiting

```typescript
// Use queue-based geocoding
class GeocodingQueue {
  private queue: Request[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private MIN_DELAY_MS = 1100; // Nominatim: 1 req/sec
  
  async geocode(address: string) {
    return new Promise((resolve) => {
      this.queue.push({ address, resolve });
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.MIN_DELAY_MS) {
        await new Promise(r => setTimeout(r, this.MIN_DELAY_MS - timeSinceLastRequest));
      }
      
      const request = this.queue.shift();
      const result = await LocationService.geocodeAddress(request.address);
      request.resolve(result);
      this.lastRequestTime = Date.now();
    }
    this.processing = false;
  }
}
```

#### 7. Improve OSRM Error Handling

```typescript
const getRouteWithOSRM = async (origin, destination) => {
  try {
    const url = `...`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5sec timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (response.status === 503) {
      // Service unavailable - use cached or fallback pricing
      return {
        distance: calculateHaversineDistance(origin, destination),
        duration: null,
        error: 'OSRM unavailable, using straight-line distance',
        usedFallback: true
      };
    }
    
    // Process response...
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        error: 'Route calculation timeout',
        usedFallback: true
      };
    }
    throw error;
  }
};

// In booking creation:
const routeInfo = await getRouteWithOSRM(...);
if (routeInfo.usedFallback) {
  console.warn('Using fallback calculation, actual cost may differ');
  // Apply minimum surcharge or get approval
}
```

#### 8. Add Address Validation Display

```typescript
// Show parsed address to user for confirmation
const validation = await LocationService.validateAddress(...);

// UI should show:
// Full Address: {validation.address.fullAddress}
// Confidence: {validation.confidence}%
// Suggestions: {validation.suggestions.map(...)}

// Require user to confirm before proceeding
```

### P2 - MEDIUM (Features)

#### 9. Save Route Polyline

```typescript
// When calculating travel, save the route
const routeInfo = await getRouteWithOSRM(origin, destination);

// Store in booking:
booking_data = {
  // ... existing fields
  travel_route_polyline: JSON.stringify(routeInfo.route), // GeoJSON format
  travel_distance_actual: routeInfo.distance,
  travel_duration_estimated: routeInfo.duration
};
```

#### 10. Add Driver Assignment

```typescript
// New table: booking_drivers
{
  id,
  bookingId,
  driverId,
  assignedAt,
  status: 'pending' | 'accepted' | 'en_route' | 'arrived' | 'completed'
}

// When home visit booking created:
if (data.isHomeVisit) {
  // Find available driver
  const driver = await findAvailableDriver(tenantId, scheduledAt);
  await assignDriver(bookingId, driver.id);
}
```

---

## 🧪 TEST SCENARIOS

```typescript
describe('Home Visit', () => {
  describe('Surcharge Calculation', () => {
    test('Should apply homeVisitSurcharge when service available');
    test('Should use travel surcharge if calculated');
    test('Should take max of both surcharges');
    test('Should not charge surcharge if service not available');
    test('Should handle 0km distance correctly');
  });
  
  describe('Validation', () => {
    test('Should reject booking if homeVisitAvailable=false');
    test('Should reject booking outside service area');
    test('Should require valid address for geocoding');
    test('Should timeout gracefully if geocoding fails');
  });
  
  describe('Invoice', () => {
    test('Should show surcharge breakdown clearly');
    test('Should label surcharge correctly (home visit vs travel)');
    test('Should match invoice to actual charged amount');
  });
  
  describe('Concurrency', () => {
    test('Should not allow booking if service disabled after check');
    test('Should use fresh geocoding if address changed');
    test('Should recalculate service area if boundaries changed');
  });
});
```

---

## 📊 IMPACT ASSESSMENT

| Issue | Severity | Financial Impact | Users Affected |
|-------|----------|------------------|---|
| homeVisitSurcharge ignored | 🔴 HIGH | -Rp 150k per booking | All home visits |
| homeVisitAvailable not checked | 🔴 HIGH | Wrong service delivered | Services w/ restrictions |
| Null coordinates crash | 🔴 CRITICAL | System error | Poor geocoding areas |
| Geocoding timeouts | 🟠 MEDIUM | Booking failures | High-volume periods |
| Service area not enforced | 🟠 MEDIUM | Wrong surcharge applied | Border areas |
| Duplicate surcharges | 🟡 LOW | Occasional overbilling | Edge cases |
| Suboptimal routing | 🟡 LOW | Inefficient delivery | Multi-stop routes |

---

## 🎯 RECOMMENDATION

**Immediate actions (Sprint 1):**
1. ✅ Add homeVisitAvailable validation
2. ✅ Apply homeVisitSurcharge logic
3. ✅ Validate coordinates exist before booking
4. ✅ Check service area before charging

**Short term (Sprint 2):**
5. ✅ Implement surcharge priority logic
6. ✅ Add geocoding rate limiting
7. ✅ Improve OSRM error handling
8. ✅ Show address confirmation

**Medium term (Sprint 3+):**
9. ✅ Add driver assignment
10. ✅ Implement route optimization
11. ✅ Add real-time tracking

---

**Next steps:**
1. Create GitHub issues for each P0 item
2. Add test cases before implementing fixes
3. Deploy P0 fixes to production ASAP
4. Review all home visit invoices for discrepancies
5. Schedule P1 items for next sprint

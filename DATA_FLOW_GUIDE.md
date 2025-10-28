# Data Flow Guide: Landing Page Booking → Summary Tab

## Overview

Dokumentasi ini menjelaskan bagaimana data booking yang dibuat di landing page mengalir ke Summary tab di Unified Booking Panel.

---

## Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ LANDING PAGE - Booking Creation                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. Customer mengisi form booking:                               │
│    ✅ Nama Customer (atau select existing)                       │
│    ✅ Pilih Service                                              │
│    ✅ Pilih Tanggal & Jam                                        │
│    ✅ Pilih Home Visit (optional)                                │
│    ✅ Tambah Notes (optional)                                    │
│                                                                  │
│ 2. Click "Confirm Booking"                                      │
│    → POST /api/bookings                                          │
│    → Body: customerId, serviceId, scheduledAt, etc.             │
│                                                                  │
│ 3. Database INSERT                                              │
│    → bookings table: id, booking_number, customer_id,           │
│                      service_id, scheduled_at, total_amount     │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ API: GET /api/bookings                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ BookingDashboard.fetchBookings() calls:                         │
│                                                                  │
│ Promise.all([                                                   │
│   ✅ GET /api/bookings?tenantId=xxx (return: id, customerId,  │
│                                               serviceId, etc)   │
│   ✅ GET /api/customers?tenantId=xxx (return: id, name, phone) │
│   ✅ GET /api/services?tenantId=xxx (return: id, name, price)  │
│ ])                                                              │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ DATA ENRICHMENT - BookingDashboard                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ // Create lookup maps                                           │
│ const customerMap = Map {                                       │
│   'cust-001' → { id, name: 'Ahmad', phone: '081...' },        │
│   'cust-002' → { id, name: 'Siti', phone: '082...' }          │
│ }                                                               │
│                                                                  │
│ const serviceMap = Map {                                        │
│   'svc-001' → { id, name: 'Massage', price: 500000 },         │
│   'svc-002' → { id, name: 'Spa', price: 750000 }              │
│ }                                                               │
│                                                                  │
│ // Enrich each booking                                          │
│ enrichedBookings = bookings.map(booking => ({                  │
│   ...booking,                                                   │
│   customer: customerMap.get(booking.customerId),               │
│   service: serviceMap.get(booking.serviceId)                   │
│ }))                                                             │
│                                                                  │
│ Result:                                                         │
│ ✅ booking.customer = { id, name: 'Ahmad', phone, ... }        │
│ ✅ booking.service = { id, name: 'Massage', price, ... }       │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ BOOKING DASHBOARD - Display in List                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Enriched bookings shown in:                                     │
│ • Calendar view (with customer name, time)                      │
│ • List view (table with customer, service, amount)              │
│                                                                  │
│ Each booking card displays:                                     │
│ ✅ booking.customer?.name  → 'Ahmad Saputra'                    │
│ ✅ booking.service?.name   → 'Massage'                          │
│ ✅ booking.scheduledAt     → '2025-10-28, 14:00'               │
│ ✅ booking.totalAmount     → 'Rp 550,000'                      │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ UNIFIED BOOKING PANEL - Summary Tab                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ When user clicks booking → opens drawer with UnifiedBookingPanel│
│                                                                  │
│ Panel receives:                                                 │
│ ✅ booking.customer (enriched object)                           │
│ ✅ booking.service (enriched object)                            │
│                                                                  │
│ Summary Tab displays:                                           │
│ ╔════════════════════════════════════════════════════════════╗ │
│ ║ BK-001 | Ahmad Saputra • Massage                          ║ │
│ ║ 2025-10-28 14:00 | Rp 550,000                            ║ │
│ ║ 🔴 Next Action: Confirm Booking                          ║ │
│ ╠════════════════════════════════════════════════════════════╣ │
│ ║ Customer      Ahmad Saputra ✓                            ║ │
│ ║ Phone         0812xxxxxxx ✓                              ║ │
│ ║ Service       Massage ✓                                  ║ │
│ ║ Duration      60 minutes ✓                               ║ │
│ ║ Amount        Rp 550,000 ✓                               ║ │
│ ║ Status        ⬤ PENDING                                  ║ │
│ ║ Location      Home Visit - Jl. Merdeka No.10            ║ │
│ ║ Notes         Please bring oil                           ║ │
│ ╚════════════════════════════════════════════════════════════╝ │
│                                                                  │
│ All data dari landing page sudah visible! ✅                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Data Flow

### Step 1: Landing Page Form Submission
```typescript
// User fills: Customer (Ahmad), Service (Massage), Date (Oct 28 14:00)
// User clicks: Confirm Booking

fetch('/api/bookings', {
  method: 'POST',
  body: {
    customerId: 'cust-001',     // Customer yang dipilih
    serviceId: 'svc-001',        // Service yang dipilih
    scheduledAt: '2025-10-28T14:00:00',
    isHomeVisit: true,
    homeVisitAddress: 'Jl. Merdeka No.10',
    notes: 'Please bring oil'
  }
})
```

### Step 2: BookingService.createBooking()
```typescript
// Backend validates & creates booking
INSERT INTO bookings (
  id, tenant_id, customer_id, service_id,
  scheduled_at, duration, total_amount,
  status, is_home_visit, home_visit_address, notes
)
VALUES (
  'booking-001', 'tenant-001', 'cust-001', 'svc-001',
  '2025-10-28T14:00:00', 60, 550000,
  'pending', true, 'Jl. Merdeka No.10', 'Please bring oil'
)
```

### Step 3: BookingDashboard.fetchBookings()
```typescript
// ✅ Fetch bookings
GET /api/bookings?tenantId=tenant-001
Response: [
  {
    id: 'booking-001',
    bookingNumber: 'BK-001',
    customerId: 'cust-001',    // ← Only ID, no details
    serviceId: 'svc-001',      // ← Only ID, no details
    scheduledAt: '2025-10-28T14:00:00',
    totalAmount: 550000,
    status: 'pending'
  }
]

// ✅ Fetch customers in parallel
GET /api/customers?tenantId=tenant-001
Response: [
  { id: 'cust-001', name: 'Ahmad Saputra', phone: '0812xxxxxxx', ... },
  { id: 'cust-002', name: 'Siti Nurhaliza', phone: '0813xxxxxxx', ... }
]

// ✅ Fetch services in parallel
GET /api/services?tenantId=tenant-001
Response: [
  { id: 'svc-001', name: 'Massage', price: 500000, duration: 60, ... },
  { id: 'svc-002', name: 'Spa', price: 750000, duration: 90, ... }
]
```

### Step 4: Data Enrichment
```typescript
// Create lookup maps
const customerMap = new Map([
  ['cust-001', { id: 'cust-001', name: 'Ahmad Saputra', ... }],
  ['cust-002', { id: 'cust-002', name: 'Siti Nurhaliza', ... }]
]);

const serviceMap = new Map([
  ['svc-001', { id: 'svc-001', name: 'Massage', price: 500000, ... }],
  ['svc-002', { id: 'svc-002', name: 'Spa', price: 750000, ... }]
]);

// Enrich bookings
const enrichedBookings = bookings.map(booking => ({
  ...booking,
  customer: customerMap.get(booking.customerId),  // ✅ Add customer object
  service: serviceMap.get(booking.serviceId)      // ✅ Add service object
}));

// Result:
// {
//   id: 'booking-001',
//   bookingNumber: 'BK-001',
//   customerId: 'cust-001',
//   serviceId: 'svc-001',
//   customer: { id: 'cust-001', name: 'Ahmad Saputra', phone: '0812...', ... },
//   service: { id: 'svc-001', name: 'Massage', price: 500000, duration: 60, ... },
//   ...
// }
```

### Step 5: Booking Dashboard Display
```typescript
// List shows enriched data
│ BK-001  │ Ahmad Saputra  │ Massage  │ 2025-10-28 14:00 │ PENDING │ Paid? │ Rp550k
│ (number)│ (from customer)│ (from svc)│ (from booking)   │ (status)│ (pay) │ (total)
```

### Step 6: Click Booking → Opens Unified Panel
```typescript
// User clicks booking in list
handleBookingClick(enrichedBooking)

// Opens drawer with UnifiedBookingPanel
<BookingDetailsDrawer
  booking={enrichedBooking}  // ✅ Already has customer & service
  tenantId={tenantId}
  onOpenChange={setOpen}
/>
```

### Step 7: UnifiedBookingPanel Summary Tab
```typescript
// Summary tab renders with data:
<p>{booking.customer?.name}</p>      // ✅ Ahmad Saputra
<p>{booking.service?.name}</p>       // ✅ Massage
<p>{booking.totalAmount}</p>         // ✅ 550000
<p>{booking.service?.duration}</p>   // ✅ 60 minutes

// All data visible! ✅✅✅
```

---

## Code Points Reference

### 1. BookingDashboard - Fetch & Enrich
**File:** `components/booking/BookingDashboard.tsx`

```typescript
const fetchBookings = async () => {
  // Line 68-100: Parallel fetch bookings, customers, services
  // Line 101: Create enriched bookings with customer & service objects
  
  const enrichedBookings = (bookingsData.bookings || []).map((booking: any) => ({
    ...booking,
    customer: customerMap.get(booking.customerId),  // ← Key line
    service: serviceMap.get(booking.serviceId)      // ← Key line
  }));
  
  setBookings(enrichedBookings);
}
```

### 2. UnifiedBookingPanel - Display
**File:** `components/booking/UnifiedBookingPanel.tsx`

```typescript
// Header (Line 255)
<p className="text-sm text-gray-600 mt-1">
  {booking.customer?.name} • {booking.service?.name}
</p>

// Summary Tab (Line 320-330)
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label className="text-gray-600">Customer</Label>
    <p className="font-medium">{booking.customer?.name}</p>
  </div>
  <div>
    <Label className="text-gray-600">Phone</Label>
    <p className="font-medium">{booking.customer?.phone}</p>
  </div>
  <div>
    <Label className="text-gray-600">Service</Label>
    <p className="font-medium">{booking.service?.name}</p>
  </div>
  <div>
    <Label className="text-gray-600">Duration</Label>
    <p className="font-medium">{booking.service?.duration} minutes</p>
  </div>
</div>
```

---

## Data Integrity Checks

### ✅ Bagaimana data tidak hilang?

1. **Landing Page → Database**
   - ✅ Customer ID simpan di booking.customer_id
   - ✅ Service ID simpan di booking.service_id

2. **Database → API Response**
   - ✅ API return booking dengan customerId & serviceId
   - ✅ API return customers dengan id & name
   - ✅ API return services dengan id & name

3. **API Response → BookingDashboard**
   - ✅ Map customers & services by ID
   - ✅ Attach customer & service objects ke booking
   - ✅ setBookings() state dengan enriched data

4. **BookingDashboard → UnifiedBookingPanel**
   - ✅ Pass enriched booking (with customer & service)
   - ✅ Panel render data dari booking.customer & booking.service
   - ✅ All visible in Summary tab ✅

---

## Safety Fallback

### Jika data tidak terenrich (backup):

```typescript
// UnifiedBookingPanel.fetchRelatedData() - Line 68-92
if (!booking.customer || !booking.service) {
  // Try to fetch individually
  const customerRes = await fetch(`/api/customers/${booking.customerId}`)
  const serviceRes = await fetch(`/api/services/${booking.serviceId}`)
  // Can display data if needed
}
```

---

## Performance Considerations

### Parallel Loading
```typescript
// All 3 requests sent simultaneously (faster!)
const [bookingsRes, customersRes, servicesRes] = await Promise.all([...])

// Instead of:
// const bookingsRes = await fetch(...) // wait
// const customersRes = await fetch(...) // wait
// const servicesRes = await fetch(...)  // wait
```

### Lookup Maps (O(1) access)
```typescript
// Fast lookup by ID:
const customerMap = new Map(...)
const service = serviceMap.get(serviceId)  // ← O(1) instead of O(n)
```

---

## Testing Checklist

- [ ] Create booking from landing page with customer
- [ ] Navigate to Bookings menu
- [ ] Verify booking shows in list with customer name & service name
- [ ] Click booking → drawer opens
- [ ] Check Summary tab shows all customer data
- [ ] Check Summary tab shows all service data
- [ ] Verify phone, email, notes display correctly
- [ ] Test with multiple bookings
- [ ] Test with different customers
- [ ] Verify data persistence after page refresh

---

## Common Issues & Solutions

**Issue: Summary tab menunjukkan "undefined" untuk customer/service**

Solution: 
1. Check if BookingDashboard enrichment working
2. Look at browser console for errors
3. Verify API responses have customer & service data
4. Check if IDs match in booking

**Issue: Slow loading when opening panel**

Solution:
1. Parallel fetch sudah implemented
2. May need React Query for caching
3. Consider lazy-loading related data (sales, invoices)

**Issue: Data tidak update setelah booking dibuat**

Solution:
1. Call fetchBookings() after POST /api/bookings
2. Verify response includes enriched data
3. Check if setBookings() being called

---

## Next Steps

1. ✅ Enrich booking data with customer & service
2. ✅ Pass enriched booking to UnifiedBookingPanel
3. ✅ Display in Summary tab
4. [ ] **Next:** Test end-to-end flow locally
5. [ ] **Then:** Integrate into admin bookings page
6. [ ] **Finally:** Deploy to production


# New Booking Creation Workflow

## 🎯 Overview

Complete flow dari user click "New Booking" sampai booking tersimpan di database.

---

## 📊 WORKFLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS "New Booking"
   └─> Link: /tenant/admin/bookings/new?subdomain=test-demo
       └─> Open BookingNewPage component

2. PAGE LOADS
   └─> useEffect triggers fetchData()
       ├─> GET /api/customers (with x-tenant-id header)
       └─> GET /api/services (with x-tenant-id header)
           └─> Both APIs resolve subdomain → tenant UUID
               ├─> Load all customers
               └─> Load all services

3. USER FILLS FORM
   ├─> Select Customer (dropdown)
   ├─> Select Service (dropdown)
   ├─> Pick Date (date picker)
   ├─> Pick Time (time picker)
   └─> Optional: Add notes (textarea)

4. USER SUBMITS FORM
   └─> onClick="handleSubmit"
       └─> Validation:
           ├─ customerId NOT empty? ✓
           ├─ serviceId NOT empty? ✓
           ├─ scheduledAt NOT empty? ✓
           └─ scheduledTime NOT empty? ✓

5. COMBINE DATE + TIME
   └─> "2025-01-21" + "14:30" → "2025-01-21T14:30:00Z" (ISO string)

6. POST TO /api/bookings
   ├─ Method: POST
   ├─ URL: /api/bookings
   ├─ Headers:
   │  ├─ Content-Type: application/json
   │  └─ x-tenant-id: test-demo
   └─ Body:
      {
        "customerId": "uuid-123",
        "serviceId": "uuid-456",
        "scheduledAt": "2025-01-21T14:30:00Z",
        "notes": "Customer prefers morning..."
      }
```

---

## 🔄 BACKEND PROCESSING (POST /api/bookings)

```
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API PROCESSING                         │
└─────────────────────────────────────────────────────────────────┘

1. RECEIVE REQUEST
   └─> Extract headers + body
       ├─ x-tenant-id: "test-demo" (subdomain)
       └─ body: { customerId, serviceId, scheduledAt, notes }

2. VALIDATE TENANT ID
   ├─ Is tenantId provided? (required)
   └─ If NO → Response 400: "Tenant ID required"

3. RESOLVE TENANT ID (subdomain → UUID)
   ├─ Check length: "test-demo" = 9 chars (not 36 chars)
   │  → It's a subdomain, NOT a UUID
   │
   ├─ Query Supabase:
   │  SELECT id FROM tenants WHERE subdomain = 'test-demo'
   │
   ├─ Get result: { id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
   │
   └─ If tenant NOT found → Response 404: "Tenant not found"

4. PARSE REQUEST BODY
   └─> JSON.parse(body)

5. VALIDATE BOOKING DATA
   └─> Run createBookingSchema.safeParse(body)
       Checks:
       ├─ customerId: string, min 1 char ✓
       ├─ serviceId: string, min 1 char ✓
       ├─ scheduledAt: valid ISO datetime ✓
       ├─ isHomeVisit: optional boolean
       ├─ homeVisitAddress: required IF isHomeVisit=true
       ├─ notes: optional string
       │
       └─ If validation FAILS → Response 400 + error details

6. HOME VISIT VALIDATION (if applicable)
   ├─ If isHomeVisit=true AND homeVisitAddress empty?
   │  └─> Response 400: "Home visit address required"
   └─ Otherwise PASS

7. CALL BookingService.createBooking()
   └─> Create booking di Supabase
       └─> INSERT INTO bookings WITH:
           {
             id: "new-uuid",
             tenant_id: "resolved-uuid",
             customer_id: "customer-uuid",
             service_id: "service-uuid",
             scheduled_at: "2025-01-21T14:30:00Z",
             status: "pending",
             payment_status: "pending",
             duration: [dari service],
             total_amount: [dari service],
             notes: "...",
             created_at: now(),
             updated_at: now()
           }

8. RETURN RESPONSE
   ├─ Status: 201 (Created)
   └─ Body:
      {
        "booking": {
          "id": "booking-uuid",
          "customerId": "customer-uuid",
          "serviceId": "service-uuid",
          "scheduledAt": "2025-01-21T14:30:00Z",
          "status": "pending",
          "paymentStatus": "pending",
          ...
        }
      }
```

---

## 💾 DATABASE CHANGES

### Table: `bookings`

**INSERT Operation:**

```sql
INSERT INTO bookings (
  id,
  tenant_id,
  customer_id,
  service_id,
  scheduled_at,
  status,
  payment_status,
  duration,
  total_amount,
  notes,
  home_visit_address,
  home_visit_coordinates,
  is_home_visit,
  created_at,
  updated_at
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- new UUID
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- tenant UUID
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- customer UUID
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- service UUID
  '2025-01-21T14:30:00Z',                   -- scheduled time
  'pending',                                 -- status
  'pending',                                 -- payment status
  60,                                        -- duration (from service)
  5000,                                      -- price (from service)
  'Customer notes...',                       -- notes
  NULL,                                      -- home visit address
  NULL,                                      -- coordinates
  false,                                     -- is home visit
  NOW(),                                     -- created_at
  NOW()                                      -- updated_at
);
```

**RESULT:**
- ✅ New row created in `bookings` table
- ✅ Linked to tenant, customer, and service
- ✅ Status = "pending" (needs confirmation)
- ✅ Payment status = "pending" (not paid yet)

---

## 🔙 FRONTEND RESPONSE HANDLING

```
After POST /api/bookings returns:

├─ IF Status 201 (Success)
│  ├─ Response received with booking object
│  ├─ router.push() redirect:
│  │  → /tenant/admin/bookings?subdomain=test-demo
│  │
│  └─ User sees updated bookings list with new booking

├─ IF Status 400 (Bad Request)
│  ├─ Parse error response
│  ├─ Display error in form:
│  │  "Failed to create booking: [error message]"
│  │
│  └─ User can fix and retry

├─ IF Status 404 (Not Found)
│  ├─ Tenant not found
│  ├─ Display error: "Tenant not found"
│  │
│  └─ Likely auth issue

└─ IF Status 500 (Server Error)
   ├─ Server error occurred
   ├─ Display error: "An error occurred"
   │
   └─ Check server logs
```

---

## ✅ VALIDATION STEPS

### Frontend Validation (Form Level)

```javascript
// In BookingNewPage handleSubmit()

1. customerId NOT empty?
   if (!booking.customerId) → Error: "Please fill in all required fields"

2. serviceId NOT empty?
   if (!booking.serviceId) → Error: "Please fill in all required fields"

3. scheduledAt NOT empty?
   if (!booking.scheduledAt) → Error: "Please fill in all required fields"

4. scheduledTime NOT empty?
   if (!booking.scheduledTime) → Error: "Please fill in all required fields"

5. If ANY missing → Stop, show error, don't send to API
```

### Backend Validation (API Level)

```javascript
// In POST /api/bookings

1. tenantId required?
   if (!tenantIdentifier) → 400: "Tenant ID required"

2. Tenant exists?
   if (!tenant) → 404: "Tenant not found"

3. Body schema valid?
   if (!validation.success) → 400: "Validation failed" + details

4. Home visit validation?
   if (isHomeVisit && !homeVisitAddress) → 400: "Home visit address required"

5. Database insert success?
   if (result.error) → 400: Error message
```

---

## 🔗 DATA RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────┐
│                   DATA RELATIONSHIPS                          │
└──────────────────────────────────────────────────────────────┘

BOOKINGS Table
│
├─ Foreign Key: tenant_id → TENANTS.id
│  └─ Links booking to tenant (test-demo)
│
├─ Foreign Key: customer_id → CUSTOMERS.id
│  └─ Links booking to customer (John Doe)
│     └─ Contains: name, phone, email, address
│
└─ Foreign Key: service_id → SERVICES.id
   └─ Links booking to service (Haircut)
      └─ Contains: name, duration, price, description

Example:

BOOKING (new)
├─ ID: booking-123
├─ Tenant: test-demo (uuid-001)
├─ Customer: John Doe (uuid-002)
│  ├─ Phone: +92 300 1234567
│  └─ Email: john@example.com
│
├─ Service: Haircut (uuid-003)
│  ├─ Duration: 30 minutes
│  ├─ Price: 500 PKR
│  └─ Description: Professional haircut service
│
├─ Scheduled: 2025-01-21 14:30
├─ Status: pending (awaiting confirmation)
└─ Payment: pending (awaiting payment)
```

---

## 📋 FORM FIELDS EXPLANATION

| Field | Type | Required | Example | Purpose |
|-------|------|----------|---------|---------|
| **Customer** | Select | YES | John Doe | Who is this booking for? |
| **Service** | Select | YES | Haircut | What service? |
| **Date** | Date | YES | 2025-01-21 | What day? |
| **Time** | Time | YES | 14:30 | What time? |
| **Notes** | Text | NO | VIP customer | Special instructions |

---

## 🎯 COMPLETE REQUEST/RESPONSE EXAMPLE

### REQUEST

```http
POST /api/bookings HTTP/1.1
Host: test-demo.booqing.my.id
Content-Type: application/json
x-tenant-id: test-demo

{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "serviceId": "550e8400-e29b-41d4-a716-446655440001",
  "scheduledAt": "2025-01-21T14:30:00Z",
  "notes": "Customer prefers morning slots"
}
```

### RESPONSE (201 Created)

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "booking": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "tenantId": "550e8400-e29b-41d4-a716-446655440099",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "serviceId": "550e8400-e29b-41d4-a716-446655440001",
    "scheduledAt": "2025-01-21T14:30:00Z",
    "status": "pending",
    "paymentStatus": "pending",
    "duration": 30,
    "totalAmount": 500,
    "notes": "Customer prefers morning slots",
    "isHomeVisit": false,
    "createdAt": "2025-01-21T09:15:00Z",
    "updatedAt": "2025-01-21T09:15:00Z"
  }
}
```

---

## ⚡ KEY POINTS

✅ **Before Creation:**
- Subdomain converted to tenant UUID
- All data validated
- Customer & service must exist

✅ **During Creation:**
- New booking gets UUID
- Status set to "pending" (not confirmed yet)
- Payment status set to "pending" (unpaid)
- Timestamps auto-generated

✅ **After Creation:**
- User redirected to bookings list
- New booking visible in list
- Can be updated/confirmed later
- Payment not processed yet

---

## 🔄 STATE CHANGES

```
BOOKING LIFECYCLE:

Created (pending) 
  ↓
  ├─→ Owner confirms? → Status: confirmed
  │    ├─→ Customer pays? → Payment: paid
  │    │    └─→ Service completed? → Status: completed
  │    │         └─→ Customer requests refund? → Payment: refunded
  │    │
  │    └─→ Payment timeout? → Status: cancelled
  │
  └─→ Owner cancels? → Status: cancelled
```

**First Booking Status:**
- Status: **pending** ⏳ (waiting for confirmation)
- Payment: **pending** ⏳ (waiting for payment)

---

## 🛠️ FILES INVOLVED

| File | Purpose |
|------|---------|
| `app/tenant/admin/bookings/new/page.tsx` | UI Form to input booking details |
| `app/api/bookings/route.ts` | POST endpoint to create booking |
| `lib/booking/booking-service.ts` | Business logic for booking creation |
| `lib/validation/booking-validation.ts` | Schema validation |
| Database: `bookings` table | Store booking data |


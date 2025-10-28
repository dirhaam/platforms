# 📋 WORKFLOW DOCUMENTATION: Booking → Sales → Invoice

Dokumentasi lengkap workflow dari customer booking via landing page hingga invoice dikirim ke customer.

---

## 🔄 OVERVIEW WORKFLOW

```
Landing Page (Booking Dialog)
        ↓
   Customer Books Service
        ↓
   Menu Booking (Admin Management)
        ↓
   Confirm/Update Booking Status
        ↓
   Menu Sales (Transaction Management)
        ↓
   Record On-The-Spot Sale OR Create Sale from Booking
        ↓
   Menu Invoice (Invoice Management)
        ↓
   Create Invoice, Send via WhatsApp, Print PDF
```

---

## 1️⃣ LANDING PAGE - CUSTOMER BOOKING FLOW

### File: `app/s/[subdomain]/page.tsx` + `components/booking/BookingDialog.tsx`
**Purpose:** Public landing page untuk customer yang ingin booking service

### Step 0: Landing Page Initial Load

```
User accesses: https://business.com/s/[subdomain]
  ↓
TenantService.getTenantLandingData(subdomain)
  ├─ Get tenant info (name, logo, category, description)
  ├─ Get all services with pricing
  ├─ Get business hours
  ├─ Get template preference
  └─ Render appropriate template (Modern/Classic/Beauty/Healthcare)
```

### Step 1: Service Selection

**Landing Page Components:**
- Navigation bar dengan "Reserve Now" button
- Hero section dengan business info
- Services section:
  - Show service cards: name, price, duration
  - Show "Book" or "Reserve Now" button per service
  - Show badge "Home visit available" jika applicable

**User Action:**
- Click "Reserve Now" on service
- OR click button di navbar untuk membuka booking form tanpa service pre-selected

**BookingDialog State Initialization:**
```typescript
// Initial state based on whether service was pre-selected
const initialStep = hasInitialService ? 'details' : 'service';

// Pre-fill if service selected
if (service) {
  setSelectedService(service);
  setCalculatedPrice(Number(service.price));
}
```

---

### Step 2: Service Confirmation (if no pre-selection)

**Component:** `BookingDialog` - Step "service"

**Displayed:**
- Service card dengan details:
  - Service name
  - Category badge
  - Description
  - Duration (minutes)
  - Price (IDR format)
  - Home visit available? + surcharge if yes
- "Continue with this service" button

**Logic:**
```typescript
if (selectedService) {
  // Service already selected from landing page
  // Jump to details step
  setStep('details');
} else {
  // No service selected, show service selection
  // (depends on template - some pre-select or require selection)
}
```

---

### Step 3: Booking Form Details

**Component:** `BookingDialog` - Step "details"

**Form Sections:**

#### A. Service Summary (Read-only)
```
Service: [Service Name]
Duration: [X] minutes
Price: IDR [price]
Home Visit Surcharge (if applicable): IDR [surcharge]
```

#### B. Customer Information (Required)
```
Full Name: __________________ (min required)
Phone Number: ________________ (min 10 digits, required)
Email Address: ________________ (optional, email format validation)
```

#### C. Appointment Preferences (Required)
```
Preferred Date: ________________ (min: today, max: 1 year from today)
Preferred Time: ________________ (time picker)
```

#### D. Home Visit Option (Conditional)
```
☐ Request home visit (+IDR [surcharge])  [visible only if service.homeVisitAvailable = true]
  
If checked:
  Home Address: _________________ (required, address input with geo-coordinates)
  └─ AddressInput component:
     - Google Places autocomplete
     - Get lat/lng coordinates
     - Show on map
```

#### E. Pricing Calculator (Dynamic)
```
Service Price: IDR [base_price]
+ Home Visit Surcharge: IDR [surcharge] (if isHomeVisit = true)
+ Distance Surcharge: IDR [distance] (calculated from PricingCalculator)
──────────────────────
Total: IDR [total]
```

**Component:** `PricingCalculator.tsx`
- Calculate surcharge based on distance from business to home
- Input: service, isHomeVisit, homeVisitAddress, businessLocation
- Output: totalPrice

#### F. Additional Notes (Optional)
```
Special Requests / Notes:
[Textarea for customer to add preferences]
```

**Validation on Submit:**
```javascript
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.customerName.trim()) 
    errors.customerName = 'Name is required';
  
  if (!formData.customerPhone.trim()) 
    errors.customerPhone = 'Phone is required';
  
  if (formData.customerPhone.length < 10) 
    errors.customerPhone = 'Phone must be at least 10 digits';
  
  if (formData.customerEmail && !formData.customerEmail.includes('@')) 
    errors.customerEmail = 'Invalid email format';
  
  if (!formData.preferredDate) 
    errors.preferredDate = 'Date is required';
  
  if (!formData.preferredTime) 
    errors.preferredTime = 'Time is required';
  
  if (formData.isHomeVisit && !formData.homeVisitAddress) 
    errors.homeVisitAddress = 'Address is required for home visit';
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

### Step 4: Booking Form Submission Process

**When user clicks "Submit Booking Request":**

#### 4A. Form Validation
```
validateForm() → Check all required fields
  ✓ Customer name present
  ✓ Phone ≥ 10 digits
  ✓ Email format valid (if provided)
  ✓ Date provided
  ✓ Time provided
  ✓ Home visit address provided (if isHomeVisit = true)
```

#### 4B. Date/Time Combination
```javascript
// Combine date (YYYY-MM-DD) + time (HH:MM) to ISO datetime
const [year, month, day] = formData.preferredDate.split('-');
const [hour, minute] = formData.preferredTime.split(':');
const scheduledAt = new Date(
  parseInt(year),
  parseInt(month) - 1,  // Month is 0-indexed
  parseInt(day),
  parseInt(hour),
  parseInt(minute)
);
// Result: ISO string like "2025-10-28T14:00:00Z"
```

#### 4C: Step 1 - FIND OR CREATE CUSTOMER

**API Endpoint:** `POST /api/customers/find-or-create?subdomain={subdomain}`

**Request Payload:**
```json
{
  "name": "Ahmad Hidayat",
  "phone": "+6281234567890",
  "email": "ahmad@email.com",
  "address": "Jl. Merdeka No.10",
  "whatsappNumber": "+6281234567890"
}
```

**Validation (in route handler):**
```typescript
const validation = createCustomerSchema.safeParse(body);
// Schema validates:
// - name: min 1, max 100 chars
// - phone: min 10, max 20 digits
// - email: valid email format (optional)
// - address: max 200 chars (optional)
```

**Backend Logic:** `CustomerService.findOrCreateCustomer(tenantId, data)`
```typescript
// 1. Look for existing customer by phone number & tenant
const existingCustomer = await supabase
  .from('customers')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('phone', data.phone)
  .single();

// 2. If found → Return existing customer (created: false)
if (existingCustomer) {
  return { customer: mapToCustomer(existingCustomer), created: false };
}

// 3. If not found → Create new customer
const newCustomer = {
  id: randomUUID(),
  tenant_id: tenantId,
  name: data.name,
  email: data.email || null,
  phone: data.phone,
  address: data.address || null,
  whatsapp_number: data.phone,  // Use phone as WhatsApp number
  total_bookings: 0,             // Will increment on booking
  last_booking_at: null,         // Will set on first booking
  created_at: now(),
  updated_at: now()
};

const result = await supabase
  .from('customers')
  .insert(newCustomer)
  .select()
  .single();

return { customer: mapToCustomer(result), created: true };
```

**Response:**
```json
{
  "customer": {
    "id": "cust-uuid-001",
    "tenantId": "tenant-uuid",
    "name": "Ahmad Hidayat",
    "phone": "+6281234567890",
    "email": "ahmad@email.com",
    "address": "Jl. Merdeka No.10",
    "whatsappNumber": "+6281234567890",
    "totalBookings": 0,
    "lastBookingAt": null,
    "createdAt": "2025-10-28T12:00:00Z",
    "updatedAt": "2025-10-28T12:00:00Z"
  },
  "created": true  // or false if customer already existed
}
```

**Error Handling:**
```javascript
if (!findRes.ok) {
  const errData = await findRes.json();
  setError(`Customer creation failed: ${errData.error}`);
  return;
}
```

---

#### 4D: Step 2 - CALCULATE BOOKING AMOUNT

**Logic:**
```javascript
const totalAmount = formData.isHomeVisit 
  ? Number(selectedService.price) + Number(selectedService.homeVisitSurcharge || 0)
  : Number(selectedService.price);

// Example:
// Base price: 500,000
// Home visit surcharge: 50,000
// Total: 550,000 (if home visit selected)
```

#### 4E: Step 3 - CREATE BOOKING

**API Endpoint:** `POST /api/bookings?subdomain={subdomain}`

**Request Payload:**
```json
{
  "customerId": "cust-uuid-001",
  "serviceId": "svc-uuid-001",
  "scheduledAt": "2025-10-28T14:00:00Z",
  "isHomeVisit": true,
  "homeVisitAddress": "Jl. Merdeka No.10",
  "homeVisitCoordinates": {
    "lat": -6.123456,
    "lng": 106.789012
  },
  "notes": "Please bring massage oil"
}
```

**Validation (in route handler):**

1. **Tenant Resolution** (subdomain → UUID)
   ```javascript
   // If subdomain provided, lookup tenant UUID
   const tenant = await supabase
     .from('tenants')
     .select('id')
     .eq('subdomain', subdomain)
     .single();
   ```

2. **Schema Validation** (createBookingSchema)
   ```typescript
   const validation = createBookingSchema.safeParse(body);
   // Validates:
   // - customerId: required, min 1 char
   // - serviceId: required, min 1 char
   // - scheduledAt: valid ISO datetime format
   // - isHomeVisit: optional boolean (default false)
   // - homeVisitAddress: required IF isHomeVisit = true
   // - homeVisitCoordinates: optional (lat/lng validation if provided)
   // - notes: optional string
   ```

3. **Home Visit Validation**
   ```javascript
   if (validation.data.isHomeVisit && !validation.data.homeVisitAddress) {
     return error: 'Home visit address is required for home visit bookings'
   }
   ```

4. **Blocked Date Check**
   ```javascript
   const isBlocked = await BlockedDatesService.isDateBlocked(
     tenantId,
     new Date(validation.data.scheduledAt)
   );
   if (isBlocked) {
     return error: 'This date is blocked and cannot be booked'
   }
   ```

**Backend Logic:** `BookingService.createBooking(tenantId, data)`
```typescript
// 1. Validate service exists & belongs to tenant
const service = await supabase
  .from('services')
  .select('*')
  .eq('id', data.serviceId)
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
  .single();

if (!service) {
  return { error: 'Service not found or inactive' };
}

// 2. Validate customer exists & belongs to tenant
const customer = await supabase
  .from('customers')
  .select('*')
  .eq('id', data.customerId)
  .eq('tenant_id', tenantId)
  .single();

if (!customer) {
  return { error: 'Customer not found' };
}

// 3. Validate booking time (not in past, not > 1 year future)
const timeValidation = validateBookingTime(scheduledAt);
if (!timeValidation.valid) {
  return { error: timeValidation.message };
}

// 4. Validate business hours
const businessHours = await supabase
  .from('businessHours')
  .select('*')
  .eq('tenant_id', tenantId)
  .single();

const hoursValidation = validateBusinessHours(scheduledAt, businessHours);
if (!hoursValidation.valid) {
  return { error: hoursValidation.message };
}

// 5. Calculate total amount
let totalAmount = Number(service.price);
if (data.isHomeVisit && service.homeVisitSurcharge) {
  totalAmount += Number(service.homeVisitSurcharge);
}

// 6. Create booking
const booking = {
  id: randomUUID(),
  tenant_id: tenantId,
  customer_id: data.customerId,
  service_id: data.serviceId,
  scheduled_at: scheduledAt.toISOString(),
  duration: service.duration,
  is_home_visit: data.isHomeVisit || false,
  home_visit_address: data.homeVisitAddress || null,
  home_visit_coordinates: data.homeVisitCoordinates || null,
  notes: data.notes || null,
  total_amount: totalAmount,
  status: BookingStatus.PENDING,  // ← STATUS ALWAYS PENDING
  payment_status: PaymentStatus.PENDING,
  reminders_sent: [],
  created_at: now(),
  updated_at: now()
};

const result = await supabase
  .from('bookings')
  .insert(booking)
  .select()
  .single();

// 7. Update customer's total_bookings & last_booking_at
await supabase
  .from('customers')
  .update({
    total_bookings: (customer.total_bookings || 0) + 1,
    last_booking_at: now()
  })
  .eq('id', data.customerId);

return { booking: mapToBooking(result) };
```

**Response:**
```json
{
  "booking": {
    "id": "booking-uuid-001",
    "bookingNumber": "BK-20251028-0001",
    "tenantId": "tenant-uuid",
    "customerId": "cust-uuid-001",
    "serviceId": "svc-uuid-001",
    "status": "pending",
    "scheduledAt": "2025-10-28T14:00:00Z",
    "duration": 60,
    "isHomeVisit": true,
    "homeVisitAddress": "Jl. Merdeka No.10",
    "homeVisitCoordinates": { "lat": -6.123456, "lng": 106.789012 },
    "notes": "Please bring massage oil",
    "totalAmount": 550000,
    "paymentStatus": "pending",
    "remindersSent": [],
    "createdAt": "2025-10-28T12:00:00Z",
    "updatedAt": "2025-10-28T12:00:00Z"
  }
}
```

---

### Step 5: Booking Confirmation Page

**Component:** `BookingDialog` - Step "confirmation"

**Displayed to Customer:**
```
✅ Booking Request Submitted!

Thank you for your booking request. 
We'll contact you shortly to confirm your appointment.

═══════════════════════════════════════
BOOKING SUMMARY
═══════════════════════════════════════
Service:          Spa Treatment
Date & Time:      2025-10-28 at 14:00
Duration:         60 minutes
Location:         Home Visit
Address:          Jl. Merdeka No.10
Special Notes:    Please bring massage oil

Total:            IDR 550,000
═══════════════════════════════════════

[Close Dialog] [Make Another Booking]
```

**Actions:**
- Close dialog → Back to landing page
- Make another booking → Reset form, stay in booking dialog

---

### Booking Status After Creation:
- **Status:** `PENDING` (admin must confirm)
- **Payment Status:** `PENDING`
- **Next Action:** Admin reviews & confirms in Menu Booking

---

## 2️⃣ MENU BOOKING - ADMIN MANAGEMENT

### File: `app/tenant/admin/bookings/content.tsx` + `components/booking/BookingManagement.tsx`
**Purpose:** Admin panel untuk manage semua booking dari customer

### Overview:

Admin dapat view, filter, manage, dan track semua bookings yang masuk dari customer. Interface menyediakan calendar view, list view, dan detail view untuk setiap booking.

---

### A. Booking Status Lifecycle

```
┌─────────────────────────────────────────────────┐
│ PENDING (Booking masuk dari customer)           │
│ - Admin perlu review & confirm                  │
│ - Customer menunggu approval                    │
└────────────────┬────────────────────────────────┘
                 │ (Admin click "Confirm")
                 ▼
┌─────────────────────────────────────────────────┐
│ CONFIRMED (Approved, service siap dilakukan)   │
│ - Booking ditampilkan di schedule staff         │
│ - Dapat send reminder ke customer              │
│ - Dapat reschedule jika perlu                  │
└────────────────┬────────────────────────────────┘
                 │ (Service executed)
                 ▼
┌─────────────────────────────────────────────────┐
│ COMPLETED (Service sudah selesai)              │
│ - Ready untuk create sales transaction          │
│ - Ready untuk create invoice                    │
└────────────────┬────────────────────────────────┘
                 │
       ┌─────────┴──────────┬─────────────────┐
       ▼                    ▼                 ▼
    CANCELLED       NO_SHOW            (End of workflow)
```

---

### B. Admin Dashboard - Booking Management

**File:** `components/booking/BookingManagement.tsx`

**Tabs:**
1. **Calendar View** (default) - Visual scheduling
2. **List View** - Table dengan semua bookings
3. **Recurring Bookings** - Manage recurring bookings
4. **Blackout Dates** - Manage blocked dates

---

### C. Calendar View

**Display:**
```
[Previous Month] [Current Month: October 2025] [Next Month]

Mon     Tue     Wed     Thu     Fri     Sat     Sun
28      29      30      1(●)    2(●●)   3       4(●)
5       6(●)    7       8       9(●●●)  10      11
12      13      14(●)   15      16      17(●)   18

Legend:
● = 1 booking
●● = 2 bookings
●●● = 3+ bookings

Click on date to see bookings for that day
```

**Time Slot View (Day Selected):**
```
Selected: October 9, 2025

Time Slot | Booking | Customer | Service | Status
08:00     | BK-001  | Ahmad    | Spa     | [CONFIRMED]
09:30     | BK-002  | Siti     | Massage | [PENDING]
14:00     | BK-003  | Budi     | Therapy | [CONFIRMED]
16:00     | ---     | ---      | ---     | [AVAILABLE]

[< Previous Day] [Today] [Next Day >]
```

---

### D. List View

**Filters Available:**
```
Status:     [All Statuses] [PENDING] [CONFIRMED] [COMPLETED] [CANCELLED] [NO_SHOW]
Date Range: [From] ____ [To] ____
Customer:   [Search...] (search by name/phone)
Service:    [All Services] [Service1] [Service2]
```

**Table Display:**
```
┌──────────┬─────────────────┬──────────────┬──────────────┬────────────┬──────────┬────────────┐
│ Booking# │ Customer        │ Service      │ Date & Time  │ Status     │ Payment  │ Actions    │
├──────────┼─────────────────┼──────────────┼──────────────┼────────────┼──────────┼────────────┤
│ BK-001   │ Ahmad Hidayat   │ Spa (60min)  │ 2025-10-28   │ CONFIRMED  │ PENDING  │ [View]     │
│          │ +6281234567890  │ Home Visit   │ 14:00        │            │          │ [Edit]     │
│          │                 │ Rp 550,000   │              │            │          │ [...]      │
├──────────┼─────────────────┼──────────────┼──────────────┼────────────┼──────────┼────────────┤
│ BK-002   │ Siti Nurhaliza  │ Massage      │ 2025-10-28   │ PENDING    │ PENDING  │ [View]     │
│          │ +6282847392847  │ (90min)      │ 09:30        │            │          │ [Confirm]  │
│          │                 │ Rp 300,000   │              │            │          │ [...]      │
├──────────┼─────────────────┼──────────────┼──────────────┼────────────┼──────────┼────────────┤
│ BK-003   │ Budi Gunawan    │ Therapy      │ 2025-10-29   │ COMPLETED  │ PAID     │ [View]     │
│          │ +6289876543210  │ (120min)     │ 11:00        │            │          │ [...]      │
└──────────┴─────────────────┴──────────────┴──────────────┴────────────┴──────────┴────────────┘
```

---

### E. Booking Details Panel

**When Admin Clicks "View" on Booking:**

```
═══════════════════════════════════════════════════
BOOKING DETAIL: BK-001
═══════════════════════════════════════════════════

CUSTOMER INFORMATION
─────────────────────
Name:              Ahmad Hidayat
Phone:             +6281234567890
Email:             ahmad@email.com
Address:           Jl. Merdeka No.10
Total Bookings:    3
Last Booking:      2025-10-21

SERVICE DETAILS
─────────────────────
Service:           Spa Treatment
Duration:          60 minutes
Price:             Rp 500,000
Home Visit:        Yes
Home Address:      Jl. Merdeka No.10
Coordinates:       -6.123456, 106.789012
Special Notes:     Please bring massage oil

APPOINTMENT
─────────────────────
Booking Date:      2025-10-28
Booking Time:      14:00
Status:            [CONFIRMED] ↓

PAYMENT
─────────────────────
Amount:            Rp 550,000
Payment Status:    [PENDING] ↓
Payment Method:    [Not Set] ↓

ACTIONS
─────────────────────
[Edit]     [Reschedule]  [Send Reminder]
[Refund]   [Delete]      [Send WhatsApp]
[...]
```

---

### F. Admin Actions

#### 1. CONFIRM BOOKING (PENDING → CONFIRMED)

**UI:**
```
Status: [PENDING] ↓

Dropdown menu appears:
  - CONFIRMED
  - CANCELLED
  - NO_SHOW
  
Select: CONFIRMED
```

**Backend:**
```typescript
await onBookingUpdate?.(booking.id, {
  status: BookingStatus.CONFIRMED
});

// PUT /api/bookings/{bookingId}
// Payload: { status: "confirmed" }

// Local state updates instantly
setSelectedBooking({ ...selectedBooking, status: BookingStatus.CONFIRMED });

// Toast notification
toast.success('Booking status updated to CONFIRMED');
```

**What Happens:**
- Status saved to DB
- Staff see booking in their schedule
- Admin can send reminder to customer
- Can set payment method & record payment

#### 2. UPDATE PAYMENT STATUS & METHOD

**UI:**
```
PAYMENT SECTION
─────────────────────
Amount:            Rp 550,000
Payment Status:    [PENDING] ↓
Payment Method:    [Not Set] ↓

Click "Payment Status" dropdown:
  - PENDING
  - PAID
  - REFUNDED
  
Click "Payment Method" dropdown:
  - Cash
  - Bank Transfer
  - Card
  - Other
  
If select "PAID":
  - Paid Date field appears: [2025-10-28]
  - Save automatically
```

**Backend:**
```typescript
await onBookingUpdate?.(booking.id, {
  paymentStatus: PaymentStatus.PAID,
  paymentMethod: 'cash' // or 'transfer', 'card', etc
});

// Payment status can now be tracked
// Ready to create Sales transaction
```

#### 3. RESCHEDULE BOOKING

**UI:**
```
Click [Reschedule] button

Dialog appears:
  New Date: [Calendar picker]
  New Time: [Time picker]
  
  Note: Shows available time slots
  
  [Cancel] [Reschedule]
```

**Validation:**
```typescript
const isSlotAvailable = (newDateTime: Date, excludeBookingId?: string): boolean => {
  const newStart = new Date(newDateTime);
  const newEnd = new Date(newStart.getTime() + duration * 60000);

  // Check if any other booking conflicts
  return !bookings.some(booking => {
    if (booking.id === excludeBookingId) return false; // Skip this booking
    if (booking.status === 'cancelled') return false;  // Skip cancelled

    const bookingStart = new Date(booking.scheduledAt);
    const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

    return newStart < bookingEnd && newEnd > bookingStart; // Conflict?
  });
};

if (!isSlotAvailable(newDateTime, booking.id)) {
  alert('This time slot is not available');
  return;
}
```

**Backend:**
```typescript
await onBookingUpdate?.(booking.id, {
  scheduledAt: newDateTime
});

// If booking is CONFIRMED & customer has phone:
// Send WhatsApp notification: 
// "Your booking has been rescheduled to {newDateTime}"
```

#### 4. SEND REMINDER

**UI:**
```
Click [Send Reminder] button

Dialog appears:
  Template: [Select Template] ↓
  
  Available templates:
    - Booking Confirmation
    - 24-Hour Reminder
    - 1-Hour Before Service
    - Thank You (Post-Service)
  
  Selected template preview:
  ─────────────────────
  "Halo Ahmad, reminder untuk booking Spa Treatment 
  pada 28 Oct 2025, 14:00. Lokasi: Jl. Merdeka No.10"
  
  [Cancel] [Send]
```

**Backend:**
```typescript
// POST /api/reminders
{
  tenantId,
  action: 'send_immediate',
  templateId: selectedTemplate.id,
  booking: selectedBooking,
  customer: selectedBooking.customer,
  service: selectedBooking.service
}

// Response success:
// - Reminder sent via WhatsApp
// - booking.reminders_sent updated
// - Toast: "Reminder sent successfully"
```

#### 5. PROCESS REFUND

**UI:**
```
Click [Refund] button

Refund Dialog:
  Refund Type:    [Full] [Partial]
  Amount:         [Rp 550,000] ← editable for partial
  Reason:         [Dropdown] ↓
                  - Customer Request
                  - Service Issue
                  - Other
  Notes:          [Text field]
  
  [Cancel] [Process Refund]
```

**Backend:**
```typescript
if (refundData.refundType === 'partial' && 
    refundData.amount > booking.totalAmount) {
  alert('Refund amount cannot exceed total booking amount');
  return;
}

await onBookingUpdate?.(booking.id, {
  paymentStatus: PaymentStatus.REFUNDED,
  notes: `${refundType} refund: IDR ${amount}. Reason: ${reason}`
});

// Status updated to REFUNDED
// Admin can see refund history in notes
```

#### 6. EDIT BOOKING DETAILS

**UI:**
```
Click [Edit] button

Edit Mode:
─────────────────────
Service:       [Service1] ✓
Date:          [2025-10-28] (editable)
Time:          [14:00] (editable)
Duration:      [60] minutes (auto-fill from service)
Amount:        [550000] (editable)
Notes:         [Please bring massage oil] (editable)

[Cancel Edit] [Save Changes]
```

**Validations:**
```typescript
- If date/time changed: Check if slot available
- If amount changed: Must be > 0
- Cannot change customer or service
  (must delete & recreate)
```

**Backend:**
```typescript
await onBookingUpdate?.(booking.id, {
  scheduledAt: newDateTime,
  totalAmount: newAmount,
  notes: newNotes
});

// If datetime changed & booking CONFIRMED:
// Send WhatsApp reschedule notification
```

#### 7. DELETE / CANCEL BOOKING

**UI:**
```
Click [Delete] or [Cancel]

Confirmation Dialog:
  "Are you sure you want to cancel this booking?"
  
  This action:
  - Marks booking as CANCELLED
  - Customer should be notified
  - Can process refund if needed
  
  [Keep] [Cancel Booking]
```

**Backend:**
```typescript
await onBookingDelete?.(booking.id);

// Typically sets status to CANCELLED
// Or deletes entirely from DB
```

---

### G. Reminder Management

**Component:** RecurringBookingManager, reminder-service

**Reminder Scheduling:**
```typescript
// When booking CONFIRMED:
await handleScheduleReminders(booking);

// POST /api/reminders
{
  tenantId,
  action: 'schedule_auto',
  bookingId: booking.id,
  template_type: 'reminder'
}

// System automatically sends:
// 1. 24-hour before: "Reminder your booking tomorrow at 14:00"
// 2. 1-hour before: "Your appointment starts in 1 hour"
// 3. After service: "Thank you for your booking!"
```

**Reminder Settings:**
```
Admin can configure:
  - Enable/disable auto reminders
  - Default reminder templates
  - Reminder timing (days/hours before)
  - Communication channel (WhatsApp/SMS)
```

---

### H. Recurring Bookings (Tab)

**For customers dengan recurring appointments:**

```
Manage Recurring Bookings:
  
Recurring Booking Pattern:
  Pattern Type:    [Weekly] ↓
  Frequency:       Every [1] week
  Day of Week:     [Monday] [Wednesday] [Friday]
  
Recurring Details:
  Start Date:      2025-10-28
  End Date:        2025-12-31 (or "No End Date")
  
  Auto-Create:     ☑ Automatically create bookings
  Auto-Confirm:    ☐ Automatically confirm bookings
  
Actions:
  [Save Pattern]  [Delete Pattern]
```

---

### I. Blackout Dates (Tab)

**Block dates when business is closed:**

```
Blackout Dates Management

Blocked Dates:
  Start Date:      [2025-11-01]
  End Date:        [2025-11-07]
  Reason:          [Holiday] ↓  (or Custom Reason)
  
  [Add Blackout Date]

Active Blackout Dates:
  ┌─────────────────────────────────────────────┐
  │ 2025-11-01 to 2025-11-07 (Holiday)          │ [Delete]
  │ 2025-12-24 to 2025-12-26 (Christmas Holiday)│ [Delete]
  └─────────────────────────────────────────────┘
  
When customer tries to book blocked date:
  Error: "This date is blocked and cannot be booked"
```

---

### J. Database: Bookings Table

```typescript
{
  id: UUID
  tenant_id: UUID
  customer_id: UUID
  service_id: UUID
  
  booking_number: "BK-20251028-0001"
  status: PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW
  
  scheduled_at: DateTime          // "2025-10-28T14:00:00Z"
  duration: number                // 60 (minutes)
  
  is_home_visit: boolean
  home_visit_address?: string
  home_visit_coordinates?: JSON   // { "lat": -6.123, "lng": 106.789 }
  
  total_amount: Decimal           // 550000
  payment_status: PENDING | PAID | REFUNDED
  payment_method?: 'cash' | 'card' | 'transfer' | 'qris'
  
  notes?: string                  // "Please bring massage oil"
  reminders_sent: DateTime[]      // ["2025-10-27T14:00:00Z", ...]
  
  created_at: DateTime
  updated_at: DateTime
}
```

---

### K. API Endpoints

```
GET  /api/bookings
     - Get all bookings with filters
     - Query: status, customerId, serviceId, startDate, endDate, limit, offset
     - Response: { bookings: [...], totalPages: N }

POST /api/bookings
     - Create new booking (from landing page or admin)
     - Body: { customerId, serviceId, scheduledAt, isHomeVisit, ... }
     - Response: { booking: {...} }

PUT  /api/bookings/{bookingId}
     - Update booking status, date, amount, notes, etc.
     - Body: { status?, scheduledAt?, totalAmount?, notes?, ... }
     - Response: { booking: {...} }

DELETE /api/bookings/{bookingId}
     - Delete / cancel booking
     - Response: { success: true }
```

---

### L. Complete Admin Workflow Example

```
SCENARIO: Admin Reviews Pending Booking & Confirms

1. Admin opens Menu Booking
   → Calendar view shows October 2025
   → See dots on dates with bookings
   
2. Admin clicks Oct 28
   → Time slot view shows 3 bookings
   → See BK-002 in PENDING status (red badge)
   
3. Admin clicks [View] on BK-002
   → Booking details panel opens
   → Customer: Siti Nurhaliza (+6282847392847)
   → Service: Massage (90 min, Rp 300,000)
   → Time: 2025-10-28, 09:30
   → Status: PENDING
   
4. Admin clicks [Confirm] 
   → Status dropdown: CONFIRMED selected
   → PUT /api/bookings/BK-002 { status: "CONFIRMED" }
   → Toast: "Booking status updated to CONFIRMED"
   → Booking card color changes (red → green)
   
5. Admin records payment
   → Clicks payment status: "PAID"
   → Selects payment method: "Cash"
   → Payment Status shows "PAID" ✓
   
6. Admin sends reminder (optional)
   → Clicks [Send Reminder]
   → Selects template: "24-Hour Reminder"
   → Click [Send]
   → WhatsApp sent: "Halo Siti, reminder booking Massage besok 09:30..."
   → Toast: "Reminder sent successfully"
   
7. Admin notes that service is complete
   → Later, changes status to COMPLETED
   → Now ready to create Sales transaction
   → Later ready to create Invoice if needed
```

---

## 🎨 MENU BOOKING - USER INTERFACE

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Admin Dashboard > Bookings                      [Menu] [Profile]    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ BOOKINGS                                                             │
│ Manage customer bookings and appointments                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────────────────────────────┐
│ ■ 12     │ ▶ 8     │ 👥 45    │                                   │
│ Today's  │ This     │ Active   │                                   │
│ Bookings │ Week     │ Customers│                                   │
└──────────┴──────────┴──────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ [Calendar] [List] [Recurring] [Blackout Dates]                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CALENDAR VIEW                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  [< October 2025 >]                                                 │
│                                                                      │
│  Mo    Tu    We    Th    Fr    Sa    Su                             │
│  29    30     1(●)   2(●●) 3     4     5                            │
│   6(●)  7     8     9(●●●)10    11    12                            │
│  13    14    15(●)  16    17    18(●) 19                            │
│  20    21    22    23(●)  24    25    26                            │
│  27    28    29    30    31    -     -                              │
│                                                                      │
│  Legend: ● = 1 booking, ●● = 2 bookings, ●●● = 3+ bookings        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SELECTED: October 15, 2025 - Wednesday                      │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Time    │ Booking  │ Customer         │ Service    │ Status │  │
│  ├─────────┼──────────┼──────────────────┼────────────┼────────┤  │
│  │ 08:00   │ BK-001   │ Ahmad Hidayat    │ Spa        │ ✓ CONF │  │
│  │ 09:30   │ BK-002   │ Siti Nurhaliza   │ Massage    │ ◆ PEND │  │
│  │ 14:00   │ BK-003   │ Budi Gunawan     │ Therapy    │ ✓ CONF │  │
│  │ 16:00   │ ---      │ ---              │ ---        │ FREE   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [< Previous Day] [Today] [Next Day >]                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### List View Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [List] [Calendar] [Recurring] [Blackout Dates]                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filters:                                                            │
│  ┌─────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ [All Statuses]▼ │ │From ____ │ │To ______ │ │ All Services▼│   │
│  └─────────────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  [PENDING] [CONFIRMED] [COMPLETED] [CANCELLED]                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Booking # │ Customer       │ Service    │ Date & Time       │  │
│  │          │                │            │                   │  │
│  │ Status   │ Payment        │            │                   │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ BK-001  │ Ahmad Hidayat  │ Spa        │ 2025-10-28 14:00  │  │
│  │ [✓ CONFIRMED]  │ [PENDING]       │ [View] [Edit] [...]│  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ BK-002  │ Siti Nurhaliza │ Massage    │ 2025-10-28 09:30  │  │
│  │ [◆ PENDING]    │ [PENDING]       │ [Confirm] [...]   │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ BK-003  │ Budi Gunawan   │ Therapy    │ 2025-10-29 11:00  │  │
│  │ [✓ COMPLETED]  │ [PAID]          │ [View] [...]      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [Page 1 of 5] [< Previous] [1 2 3 4 5] [Next >]                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Booking Details Panel (Slide-in Drawer)

```
┌────────────────────────────────────────────────┐
│ BOOKING DETAIL: BK-001                    [✕]  │
├────────────────────────────────────────────────┤
│                                                │
│ CUSTOMER INFORMATION                          │
│ ──────────────────────────────────────────    │
│ Name:         Ahmad Hidayat                   │
│ Phone:        +6281234567890                  │
│ Email:        ahmad@email.com                 │
│ Address:      Jl. Merdeka No.10               │
│ Total Bookings: 3                             │
│ Last Booking: 2025-10-21                      │
│                                                │
│ SERVICE DETAILS                               │
│ ──────────────────────────────────────────    │
│ Service:      Spa Treatment                   │
│ Duration:     60 minutes                      │
│ Price:        Rp 500,000                      │
│ Home Visit:   Yes                             │
│ Address:      Jl. Merdeka No.10               │
│ Coords:       -6.123456, 106.789012           │
│ Notes:        Please bring massage oil        │
│                                                │
│ APPOINTMENT                                   │
│ ──────────────────────────────────────────    │
│ Date:         2025-10-28                      │
│ Time:         14:00                           │
│ Status:       [CONFIRMED ▼]                   │
│               ├─ CONFIRMED                    │
│               ├─ COMPLETED                    │
│               ├─ CANCELLED                    │
│               └─ NO_SHOW                      │
│                                                │
│ PAYMENT                                       │
│ ──────────────────────────────────────────    │
│ Amount:       Rp 550,000                      │
│ Status:       [PENDING ▼]                     │
│ Method:       [Not Set ▼]                     │
│               ├─ Cash                         │
│               ├─ Bank Transfer                │
│               ├─ Card                         │
│               └─ Other                        │
│                                                │
│ ACTIONS                                       │
│ ──────────────────────────────────────────    │
│ [Edit]  [Reschedule]  [Send Reminder]        │
│ [Refund] [Delete]     [Send WhatsApp]        │
│ [More ...]                                    │
│                                                │
└────────────────────────────────────────────────┘
```

### Booking Detail Modals

#### Edit Booking Modal
```
┌───────────────────────────────────────────────┐
│ Edit Booking: BK-001                     [✕]  │
├───────────────────────────────────────────────┤
│                                               │
│ Date:      [2025-10-28 ▼] [Calendar]        │
│ Time:      [14:00 ▼]                        │
│ Duration:  60 minutes                       │
│ Amount:    [550000] ✓                       │
│ Notes:     [Please bring massage oil...]    │
│                                               │
│ [Cancel] [Save Changes]                     │
│                                               │
└───────────────────────────────────────────────┘
```

#### Refund Dialog
```
┌───────────────────────────────────────────────┐
│ Process Refund                           [✕]  │
├───────────────────────────────────────────────┤
│                                               │
│ Refund Type:   [○ Full] [● Partial]         │
│ Amount:        [550000] ✓                   │
│ Reason:        [Customer Request ▼]        │
│ Notes:         [Text area...]               │
│                                               │
│ [Cancel] [Process Refund]                  │
│                                               │
└───────────────────────────────────────────────┘
```

#### Send Reminder Modal
```
┌───────────────────────────────────────────────┐
│ Send Reminder                            [✕]  │
├───────────────────────────────────────────────┤
│                                               │
│ Template:  [24-Hour Reminder ▼]             │
│            ├─ Booking Confirmation           │
│            ├─ 24-Hour Reminder               │
│            ├─ 1-Hour Before Service          │
│            └─ Thank You (Post-Service)       │
│                                               │
│ Preview:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Halo Ahmad, reminder untuk booking      │ │
│ │ Spa Treatment pada 28 Oct 2025, 14:00.  │ │
│ │ Lokasi: Jl. Merdeka No.10                │ │
│ └─────────────────────────────────────────┘ │
│                                               │
│ [Cancel] [Send]                             │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 🎨 MENU SALES - USER INTERFACE

### Main Sales Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Admin Dashboard > Sales                     [Menu] [Profile]        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SALES                                                                │
│ Manage transactions and track revenue                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┬──────────────┬────────────┬─────────────┐
│ $ 45,500K   │ 156          │ ✓ 38,250K  │ ◆ 7,250K    │
│ Total       │ Total        │ Paid       │ Pending     │
│ Revenue     │ Transactions │ Amount     │ Amount      │
└─────────────┴──────────────┴────────────┴─────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ [Transactions] [Analytics] [Summary]                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐                                           │
│  │ [+ Create on Spot]   │  [+ From Booking]  [Search...] [Filters] │
│  └──────────────────────┘                                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Transaction │ Customer       │ Service    │ Amount    │ Type │  │
│  │             │                │            │           │      │  │
│  │ Status      │ Payment Method │ Date       │ Reference │ ...  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ SALE-001    │ Ahmad Hidayat  │ Spa        │ 550,000   │ ↻    │  │
│  │ [✓ COMPLETED]  │ [💳 CASH]     │ 2025-10-28 │ Paid      │[Delete]  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ SALE-002    │ Siti Nurhaliza │ Massage    │ 300,000   │ ↻    │  │
│  │ [◆ PENDING]    │ [💳 CASH]     │ 2025-10-28 │ Pending   │[Delete]  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ SALE-003    │ Budi Gunawan   │ Therapy    │ 450,000   │ ↻    │  │
│  │ [✓ COMPLETED]  │ [💳 TRANSFER]  │ 2025-10-27 │ Paid      │[Delete]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  [Page 1 of 12] [< Previous] [1 2 3 ... 12] [Next >]              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Transaction Card (On Desktop List)

```
┌───────────────────────────────────────────────────────────────────┐
│ SALE-001                                                           │
│ Ahmad Hidayat | +6281234567890                                    │
│ ───────────────────────────────────────────────────────────────── │
│ Service: Spa Treatment (60 min) | Home Visit                      │
│ Address: Jl. Merdeka No.10                                        │
│ ───────────────────────────────────────────────────────────────── │
│ Amount: Rp 550,000 | Status: [✓ COMPLETED] | [💳 CASH]          │
│ Date: 2025-10-28 14:00 | Payment: Paid                           │
│ ───────────────────────────────────────────────────────────────── │
│ [View Details]  [Edit]  [Generate Invoice]  [Delete]             │
│                                                                    │
│ Source: [From Booking] | Reference: BK-001                      │
└───────────────────────────────────────────────────────────────────┘
```

### Create On-The-Spot Transaction Modal

```
┌───────────────────────────────────────────────────────┐
│ Create On-The-Spot Transaction               [✕]     │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Customer:       [Select Customer ▼]                 │
│                 - Ahmad Hidayat                      │
│                 - Siti Nurhaliza                     │
│                 - Budi Gunawan                       │
│                 [+ Add New Customer]                 │
│                                                       │
│ Service:        [Select Service ▼]                  │
│                 - Spa Treatment (Rp 500K)           │
│                 - Massage (Rp 300K)                 │
│                 - Therapy (Rp 450K)                 │
│                                                       │
│ Service Price:  Rp 500,000                          │
│ Duration:       60 minutes                          │
│ Home Visit Available: Yes (+ Rp 50,000)             │
│                                                       │
│ Payment Method: [CASH ▼]                            │
│                 - CASH                              │
│                 - TRANSFER                          │
│                 - CARD                              │
│                 - QRIS                              │
│                                                       │
│ Amount:         Rp 500,000                          │
│ Notes:          [Optional notes...]                 │
│                                                       │
│ [Cancel] [Create Transaction]                       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Create From-Booking Transaction Modal

```
┌───────────────────────────────────────────────────────┐
│ Create from Booking                              [✕]  │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Select Confirmed Booking:                           │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ BK-001                                          │ │
│ │ Ahmad Hidayat | Spa Treatment (60 min)        │ │
│ │ 2025-10-28, 14:00 | Rp 550,000               │ │
│ │ Home Visit: Yes, Jl. Merdeka No.10           │ │
│ │ [Select]                                      │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ BK-002                                          │ │
│ │ Siti Nurhaliza | Massage (90 min)            │ │
│ │ 2025-10-28, 09:30 | Rp 300,000               │ │
│ │ [Select]                                      │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ BK-003                                          │ │
│ │ Budi Gunawan | Therapy (120 min)             │ │
│ │ 2025-10-29, 11:00 | Rp 450,000               │ │
│ │ [Select]                                      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ If Booking Selected:                                │
│ ───────────────────────────────────────────────────│
│ Customer:       Ahmad Hidayat ✓                    │
│ Service:        Spa Treatment ✓                    │
│ Amount:         Rp 550,000 ✓                       │
│ Date:           2025-10-28, 14:00 ✓               │
│ Home Visit:     Yes ✓                              │
│ Payment Method: [CASH ▼]                           │
│                                                       │
│ [Cancel] [Create Transaction]                       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Analytics View

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Transactions] [Analytics] [Summary]                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  REVENUE TRENDS                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Rp                 ╱╲                                              │
│  50M    ───────────╱  ╲                                            │
│  40M    ╱╲        ╱    ╲╱╲                                        │
│  30M ──╱  ╲──────╱        ╲     Oct 2025 Revenue: Rp 45.5M       │
│  20M                       ╲╱   ▲ +15% from Sept                 │
│  10M                                                              │
│   0M  ──────────────────────────────────────                    │
│        Aug   Sept   Oct                                           │
│                                                                   │
│  TOP SERVICES                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  Spa Treatment        ████████████ 45%  Rp 20.5M                │
│  Massage             ███████ 28%     Rp 12.8M                 │
│  Therapy             ████ 18%        Rp 8.2M                  │
│  Other               ██ 9%           Rp 4.0M                  │
│                                                                   │
│  PAYMENT METHODS                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Cash                █████████████ 52%  Rp 23.7M               │
│  Transfer           ████████ 32%     Rp 14.6M                 │
│  Card               ██ 10%           Rp 4.6M                  │
│  QRIS               █ 6%             Rp 2.7M                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ MENU SALES - TRANSACTION MANAGEMENT

### File: `app/tenant/admin/sales/content.tsx`
**Purpose:** Record & manage semua sales transaction dari customer

### Component: `SalesContent.tsx`

### Sales Transaction Types:

#### Type 1: ON THE SPOT SALE
**Scenario:** Customer datang langsung, bayar langsung (tanpa booking sebelumnya)

Flow:
```
1. Select Customer
2. Select Service  
3. Choose Payment Method (Cash, Card, Transfer, QRIS)
4. Add Notes (optional)
5. Create Transaction → Status = COMPLETED, Payment = PAID
```

#### Type 2: TRANSACTION FROM BOOKING
**Scenario:** Booking sudah dikonfirmasi, sekarang catat pembayaran/selesaikan service

Flow:
```
1. Select Confirmed Booking from list
2. Auto-fill: Customer, Service, Amount, Date
3. Choose Payment Method
4. Add Notes (optional)
5. Create Transaction → Status = PENDING → COMPLETED
```

### Transaction Record Fields:

```typescript
{
  id: UUID
  tenant_id: UUID
  customer_id: UUID
  service_id: UUID
  booking_id?: UUID                    // jika dari booking
  
  transaction_number: "SALE-20251028-0001"
  source: ON_THE_SPOT | FROM_BOOKING
  status: PENDING | COMPLETED | CANCELLED | REFUNDED
  
  // Service Details
  service_name: string
  duration: number (minutes)
  is_home_visit: boolean
  home_visit_address?: string
  home_visit_coordinates?: JSON
  
  // Pricing Details
  unit_price: Decimal              // Base service price
  home_visit_surcharge?: Decimal   // Additional fee for home visit
  subtotal: Decimal                // unit_price + surcharge
  tax_rate: number (%)
  tax_amount: Decimal
  discount_amount: Decimal
  total_amount: Decimal
  
  // Payment Info
  payment_method: CASH | CARD | TRANSFER | QRIS
  payment_status: PENDING | PAID
  paid_amount: Decimal
  payment_reference?: string       // e.g., bank ref, transaction ID
  paid_at?: DateTime
  
  // Additional
  staff_id?: UUID
  notes?: string
  invoice_id?: UUID                // Link ke invoice (jika dibuat)
  created_at: DateTime
  updated_at: DateTime
}
```

### Data Flow:

#### On The Spot Transaction:
```
Customer arrives
  ↓
Select service & payment method
  ↓
POST /api/sales/transactions {type: 'on_the_spot', ...}
  ↓
SalesService.createOnTheSpotTransaction()
  ↓
Transaction created with:
  - Status: COMPLETED
  - Payment Status: PAID
  - Paid At: NOW
```

#### Transaction from Booking:
```
Booking is CONFIRMED
  ↓
Admin selects booking
  ↓
POST /api/sales/transactions {type: 'from_booking', bookingId, ...}
  ↓
SalesService.createTransactionFromBooking()
  ↓
Transaction created with:
  - Status: PENDING (atau COMPLETED jika paid)
  - Payment Status: PENDING (atau PAID)
  - Booking ID linked
```

### API Endpoints:

**GET** `/api/sales/transactions`
- Query filters: `status`, `customerId`, `dateFrom`, `dateTo`, `paymentMethod`
- Response: Array of transactions

**POST** `/api/sales/transactions`
- Type: `on_the_spot` atau `from_booking`
- Create new transaction & return created transaction

---

## 4️⃣ MENU INVOICE - INVOICE MANAGEMENT

### File: `app/tenant/admin/invoices/page.tsx` (actually uses finance/content)
**Purpose:** Generate, manage, dan kirim invoice ke customer

### Component: `InvoiceManagement.tsx`

### Three Ways to Create Invoice:

#### Method 1: Create Manual Invoice
```
Click "Create Invoice" button
  ↓
Fill form:
  - Select Customer
  - Add Line Items (description, qty, price)
  - Set Tax Rate, Discount
  - Set Due Date
  ↓
POST /api/invoices
  ↓
Invoice created with Status = DRAFT
```

#### Method 2: Create Invoice from CONFIRMED Booking
```
Click "Create from Booking" button
  ↓
Dialog shows CONFIRMED bookings (or later COMPLETED)
  ↓
Select booking
  ↓
POST /api/invoices/from-booking/{bookingId}
  ↓
InvoiceService.createInvoiceFromBooking()
  ├─ Get booking details (customer, service, amount)
  ├─ Create invoice item with service name & total
  ├─ Set due date = today + 7 days
  └─ Invoice created with Status = DRAFT
```

#### Method 3: Create Invoice from Sales Transaction
```
Click "Create from Booking" → Sales tab
  ↓
Dialog shows PENDING/COMPLETED sales transactions
  ↓
Select transaction
  ↓
POST /api/invoices/from-sales/{transactionId}
  ↓
InvoiceService.createInvoiceFromSalesTransaction()
  ├─ Get transaction details (service, amount, tax, etc.)
  ├─ Check if invoice already exists
  ├─ Create invoice items (service + home visit surcharge if any)
  ├─ Apply transaction's tax & discount
  ├─ Set due date = today + 7 days
  ├─ Update transaction with invoice_id
  └─ Invoice created with Status = DRAFT
```

### Invoice Status Lifecycle:

```
DRAFT (created, not sent)
  ↓ (admin sends)
SENT (sent to customer)
  ↓ (customer pays)
PAID (marked as paid)

OVERDUE (auto-set if today > due_date AND status != PAID)
CANCELLED (admin cancels)
```

### Invoice Database Schema:

```typescript
{
  id: UUID
  tenant_id: UUID
  customer_id: UUID
  booking_id?: UUID
  
  invoice_number: "INV-202510-0001"
  status: DRAFT | SENT | PAID | OVERDUE | CANCELLED
  
  issue_date: DateTime
  due_date: DateTime
  paid_date?: DateTime
  
  // Amounts
  subtotal: Decimal              // Sum of all items
  tax_rate: number (%)
  tax_amount: Decimal            // subtotal * tax_rate
  discount_amount: Decimal
  total_amount: Decimal          // subtotal + tax - discount
  
  // Payment Info
  payment_method?: CASH | BANK_TRANSFER | CREDIT_CARD | DIGITAL_WALLET | OTHER
  payment_reference?: string
  
  // Invoice Items
  items: [
    {
      id: UUID
      invoice_id: UUID
      description: string
      quantity: number
      unit_price: Decimal
      total_price: Decimal
      service_id?: UUID
    }
  ]
  
  // Notes
  notes?: string
  terms?: string
  
  // QR Code for Payment
  qr_code_data?: string
  qr_code_url?: string
  
  created_at: DateTime
  updated_at: DateTime
  
  // Relations
  customer: Customer
  tenant: Tenant
}
```

### Invoice Actions Available:

#### 1. View & Filter Invoices
- **Filters:** Status, Customer, Date range, Amount range
- **Search:** Invoice number, customer name
- **Pagination:** 20 per page

#### 2. Download PDF
```
GET /api/invoices/{id}/pdf
  ↓
InvoicePDFGenerator.generateInvoicePDF(invoice)
  ├─ Add header (business name, contact)
  ├─ Add invoice details (number, dates)
  ├─ Add customer details
  ├─ Add items table (description, qty, price)
  ├─ Add totals (subtotal, tax, discount, total)
  ├─ Add QR code for payment
  └─ Return PDF as ArrayBuffer
  ↓
Browser downloads: invoice-{invoiceNumber}.pdf
```

#### 3. Send via WhatsApp
```
Click "Send" button
  ↓
Fill WhatsApp form:
  - Phone Number (pre-filled from customer)
  - Message (pre-filled template)
  ↓
Click "Kirim WhatsApp"
  ↓
POST /api/invoices/{id}/whatsapp
  {
    phoneNumber: string,
    message?: string
  }
  ↓
API Endpoint Logic:
  ├─ Validate phone number
  ├─ Generate PDF
  ├─ Send to WhatsApp API (Twilio/built-in)
  └─ Return success
  ↓
Toast: "Invoice sent via WhatsApp"
  ↓
Update Invoice Status → SENT
```

#### 4. Edit Invoice
- Update status, due date, payment method
- Update notes & terms
- Cannot change customer or items (must recreate)

#### 5. Delete Invoice
- Delete invoice & all associated items
- Use with caution

---

## 📊 DATA RELATIONSHIPS

```
┌─────────────┐
│   Tenant    │
└─────────────┘
      │
      ├────────────────────────────────┐
      │                                │
      ▼                                ▼
┌──────────────┐              ┌──────────────┐
│  Customer    │              │   Service    │
└──────────────┘              └──────────────┘
      │                             │
      ├─────────────────┬───────────┤
      │                 │           │
      ▼                 ▼           ▼
  ┌─────────┐      ┌────────┐  ┌─────────┐
  │ Booking │      │ Sales  │  │ Invoice │
  └─────────┘      │ Trans  │  └─────────┘
                   └────────┘
                        │
                        ▼ (optional link)
                   ┌─────────┐
                   │ Invoice │
                   │  Items  │
                   └─────────┘
```

---

## 🔄 COMPLETE WORKFLOW EXAMPLE

### Scenario: Customer Books + Pays + Gets Invoice

```
Step 1: Landing Page Booking
┌─ Customer: Ahmad (+6281234567890)
├─ Service: Spa Treatment (Rp 500,000)
├─ Date/Time: 2025-10-28, 14:00
├─ Home Visit: Yes, Jl. Merdeka No.10
└─ Result: Booking created (ID: booking-001, Status: PENDING)

Step 2: Admin Confirms Booking
┌─ Admin opens Menu Booking
├─ Sees booking-001 (Ahmad, Spa Treatment)
├─ Clicks "Confirm"
├─ Updates status: PENDING → CONFIRMED
└─ Result: Booking status = CONFIRMED

Step 3: Service Executed
┌─ Staff goes to home, performs spa treatment
├─ Customer pays Rp 500,000 (Cash)
└─ Result: Service completed

Step 4: Create Sales Transaction
┌─ Admin opens Menu Sales
├─ Clicks "Create from Booking"
├─ Selects booking-001
├─ Confirms payment method (Cash) & amount (Rp 500,000)
├─ Clicks "Create"
└─ Result: Transaction created (ID: txn-001, Status: COMPLETED, Paid)

Step 5: Create Invoice
┌─ Admin opens Menu Invoice
├─ Clicks "Create from Booking"
├─ Selects booking-001
├─ System auto-generates:
│  ├─ Invoice #: INV-202510-0001
│  ├─ Customer: Ahmad
│  ├─ Item: Spa Treatment (1 x Rp 500,000)
│  ├─ Subtotal: Rp 500,000
│  ├─ Tax (0%): Rp 0
│  ├─ Total: Rp 500,000
│  ├─ Status: DRAFT
│  └─ Due Date: 2025-11-04
└─ Result: Invoice created

Step 6: Send Invoice via WhatsApp
┌─ Admin clicks "Send" on invoice
├─ System pre-fills:
│  ├─ Phone: +6281234567890
│  └─ Message: "Halo Ahmad, Berikut kami kirimkan invoice INV-202510-0001 dengan total Rp 500.000. Jatuh tempo pada 04/11/2025. Terima kasih."
├─ Admin clicks "Kirim WhatsApp"
├─ System sends:
│  ├─ Invoice PDF as attachment
│  └─ Message with details
└─ Result: Invoice Status = SENT, Toast shows "Sent successfully"

Step 7: Customer Receives & Pays
┌─ Customer receives WhatsApp with invoice PDF
├─ Customer sees all details: items, amount, due date
├─ Customer makes payment (out of system)
└─ Result: (Waiting for admin to confirm payment)

Step 8: Admin Marks Invoice as Paid
┌─ Admin opens Menu Invoice
├─ Clicks invoice to view details
├─ Selects Status: PAID
├─ Optional: Enter payment date & method
├─ Saves changes
└─ Result: Invoice Status = PAID, Date = today
```

---

## 🛠️ API ENDPOINTS SUMMARY

### Bookings
- `GET /api/bookings` - List all bookings (with filters, limit)
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel/Delete booking

### Sales Transactions
- `GET /api/sales/transactions` - List transactions
- `POST /api/sales/transactions` - Create transaction (on-the-spot or from booking)
- `PUT /api/sales/transactions/{id}` - Update transaction
- `DELETE /api/sales/transactions/{id}` - Delete transaction

### Invoices
- `GET /api/invoices` - List invoices (with filters)
- `POST /api/invoices` - Create manual invoice
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice
- `POST /api/invoices/from-booking/{bookingId}` - Create from booking
- `POST /api/invoices/from-sales/{transactionId}` - Create from sales transaction
- `GET /api/invoices/{id}/pdf` - Download invoice as PDF
- `POST /api/invoices/{id}/whatsapp` - Send invoice via WhatsApp

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `POST /api/customers/find-or-create` - Get or create if not exists

### Services
- `GET /api/services` - List available services
- `POST /api/services` - Create service

---

## 📝 KEY BUSINESS LOGIC

### 1. Booking Auto-Completion
```typescript
// When booking is confirmed but date has passed
// Status automatically changes to COMPLETED if:
// - scheduled_at < today
// - status = CONFIRMED
```

### 2. Invoice Status Auto-Update
```typescript
// Daily job to mark invoices as OVERDUE:
// IF status = SENT AND due_date < today
// THEN status = OVERDUE
```

### 3. Price Calculation
```typescript
// Booking Price:
basePrice = service.price
if (isHomeVisit) {
  homeVisitSurcharge = service.homeVisitSurcharge || 0
  totalAmount = basePrice + homeVisitSurcharge
} else {
  totalAmount = basePrice
}

// Transaction & Invoice Amounts:
subtotal = sum(item.quantity * item.unitPrice)
tax = subtotal * (taxRate / 100)
total = subtotal + tax - discount
```

### 4. Customer Deduplication
```typescript
// When creating booking from landing page:
// - Check if customer exists by phone number
// - If exists: USE existing customer
// - If not exists: CREATE new customer
// - This prevents duplicate customer records
```

---

## 🔐 SECURITY NOTES

1. **Tenant Isolation:** All data queries filter by `tenant_id`
2. **Authentication:** Endpoints require `getTenantFromRequest()` middleware
3. **Phone Validation:** 
   - Minimum 10 digits
   - Format: +62 or 0 prefix
4. **WhatsApp API:** 
   - Requires valid phone number
   - Integration with WhatsApp Business API
5. **PDF Generation:** 
   - Server-side generation
   - No sensitive data in QR code

---

## 🚀 NEXT STEPS / TODOs

1. **PDF Invoice Endpoints**
   - Need to create `/api/invoices/[id]/pdf/route.ts`
   - Need to create `/api/invoices/[id]/whatsapp/route.ts`

2. **WhatsApp Integration**
   - Setup WhatsApp Business API credentials
   - Test WhatsApp sending

3. **Auto-Status Updates**
   - Create cron job for marking invoices as OVERDUE
   - Create cron job for auto-completing bookings

4. **Customer Communication**
   - SMS reminders for booking confirmation
   - Email invoices option

5. **Reporting**
   - Sales summary dashboard
   - Invoice aging report
   - Revenue by service type

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-28  
**Status:** Complete Overview

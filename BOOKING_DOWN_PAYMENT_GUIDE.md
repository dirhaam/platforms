# Booking Down Payment (DP) Guide

## Overview

Sistem Down Payment (DP) untuk booking memungkinkan customer melakukan pembayaran DP saat membuat booking, kemudian membayar sisanya saat hari layanan tiba.

Contoh: Booking Rp 1.000.000 → Bayar DP Rp 400.000 → Bayar sisanya Rp 600.000 saat tunai.

---

## Data Model

### Bookings Table (Updated)
```sql
bookings
├── id
├── total_amount: 1,000,000 (TOTAL booking)
├── dp_amount: 400,000 (DP yang dibayar saat booking)
├── paid_amount: 400,000 (TOTAL yang sudah dibayar)
├── payment_status: 'pending' | 'paid'
├── payment_method: 'cash' | 'card' | 'transfer' | 'qris'
├── payment_reference: 'RCP001' (Reference pembayaran DP)
└── created_at
```

### Booking Payments Table (New)
```sql
booking_payments (Track payment history)
├── id
├── booking_id
├── payment_amount: 400,000 (DP)
├── payment_method: 'cash'
├── payment_reference: 'RCP001'
├── paid_at: 2024-10-29 10:00:00
└── notes: 'Down Payment (DP)'

booking_payments (2nd payment)
├── id
├── booking_id (same)
├── payment_amount: 600,000 (Sisa)
├── payment_method: 'transfer'
├── payment_reference: 'TRF001'
├── paid_at: 2024-10-30 14:00:00
└── notes: 'Final payment'
```

---

## Step-by-Step Flow

### 1️⃣ Create Booking with DP

**User Input:**
```typescript
{
  customerId: "cust-1",
  serviceId: "srv-1",
  scheduledAt: "2024-11-05T10:00:00Z",
  isHomeVisit: true,
  dpAmount: 400000,              // DP yang dibayar sekarang
  paymentMethod: "cash",         // Metode pembayaran DP
  paymentReference: "RCP001"     // Receipt number
}
```

**What Happens (Backend):**

```typescript
// a) Insert ke bookings table
INSERT INTO bookings (
  total_amount: 1000000,
  dp_amount: 400000,
  paid_amount: 400000,
  payment_status: 'pending',  // Belum sepenuhnya dibayar
  payment_method: 'cash',
  payment_reference: 'RCP001'
)

// b) Record pembayaran DP di booking_payments
INSERT INTO booking_payments (
  booking_id: 'bk-1',
  payment_amount: 400000,
  payment_method: 'cash',
  payment_reference: 'RCP001',
  notes: 'Down Payment (DP)',
  paid_at: now()
)
```

**Response:**
```json
{
  "booking": {
    "id": "bk-1",
    "totalAmount": 1000000,
    "dpAmount": 400000,
    "paidAmount": 400000,
    "remainingBalance": 600000,
    "paymentStatus": "pending",
    "paymentMethod": "cash",
    "paymentReference": "RCP001"
  }
}
```

### 2️⃣ Display Booking Status

**In Booking List:**
```
Booking   | Date       | Total   | DP      | Remaining | Status
BK-001    | 5 Nov 2024 | 1.0M    | 400K ✓  | 600K      | ⏳ PENDING
BK-002    | 6 Nov 2024 | 2.0M    | 1.0M ✓  | 1.0M      | ⏳ PENDING
BK-003    | 7 Nov 2024 | 500K    | 500K ✓  | 0         | ✅ PAID
```

**In Booking Detail:**
```
┌─ Booking Details ────────────────┐
│                                  │
│ Service: Paket Beauty            │
│ Date: 5 Nov 2024 10:00           │
│                                  │
│ Amount: Rp 1.000.000             │
│ DP Paid: Rp 400.000 ✓            │
│ Remaining: Rp 600.000            │
│                                  │
│ Payment History:                 │
│ • DP: Rp 400K (Cash) - RCP001    │
│   5 Nov 2024 10:00               │
│                                  │
│ [Add Payment] [Print Receipt]    │
└──────────────────────────────────┘
```

### 3️⃣ Customer Bayar Sisa (Days Later)

**User clicks "Add Payment":**
```typescript
{
  bookingId: "bk-1",
  paymentAmount: 600000,          // Sisa pembayaran
  paymentMethod: "transfer",
  paymentReference: "TRF001",
  notes: "Final payment for booking"
}
```

**What Happens:**

```typescript
// POST /api/bookings/{id}/payments

// a) Insert pembayaran sisa
INSERT INTO booking_payments (
  booking_id: 'bk-1',
  payment_amount: 600000,
  payment_method: 'transfer',
  payment_reference: 'TRF001',
  notes: 'Final payment',
  paid_at: now()
)

// b) Calculate new paid amount
new_paid_amount = 400000 + 600000 = 1000000

// c) Check if fully paid
if (1000000 >= 1000000) {
  payment_status = 'PAID'  // Lunas!
}

// d) Update booking
UPDATE bookings
SET paid_amount = 1000000,
    payment_status = 'PAID',
    updated_at = now()
WHERE id = 'bk-1'
```

### 4️⃣ Final Status

**In Booking List:**
```
Booking   | Date       | Total   | DP      | Remaining | Status
BK-001    | 5 Nov 2024 | 1.0M    | 400K ✓  | 0         | ✅ PAID
```

**In Booking Detail:**
```
┌─ Booking Details ────────────────┐
│                                  │
│ Service: Paket Beauty            │
│ Date: 5 Nov 2024 10:00           │
│                                  │
│ Amount: Rp 1.000.000 ✅ LUNAS   │
│ DP Paid: Rp 400.000 ✓            │
│ Final Payment: Rp 600.000 ✓      │
│ Remaining: Rp 0                  │
│                                  │
│ Payment History:                 │
│ • DP: Rp 400K (Cash) - RCP001    │
│   5 Nov 2024 10:00               │
│ • Final: Rp 600K (Transfer)      │
│   TRF001                         │
│   30 Oct 2024 14:00              │
│                                  │
│ [Print Receipt]                  │
└──────────────────────────────────┘
```

---

## API Endpoints

### 1. Create Booking with DP
```
POST /api/bookings

Request Body:
{
  "customerId": "cust-1",
  "serviceId": "srv-1",
  "scheduledAt": "2024-11-05T10:00:00Z",
  "isHomeVisit": true,
  "tenantId": "tenant-1",
  "dpAmount": 400000,              // NEW
  "paymentMethod": "cash",         // NEW
  "paymentReference": "RCP001",    // NEW
  "notes": "Special requests..."
}

Response:
{
  "booking": {
    "id": "bk-1",
    "totalAmount": 1000000,
    "dpAmount": 400000,            // NEW
    "paidAmount": 400000,          // NEW
    "remainingBalance": 600000,    // NEW (calculated)
    "paymentStatus": "pending",
    "paymentMethod": "cash"        // NEW
  }
}
```

### 2. Record Additional Payment
```
POST /api/bookings/{id}/payments

Request Body:
{
  "tenantId": "tenant-1",
  "paymentAmount": 600000,
  "paymentMethod": "transfer",
  "paymentReference": "TRF001",
  "notes": "Final payment"
}

Response:
{
  "booking": {
    "id": "bk-1",
    "totalAmount": 1000000,
    "dpAmount": 400000,
    "paidAmount": 1000000,         // Updated
    "remainingBalance": 0,         // Updated
    "paymentStatus": "paid",       // Updated
    "paymentMethod": "transfer"    // Updated
  }
}
```

### 3. Get Booking with Payment History
```
GET /api/bookings/{id}/payments?tenantId={tenantId}

Response:
{
  "booking": {
    "id": "bk-1",
    "totalAmount": 1000000,
    "paidAmount": 1000000,
    "remainingBalance": 0,
    "paymentHistory": [
      {
        "id": "pmt-1",
        "paymentAmount": 400000,
        "paymentMethod": "cash",
        "paymentReference": "RCP001",
        "notes": "Down Payment (DP)",
        "paidAt": "2024-10-29T10:00:00Z"
      },
      {
        "id": "pmt-2",
        "paymentAmount": 600000,
        "paymentMethod": "transfer",
        "paymentReference": "TRF001",
        "notes": "Final payment",
        "paidAt": "2024-10-30T14:00:00Z"
      }
    ]
  }
}
```

---

## Database Migration

File: `/drizzle/0008_add_booking_down_payment_support.sql`

**Changes to bookings table:**
- `dp_amount` (NUMERIC DEFAULT 0) - DP amount
- `paid_amount` (NUMERIC DEFAULT 0) - Total paid
- `payment_method` (TEXT) - Payment method
- `payment_reference` (TEXT) - Reference/receipt

**New table: booking_payments**
- Tracks all payment history
- Foreign key to bookings
- Indexes for performance

---

## TypeScript Types

### Updated Booking Interface
```typescript
interface Booking {
  id: string;
  totalAmount: number;
  
  // NEW DP fields
  dpAmount?: number;              // DP yang dibayar
  paidAmount?: number;            // Total yang sudah dibayar
  remainingBalance?: number;      // Total - Paid (calculated)
  paymentHistory?: BookingPayment[];
  paymentReference?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';
}

interface BookingPayment {
  id: string;
  bookingId: string;
  paymentAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qris';
  paymentReference?: string;
  notes?: string;
  paidAt: Date;
  createdAt: Date;
}
```

---

## Implementation Status

- [x] Database migration created
- [x] Types updated
- [x] BookingService.createBooking() updated to handle DP
- [x] BookingService.recordPayment() created
- [x] API endpoint `/api/bookings/{id}/payments` created
- [ ] Update booking UI to show DP info & remaining balance
- [ ] Add "Add Payment" button for pending bookings
- [ ] Update booking detail view to show payment history
- [ ] Integrate with invoice generation from booking
- [ ] Add payment status badge (pending/paid)

---

## Usage Example

### Create Booking with DP
```typescript
const response = await fetch('/api/bookings', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'cust-123',
    serviceId: 'srv-456',
    scheduledAt: '2024-11-05T10:00:00Z',
    isHomeVisit: true,
    tenantId: 'tenant-789',
    dpAmount: 400000,        // DP amount
    paymentMethod: 'cash',
    paymentReference: 'RCP001'
  })
});

const { booking } = await response.json();
console.log('Booking created with DP:', booking.dpAmount);
console.log('Remaining to pay:', booking.remainingBalance);
```

### Record Additional Payment
```typescript
const response = await fetch(`/api/bookings/bk-1/payments`, {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'tenant-789',
    paymentAmount: 600000,
    paymentMethod: 'transfer',
    paymentReference: 'TRF001',
    notes: 'Final payment'
  })
});

const { booking } = await response.json();
console.log('New paid amount:', booking.paidAmount);
console.log('Status:', booking.paymentStatus); // Should be 'paid'
```

---

## Notes

- DP adalah optional - jika tidak ada DP, booking dibuat dengan `paid_amount: 0` dan `payment_status: 'pending'`
- Payment history selalu tercatat di `booking_payments` table
- Remaining balance dihitung otomatis dari `total_amount - paid_amount`
- Status otomatis update ke 'paid' saat `paid_amount >= total_amount`
- Multiple payments dapat dicatat dengan sukses

---

## Next Steps

1. Update booking detail UI component
2. Add payment history display
3. Add "Add Payment" button
4. Update booking list to show DP & remaining
5. Connect to invoice generation (show DP in invoice)
6. Test end-to-end payment flow

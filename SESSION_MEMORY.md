# SESSION MEMORY - Booking & Payment System Debugging
**Date**: 2025-10-30  
**Status**: Completed - Core payment workflow fixed

---

## QUICK REFERENCE

### Problem Summary
Bookings created from landing page had `paid_amount: 0` and `payment_method: null`, causing:
- Payment history not showing in Payment Tab
- Invoice status stuck at UNPAID even after "Mark as Paid"
- Split payment data not displaying in View Details

### Solution Path
1. Fix split payment data fetching (Sales Service)
2. Enhance View Details dialog with payment breakdown
3. Implement Invoice Tab action handlers
4. Add payment history to Payment Tab with proper API
5. Fix payment method recording via proper endpoint
6. Add payment info to booking creation workflow

---

## DETAILED RESOLUTION LOG

### Issue 1: Build Error - TypeScript Compilation
**Error**: `Type error: Argument of type '(dbData: any, payments?: any[]) => SalesTransaction'`

**Files**: `lib/sales/sales-service.ts:462`

**Root Cause**: 
- `mapToSalesTransaction()` signature changed to accept optional `payments` parameter
- `getSalesSummary()` still using `.map(mapToSalesTransaction)` direct reference
- Function signature mismatch with Array.map callback signature

**Fix**:
```typescript
// BEFORE
const transactions = data.map(mapToSalesTransaction);

// AFTER
const transactions = data.map(t => mapToSalesTransaction(t));
```

**Commit**: `55a43d5`

---

### Issue 2: Split Payment Data Not Loading
**Symptoms**: 
- View Details dialog shows only single payment method
- Split payment breakdown not visible
- Payment history empty

**Files Modified**:
- `lib/sales/sales-service.ts`
- `components/sales/SalesTransactionDetailsDialog.tsx`
- `app/tenant/admin/sales/content.tsx`

**Root Causes**:
1. `getTransaction()` method didn't fetch payments from database
2. `getTransactions()` method didn't fetch payments
3. `mapToSalesTransaction()` didn't map payments array
4. Sales Content and Booking Dashboard had duplicate dialog code

**Solutions Applied**:

**1. Updated mapToSalesTransaction() signature**:
```typescript
const mapToSalesTransaction = (dbData: any, payments?: any[]): SalesTransaction => {
  return {
    // ... other fields ...
    payments: payments ? payments.map((p: any) => ({
      id: p.id,
      salesTransactionId: p.sales_transaction_id,
      paymentAmount: p.payment_amount,
      paymentMethod: p.payment_method as SalesPaymentMethod,
      paymentReference: p.payment_reference || undefined,
      paidAt: p.paid_at ? new Date(p.paid_at) : new Date(),
      notes: p.notes || undefined,
      createdAt: p.created_at ? new Date(p.created_at) : new Date(),
      updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
    })) : undefined,
  };
};
```

**2. Enhanced getTransaction() method**:
```typescript
async getTransaction(transactionId: string, tenantId: string): Promise<SalesTransaction | null> {
  // Get transaction
  const { data, error } = await supabase
    .from('sales_transactions')
    .select()
    .eq('id', transactionId)
    .eq('tenant_id', tenantId)
    .single();

  // Fetch payments for this transaction
  const { data: paymentsData } = await supabase
    .from('sales_transaction_payments')
    .select()
    .eq('sales_transaction_id', transactionId)
    .order('created_at', { ascending: true });

  return mapToSalesTransaction(data, paymentsData || []);
}
```

**3. Enhanced getTransactions() method**:
- Batch-fetch all payments for efficiency using `.in()` filter
- Group payments by transaction ID using Map
- Associate correct payments with each transaction

**4. Created reusable SalesTransactionDetailsDialog component**:
- New file: `components/sales/SalesTransactionDetailsDialog.tsx`
- Replaces inline dialog code in SalesContent and BookingDashboard
- Shows split payment breakdown with colors:
  - Green = CASH
  - Purple = CARD
  - Blue = TRANSFER
  - Indigo = QRIS
- Badge: "Split Payment (N entries)" for multi-payment transactions
- Lists each payment with: method, amount, date, reference

**Commits**:
- `a234e31` - Fetch and include split payment data
- `86b1c89` - Enhance SalesTransactionDetailsDialog with split payment support

---

### Issue 3: Invoice Preview UI Not Proportional
**Symptoms**: 
- Dialog buttons crowded and not readable
- Title and description mixed with action buttons
- Layout not responsive

**Files**: `components/invoice/InvoicePreview.tsx`

**Changes**:
- Reorganized DialogHeader with better flex layout
- Separated title/description from action buttons
- Made buttons responsive (full-width mobile, normal desktop)
- Shortened button labels: "Download PDF" → "PDF"
- Increased max-width: max-w-3xl → max-w-4xl
- Added border separator for clarity
- Added background container for preview with padding

**Commit**: `f68bebe`

---

### Issue 4: Invoice Tab Action Buttons Not Working
**Symptoms**: 
- "Mark Paid" button does nothing
- "Download PDF" button does nothing
- "Send WhatsApp" button works

**Files**: `components/booking/UnifiedBookingPanel.tsx`

**Root Cause**: 
- Buttons had no onClick handlers
- Missing implementation of handler functions

**Solutions Implemented**:

**1. handleMarkInvoicePaid()**:
```typescript
const handleMarkInvoicePaid = async (invoiceId: string) => {
  const response = await fetch(`/api/invoices/${invoiceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ status: InvoiceStatus.PAID })
  });
  
  if (response.ok) {
    toast.success('Invoice marked as paid');
    await fetchRelatedData();
  }
};
```

**2. handleDownloadInvoicePDF()**:
```typescript
const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
  const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
    headers: { 'x-tenant-id': tenantId }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  link.click();
};
```

**3. Connected buttons to handlers**:
- Mark Paid: `onClick={() => handleMarkInvoicePaid(invoice.id)}`
- Download PDF: `onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoiceNumber)}`
- Send WhatsApp: `onClick={() => handleSendInvoiceWhatsApp(invoice.id)}`

**Commit**: `fa63afa`

---

### Issue 5: Payment Tab - Payment History Not Loading
**Symptoms**:
- "No payment history" message even after recording payment
- Paid Amount: Rp 0
- Remaining Balance: Full amount (not updated)

**Files Modified**:
- `components/booking/UnifiedBookingPanel.tsx`
- `app/api/bookings/[id]/payments/route.ts`

**Root Causes**:
1. Payment history state not initialized
2. GET endpoint only returned booking, not payments array
3. No tenantId in query parameter
4. fetchRelatedData() not calling payment endpoint

**Solutions Applied**:

**1. Backend - Fix GET /api/bookings/{id}/payments**:
```typescript
export async function GET(request: NextRequest, { params }) {
  // ... validation ...
  
  // Fetch payment history from booking_payments table
  const { data: payments } = await supabase
    .from('booking_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('tenant_id', tenantId)
    .order('paid_at', { ascending: true });

  return NextResponse.json({
    success: true,
    booking,
    payments: payments || []  // ✅ Return payments array
  });
}
```

**2. Frontend - Fetch payment history**:
```typescript
// Add state
const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

// In fetchRelatedData()
const paymentRes = await fetch(
  `/api/bookings/${booking.id}/payments?tenantId=${encodeURIComponent(tenantId)}`,
  { headers: { 'x-tenant-id': tenantId } }
);
if (paymentRes.ok) {
  const paymentData = await paymentRes.json();
  setPaymentHistory(paymentData.payments || []);
}
```

**3. Enhanced Payment Tab UI**:
- Payment progress bar (green bar showing paid %)
- Paid amount display
- Remaining balance (if any, orange text)
- Payment history list with:
  - Payment method (CASH, CARD, etc.)
  - Amount paid
  - Date and time
  - Reference number (if available)
  - Notes (if available)

**Commits**:
- `323aca1` - Add payment history fetching and display
- `6473013` - Fix payment history endpoint to return payments array

---

### Issue 6: Payment Method Not Being Recorded
**Data From User**:
```json
{
  "id": "eedb0983-05f8-40b6-a7bf-75930a70cdd1",
  "paid_amount": "0",      // ❌ Should be 350000
  "payment_status": "paid",
  "payment_method": null   // ❌ Should be 'cash' or payment method
}
```

**Problem**: Status PAID but paid_amount still 0 and no payment method

**Files Modified**:
- `components/booking/UnifiedBookingPanel.tsx`
- `lib/booking/booking-service.ts`

**Root Cause**:
- `handleRecordPayment()` called `onBookingUpdate()` callback instead of proper API endpoint
- Callback-based update didn't properly update database fields

**Solutions Applied**:

**1. Changed handleRecordPayment() to use proper endpoint**:
```typescript
const handleRecordPayment = async () => {
  try {
    setLoading(true);
    
    // Use proper endpoint: /api/bookings/{id}/payments (POST)
    const response = await fetch(`/api/bookings/${booking.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId
      },
      body: JSON.stringify({
        tenantId,
        paymentAmount: booking.totalAmount - (booking.paidAmount || 0),  // Calculate remaining
        paymentMethod: paymentMethod,
        paymentReference: '',
        notes: 'Payment recorded'
      })
    });

    if (!response.ok) throw new Error('Failed to record payment');
    
    toast.success('Payment recorded');
    setShowPaymentDialog(false);
    await fetchRelatedData();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

**2. Added comprehensive logging to recordPayment()**:
```typescript
static async recordPayment(
  tenantId, bookingId, paymentAmount, paymentMethod, paymentReference, notes
) {
  console.log('[recordPayment] Input:', { bookingId, paymentAmount, paymentMethod });
  
  // Get current booking
  console.log('[recordPayment] Current booking:', { 
    paidAmount: booking.paid_amount,
    totalAmount: booking.total_amount 
  });
  
  // Record payment in table
  // ...
  console.log('[recordPayment] Payment recorded:', paymentRecord);
  
  // Calculate new paid amount
  const newPaidAmount = Number(booking.paid_amount) + Number(paymentAmount);
  console.log('[recordPayment] Calculating:', { 
    currentPaidAmount, paymentAmount, newPaidAmount, totalAmount 
  });
  
  // Update booking
  // ...
  console.log('[recordPayment] Booking updated:', {
    paidAmount: updatedBooking.paid_amount,
    paymentStatus: updatedBooking.payment_status,
    paymentMethod: updatedBooking.payment_method
  });
}
```

**Commits**:
- `9daa646` - Fix payment method recording to use proper endpoint
- `245db25` - Add comprehensive logging to recordPayment method

---

### Issue 7: Booking From Landing Page Missing Payment Info
**Symptoms**: 
- Bookings created via BookingDialog had `payment_method: null` and `paid_amount: 0`
- No way to track initial payment
- Payment recording failed because missing initial state

**Files**: `components/booking/BookingDialog.tsx`

**Root Cause**:
- BookingDialog form didn't include payment fields
- Booking API payload didn't include `paymentMethod` and `dpAmount`

**Solutions Applied**:

**1. Extended BookingFormData interface**:
```typescript
interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  preferredTime: string;
  isHomeVisit: boolean;
  homeVisitAddress: string;
  homeVisitCoordinates?: { lat: number; lng: number };
  notes: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'qris';  // ✅ NEW
  dpAmount?: number;  // ✅ NEW
}
```

**2. Initialize with defaults**:
```typescript
const [formData, setFormData] = useState<BookingFormData>({
  // ... other fields ...
  paymentMethod: 'cash',      // ✅ Default to cash
  dpAmount: 0,               // ✅ Default to no down payment
});
```

**3. Updated booking payload**:
```typescript
const bookingPayload = {
  customerId,
  serviceId: selectedService.id,
  scheduledAt: scheduledAt.toISOString(),
  isHomeVisit: formData.isHomeVisit,
  paymentMethod: formData.paymentMethod || 'cash',  // ✅ NEW
  dpAmount: formData.dpAmount || 0,                 // ✅ NEW
  // ... other fields ...
};
```

**4. Updated resetForm()**:
```typescript
const resetForm = () => {
  setFormData({
    // ... other fields reset ...
    paymentMethod: 'cash',
    dpAmount: 0,
  });
};
```

**Commit**: `aea3339`

---

## DATABASE SCHEMA REFERENCE

### bookings table
```sql
- id (uuid)
- tenant_id (uuid)
- customer_id (uuid)
- service_id (uuid)
- status (BookingStatus enum)
- scheduled_at (timestamp)
- duration (integer, minutes)
- is_home_visit (boolean)
- total_amount (numeric)
- payment_status (enum: pending, paid, refunded)
- payment_method (text: cash, card, transfer, qris)  ← KEY FIELD
- payment_reference (text)
- dp_amount (numeric)                                ← DOWN PAYMENT
- paid_amount (numeric)                              ← TOTAL PAID
- created_at, updated_at (timestamps)
```

### booking_payments table
```sql
- id (uuid)
- booking_id (uuid, FK -> bookings)
- tenant_id (uuid)
- payment_amount (numeric)
- payment_method (text)
- payment_reference (text)
- notes (text)
- paid_at (timestamp)
- created_at, updated_at (timestamps)
```

### sales_transaction_payments table
```sql
- id (uuid)
- sales_transaction_id (uuid, FK -> sales_transactions)
- payment_amount (numeric)
- payment_method (text)
- payment_reference (text)
- paidAt (timestamp)
```

---

## API ENDPOINTS

### GET /api/bookings/{id}/payments
**Parameters**: `tenantId` (query string)

**Response**:
```json
{
  "success": true,
  "booking": { /* booking object */ },
  "payments": [
    {
      "id": "...",
      "booking_id": "...",
      "payment_amount": 350000,
      "payment_method": "cash",
      "payment_reference": "...",
      "notes": "Payment recorded",
      "paid_at": "2025-10-28T08:19:37.118Z"
    }
  ]
}
```

### POST /api/bookings/{id}/payments
**Body**:
```json
{
  "tenantId": "...",
  "paymentAmount": 350000,
  "paymentMethod": "cash|card|transfer|qris",
  "paymentReference": "...",
  "notes": "..."
}
```

**Response**:
```json
{
  "success": true,
  "booking": {
    "id": "...",
    "paid_amount": 350000,      // ✅ UPDATED
    "payment_status": "paid",    // ✅ UPDATED
    "payment_method": "cash"     // ✅ UPDATED
  }
}
```

---

## KEY LOGGING PREFIXES

Use these for grep/filtering in server logs:
- `[recordPayment]` - Payment recording flow
- `[BookingDetailsDrawer]` - Payment history fetch
- `[SalesService]` - Sales transaction operations
- `[BookingDialog]` - Booking creation workflow

---

## TERMINAL COMMITS (Latest 10)

```
aea3339 - Add payment method/DP fields to booking dialog
245db25 - Add comprehensive logging to recordPayment method
9daa646 - Fix payment method recording in booking details
6473013 - Fix payment history endpoint to return payments array
323aca1 - Add payment history fetching and display in Payment Tab
fa63afa - Implement Invoice Tab action handlers
86b1c89 - Enhance SalesTransactionDetailsDialog with split payment support
f68bebe - Improve InvoicePreview dialog layout and proportions
a234e31 - Fetch and include split payment data in sales transactions
55a43d5 - Fix TypeScript error in getSalesSummary
```

---

## CURRENT STATUS

### ✅ RESOLVED
- [x] Build error - TypeScript compilation
- [x] Split payment data loading in View Details
- [x] Invoice preview UI improvements
- [x] Invoice Tab action handlers (Mark Paid, Download PDF)
- [x] Payment Tab payment history display
- [x] Payment method recording via proper endpoint
- [x] Booking creation with payment info from landing page

### 🔄 IN TESTING
- [ ] Verify `[recordPayment]` logs show correct calculations
- [ ] Confirm `paid_amount` updates in database
- [ ] Test invoice status changes to PAID automatically
- [ ] Verify payment history displays for all bookings

### ⚠️ TODO (Nice to Have)
- [ ] Edit transaction functionality (currently: "coming soon")
- [ ] History tab - fetch from database (currently: mock data)
- [ ] Reschedule booking feature
- [ ] Process Refund handler implementation

---

## DEBUGGING CHECKLIST

If payment issues reappear:

1. **Check server logs**:
   ```bash
   grep "[recordPayment]" server.log
   ```
   Look for: Input values → Current state → Payment record → Calculations → Final update

2. **Verify database**:
   ```sql
   SELECT paid_amount, payment_method, payment_status 
   FROM bookings 
   WHERE id = 'booking-uuid';
   ```
   Should show: `paid_amount = total_amount`, `payment_method = "cash"`, `payment_status = "paid"`

3. **Check payment history**:
   ```sql
   SELECT * FROM booking_payments 
   WHERE booking_id = 'booking-uuid' 
   ORDER BY paid_at DESC;
   ```
   Should have at least one record

4. **Frontend console**:
   Look for: `[BookingDetailsDrawer] Payment data:` logs
   Should show payments array populated

---

## REFERENCE FILES

**Core Files**:
- `components/booking/BookingDialog.tsx` - Landing page booking form
- `components/booking/UnifiedBookingPanel.tsx` - Admin booking details
- `lib/booking/booking-service.ts` - Booking business logic
- `app/api/bookings/[id]/payments/route.ts` - Payment API endpoint

**Related Files**:
- `lib/sales/sales-service.ts` - Split payment fetching
- `components/sales/SalesTransactionDetailsDialog.tsx` - Reusable dialog
- `components/invoice/InvoicePreview.tsx` - Invoice display
- `app/tenant/admin/sales/content.tsx` - Sales menu

---

## LOADING THIS FILE

To reload this context:
1. Search for session-specific issues: Use grep for commit hashes or timestamps
2. Check debugging checklist: Section "DEBUGGING CHECKLIST"
3. Review API endpoints: Section "API ENDPOINTS"
4. Look up file changes: Section "REFERENCE FILES"
5. Follow terminal commits: Section "TERMINAL COMMITS"

**Last Updated**: 2025-10-30  
**Next Review**: When payment issues resurface or new payment features added

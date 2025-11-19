# Booking vs Sales Tab - Data Comparison & Alignment Plan

## Current State Inspection

### Tab: BOOKING (List View)
**File:** `components/booking/BookingDashboard.tsx` (lines 599-655)
**Table Columns (in order):**
1. **Booking** - booking number (e.g., "BK-20250101-ABC123")
2. **Customer** - customer name
3. **Service** - service name
4. **Date & Time** - scheduled date and time in local format
5. **Status** - booking status (CONFIRMED, PENDING, COMPLETED, CANCELLED)
6. **Payment** - payment status (PAID, PARTIAL, PENDING)
7. **Amount** - total booking amount in Rp
8. **Action** - "View" button to open details

**Data Source:** `filteredBookings` (filtered from `bookings` array)
**Data Type:** Booking[]

---

### Tab: SALES (Sales View)
**File:** `components/sales/SalesTransactionsTable.tsx` (lines 51-89)
**Table Columns (in order):**
1. **Transaction #** - transaction number
2. **Date** - transaction date (format: YYYY-MM-DD)
3. **Service** - service name (or "Multiple Services")
4. **Source** - source badge (ON_THE_SPOT or FROM_BOOKING)
5. **Amount** - transaction total amount in IDR format
6. **Payment** - payment method badge (CASH, CARD, TRANSFER, QRIS)
7. **Status** - transaction status (PENDING, COMPLETED, CANCELLED, REFUNDED)
8. **Actions** - custom action button (Eye icon + "View")

**Data Source:** `salesTransactions` (SalesTransaction[])
**Data Type:** SalesTransaction[]

---

## Data Structure Comparison

### Booking Data
```typescript
{
  id: string;
  bookingNumber: string;           // e.g., "BK-20250101-ABC123"
  customer: { name: string };
  service: { name: string };
  scheduledAt: Date;               // Full date+time
  status: BookingStatus;           // CONFIRMED | PENDING | COMPLETED | CANCELLED
  paymentStatus: PaymentStatus;    // PAID | PARTIAL | PENDING
  totalAmount: number;             // Rp amount
}
```

### Sales Transaction Data
```typescript
{
  id: string;
  transactionNumber: string;       // e.g., "TXN-001"
  transactionDate: Date;           // Just date
  serviceName: string;             // Single or "Multiple Services"
  source: SalesTransactionSource;  // ON_THE_SPOT | FROM_BOOKING
  totalAmount: number;             // Rp amount
  paymentMethod: SalesPaymentMethod; // CASH | CARD | TRANSFER | QRIS
  status: SalesTransactionStatus;  // PENDING | COMPLETED | CANCELLED | REFUNDED
}
```

---

## Differences Found

| Aspect | Booking Tab | Sales Tab | Status |
|--------|------------|-----------|--------|
| **ID Column** | bookingNumber | transactionNumber | Different identifier |
| **Date Format** | Full DateTime (toLocaleString) | Date only (toLocaleDateString) | Different |
| **Customer Info** | Shows customer name | ❌ NOT SHOWN | Missing in Sales |
| **Status Column** | booking.status | transaction.status | Different enum values |
| **Payment Info** | paymentStatus (PAID/PARTIAL) | paymentMethod (CASH/CARD/etc) | Different meaning |
| **Source Info** | ❌ NOT SHOWN | Shows source badge | Not in Booking |
| **Column Order** | Booking, Customer, Service, Date, Status, Payment, Amount, Action | Transaction#, Date, Service, Source, Amount, Payment, Status, Actions | Different order |
| **Date/Time Display** | Full datetime | Date only | Different precision |

---

## Issues & Alignment Strategy

### Current Problems:
1. ❌ **Different Columns** - Sales has "Source" badge, Booking doesn't
2. ❌ **Different Column Order** - Order is completely different
3. ❌ **Different Date Formats** - Booking shows full datetime, Sales shows date only
4. ❌ **Customer Info Missing in Sales** - Sales tab doesn't show customer name
5. ❌ **Payment Info Different** - Booking shows paymentStatus, Sales shows paymentMethod
6. ❌ **Status Values Different** - Booking and Sales use different status enums

---

## Proposed Solution

### Option A: Make Both Identical (Minimum Changes)
**Goal:** Same columns, same order, same data

**Approach:**
1. Create a unified table component that works for both Booking and Sales
2. Standardize columns to: **ID | Customer | Service | Date | Amount | Status | Payment | Action**
3. Map both data sources to same schema

**Challenges:**
- Sales doesn't have Customer relationship
- Booking doesn't have Source information
- Different status/payment structures

### Option B: Make Both Look Similar But Keep Separate (Recommended)
**Goal:** Same visual appearance and column order, but preserve unique data for each

**Proposed Unified Column Order:**
1. **ID/Number** - (bookingNumber or transactionNumber)
2. **Date** - Full datetime for both
3. **Customer** - Customer name (empty for sales if not linked)
4. **Service** - Service name
5. **Amount** - Total Rp amount
6. **Status** - Status badge (use appropriate enum for each)
7. **Payment** - Payment info (paymentStatus for Booking, paymentMethod for Sales)
8. **Source** - (Optional - only for Sales to show "On-the-Spot" vs "From Booking")
9. **Action** - View button

### Option C: Separate But Consistent Styling
**Goal:** Keep data as-is, but apply consistent table styling and badge colors

**Approach:**
- Keep different columns for each
- Apply same CSS classes, colors, and structure
- Ensure badges use consistent color scheme

---

## Recommendation

**I recommend Option B** because:
- ✓ Unified look and feel for both tabs
- ✓ Same column order makes it feel like same interface
- ✓ Can still preserve important unique data (Source for Sales, PaymentStatus for Booking)
- ✓ Shows Customer relationship for both when available
- ✓ Consistent datetime format

---

## Implementation Plan (Option B)

### New Unified Column Structure:
```
ID # | Date | Customer | Service | Amount | Status | Payment | Action
```

### Booking Tab Mapping:
- ID # → bookingNumber
- Date → scheduledAt (full datetime)
- Customer → customer?.name
- Service → service?.name
- Amount → totalAmount
- Status → status (CONFIRMED, PENDING, etc)
- Payment → paymentStatus (PAID, PARTIAL, etc)
- Action → View button

### Sales Tab Mapping:
- ID # → transactionNumber
- Date → transactionDate (convert to full datetime if possible)
- Customer → "-" (or lookup from booking if "From Booking")
- Service → serviceName
- Amount → totalAmount
- Status → status (PENDING, COMPLETED, etc)
- Payment → paymentMethod (CASH, CARD, TRANSFER, QRIS)
- Action → View button

---

## Alternative: Keep Source Column for Sales

If you want to keep the Source information visible for Sales (to differentiate "On-the-Spot" vs "From Booking"), the order could be:

```
ID # | Date | Customer | Service | Amount | Status | Payment | Source | Action
```

But this would make Sales tab have more columns than Booking tab.

---

## Next Steps

Please confirm which approach you prefer:
- **Option A** - Completely unified (same columns for both)
- **Option B** - Same order, preserve unique data (my recommendation)
- **Option C** - Keep different columns, just consistent styling
- **Custom** - Define specific columns you want

Once confirmed, I'll implement the changes.

# Sales Multi-Service & Split Payment Migration

## Overview
Migration `0007_add_multi_service_split_payment_support.sql` adds support for:
1. **Multiple Services per Transaction** - Track individual items in a sales transaction
2. **Split/Partial Payments** - Record partial payments and payment history
3. **Invoice Tracking** - Link generated invoices to sales transactions

---

## New Tables Created

### 1. `sales_transaction_items`
Tracks individual services/items within a sales transaction (similar to invoice_items).

**Columns**:
- `id` (uuid) - Primary key
- `sales_transaction_id` (uuid) - Foreign key to sales_transactions
- `service_id` (uuid) - Reference to service
- `service_name` (text) - Service name snapshot
- `quantity` (integer) - Quantity ordered
- `unit_price` (real) - Price per unit
- `total_price` (real) - Quantity × Unit Price
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Use Case**:
```sql
-- A customer buys 3 services in one transaction
INSERT INTO sales_transaction_items VALUES
  ('item-1', 'trans-123', 'srv-1', 'Haircut', 2, 75000, 150000, now(), now()),
  ('item-2', 'trans-123', 'srv-2', 'Coloring', 1, 100000, 100000, now(), now());
```

---

### 2. `sales_transaction_payments`
Tracks individual payment records for split/partial payments.

**Columns**:
- `id` (uuid) - Primary key
- `sales_transaction_id` (uuid) - Foreign key to sales_transactions
- `payment_amount` (real) - Amount paid in this record
- `payment_method` (text) - cash, card, transfer, qris
- `payment_reference` (text) - Receipt ID, transaction ID, etc.
- `paid_at` (timestamp) - When payment was received
- `notes` (text) - Additional notes
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Use Case**:
```sql
-- Customer pays Rp 200,000 now, rest later
INSERT INTO sales_transaction_payments VALUES
  ('pay-1', 'trans-123', 200000, 'cash', 'RCP001', now(), 'First payment', now(), now()),
  ('pay-2', 'trans-123', 50000, 'transfer', 'TRF001', '2024-10-30 10:00:00', 'Remaining', now(), now());
```

---

## Modified Tables

### `sales_transactions`
Added new columns for split payment support:

**New Columns**:
- `payment_amount` (real) - Initial payment received (can be less than total for split payment)
- `invoice_id` (uuid) - Foreign key to invoices (when auto-generated from transaction)

**Updated Relationships**:
- New foreign key: `sales_transactions.invoice_id` → `invoices.id`

---

## Data Migration Strategy

### For Existing Data (Backward Compatibility):
1. **Existing transactions with single service**:
   - Single row in `sales_transaction_items` created from `serviceId` → `sales_transaction_items.service_id`
   - `payment_amount` = `total_amount` (full payment assumed)

2. **Example Backfill Query**:
```sql
-- Create items from existing transactions
INSERT INTO sales_transaction_items (
  id, sales_transaction_id, service_id, service_name, 
  quantity, unit_price, total_price, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  st.id,
  st.service_id,
  st.service_name,
  1, -- quantity
  st.unit_price,
  st.subtotal,
  st.created_at,
  st.updated_at
FROM sales_transactions st
WHERE st.service_id IS NOT NULL;

-- Update payment amounts from paid_amount
UPDATE sales_transactions
SET payment_amount = CASE 
  WHEN paid_amount > 0 THEN paid_amount
  ELSE total_amount
END
WHERE payment_amount = 0;
```

---

## API/Form Changes Required

### Form Structure (On-the-Spot Transaction):
```typescript
{
  customerId: "...",
  items: [
    { serviceId: "...", quantity: 2, unitPrice: 150000 },
    { serviceId: "...", quantity: 1, unitPrice: 100000 }
  ],
  totalAmount: 400000,
  paymentAmount: 250000, // Partial payment (NEW)
  paymentMethod: "cash",
  paymentReference: "RCP001", // NEW
  notes: "..."
}
```

### Database Insert Flow:
1. **Insert into `sales_transactions`**:
   - Basic transaction data
   - `totalAmount` = sum of items
   - `paymentAmount` = amount received
   - `paymentStatus` = 'paid' | 'partial' | 'pending'

2. **Insert into `sales_transaction_items`** (for each service):
   - Individual service details with quantity & price

3. **Insert into `sales_transaction_payments`** (optional):
   - Record payment for future tracking
   - Can add more payments later for split payment scenarios

---

## Payment Status Logic

```typescript
function getPaymentStatus(transaction: SalesTransaction): PaymentStatus {
  const paidAmount = transaction.paidAmount || 0;
  const totalAmount = transaction.totalAmount;
  
  if (paidAmount >= totalAmount) {
    return 'paid';
  }
  
  if (paidAmount > 0) {
    return 'partial';
  }
  
  return 'pending';
}
```

---

## Indexes Added

For query performance:
- `idx_sales_transaction_items_transaction_id` - Filter items by transaction
- `idx_sales_transaction_payments_transaction_id` - Filter payments by transaction
- `idx_sales_transactions_invoice_id` - Find transactions by invoice

---

## Key Features Enabled

### ✅ Multiple Services
- One transaction can contain 2+ services
- Each service tracked separately with quantity & price
- Total calculated from sum of all items

### ✅ Split/Partial Payments
- `payment_amount` field tracks initial payment
- Can be less than `total_amount` for split payment scenario
- `sales_transaction_payments` table tracks payment history over time
- `payment_status` field indicates: 'paid' | 'partial' | 'pending'

### ✅ Invoice Integration
- Auto-generated invoices from sales transactions are linked via `invoice_id`
- Can track which invoice was created from which transaction

---

## SQL Example: Complete Flow

```sql
-- 1. Create transaction
INSERT INTO sales_transactions (
  id, tenant_id, customer_id, transaction_number, source, status,
  subtotal, tax_rate, tax_amount, discount_amount, total_amount,
  payment_method, payment_status, paid_amount, payment_amount,
  is_home_visit, created_at, updated_at
) VALUES (
  'trans-123', 'tenant-1', 'cust-1', 'TRX001', 'on_the_spot', 'completed',
  300000, 0.1, 30000, 0, 330000,
  'cash', 'partial', 200000, 200000, -- payment_amount = partial payment
  false, now(), now()
);

-- 2. Add items
INSERT INTO sales_transaction_items (
  id, sales_transaction_id, service_id, service_name,
  quantity, unit_price, total_price, created_at, updated_at
) VALUES
  ('item-1', 'trans-123', 'srv-1', 'Haircut', 2, 150000, 300000, now(), now());

-- 3. Record payment
INSERT INTO sales_transaction_payments (
  id, sales_transaction_id, payment_amount, payment_method,
  payment_reference, paid_at, notes, created_at, updated_at
) VALUES (
  'pay-1', 'trans-123', 200000, 'cash',
  'RCP001', now(), 'Partial payment received', now(), now()
);

-- 4. (Later) Record additional payment
INSERT INTO sales_transaction_payments (
  id, sales_transaction_id, payment_amount, payment_method,
  payment_reference, paid_at, notes, created_at, updated_at
) VALUES (
  'pay-2', 'trans-123', 130000, 'transfer',
  'TRF001', now(), 'Remaining balance', now(), now()
);

-- 5. Update transaction to fully paid
UPDATE sales_transactions
SET paid_amount = 330000, payment_status = 'paid', completed_at = now()
WHERE id = 'trans-123';
```

---

## Implementation Checklist

- [ ] Run migration `0007_add_multi_service_split_payment_support.sql`
- [ ] Update API endpoint `/api/sales/transactions` to handle:
  - [ ] Multiple items array
  - [ ] `paymentAmount` vs `totalAmount` (for split payment)
  - [ ] Insert into `sales_transaction_items` table
  - [ ] Insert into `sales_transaction_payments` table
- [ ] Update sales transaction service layer
- [ ] Update invoice generation from sales to sum items
- [ ] Test split payment flow
- [ ] Test partial payment tracking
- [ ] Run backfill migration for existing data (optional)

---

## Notes

- All new fields are backward compatible
- Existing transactions can continue to work with null `invoice_id`
- `payment_amount` defaults to 0, can be calculated from `paid_amount` if needed
- Payment status should be calculated dynamically based on `paid_amount` vs `total_amount`

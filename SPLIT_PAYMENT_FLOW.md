# Split Payment Flow Documentation

## Overview
Split payment memungkinkan customer membayar invoice/sales transaction dalam beberapa kali pembayaran. Misalnya: Total Rp 1.000.000, bayar pertama Rp 600.000, bayar kedua Rp 400.000.

---

## Data Model

### 1. Sales Transaction (Main Record)
```
sales_transactions
├── id
├── total_amount: 1,000,000 (TOTAL yang harus dibayar)
├── paid_amount: 600,000 (TOTAL yang sudah dibayar - di-update per payment)
├── payment_amount: 600,000 (Initial payment - snapshot awal)
├── payment_status: "partial" | "paid" | "pending"
└── payment_reference: "REF001" (Reference pembayaran pertama)
```

### 2. Payment History (Multiple Records)
```
sales_transaction_payments (untuk track setiap pembayaran)
├── payment_1:
│   ├── payment_amount: 600,000
│   ├── payment_method: "cash"
│   ├── payment_reference: "RCP001"
│   └── paid_at: 2024-10-29 10:00:00
│
└── payment_2:
    ├── payment_amount: 400,000
    ├── payment_method: "transfer"
    ├── payment_reference: "TRF001"
    └── paid_at: 2024-10-30 14:00:00
```

---

## Payment Status Logic

```typescript
function getPaymentStatus(transaction: SalesTransaction): PaymentStatus {
  const paidAmount = transaction.paidAmount || 0;
  const totalAmount = transaction.totalAmount;
  
  if (paidAmount >= totalAmount) {
    return 'PAID';           // Lunas
  }
  
  if (paidAmount > 0) {
    return 'PARTIAL_PAID';   // Belum lunas (ada pembayaran sebagian)
  }
  
  return 'PENDING';          // Belum ada pembayaran
}
```

---

## Step-by-Step Flow

### Scenario: Customer beli Rp 1.000.000, bayar Rp 600.000 dulu

### 1️⃣ **Create Transaction (User Input)**
```typescript
const transactionData = {
  customerId: "cust-1",
  items: [
    { serviceId: "srv-1", quantity: 2, unitPrice: 500000 }  // 1M total
  ],
  totalAmount: 1000000,        // Total invoice
  paymentAmount: 600000,       // Yang dibayar sekarang (PARTIAL)
  paymentMethod: "cash",
  paymentReference: "RCP001"   // Nomor struk pertama
};
```

### 2️⃣ **API Create Transaction** → `POST /api/sales/transactions`

API akan:
```typescript
// a) Insert ke sales_transactions
INSERT INTO sales_transactions (
  id, total_amount, paid_amount, payment_amount, payment_status
) VALUES (
  'trans-1', 1000000, 600000, 600000, 'partial'
);

// b) Insert items ke sales_transaction_items
INSERT INTO sales_transaction_items (
  sales_transaction_id, service_id, quantity, unit_price, total_price
) VALUES ('trans-1', 'srv-1', 2, 500000, 1000000);

// c) Record payment pertama di sales_transaction_payments
INSERT INTO sales_transaction_payments (
  sales_transaction_id, payment_amount, payment_method, payment_reference, paid_at
) VALUES (
  'trans-1', 600000, 'cash', 'RCP001', now()
);
```

### 3️⃣ **Display Status**
- Status Badge: **PARTIAL PAID** (warna orange/warning)
- Payment History: "Partial Payment: Rp 600.000 | Remaining: Rp 400.000"
- Show payment details:
  - Amount Received: Rp 600.000
  - Method: Cash
  - Reference: RCP001

### 4️⃣ **Customer Bayar Sisa (Days Later)**

User membuka transaction yang sama dan tambah payment:
```typescript
const additionalPayment = {
  transactionId: "trans-1",
  paymentAmount: 400000,       // Sisa pembayaran
  paymentMethod: "transfer",
  paymentReference: "TRF001"
};
```

### 5️⃣ **API Record Additional Payment** → `POST /api/sales/transactions/{id}/payments`

API akan:
```typescript
// a) Insert payment baru
INSERT INTO sales_transaction_payments (
  sales_transaction_id, payment_amount, payment_method, payment_reference, paid_at
) VALUES (
  'trans-1', 400000, 'transfer', 'TRF001', now()
);

// b) Update total paid_amount di sales_transactions
UPDATE sales_transactions
SET paid_amount = 600000 + 400000 = 1000000,
    payment_status = 'PAID',  // Sekarang jadi PAID
    updated_at = now()
WHERE id = 'trans-1';
```

### 6️⃣ **Final Status**
- Status Badge: **PAID** (warna hijau/success)
- Payment History: "Payment Complete: Rp 1.000.000 | Paid on 2024-10-30"
- Show payment breakdown:
  - Payment 1: Rp 600.000 (Cash) - RCP001
  - Payment 2: Rp 400.000 (Transfer) - TRF001
  - Total: Rp 1.000.000 (LUNAS)

---

## Database Queries

### View Transaction dengan Payment History
```sql
SELECT 
  st.id,
  st.total_amount,
  st.paid_amount,
  st.payment_status,
  COUNT(stp.id) as payment_count,
  SUM(stp.payment_amount) as total_payments,
  ARRAY_AGG(
    jsonb_build_object(
      'amount', stp.payment_amount,
      'method', stp.payment_method,
      'reference', stp.payment_reference,
      'date', stp.paid_at
    )
  ) as payments
FROM sales_transactions st
LEFT JOIN sales_transaction_payments stp ON st.id = stp.sales_transaction_id
WHERE st.id = 'trans-1'
GROUP BY st.id;
```

### Calculate Remaining Balance
```sql
SELECT 
  st.total_amount - COALESCE(SUM(stp.payment_amount), 0) as remaining_balance
FROM sales_transactions st
LEFT JOIN sales_transaction_payments stp ON st.id = stp.sales_transaction_id
WHERE st.id = 'trans-1'
GROUP BY st.id;
```

---

## API Endpoints Needed

### 1. Create Transaction with Initial Payment
```
POST /api/sales/transactions
Body: {
  type: "on_the_spot",
  customerId: "...",
  items: [...],
  totalAmount: 1000000,
  paymentAmount: 600000,      // NEW - initial payment
  paymentMethod: "cash",
  paymentReference: "RCP001"  // NEW
}
```

### 2. Record Additional Payment
```
POST /api/sales/transactions/{id}/payments
Body: {
  paymentAmount: 400000,
  paymentMethod: "transfer",
  paymentReference: "TRF001",
  notes: "Pembayaran sisa"
}
```

### 3. Get Transaction with Payment History
```
GET /api/sales/transactions/{id}
Response: {
  transaction: {
    id, total_amount, paid_amount, payment_status, ...
  },
  payments: [
    { amount, method, reference, date },
    { amount, method, reference, date }
  ],
  remainingBalance: 0,
  paymentHistory: "..."
}
```

---

## UI/UX Display

### Transaction List
```
Transaction  | Amount    | Paid      | Status         | Action
TRX001       | Rp 1.0M   | Rp 600K   | PARTIAL PAID   | [View] [Add Payment]
TRX002       | Rp 500K   | Rp 500K   | PAID           | [View]
TRX003       | Rp 2.0M   | Rp 0      | PENDING        | [View] [Pay]
```

### Transaction Detail
```
┌─ Transaction Detail ─────────────────┐
│                                      │
│ Total Amount: Rp 1.000.000          │
│ Status: ⚠️ PARTIAL PAID             │
│                                      │
│ Payment History:                     │
│ ├─ Rp 600.000 (Cash) - RCP001       │
│ │  Paid: 29 Oct 2024 10:00          │
│ │                                    │
│ └─ Rp 400.000 (Transfer) - TRF001   │
│    Paid: 30 Oct 2024 14:00          │
│                                      │
│ Remaining: Rp 0 (LUNAS!)            │
│                                      │
│ [Add Payment] [Print Invoice] [...]  │
└──────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] Update API `POST /api/sales/transactions` untuk:
  - [ ] Handle `items` array (multiple services)
  - [ ] Handle `paymentAmount` (dapat kurang dari totalAmount)
  - [ ] Insert ke `sales_transaction_items` table
  - [ ] Insert ke `sales_transaction_payments` table
  - [ ] Set `payment_status` berdasarkan paymentAmount vs totalAmount

- [ ] Create API `POST /api/sales/transactions/{id}/payments` untuk:
  - [ ] Add additional payment
  - [ ] Update `paid_amount` di sales_transactions
  - [ ] Update `payment_status`
  - [ ] Record di `sales_transaction_payments`

- [ ] Update API `GET /api/sales/transactions/{id}` untuk:
  - [ ] Return transaction + payment history
  - [ ] Calculate remaining balance
  - [ ] Include all payment records

- [ ] Update UI untuk:
  - [ ] Display "PARTIAL PAID" status dengan remaining balance
  - [ ] Show payment history/breakdown
  - [ ] Add button "Add Payment" untuk partial transactions
  - [ ] Auto-update status ketika fully paid

---

## Why Split Payment Not Working Yet

1. **API masih old schema**: Hanya support single serviceId, belum support items array
2. **paymentAmount field belum digunakan**: Masih hardcode semua ke `paid_amount = totalAmount`
3. **sales_transaction_payments table belum dimanfaatkan**: Belum ada API untuk insert payment records
4. **Payment status logic belum di-trigger**: Form input ada, tapi backend belum process

---

## Next Steps

1. Update `/api/sales/transactions` route untuk handle new schema
2. Update `sales-service.ts` untuk:
   - Handle multiple items
   - Process paymentAmount vs totalAmount
   - Insert ke payment history table
3. Create payment recording endpoint
4. Update UI untuk show payment history & remaining balance
5. Test split payment flow end-to-end

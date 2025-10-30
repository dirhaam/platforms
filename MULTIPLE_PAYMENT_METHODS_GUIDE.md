# Multiple Payment Methods Support Guide

## Current Status: IN PROGRESS

### **Requirement**
Support split payments across multiple methods in ONE transaction:
```
Service: Rp 350,000
Payment:
  - Card: Rp 300,000
  - Cash: Rp 50,000
  - Total: Rp 350,000 (or partial)
```

---

## What's Done ✅

### 1. **Form State Structure** ✅
- Added `PaymentEntry` interface
- Changed from `paymentAmount` + `paymentMethod` to `payments: PaymentEntry[]`
- Each entry: `{ method, amount, reference }`

### 2. **Form Logic** ✅
- Helper functions: `addPaymentEntry()`, `removePaymentEntry()`, `updatePaymentEntry()`
- Validation: Checks payments array, calculates total, validates against service amount
- RequestBody: Includes `payments` array

### 3. **Backend API** ⚠️ 
- Endpoint: `/api/sales/transactions` accepts `payments` array
- **Note:** Currently still expects single `paymentMethod` + `paymentAmount`
- **Need to update:** Route handler to process `payments` array

---

## What's Remaining ⏳

### 1. **Form UI Components** - PRIORITY HIGH
Location: `SalesTransactionDialog.tsx` lines 622-680 and 778-840

Replace single payment section with:
```tsx
{/* Multiple Payment Entries */}
<Card>
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle className="text-sm">Payments</CardTitle>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPaymentEntry}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Payment
      </Button>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {newOnTheSpotTransaction.payments.length === 0 ? (
      <p className="text-sm text-gray-500">No payments added yet</p>
    ) : (
      newOnTheSpotTransaction.payments.map((payment, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
          <div className="col-span-6">
            <Label className="text-xs">Payment Method</Label>
            <Select
              value={payment.method}
              onValueChange={(value) =>
                updatePaymentEntry(index, "method", value as SalesPaymentMethod)
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SalesPaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={SalesPaymentMethod.CARD}>Card</SelectItem>
                <SelectItem value={SalesPaymentMethod.TRANSFER}>Transfer</SelectItem>
                <SelectItem value={SalesPaymentMethod.QRIS}>QRIS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4">
            <Label className="text-xs">Amount (Rp)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={payment.amount}
              onChange={(e) =>
                updatePaymentEntry(index, "amount", parseFloat(e.target.value) || 0)
              }
              className="h-8"
            />
          </div>
          <div className="col-span-2 text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePaymentEntry(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))
    )}
  </CardContent>
</Card>

{/* Total Payment */}
{newOnTheSpotTransaction.payments.length > 0 && (
  <div className="grid gap-2 p-3 bg-gray-50 rounded-lg text-sm">
    <div className="flex justify-between font-semibold">
      <span>Total Payment:</span>
      <span>Rp {calculateTotalPayment(newOnTheSpotTransaction.payments).toLocaleString("id-ID")}</span>
    </div>
    {calculateTotalPayment(newOnTheSpotTransaction.payments) < calculateOnTheSpotTotal() && (
      <div className="flex justify-between text-orange-600 text-xs">
        <span>Remaining:</span>
        <span>Rp {(calculateOnTheSpotTotal() - calculateTotalPayment(newOnTheSpotTransaction.payments)).toLocaleString("id-ID")}</span>
      </div>
    )}
  </div>
)}
```

**Repeat same for `from_booking` section**

### 2. **Update API Endpoint** - PRIORITY HIGH
Location: `app/api/sales/transactions/route.ts`

Handle both:
```tsx
// Old format (backward compat)
if (transactionData.paymentMethod && transactionData.paymentAmount) {
  // Convert to new format
  transactionData.payments = [{
    method: transactionData.paymentMethod,
    amount: transactionData.paymentAmount,
    reference: transactionData.paymentReference
  }];
}

// New format
if (transactionData.payments && Array.isArray(transactionData.payments)) {
  // Pass to service
}
```

### 3. **Update Sales Service** - PRIORITY HIGH
Location: `lib/sales/sales-service.ts` method `createTransactionWithItems()`

Changes:
```tsx
// Accept payments array
async createTransactionWithItems(transactionData: {
  ...
  payments: Array<{ method: SalesPaymentMethod; amount: number; reference?: string }>;
  paymentAmount?: number; // For compat - sum of payments
  paymentMethod?: SalesPaymentMethod; // For compat - first payment method
  ...
}): Promise<SalesTransaction> {
  // Calculate total payment from payments array
  const paymentAmount = transactionData.payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentMethod = transactionData.payments[0]?.method;
  
  // Create transaction (same as before)
  
  // Record each payment separately in sales_transaction_payments
  const paymentRecords = transactionData.payments.map(p => ({
    id: uuidv4(),
    sales_transaction_id: transactionId,
    payment_amount: p.amount,
    payment_method: p.method,
    payment_reference: p.reference || null,
    paid_at: new Date().toISOString(),
    notes: p.reference ? `Reference: ${p.reference}` : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  
  const { error: paymentsError } = await supabase
    .from('sales_transaction_payments')
    .insert(paymentRecords);
}
```

### 4. **Test Workflow** - PRIORITY MEDIUM
- Create transaction with: Card 300,000 + Cash 50,000 = 350,000 total payment
- Verify `sales_transactions` table has:
  - `payment_status`: 'paid'
  - `paid_amount`: 350,000
- Verify `sales_transaction_payments` table has 2 records:
  - Record 1: CARD, 300,000
  - Record 2: CASH, 50,000
- Create invoice from transaction
- Verify invoice shows correct payment amount and status

---

## Implementation Checklist

- [ ] Add payment entries UI to form (on_the_spot)
- [ ] Add payment entries UI to form (from_booking)
- [ ] Update API endpoint to handle payments array
- [ ] Update sales service to handle payments array
- [ ] Record each payment separately in sales_transaction_payments
- [ ] Test single payment (backward compat)
- [ ] Test multiple payments (Card + Cash)
- [ ] Test partial payment (100,000 of 350,000)
- [ ] Test invoice creation from multi-payment transaction
- [ ] Verify payment status displays correctly (PAID/PARTIAL/UNPAID)

---

## API Request Example

### Before (Single Payment)
```json
{
  "type": "on_the_spot",
  "customerId": "...",
  "items": [...],
  "totalAmount": 350000,
  "paymentAmount": 300000,
  "paymentMethod": "card",
  "tenantId": "..."
}
```

### After (Multiple Payments)
```json
{
  "type": "on_the_spot",
  "customerId": "...",
  "items": [...],
  "totalAmount": 350000,
  "paymentAmount": 350000,
  "payments": [
    { "method": "card", "amount": 300000, "reference": "CC-123456" },
    { "method": "cash", "amount": 50000 }
  ],
  "tenantId": "..."
}
```

---

## Database Tables Involved

1. **sales_transactions**
   - Stores summary: `paid_amount`, `payment_method` (primary/first method)

2. **sales_transaction_payments** ⭐ (Key table)
   - Stores individual payments
   - One row per payment
   - `payment_method`, `payment_amount`, `paid_at`, `payment_reference`

3. **invoices**
   - `paid_amount` (recalculated from sales_transaction_payments)
   - `payment_status` (PAID/PARTIAL_PAID/UNPAID)

---

## Notes

- The backend can already handle multiple payments via `sales_transaction_payments` table
- Invoice creation already calculates `paid_amount` from payment history
- Main work is: Form UI + validation + API endpoint update
- Keep backward compatibility for single payment format


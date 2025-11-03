# Bug Fix: Tax & Fees Double Charge Issue

## Ringkasan Masalah (Summary)
Ditemukan 2 bug terkait perhitungan pajak dan biaya tambahan di seluruh aplikasi:
1. **Total Amount tidak menjumlahkan tax dan fees di booking form** 
2. **Double charge saat generate invoice dari booking**

---

## Bug #1: Incorrect Total Amount in BookingDialog

### Masalah
Di `BookingDialog.tsx`, fungsi `calculateTotal()` hanya mengembalikan `calculatedPrice` tanpa memperhitungkan tax, service charge, dan additional fees.

**Contoh Error:**
```
Base Service: IDR 350.000
Tax 10%: IDR 35.000
Service Charge: IDR 25.000
Kursi Charge: IDR 35.000
─────────────────────────
Total Amount (shown): IDR 350.000 ❌ SALAH!
Total Amount (should): IDR 445.000 ✓
```

### Root Cause
Function `calculateTotal()` line 147-148:
```typescript
const calculateTotal = () => {
  return calculatedPrice;  // ❌ Missing tax, service charge, additional fees
};
```

### Solusi
Modified `calculateTotal()` untuk menghitung semua komponen:
```typescript
const calculateTotal = () => {
  if (!selectedService) return 0;
  
  let subtotal = Number(selectedService.price);
  if (formData.isHomeVisit && selectedService.homeVisitSurcharge) {
    subtotal += Number(selectedService.homeVisitSurcharge);
  }
  
  let total = subtotal;
  
  // Add tax
  if (invoiceSettings?.taxServiceCharge?.taxPercentage) {
    total += subtotal * (invoiceSettings.taxServiceCharge.taxPercentage / 100);
  }
  
  // Add service charge
  if (invoiceSettings?.taxServiceCharge?.serviceChargeRequired && invoiceSettings?.taxServiceCharge?.serviceChargeValue) {
    if (invoiceSettings.taxServiceCharge.serviceChargeType === 'fixed') {
      total += invoiceSettings.taxServiceCharge.serviceChargeValue;
    } else {
      total += subtotal * (invoiceSettings.taxServiceCharge.serviceChargeValue / 100);
    }
  }
  
  // Add additional fees
  if (invoiceSettings?.additionalFees && invoiceSettings.additionalFees.length > 0) {
    invoiceSettings.additionalFees.forEach(fee => {
      if (fee.type === 'fixed') {
        total += fee.value;
      } else {
        total += subtotal * (fee.value / 100);
      }
    });
  }
  
  return Math.round(total);
};
```

### File Changed
- `components/booking/BookingDialog.tsx`

### Commit
```
19693f4 Fix Total Amount calculation in BookingDialog to include tax, service charge, and additional fees
```

---

## Bug #2: Double Charge When Generating Invoice from Booking

### Masalah
Ketika generate invoice dari booking, tax dan fees dikalkulasi **DULU KALI**:
1. **Pertama** saat booking creation (disimpan di booking table)
2. **Kedua** saat invoice generation (dikalkulasi ulang dari settings)

**Alur Double Charge:**

```
BOOKING CREATION (BENAR ✓):
├─ Base: 350.000
├─ Tax 10%: 35.000 (dari subtotal)
├─ Service Charge: 25.000 (dari subtotal)
├─ Additional Fees: 35.000 (dari subtotal)
└─ TOTAL: 445.000 ✓
   Simpan di booking.total_amount = 445.000
   Simpan tax_percentage = 10
   Simpan service_charge_amount = 25.000
   Simpan additional_fees_amount = 35.000

INVOICE GENERATION (SALAH ❌):
├─ createInvoiceFromBooking():
│  └─ items[0].unitPrice = booking.total_amount = 445.000
├─ createInvoice():
│  ├─ subtotal = 445.000
│  ├─ tax = 445.000 * 10% = 44.500 ← DIKENAKAN LAGI!
│  ├─ service_charge = 445.000 * 7% = 31.150 ← DIKENAKAN LAGI!
│  ├─ additional_fees = 445.000 * 10% = 44.500 ← DIKENAKAN LAGI!
│  └─ TOTAL = 445.000 + 44.500 + 31.150 + 44.500 = 565.150 ❌ DOUBLE CHARGED!
```

### Root Cause
Di `InvoiceService.createInvoiceFromBooking()`:
```typescript
// ❌ Menggunakan total_amount yang sudah include tax/fees
const invoiceData: CreateInvoiceRequest = {
  items: [{
    description: serviceName,
    quantity: 1,
    unitPrice: totalAmount,  // ❌ Sudah include tax/fees
    serviceId,
  }],
};

// Kemudian createInvoice() menghitung ULANG tax/fees dari settings
```

### Solusi

**Step 1:** Extract pre-calculated values dari booking
```typescript
const taxPercentage = parseDecimal(booking.tax_percentage ?? 0);
const serviceChargeAmount = parseDecimal(booking.service_charge_amount ?? 0);
const additionalFeesAmount = parseDecimal(booking.additional_fees_amount ?? 0);

// Calculate base amount = total - tax - service_charge - additional_fees
const baseAmount = totalAmount - taxPercentage - serviceChargeAmount - additionalFeesAmount;
```

**Step 2:** Pass pre-calculated values ke createInvoice()
```typescript
const invoiceData: CreateInvoiceRequest = {
  items: [{
    unitPrice: baseAmount,  // ✓ Base amount saja
  }],
  // Pass pre-calculated values untuk prevent recalculation
  preTaxPercentage: taxPercentage,
  preServiceChargeAmount: serviceChargeAmount,
  preAdditionalFeesAmount: additionalFeesAmount,
};
```

**Step 3:** Modified createInvoice() untuk menggunakan pre-calculated values
```typescript
const hasPreCalculated = (data as any).preTaxPercentage !== undefined || 
                         (data as any).preServiceChargeAmount !== undefined || 
                         (data as any).preAdditionalFeesAmount !== undefined;

if (hasPreCalculated) {
  // ✓ Gunakan pre-calculated values, jangan recalculate
  taxPercentage = (data as any).preTaxPercentage || 0;
  taxAmount = new Decimal((data as any).preTaxPercentage || 0);
  serviceChargeAmount = new Decimal((data as any).preServiceChargeAmount || 0);
  additionalFeesAmount = new Decimal((data as any).preAdditionalFeesAmount || 0);
} else {
  // Calculate from settings (normal flow)
  const settings = await InvoiceSettingsService.getSettings(tenantId);
  // ... calculate tax, service charge, additional fees
}
```

### Files Changed
- `lib/invoice/invoice-service.ts`
  - Modified `createInvoiceFromBooking()` to extract and pass pre-calculated values
  - Modified `createInvoice()` to accept and use pre-calculated tax/fees
- `types/invoice.ts`
  - Updated `CreateInvoiceRequest` interface dengan optional pre-calculated fields

### Commit
```
93571cb Fix double charge bug when generating invoice from booking
```

---

## Verification

### Test Case: Generate Invoice dari Booking
```
1. Create booking dengan service 350.000
2. Tax 10% (35.000) + Service Charge 25.000 + Additional Fee 35.000 = 445.000
3. Generate invoice dari booking
4. Invoice total harus = 445.000 ✓ (bukan 565.150 ❌)
```

### Code Paths Tested
- ✅ BookingDialog: Amount breakdown calculation
- ✅ NewBookingDialog: Amount breakdown calculation  
- ✅ BookingService: Booking creation dengan tax/fees calculation
- ✅ InvoiceService: Creating invoice from booking dengan pre-calculated prevention

---

## Potential Related Issues (Future Investigation)

### 1. Sales Transaction Invoice Generation
Similar issue mungkin ada di `createInvoiceFromSalesTransaction()`:
```typescript
const baseItemPrice = parseDecimal(
  transaction.unit_price ?? transaction.subtotal ?? transaction.total_amount ?? 0
);
```
Jika `unit_price` tidak tersedia, akan fallback ke `total_amount` yang mungkin sudah include tax/fees.

**Rekomendasi:** Apply same fix pattern untuk sales transactions jika ditemukan unit_price field kosong dan total_amount digunakan.

### 2. PricingCalculator Component
File `components/booking/PricingCalculator.tsx` menghitung:
- Base price
- Home visit surcharge
- Travel surcharge

Perlu verify bahwa travel surcharge tidak di-double-charge di invoice generation.

---

## Technical Notes

### Where Tax/Fees Are Stored
**Booking Table:**
- `total_amount`: Final total (base + tax + service_charge + additional_fees)
- `tax_percentage`: Tax percentage applied
- `service_charge_amount`: Service charge amount calculated
- `additional_fees_amount`: Additional fees amount calculated

**Invoice Table:**
- `subtotal`: Sum of all items
- `tax_percentage`: Tax percentage
- `service_charge_amount`: Service charge amount
- `additional_fees_amount`: Additional fees amount
- `total_amount`: Final total

### Calculation Logic (CORRECT)
```
subtotal = base_price + home_visit_surcharge
tax = subtotal * tax_percentage / 100
service_charge = (fixed or percentage of subtotal)
additional_fees = (fixed or percentage of subtotal per fee)
total = subtotal + tax + service_charge + additional_fees - discount
```

### Key Principle
**NEVER calculate tax/fees from already-calculated totals.** Always calculate from base amount (before tax/fees).

---

## Files Modified
1. `components/booking/BookingDialog.tsx` (35 line insertions)
2. `lib/invoice/invoice-service.ts` (70 line insertions, 26 line deletions)
3. `types/invoice.ts` (4 line insertions)

Total: 109 insertions, 26 deletions

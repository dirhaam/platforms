# Sales vs Booking - Detailed Comparison

## 📊 Quick Overview

| Aspek | Sales | Booking | Sama? |
|-------|-------|---------|-------|
| **Data Source** | sales_transactions + sales_transaction_payments | bookings + booking_payments | ❌ BERBEDA |
| **Detail View** | SalesTransactionDetailsDialog (Modal) | UnifiedBookingPanel (Drawer + Tabs) | ❌ BERBEDA |
| **Tabs/Sections** | Dalam modal satu layar | Tabs: Summary, Payments, Invoices, History | ❌ BERBEDA |
| **Invoice Generation** | createInvoiceFromSalesTransaction() | createInvoiceFromBooking() | ⚠️ MIRIP |
| **Invoice Display** | Shows payment breakdown | Shows payment breakdown | ✅ SAMA |
| **Payment Tracking** | sales_transaction_payments | booking_payments | ❌ BERBEDA |
| **History/Audit Log** | Tidak ada | booking_history table | ❌ BERBEDA |

---

## 🔍 DETAIL COMPARISON

### 1️⃣ **DATA STRUCTURE**

#### SALES
```
sales_transactions
├── id
├── transaction_number (e.g., "TRX-001")
├── service_name
├── payment_status (paid, pending, partial)
├── total_amount
├── paid_amount
└── payments[] ← Multiple entries in sales_transaction_payments

sales_transaction_payments
├── id
├── sales_transaction_id (FK)
├── payment_amount
├── payment_method (cash, card, transfer, qris)
├── paid_at
```

#### BOOKING
```
bookings
├── id
├── booking_number (e.g., "BK-20251031-XXXXX")
├── service_id (FK to services)
├── payment_status (paid, pending, partial)
├── total_amount
├── paid_amount
├── dp_amount (Down Payment)
└── payments[] ← Multiple entries in booking_payments

booking_payments
├── id
├── booking_id (FK)
├── payment_amount
├── payment_method (cash, card, transfer, qris)
├── paid_at
```

**PERBEDAAN UTAMA:**
- Sales: Menyimpan service_name langsung
- Booking: Menyimpan service_id (FK), harus join ke services table
- Booking: Punya field dp_amount khusus untuk down payment

---

### 2️⃣ **DETAIL VIEW COMPONENT**

#### SALES - SalesTransactionDetailsDialog.tsx
```
Format: MODAL (Dialog popup)

Struktur:
- Transaction Header
  └── Transaction Number + Date
  
- Grid 2 Kolom
  ├── Status Badge
  ├── Source (Online/Offline)
  ├── Payment Method Badge
  ├── Service Name
  ├── Duration
  └── Home Visit Info
  
- Customer Info
  ├── Name
  ├── Phone
  └── Email
  
- Amount Summary
  ├── Subtotal
  ├── Discount
  ├── Tax
  ├── Total Amount
  └── Paid Amount
  
- Payment History (jika multiple payments)
  └── Tabel: Method | Amount | Date
  
- Action Buttons
  ├── Generate Invoice
  ├── Download PDF
  └── Delete
```

#### BOOKING - UnifiedBookingPanel.tsx
```
Format: DRAWER (Side panel) + TABS

Struktur Tab:

📋 SUMMARY TAB
- Booking Header
  ├── Booking Number + Status
  ├── Customer Info (Card)
  └── Service Info (Card)
  
- Timeline (Visual)
  ├── Scheduled Date/Time
  ├── Duration
  ├── Location
  └── Home Visit Address (if applicable)
  
- Amount Section
  ├── Total Amount
  ├── DP Amount (jika ada)
  ├── Paid Amount
  └── Remaining
  
- Status Badges

💳 PAYMENTS TAB
- Payment History
  └── Tabel: Method | Amount | Date
  
- Payment Recording Section
  ├── Mark as Paid Button
  ├── Payment Dialog (untuk input payment baru)
  
- Payment Breakdown
  ├── Showing DP payment
  ├── Showing additional payments
  └── Total paid calculation

📄 INVOICES TAB
- Invoice List
  ├── Invoice Number
  ├── Status
  ├── Amount
  └── Actions (Download, Send, Delete)
  
- Generate Invoice Button
- Invoice Preview Modal

📝 HISTORY TAB
- Timeline of all events
  ├── Booking created
  ├── Payment recorded
  ├── Status changes
  └── Invoice generation
  
- Each event shows:
  ├── Description
  ├── Timestamp
  ├── Actor (System/User)
  └── Metadata (amounts, methods, etc)
```

**PERBEDAAN UTAMA:**
- Sales: MODAL (semua info dalam 1 layar)
- Booking: DRAWER + TABS (organized into sections)
- Booking: Ada History tab untuk audit trail
- Booking: Ada dedicated Payments tab dengan recording capability
- Booking: Lebih comprehensive

---

### 3️⃣ **GENERATE INVOICE LOGIC**

#### SALES - createInvoiceFromSalesTransaction()

```javascript
Langkah:
1. Fetch sales_transactions record
2. Cek if invoice sudah ada (idempotency)
3. Fetch sales_transaction_payments (payment history)
4. Fetch service details (untuk multi-service checks)
5. Build invoice items:
   ├── Service item
   ├── Home visit surcharge (if applicable)
   └── Calculate totals
6. Tentukan invoice status:
   ├── payment_status='paid' → invoice status='paid'
   ├── payment_status='partial' → invoice status='sent'
   └── default → invoice status='draft'
7. Hitung paidAmount dari total_amount atau paid_amount
8. Create invoice with payment history
```

#### BOOKING - createInvoiceFromBooking()

```javascript
Langkah:
1. Fetch bookings record
2. Cek if invoice sudah ada (idempotency)
3. Fetch booking_payments (payment history)
4. Fetch service details
5. Build invoice items:
   ├── Service item
   └── Calculate totals (sudah termasuk surcharge)
6. Tentukan invoice status:
   ├── payment_status='paid' → invoice status='paid'
   ├── payment_status='partial' → invoice status='sent'
   └── default → invoice status='draft'
7. Hitung paidAmount dari paid_amount
8. Create invoice with payment history
```

**KESAMAAN:**
- ✅ Dua-duanya cek idempotency (tidak buat invoice ganda)
- ✅ Dua-duanya fetch payment history
- ✅ Dua-duanya hitung status berdasarkan payment_status
- ✅ Dua-duanya pass payment history ke invoice

**PERBEDAAN:**
- Sales: Bisa handle multi-service transactions
- Booking: Single service transaction saja

---

### 4️⃣ **INVOICE DISPLAY (VIEW/PREVIEW)**

#### SALES INVOICE
```
Invoice Header
├── Invoice Number
├── Issue Date
├── Due Date
└── Customer Name

Items Section
├── Service names
├── Quantities
├── Unit prices
├── Total per item

Summary
├── Subtotal
├── Tax
├── Discount
├── TOTAL AMOUNT

Payment Breakdown (✨ NEW)
├── Payment 1: Cash - Rp 150,000 - 31/10/2025
├── Payment 2: Transfer - Rp 200,000 - 01/11/2025
└── Total Paid: Rp 350,000

QR Code (untuk payment)
```

#### BOOKING INVOICE
```
Invoice Header
├── Invoice Number
├── Issue Date
├── Due Date
└── Booking Number (untuk reference)

Items Section
├── Service name
├── Quantity: 1
├── Unit price: total_amount
└── Total

Summary
├── Subtotal
├── Tax
├── Discount
├── TOTAL AMOUNT

Payment Breakdown (✨ NEW)
├── Down Payment: Transfer - Rp 150,000 - 31/10/2025
├── Additional: Cash - Rp 200,000 - 01/11/2025
└── Total Paid: Rp 350,000

QR Code (untuk payment)
```

**KESAMAAN:**
- ✅ Dua-duanya menampilkan payment breakdown
- ✅ Dua-duanya menampilkan invoices dengan struktur mirip
- ✅ Dua-duanya fetch dari database (tidak mock data)

**PERBEDAAN:**
- Booking: Menampilkan booking_number untuk reference
- Sales: Tidak ada DP konsep

---

## ✅ KESIMPULAN

### **Apakah Detail View Sama?**
❌ **TIDAK SAMA**
- Sales: Modal dialog (singkat, compact)
- Booking: Drawer + tabs (comprehensive, detailed)

### **Apakah Data Ditampilkan Sama?**
⚠️ **SEBAGIAN SAMA**
- **Sama:**
  - Status, payment status, amounts, payment history
  - Customer info, service info
  
- **Berbeda:**
  - Booking punya: DP amount, booking history, dedicated payment recording
  - Sales punya: Multi-service capability

### **Apakah Generate Invoice Sama?**
✅ **LOGIKA SAMA, IMPLEMENTASI BERBEDA**
- Dua-duanya mengikuti pattern yang sama:
  1. Fetch transaction/booking
  2. Cek idempotency
  3. Fetch payment history
  4. Hitung payment status
  5. Create invoice

- **Perbedaan detail:**
  - Sales: Handle multi-service
  - Booking: Handle DP + home visit

### **Apakah Invoice Display Sama?**
✅ **SAMA**
- Dua-duanya sekarang menampilkan **payment breakdown** (hasil dari fix invoice-service.ts)
- Structure dan format invoice mirip
- Keduanya show individual payment entries dengan method, amount, date

---

## 🎯 REKOMENDASI

### Jika Ingin Unified Experience:
1. **Standardize Invoice Template:**
   - Gunakan same component untuk render invoice (SalesInvoicePreview vs BookingInvoicePreview)
   
2. **Standardize Detail View:**
   - Bisa buat generic `TransactionDetailsPanel` component
   - Dengan property untuk switch antara sales/booking mode

3. **Standardize Payment Tracking:**
   - Dua-duanya sudah mirip (sales_transaction_payments vs booking_payments)
   - Bisa abstract menjadi generic payment recording function

### Untuk Sekarang:
✅ **Dua-duanya SUDAH FUNCTIONAL**
- Invoice generation: ✅ Working
- Payment breakdown display: ✅ Working (baru diperbaiki)
- Payment history tracking: ✅ Working
- Status calculation: ✅ Working

**Jangan diubah** - fokus pada production testing dan performance! 🚀

# Quick Sale - On-The-Spot Customer Flow

**Document Purpose:** Explain how to handle walk-in (on-the-spot) customers using the Quick Sale feature

---

## 📋 QUICK REFERENCE

### BEFORE (Without Quick Sale):
```
Walk-in customer arrives
  ↓
Must go to Menu Sales (separate menu)
  ↓
Click [+ Create On-The-Spot]
  ↓
Modal form (limited space)
  ↓
Hard to see details on mobile
```

### NOW (With Quick Sale):
```
Walk-in customer arrives
  ↓
Open Bookings page (unified place!)
  ↓
Click [+ Quick Sale] button
  ↓
Dialog form (responsive, all info visible)
  ↓
Easy on mobile & desktop
```

---

## 🚀 STEP-BY-STEP WORKFLOW

### Step 1: Open Bookings Page
```
URL: /tenant/admin/bookings
Shows:
  ├─ [+ New Booking]  (for pre-bookings)
  └─ [+ Quick Sale]   (for walk-ins) ← CLICK HERE
```

### Step 2: Click [+ Quick Sale]
Dialog opens with form:
```
╔═══════════════════════════════════════╗
║ Create Quick Sale                     ║
╠═══════════════════════════════════════╣
║                                       ║
║ Customer * [Select dropdown]          │
║   (Shows: Customer Name (Phone))      │
║                                       ║
║ Service *  [Select dropdown]          │
║   (Shows: Service Name - Rp XXXXX)    │
║                                       ║
║ Payment Method [Select dropdown]      │
║   • Cash                              │
║   • Card                              │
║   • Bank Transfer                     │
║   • QRIS                              │
║                                       ║
║ Notes [Text area]                     │
║   (Optional - add any notes)          │
║                                       ║
║ [Cancel]  [Create Sale]               │
║                                       ║
╚═══════════════════════════════════════╝
```

### Step 3: Fill Form

#### 3a. Select Customer
```
Dropdown shows all customers:
✓ Ahmad Saputra (081xxxxxxx)
✓ Siti Nurhaliza (082xxxxxxx)
✓ Budi Santoso (083xxxxxxx)
etc.

If customer not in list → Customer must exist first!
(Admin can create from Menu Customers or landing page)
```

#### 3b. Select Service
```
Dropdown shows all services with prices:
✓ Massage - Rp 500,000
✓ Spa Treatment - Rp 750,000
✓ Facial - Rp 300,000
✓ Full Body Treatment - Rp 1,000,000
etc.

Service price is FINAL amount for transaction
```

#### 3c. Select Payment Method
```
Options:
✓ Cash
✓ Card (Credit/Debit)
✓ Bank Transfer
✓ QRIS

Select based on how customer will pay
```

#### 3d. Add Notes (Optional)
```
Example notes:
- "Customer prefers morning time"
- "Allergic to specific oils"
- "Preferred therapist: Siti"
- "Follow-up appointment needed"
etc.
```

### Step 4: Create Sale
Click [Create Sale] button
```
✓ Form validated
✓ API POST /api/sales/transactions
✓ type: 'on_the_spot'
✓ All fields sent to backend
↓
SUCCESS! Toast: "Quick sale created successfully!"
↓
Dialog closes
↓
Sale transaction created: SALE-001, SALE-002, etc.
```

---

## 📊 COMPARISON: Pre-Booking vs On-The-Spot

### PRE-BOOKING FLOW
```
Step 0: Customer books from Landing Page
  ↓ (Pre-booking created with status PENDING)
Step 1: Bookings Menu → View booking
  ↓ (Confirms & updates status to CONFIRMED)
Step 2: Tab Payment → Record payment
  ↓ (Status changes to PAID)
Step 3: Tab Sales → Create sales from booking
  ↓ (Transaction auto-created with booking data)
Step 4: Tab Invoice → Generate invoice
  ↓ (Invoice auto-generated from booking)
Step 5: Send WhatsApp
  ✅ Complete booking flow
```

### ON-THE-SPOT FLOW (SIMPLIFIED!)
```
Walk-in arrives:
  ↓
Quick Sale → Customer + Service + Payment
  ✅ ONE FORM, done in seconds
  ↓
Sale transaction created instantly
  ↓ (Optional) Generate invoice from Menu Sales
  ✅ No booking needed, no multi-step process
```

---

## ✨ KEY FEATURES

### ✅ Unified Place
- Same page as bookings
- No need to switch menus
- One button access

### ✅ Responsive Design
- Works on desktop (dialog centered)
- Works on tablet (optimized form)
- Works on mobile (full-width form)

### ✅ Complete Information
- Customer + phone visible in dropdown
- Service + price visible in dropdown
- Payment method selected
- Notes for any special requests

### ✅ Smart Validation
- Requires customer & service
- Shows error if missing
- Prevents empty submissions

### ✅ Fast Checkout
- One page, no menu switching
- Form takes 30 seconds
- Transaction created instantly

---

## 🎯 USE CASES

### Case 1: Customer Walks In Without Booking
```
Scenario: Customer arrives, says "I want massage"

Steps:
1. Click [+ Quick Sale]
2. Select customer from list (or create new in Customers menu first)
3. Select "Massage" service
4. Select "Cash" payment
5. [Create Sale]
6. Done! ✓ SALE-001 created
7. Optional: Generate invoice if needed
```

### Case 2: Customer Wants Different Service Than Booked
```
Scenario: Customer booked massage but wants spa instead

Steps (if treating as new sale):
1. Click [+ Quick Sale]
2. Select same customer
3. Select "Spa Treatment" (different service)
4. Select payment method
5. [Create Sale]
6. Done! ✓ SALE-002 created for spa service
```

### Case 3: Group Walk-In
```
Scenario: 3 customers come together

Steps:
1. Create quick sale for customer 1
2. Create quick sale for customer 2
3. Create quick sale for customer 3
Result: SALE-001, SALE-002, SALE-003 created
```

---

## 🔄 AFTER CREATING QUICK SALE

### Next Steps

#### Option 1: Just Track the Sale
- Sale created ✓
- Payment received ✓
- Done! ✓

#### Option 2: Generate Invoice
1. Go to Menu Sales
2. Find SALE-001
3. Click [Generate Invoice]
4. Send invoice via WhatsApp
5. Done! ✓

---

## ⚠️ IMPORTANT NOTES

### About Customer
- **Must exist in system** before creating quick sale
- If customer new: 
  - Admin creates in Menu Customers, OR
  - Customer self-registers on landing page first

### About Service
- **Service must already exist** in system
- Admin sets up services in Menu Services
- Includes: name, price, duration, category

### About Payment Method
- Just select how customer WILL pay
- Actual payment handling depends on payment system integration
- For now: just records the method selected

### About Invoices
- Quick sale is just a transaction record
- Optional to generate invoice after
- Invoice can be generated from Menu Sales

---

## 📱 MOBILE EXPERIENCE

### Before (Without Quick Sale)
❌ Hard to see full form
❌ Must go to separate Sales menu
❌ Cramped dialog

### Now (With Quick Sale)
✅ Full-width responsive dialog
✅ One unified page
✅ Easy to fill on phone

---

## 🆘 TROUBLESHOOTING

### Problem: "Please select customer and service"
**Cause:** Form not filled completely
**Solution:** Select both customer AND service from dropdowns

### Problem: No customers in dropdown
**Cause:** No customers created yet
**Solution:** 
1. Go to Menu Customers → Add new customer
2. OR Ask customer to register on landing page
3. Then come back to Quick Sale

### Problem: No services in dropdown
**Cause:** No services created in system
**Solution:** 
1. Go to Menu Services
2. Add services with prices
3. Then come back to Quick Sale

### Problem: "Failed to create quick sale"
**Cause:** Backend error
**Solution:** 
1. Check browser console (F12) for error
2. Verify all fields filled
3. Try again or contact support

---

## 💡 BEST PRACTICES

### ✅ DO:
1. Fill all required fields (Customer, Service, Payment)
2. Add notes if special requests
3. Double-check customer before creating
4. Double-check service selected
5. Use correct payment method

### ❌ DON'T:
1. Don't create sale without customer
2. Don't create sale without service
3. Don't forget to record actual payment
4. Don't forget to generate invoice if needed

---

## 🎓 SUMMARY

**Quick Sale = Fast on-the-spot transaction creation**

One page → One form → One button = Transaction created instantly!

```
┌──────────────────────────┐
│  Bookings Page           │
│  ┌────────────────────┐  │
│  │ [+ New Booking]    │  │ ← For pre-bookings
│  │ [+ Quick Sale] ←─┐ │  │ ← For walk-ins
│  └────────────────────┘  │
│          ↓               │
│     Dialog Form:         │
│     Customer, Service    │
│     Payment, Notes       │
│          ↓               │
│     SALE Created! ✓      │
└──────────────────────────┘
```

**No menu switching, no complexity, just fast transactions!** 🚀


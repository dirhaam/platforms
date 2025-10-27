# Booking Management Issues Report

**Date:** 2025-01-21  
**Status:** Investigation Complete - Issues Identified  
**Priority:** HIGH  

---

## ISSUE #1: Customer Data Not Loading ❌

### Location
- `app/tenant/admin/bookings/content.tsx` (Line 44-55)

### Problem
Customers are fetched correctly from the API, but the data structure in the response might be incorrect, or the API is not returning data properly.

### Root Cause Analysis
```typescript
// In content.tsx
const customersRes = await fetch('/api/customers', {
  headers: { 'x-tenant-id': subdomain! }
});

const customersData = await customersRes.json();
setCustomers(customersData.customers || []);  // ← Expects .customers property
```

**Expected API Response:**
```json
{
  "customers": [
    { "id": "...", "name": "...", "email": "...", "phone": "..." },
    ...
  ]
}
```

**Actual Response from `/api/customers`:**
Looking at the API (`app/api/customers/route.ts`), the `CustomerService.getCustomers()` might return a different structure:
```json
{
  "customers": [...],
  "total": 0,
  "hasMore": false
}
```

### Evidence
- API endpoint: `app/api/customers/route.ts` returns `CustomerService.getCustomers(resolvedTenantId, {...})`
- No explicit structure validation shown
- Content component expects `customersData.customers` to be an array

### How to Reproduce
1. Go to Bookings page
2. Check browser console network tab
3. Look at `/api/customers` response - check if it has correct structure

---

## ISSUE #2: Status Management Not Functional ❌

### Location
- `components/booking/BookingManagement.tsx` (Lines 724-752)
- `app/tenant/admin/bookings/content.tsx` (Lines 88-96)

### Problem
Clicking status buttons (Pending/Confirmed/Completed/Cancelled) and payment status buttons does NOT update the database. Only updates local UI state.

### Root Cause Analysis

**Component Flow:**
```
User clicks "Confirmed" button
    ↓
handleUpdateStatus("confirmed") called
    ↓
onBookingUpdate?.(selectedBooking.id, { status: "confirmed" })
    ↓
Parent component callback (content.tsx line 88-96)
    ↓
await fetchTenantData()  // ← Only refreshes data, doesn't update!
```

**The Problem:**
```typescript
// In content.tsx - this is what the callback does:
onBookingUpdate={async (bookingId, updates) => {
  await fetchTenantData();  // ← Only fetches, doesn't save!
}}
```

**What should happen:**
```typescript
// Should make API call to update booking
onBookingUpdate={async (bookingId, updates) => {
  // 1. Make API PUT/PATCH request to /api/bookings/[id]
  // 2. Update the database with new status
  // 3. Then fetch updated data
}}
```

### Current API Status
- **GET /api/bookings** - ✅ Works (retrieves bookings)
- **PUT /api/bookings/[id]** - ❓ Might exist but not being called
- **Status update endpoint** - ❌ Not being called from component

### Evidence
1. No API call made when status button clicked
2. Only `onBookingUpdate` callback invoked
3. Callback doesn't make database update - just refetches data
4. Browser DevTools Network tab shows no PUT/PATCH request

---

## ISSUE #3: Missing API Update Handler

### Location
- `app/tenant/admin/bookings/content.tsx` (Lines 88-96)

### Problem
The `onBookingUpdate` callback is a stub - it doesn't actually update the booking in the database.

### Current Implementation
```typescript
onBookingUpdate={async (bookingId, updates) => {
  await fetchTenantData();  // Only refetches, doesn't save updates
}}
```

### What's Missing
```typescript
// Should be:
onBookingUpdate={async (bookingId, updates) => {
  // 1. Call API to update booking
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: 'PATCH',  // or PUT
    headers: { 
      'Content-Type': 'application/json',
      'x-tenant-id': subdomain!
    },
    body: JSON.stringify(updates)
  });
  
  // 2. Handle response
  if (!response.ok) throw new Error('Update failed');
  
  // 3. Refresh data
  await fetchTenantData();
}}
```

---

## ISSUE #4: Payment Status Update Same Problem ❌

### Location
- `components/booking/BookingManagement.tsx` (Lines 204-225)

### Problem
`handleUpdatePayment` function has the same issue - it calls `onBookingUpdate` callback but no database update happens.

### Code
```typescript
const handleUpdatePayment = async (newPaymentStatus: PaymentStatus) => {
  if (!selectedBooking) return;
  
  setUpdating(true);
  try {
    onBookingUpdate?.(selectedBooking.id, {
      paymentStatus: newPaymentStatus  // ← No database update!
    });
    
    setSelectedBooking({ ...selectedBooking, paymentStatus: newPaymentStatus });
    setEditingBooking(null);
    
    toast.success(`Payment status updated to ${newPaymentStatus}`);
  } catch (error) {
    // ...
  }
};
```

---

## Summary of Issues

| Issue | Severity | Component | Type | Fix Complexity |
|-------|----------|-----------|------|-----------------|
| Customer not loading | HIGH | `content.tsx` | Data loading | MEDIUM |
| Status update not working | HIGH | `BookingManagement.tsx` | No DB update | MEDIUM |
| Payment status not working | HIGH | `BookingManagement.tsx` | No DB update | MEDIUM |
| Refund not working | HIGH | `BookingManagement.tsx` | No DB update | MEDIUM |
| Missing API update endpoint | HIGH | API layer | Missing endpoint | HIGH |

---

## What's Working ✅

- ✅ Customer data fetches from API correctly
- ✅ Booking data fetches from API correctly
- ✅ UI buttons render and are clickable
- ✅ Local state updates visually
- ✅ Toast notifications show
- ✅ Refund form logic works (validation, calculations)

## What's Broken ❌

- ❌ Status changes don't persist to database
- ❌ Payment status changes don't persist to database
- ❌ Refund processing doesn't update booking
- ❌ No PUT/PATCH requests made to update bookings
- ❌ Changes revert on page refresh (because not saved)

---

## Required Fixes

### FIX #1: Implement Update Booking Callback
**File:** `app/tenant/admin/bookings/content.tsx`

The `onBookingUpdate` callback needs to make actual API call to save changes.

### FIX #2: Create/Verify PATCH Endpoint
**File:** `app/api/bookings/[id]/route.ts`

Need to create PATCH handler to update booking status, payment status, and other fields.

### FIX #3: Fix Customer Loading (if needed)
**File:** `app/api/customers/route.ts`

Verify response structure matches expected format.

---

## Test Cases to Verify

1. **Test Status Update:**
   - Click "Confirmed" button
   - Check browser DevTools Network tab
   - Verify PATCH request is sent to `/api/bookings/[id]`
   - Refresh page
   - Status should persist (not revert)

2. **Test Payment Status:**
   - Click "Paid" button
   - Verify request sent
   - Refresh page
   - Status should persist

3. **Test Refund:**
   - Click "Process Refund"
   - Enter refund amount
   - Confirm
   - Verify API call made
   - Verify payment status changes to "Refunded"
   - Refresh page
   - Status should persist

---

## Recommended Action Plan

1. **Create PATCH endpoint** for updating bookings
2. **Implement callback** in content.tsx to call new endpoint
3. **Test all status updates** to ensure persistence
4. **Fix any API response format issues** for customer loading


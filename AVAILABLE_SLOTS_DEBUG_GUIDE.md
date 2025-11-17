# Available Slots Time Issue - Debug Guide

## Problem
When you set opening hours (e.g., 09:00 AM), available time slots start from later time (e.g., 2:00 PM) instead.

## Root Cause Analysis

The issue could be one of these:

### 1. Business Hours Not Saved Correctly
- User setup time in UI, but data not saved to database
- Data saved with wrong format
- Data saved to wrong database field

### 2. Business Hours Retrieved With Wrong Format
- Time format stored as something other than "HH:MM"
- Timezone parsing issue
- Day key mismatch (case sensitivity or format issue)

### 3. Slot Generation Bug
- Hours parsed correctly, but slots not generated from start time
- Gap between opening time and first available slot

## Debug Steps

### Step 1: Check Browser Console Logs

1. Open browser DevTools (F12)
2. Go to Network tab
3. Open Calendar/Booking page and select a date
4. Look for API call to `/api/bookings/availability?...`
5. Check Console tab for logs starting with `[getAvailability]`

**Expected logs:**
```
[getAvailability] Business hours fetch: {
  serviceId: "...",
  tenantId: "...",
  hoursError: null,
  businessHoursData: {
    id: "...",
    tenant_id: "...",
    schedule: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      ...
    },
    timezone: "Asia/Jakarta"
  }
}

[getAvailability] Day lookup: {
  dayOfWeek: 1,  // 0 = Sunday, 1 = Monday, etc
  dayKey: "monday",
  schedule: { monday: {...}, ... },
  dayHours: { isOpen: true, openTime: "09:00", closeTime: "17:00" }
}

[getAvailability] Using global business hours: {
  serviceId: "...",
  date: "2025-11-18",
  dayOfWeek: 1,
  dayKey: "monday",
  operatingHours: { startTime: "09:00", endTime: "17:00" },
  dayHours: { isOpen: true, openTime: "09:00", closeTime: "17:00" }
}
```

### Step 2: If Logs Show Wrong Hours

**Problem: `operatingHours` shows `startTime: "14:00"` instead of `"09:00"`**

This means:
1. Check: Is `dayHours.openTime` already `"14:00"` in database?
   - If YES → go to Step 3
   - If NO → there's a parsing bug

**Problem: `dayHours` shows `{ isOpen: false }`**

This means:
1. Business is marked as closed on that day
2. Check business hours settings in UI
3. Make sure you saved the settings

**Problem: `schedule` is empty `{}`**

This means:
1. Business hours not saved to database
2. Go to Step 3: Check database directly

### Step 3: Check Database

Connect to Supabase and run query:

```sql
SELECT * FROM business_hours WHERE tenant_id = 'YOUR_TENANT_ID';
```

**What to check:**
1. Does record exist? If NO → settings were never saved
2. Is `schedule` JSON valid?
3. Are time values formatted as `"HH:MM"` (string)?
4. Are keys lowercase (monday, tuesday, etc)?

**Expected format:**
```json
{
  "monday": {
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  },
  "tuesday": {...},
  ...
}
```

### Step 4: Check PUT Request

When you save business hours in UI:

1. Open browser DevTools
2. Go to Network tab
3. Change business hours and save
4. Look for request to `/api/settings/business-hours` (PUT method)
5. Check Console for logs starting with `[business-hours PUT]`

**Expected:**
```
[business-hours PUT] Received schedule: {
  "monday": { "isOpen": true, "openTime": "09:00", "closeTime": "17:00" },
  ...
}
[business-hours PUT] Saving to database: {...}
[business-hours PUT] Update successful
```

**If you see error:**
```
[business-hours PUT] Invalid time format for monday: { 
  openTime: "9:00", 
  closeTime: "5:00 PM" 
}
```

This means time format is wrong. Must be "HH:MM" (24-hour, with leading zero).

### Step 5: Check UI Setup

Make sure you're entering times correctly:

1. Go to Calendar Settings → Global Business Hours
2. For each day:
   - Check the "Open" checkbox
   - Enter "Open Time": format should be `HH:MM` (e.g., "09:00", not "9:00" or "9:00 AM")
   - Enter "Close Time": format should be `HH:MM` (e.g., "17:00", not "5:00 PM")
3. Click "Save Business Hours"
4. Wait for success message
5. Refresh page
6. Verify settings are still there

## Common Issues & Solutions

### Issue 1: Slot starts at 14:00 but opening is 09:00

**Possible causes:**
- Business hours saved with wrong time
- Multiple business_hours records exist for same tenant
- Timezone confusion

**Solution:**
```sql
-- Check all records for your tenant
SELECT * FROM business_hours WHERE tenant_id = 'YOUR_TENANT_ID';

-- If multiple records, delete old ones:
DELETE FROM business_hours 
WHERE tenant_id = 'YOUR_TENANT_ID' 
AND id != 'CORRECT_ID';

-- Manually update if format is wrong:
UPDATE business_hours 
SET schedule = '{
  "monday": {"isOpen": true, "openTime": "09:00", "closeTime": "17:00"},
  ...
}'::jsonb
WHERE tenant_id = 'YOUR_TENANT_ID';
```

### Issue 2: Slots show but times wrong (off by hours)

**This is likely a timezone issue:**

1. Check server timezone
2. Check slot generation logic in `/api/bookings/availability`
3. Verify date parsing

**Current fix in code:**
- Using local timezone parsing instead of UTC
- Date parsed as: `new Date(year, month - 1, day)` (local time)
- Time parsed from "HH:MM" format

### Issue 3: Saved settings disappear after refresh

**Possible causes:**
- Data not actually saved to database
- GET endpoint returning default values
- Cache issue

**Solution:**
1. Check browser Console after save
2. Look for success message
3. Query database directly to verify
4. Clear browser cache and try again

## Debug Checklist

- [ ] Opened Console and saw `[getAvailability]` logs
- [ ] `businessHoursData` shows correct schedule
- [ ] `dayHours` shows correct time (not closed)
- [ ] `operatingHours` shows correct startTime/endTime
- [ ] Database query shows correct schedule JSON
- [ ] Time format is "HH:MM" (24-hour)
- [ ] All day keys are lowercase
- [ ] Settings persists after page refresh
- [ ] Refreshed browser cache (Ctrl+Shift+Delete)

## If Still Not Working

1. Check server logs for errors
2. Take screenshot of:
   - Business Hours settings page
   - Console logs from `/api/bookings/availability`
   - Database record
3. Contact support with this information

## Technical Details

**File locations:**
- Availability API: `/app/api/bookings/availability/route.ts`
- Business Hours API: `/app/api/settings/business-hours/route.ts`
- Booking Service: `/lib/booking/booking-service.ts` (getAvailability method)
- UI Component: `/components/settings/BusinessHoursGlobalSettings.tsx`

**Key functions:**
- `BookingService.getAvailability()` - Generates time slots
- Slot generation starts: `startDate.setHours(startHourStr, startMinStr, 0, 0)`
- Time parsing: `const [startHourStr, startMinStr] = operatingHours.startTime.split(':').map(Number)`

# Operating Hours & Hourly Quota Implementation Summary

## Overview
Complete system for managing service availability with configurable operating hours, time slot durations, and hourly booking quotas. Users can configure settings in **two connected locations** - both reading/writing from the same database.

## Features Implemented

### 1. Database Schema (3 New Columns)
- `operating_hours` (JSONB): `{ startTime: "08:00", endTime: "17:00" }`
- `slot_duration_minutes` (INTEGER): Duration of each booking slot (15/30/60 min)
- `hourly_quota` (INTEGER): Max concurrent bookings per hour

### 2. Time Slot Picker Component
- **Location**: `components/booking/TimeSlotPicker.tsx`
- **Features**:
  - Dynamically generates available time slots based on service config
  - Enforces hourly quota limits (prevents overbooking per hour)
  - Shows slots grouped by Morning/Afternoon/Evening
  - Disables fully booked slots
  - Shows business hours in header

### 3. Dual Configuration Locations

#### Location A: Service Creation UI
- **Path**: Admin → Services → Create Service
- **Fields**:
  - Start Time (time input)
  - End Time (time input)
  - Time Slot Duration (select 15/30/60)
  - Hourly Quota (number input)
- **When**: Set at service creation time
- **Default**: 8AM-5PM, 30min slots, 10/hour quota

#### Location B: Calendar Settings (NEW)
- **Path**: Admin → Settings → Calendar Tab
- **Component**: `OperatingHoursSettings.tsx`
- **Features**:
  - Lists all services
  - Edit any service settings anytime
  - Visual "Unsaved" badge for modified services
  - Example box showing how quota works
  - Individual save buttons per service
- **When**: Anytime after creation
- **Default**: Same as Location A

### 4. Booking Flow Integration
Both landing page and admin booking dialogs now use `TimeSlotPicker`:
- **BookingDialog.tsx**: Landing page bookings
- **NewBookingDialog.tsx**: Tenant admin bookings
- Both fetch available slots from `/api/bookings/availability` endpoint

### 5. Availability Calculation Logic
- **File**: `lib/booking/booking-service.ts::getAvailability()`
- **Algorithm**:
  1. Get service operating hours from database
  2. Get all confirmed bookings for that date
  3. Generate time slots based on `slotDurationMinutes`
  4. Count bookings per hour (round to nearest hour)
  5. Mark slot available if:
     - Booking count < hourly quota
     - No time overlap with existing bookings
  6. Return slots grouped by time period
- **Fallback**: If service has no hours configured, defaults to 8AM-5PM

## Database Changes

### SQL Migration
**File**: `drizzle/0014_add_operating_hours_and_quota_to_services.sql`

```sql
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS hourly_quota INTEGER DEFAULT 10;

UPDATE services 
SET 
  operating_hours = '{"startTime":"08:00","endTime":"17:00"}',
  slot_duration_minutes = 30,
  hourly_quota = 10
WHERE operating_hours IS NULL;
```

**Status**: 
- Migration file created ✅
- **NEEDS TO BE RUN** in Supabase for production

### How to Apply Migration

#### Option 1: Supabase Dashboard (Easiest)
1. Go to https://supabase.com → Console
2. SQL Editor
3. Paste migration SQL and run

#### Option 2: CLI
```bash
supabase migration up
```

#### Option 3: Direct psql
```bash
psql -h your-db.supabase.co -U postgres -d postgres -f drizzle/0014_*.sql
```

## API Changes

### Updated Endpoints

#### GET `/api/bookings/availability`
- **Query Params**: 
  - `serviceId` (required)
  - `date` (required, YYYY-MM-DD)
  - `tenantId` or `x-tenant-id` header
- **Returns**: 
  ```json
  {
    "date": "2024-11-13",
    "slots": [
      {
        "start": "2024-11-13T09:00:00Z",
        "end": "2024-11-13T09:30:00Z",
        "available": true
      }
    ],
    "businessHours": {
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00"
    }
  }
  ```

#### PUT `/api/services/{id}`
- **New Fields** in request body:
  ```json
  {
    "operatingHours": {
      "startTime": "08:00",
      "endTime": "17:00"
    },
    "slotDurationMinutes": 30,
    "hourlyQuota": 10
  }
  ```

#### POST `/api/services`
- **New Fields** (same as PUT)
- Both use same validation schema

## Type Updates

### Updated Interfaces
- `Service`: Added operatingHours, slotDurationMinutes, hourlyQuota
- `CreateServiceRequest`: Added optional operating hours fields
- `UpdateServiceRequest`: Added optional operating hours fields

### Validation Schemas
- `createServiceSchema`: Validates time regex `HH:MM`
- `updateServiceSchema`: Same validation

## UI/UX Improvements

### Calendar Popover Fix
- Fixed clipping issue in booking dialogs
- Added `z-50` to ensure popover renders above dialog
- Changed dialog from `overflow-y-auto` to `overflow-hidden flex flex-col`
- Separates header (fixed) from content (scrollable)

### Layout Fixes
- Removed redundant wrapper divs
- Simplified date picker structure
- Better spacing and visual hierarchy

## How It Works: Example

### Scenario: Salon with 4 simultaneous bookings per hour

**Configuration**:
- Operating Hours: 09:00 - 18:00
- Slot Duration: 30 minutes
- Hourly Quota: 4

**For 9:00 AM hour**:
```
09:00-09:30 (slot 1) ✅ Available
09:00-09:30 (slot 2) ✅ Available  
09:00-09:30 (slot 3) ✅ Available
09:00-09:30 (slot 4) ✅ Available (QUOTA FULL)
09:30-10:00 ❌ Would exceed 9:00 hour quota
```

**For 10:00 AM hour**:
```
10:00-10:30 (slot 1) ✅ Available (new hour, fresh quota)
10:00-10:30 (slot 2) ✅ Available
... (continues with fresh quota for each hour)
```

## Files Modified

### New Files
1. `components/settings/OperatingHoursSettings.tsx` - Calendar settings component
2. `OPERATING_HOURS_SETUP_GUIDE.md` - User guide
3. `OPERATING_HOURS_IMPLEMENTATION_SUMMARY.md` - This file
4. `drizzle/0014_add_operating_hours_and_quota_to_services.sql` - Migration

### Modified Files
1. `components/booking/TimeSlotPicker.tsx` - Time slot picker
2. `components/booking/BookingDialog.tsx` - Landing page booking (uses TimeSlotPicker)
3. `components/booking/NewBookingDialog.tsx` - Admin booking (uses TimeSlotPicker)
4. `app/tenant/admin/settings/content.tsx` - Added Calendar tab with Operating Hours
5. `lib/booking/booking-service.ts` - Availability calculation with quotas
6. `lib/booking/service-service.ts` - Service CRUD operations
7. `lib/database/schema/index.ts` - Database schema definition
8. `lib/validation/booking-validation.ts` - Validation schemas
9. `types/booking.ts` - TypeScript interfaces

## Testing Checklist

- [ ] **Run SQL migration** in Supabase
- [ ] **Create service** with operating hours (via service creation UI)
- [ ] **Edit service** hours (via Calendar Settings)
- [ ] **Verify** hours sync between both locations
- [ ] **Book appointment** on landing page → time slots appear ✅
- [ ] **Book appointment** in admin → time slots appear ✅
- [ ] **Try to exceed quota** → extra slots disabled ✅
- [ ] **Pick blocked date** → slots not shown ✅
- [ ] **Check** TimeSlotPicker loading/error states
- [ ] **Verify** calendar popover doesn't clip ✅

## Commits Related to This Feature

```
9a89397 docs: update guide with dual setup locations
889436b feat: add operating hours settings in Calendar tab
110e34a docs: add operating hours and quota setup guide
b67829e fix: add fallback operating hours when service config
815f2c8 fix: prevent calendar popover clipping
bc2299f fix: simplify date picker UI layout
e0c3adb fix: resolve TypeScript type error
8e17dc7 chore: add SQL migration for operating hours
cafca12 feat: add operating hours settings to service creation UI
defe9d0 feat: implement hourly quotas and operating hours
```

## Known Issues & Limitations

1. **Migration not yet applied** - SQL migration file exists but needs to be run in production Supabase
2. **Existing services** - Services created before this feature get 8AM-5PM default (fallback included in code)
3. **No time zone support** - Times are stored as HH:MM strings, no timezone conversion
4. **No weekend settings** - Operating hours same for all days (future enhancement)
5. **No service staff assignment** - Quota is per service, not per staff member

## Future Enhancements

1. Different hours for different days of week
2. Multiple staff members with individual quotas
3. Break times / lunch hours
4. Holiday closures
5. Special events (closed certain dates)
6. Buffer time between bookings
7. Timezone support

## Deployment Notes

1. **Required**: Run SQL migration before deploying updated code
2. **Optional**: Update existing services via Calendar Settings UI
3. **Testing**: Book a test appointment to verify time slots appear
4. **Monitor**: Check API logs for any errors in availability calculation

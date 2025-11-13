# Operating Hours & Hourly Quota Setup Guide

## Overview

Sistem booking sekarang support **operating hours** (jam operasional) dan **hourly quota** (batas pemesanan per jam) per service. Ini memastikan:
- User hanya bisa book pada jam yang ditentukan
- Max concurrent bookings per hour di-enforce
- Flexible time slot durations (15/30/60 menit)

## Step 1: Run SQL Migration

Database schema perlu di-update dengan 3 column baru di table `services`:

### Option A: Supabase Dashboard (Recommended)
1. Go to Supabase Console → SQL Editor
2. Run this migration:

```sql
-- Add operating hours and quota fields to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS hourly_quota INTEGER DEFAULT 10;

-- Set defaults for existing services
UPDATE services 
SET 
  operating_hours = '{"startTime":"08:00","endTime":"17:00"}',
  slot_duration_minutes = 30,
  hourly_quota = 10
WHERE operating_hours IS NULL;
```

3. Click "Run"

### Option B: Via CLI
```bash
# Make sure you have Supabase CLI installed
supabase migration up

# Or manually run:
psql -h your-db-host -U your-user -d your-database -f drizzle/0014_add_operating_hours_and_quota_to_services.sql
```

## Step 2: Configure Service Operating Hours

### Via Tenant Admin UI
1. Go to Admin Dashboard → Services
2. Click "Add Service" or edit existing service
3. Find **"Booking Availability"** section
4. Set:
   - **Start Time**: e.g., 08:00
   - **End Time**: e.g., 17:00
   - **Time Slot Duration**: 15, 30, or 60 minutes
   - **Hourly Quota**: Max bookings per hour (default: 10)
5. Click Save

### Database Direct Update (If Needed)
```sql
UPDATE services
SET 
  operating_hours = '{"startTime":"09:00","endTime":"18:00"}',
  slot_duration_minutes = 30,
  hourly_quota = 8
WHERE id = 'your-service-uuid';
```

## Step 3: Verify Setup

### Check Time Slots Appear
1. Go to tenant landing page
2. Click "Book Appointment"
3. Select service
4. Pick a date
5. Should see time slots grouped by Morning/Afternoon/Evening

### Debug Console
Open browser DevTools → Console tab:
- If you see `[getAvailability] Using operating hours: ...` with `hasConfiguredHours: true` ✅ Service configured
- If you see `hasConfiguredHours: false` ⚠️ Service using defaults (8AM-5PM)

## Default Values

If service doesn't have configured hours:
```json
{
  "startTime": "08:00",
  "endTime": "17:00"
}
```

- **Slot Duration**: 30 minutes
- **Hourly Quota**: 10 bookings/hour

## Configuration Examples

### Salon/Hair Service (Morning Heavy)
```
Start Time: 09:00
End Time: 20:00
Slot Duration: 30 min
Hourly Quota: 4
```

### Massage Therapy (Limited Slots)
```
Start Time: 10:00
End Time: 19:00
Slot Duration: 60 min (longer service)
Hourly Quota: 2
```

### Medical Clinic (High Volume)
```
Start Time: 08:00
End Time: 17:00
Slot Duration: 15 min
Hourly Quota: 8
```

## How Hourly Quota Works

**Example**: Service has `hourlyQuota: 3` and `slotDurationMinutes: 30`

**9:00 AM hour:**
- 9:00-9:30 ✅ Slot 1 available
- 9:00-9:30 ✅ Slot 2 available  
- 9:00-9:30 ✅ Slot 3 available (quota full)
- 9:30-10:00 ❌ Would exceed quota for 9:00 hour

**10:00 AM hour:**
- 10:00-10:30 ✅ Slot 1 available (new hour, quota resets)
- 10:00-10:30 ✅ Slot 2 available
- 10:00-10:30 ✅ Slot 3 available (quota full)

## Troubleshooting

### No Time Slots Showing

**Problem**: Calendar is picked but no times appear

**Solutions**:
1. Check migration was run: 
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'services' AND column_name = 'operating_hours';
   ```
   Should return: `operating_hours`

2. Check service has hours configured:
   ```sql
   SELECT id, name, operating_hours FROM services WHERE tenant_id = 'your-tenant-id';
   ```
   Should show JSON like: `{"startTime":"08:00","endTime":"17:00"}`

3. Check browser console for errors in TimeSlotPicker fetch

### Time Slots All Booked

This is normal if you have high quota and many existing bookings. Check:
- Hourly Quota value is reasonable for your service
- Slot duration matches your service duration
- Not selecting a date that already has all slots booked

### Migration Conflicts

If you get errors like "column already exists":
- SQLmigration has `IF NOT EXISTS` clause, safe to re-run
- Check if columns already exist:
  ```sql
  \d services  -- in psql
  ```

## Next Steps

1. ✅ Run SQL migration
2. ✅ Create/edit services with operating hours
3. ✅ Test booking on landing page
4. ✅ Monitor bookings to optimize quota

For questions, check console logs in `/api/bookings/availability` endpoint.

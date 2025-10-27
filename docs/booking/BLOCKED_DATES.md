# Blocked Dates Feature

## Overview

Fitur Blocked Dates memungkinkan admin untuk memblokir tanggal tertentu sehingga customers tidak bisa membuat booking pada tanggal tersebut. Berguna untuk:

- 🔧 Maintenance days
- 🏖️ Holidays/Public holidays
- 🚫 Closed days
- 📅 Special events
- ⚠️ Emergency closures

## Features

### 1. Single Date Block
Blokir satu tanggal spesifik untuk alasan tertentu.

```
Block Date: 2025-12-25
Reason: Christmas Holiday
```

### 2. Recurring Date Blocks
Blokir tanggal secara berulang dengan berbagai pola:

- **Daily** - Block setiap hari sampai end date
- **Weekly** - Block setiap hari yang sama dalam seminggu
- **Monthly** - Block tanggal yang sama setiap bulan
- **Yearly** - Block tanggal yang sama setiap tahun

### 3. Reasons & Notes
Tambahkan alasan untuk setiap block, membantu staff dan audit trail.

## Database Schema

```sql
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  recurring_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### GET /api/bookings/blocked-dates

Fetch blocked dates untuk tenant, dengan optional filtering by month/year.

**Query Parameters:**
- `tenantId` (required): Tenant UUID
- `month` (optional): Format `YYYY-MM` (e.g., `2025-10`)
- `year` (optional): Format `YYYY` (e.g., `2025`)

**Response:**
```json
{
  "blockedDates": [
    {
      "id": "uuid",
      "date": "2025-12-25T00:00:00Z",
      "reason": "Christmas Holiday",
      "isRecurring": true,
      "recurringPattern": "yearly",
      "recurringEndDate": "2030-12-25T00:00:00Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/bookings/blocked-dates

Create blocked date baru.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "date": "2025-12-25",
  "reason": "Christmas Holiday",
  "isRecurring": true,
  "recurringPattern": "yearly",
  "recurringEndDate": "2030-12-25"
}
```

**Response:**
```json
{
  "blockedDate": {
    "id": "new-uuid",
    "date": "2025-12-25T00:00:00Z",
    "reason": "Christmas Holiday",
    ...
  }
}
```

### DELETE /api/bookings/blocked-dates

Delete blocked date spesifik.

**Query Parameters:**
- `id` (required): Blocked date UUID

**Response:**
```json
{
  "success": true
}
```

## BlockedDatesService (Utility)

### Methods

#### `isDateBlocked(tenantId, date): Promise<boolean>`
Cek apakah date spesifik diblokir.

```typescript
const isBlocked = await BlockedDatesService.isDateBlocked(tenantId, new Date('2025-12-25'));
```

#### `getBlockedDatesInRange(tenantId, startDate, endDate): Promise<BlockedDate[]>`
Dapatkan semua blocked dates dalam range.

```typescript
const blocked = await BlockedDatesService.getBlockedDatesInRange(
  tenantId,
  new Date('2025-12-01'),
  new Date('2025-12-31')
);
```

#### `createBlockedDate(tenantId, date, reason?, recurringPattern?, recurringEndDate?)`
Buat blocked date baru.

```typescript
await BlockedDatesService.createBlockedDate(
  tenantId,
  new Date('2025-12-25'),
  'Christmas Holiday',
  'yearly',
  new Date('2030-12-25')
);
```

#### `deleteBlockedDate(id): Promise<boolean>`
Hapus blocked date.

```typescript
const deleted = await BlockedDatesService.deleteBlockedDate(blockedDateId);
```

#### `getAvailableDatesInRange(tenantId, startDate, endDate): Promise<Date[]>`
Dapatkan list tanggal yang tersedia (tidak diblokir) dalam range.

```typescript
const available = await BlockedDatesService.getAvailableDatesInRange(
  tenantId,
  new Date('2025-12-01'),
  new Date('2025-12-31')
);
```

#### `isTimeSlotAvailable(tenantId, date, startTime, duration, businessHoursData?): Promise<boolean>`
Cek availability dengan mempertimbangkan:
- Blocked dates
- Business hours
- Booking duration

```typescript
const available = await BlockedDatesService.isTimeSlotAvailable(
  tenantId,
  new Date('2025-12-20'),
  10 * 60, // 10:00 AM
  60,      // 1 hour
  businessHoursData
);
```

## UI Component: BlockedDatesManager

### Usage

```tsx
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';

export default function SettingsPage() {
  return (
    <BlockedDatesManager tenantId={tenantId} month="2025-12" />
  );
}
```

### Props

- `tenantId` (required): Tenant UUID
- `month` (optional): Filter by month (format: `YYYY-MM`)

### Features

- ✅ View all blocked dates
- ✅ Add new blocked date dengan dialog
- ✅ Specify reason untuk setiap block
- ✅ Support recurring patterns
- ✅ Delete blocked dates
- ✅ Empty state message
- ✅ Loading states

## Booking Validation Integration

Ketika customer mencoba membuat booking:

1. Ambil scheduled date dari booking request
2. Call `BlockedDatesService.isDateBlocked()`
3. Jika blocked, return error:
   ```json
   {
     "error": "This date is blocked and cannot be booked"
   }
   ```

**Code Location:** `/app/api/bookings/route.ts` (POST handler)

```typescript
// Check if booking date is blocked
if (validation.data.scheduledAt) {
  const isBlocked = await BlockedDatesService.isDateBlocked(
    resolvedTenantId,
    new Date(validation.data.scheduledAt)
  );
  
  if (isBlocked) {
    return NextResponse.json({ 
      error: 'This date is blocked and cannot be booked' 
    }, { status: 400 });
  }
}
```

## Usage Scenarios

### Scenario 1: Block Christmas
```
Navigate to Settings → Blocked Dates
Click "Block Date"
Select Date: 2025-12-25
Reason: Christmas Holiday
Recurring: Yes (Yearly)
End Date: 2030-12-25
Click "Block Date"
```

Result: Every December 25 from 2025-2030 akan blocked

### Scenario 2: Block Maintenance Day
```
Click "Block Date"
Select Date: 2025-11-15
Reason: System Maintenance
Click "Block Date"
```

Result: Hanya 2025-11-15 yang blocked, customers tidak bisa book

### Scenario 3: Block Sundays (Every Week)
```
Click "Block Date"
Select Date: 2025-01-05 (first Sunday)
Reason: Weekly Closure
Recurring: Yes (Weekly)
End Date: 2025-12-31
Click "Block Date"
```

Result: Setiap Sunday di tahun 2025 akan blocked

## Frontend Integration

### Show Available Dates in Booking Calendar

```tsx
const [availableDates, setAvailableDates] = useState<Date[]>([]);

useEffect(() => {
  const fetchAvailable = async () => {
    const dates = await BlockedDatesService.getAvailableDatesInRange(
      tenantId,
      startOfMonth,
      endOfMonth
    );
    setAvailableDates(dates);
  };
  fetchAvailable();
}, [tenantId]);

// In calendar component:
const isDateAvailable = availableDates.some(d => 
  d.toDateString() === dateToCheck.toDateString()
);
```

### Disable Blocked Dates in Date Picker

```tsx
const blockedDates = await BlockedDatesService.getBlockedDates(tenantId);

<DatePicker
  disabledDates={blockedDates.map(bd => new Date(bd.date))}
  onDateSelect={handleDateSelect}
/>
```

## Performance Optimization

### Indexes Created
```sql
CREATE INDEX idx_blocked_dates_tenant_id ON blocked_dates(tenant_id);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_blocked_dates_tenant_date ON blocked_dates(tenant_id, date);
```

### Query Patterns
- Fetching blocked dates untuk specific month - O(log n)
- Checking single date block - O(log n) dengan index
- Range queries - Fast dengan composite index

## Migration

### Database Setup

```bash
# 1. Run migration
drizzle-kit migrate

# 2. Verify table created
SELECT * FROM blocked_dates;

# 3. Verify indexes
SELECT * FROM pg_indexes WHERE tablename = 'blocked_dates';
```

## Future Enhancements

1. **Bulk Block Operations**
   - Block multiple dates/ranges at once
   - Import from CSV

2. **Smart Blocking**
   - Auto-block based on holidays database
   - Integration dengan public holiday APIs

3. **Partial Blocks**
   - Block specific time slots (e.g., morning only)
   - Partial availability on specific dates

4. **Analytics**
   - Report on blocked days vs revenue impact
   - Suggest optimal block periods

5. **Notifications**
   - Notify customers when dates are blocked
   - Auto-reschedule existing bookings

6. **Time-based Blocks**
   - Block specific hours on specific dates
   - Not just full day blocks

## Troubleshooting

### Blocked dates tidak muncul di UI
- ✅ Pastikan tenantId valid
- ✅ Cek browser console untuk errors
- ✅ Verify Supabase connection

### Customers masih bisa booking pada blocked date
- ✅ Run migration untuk create table
- ✅ Verify booking API checking blocked dates
- ✅ Clear browser cache

### Recurring blocks tidak bekerja
- ✅ Verify `recurringPattern` value (daily/weekly/monthly/yearly)
- ✅ Ensure `recurringEndDate` is valid

## Related Docs

- [Booking System](./BOOKING.md)
- [Business Hours](./BUSINESS_HOURS.md)
- [API Documentation](../api/BOOKINGS_API.md)

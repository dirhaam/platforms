# Analisis Lengkap: Business Hours, Blocking Dates, & Quota Logic

## 🔍 Executive Summary

Setelah mereview kode yang ada, saya menemukan **7 area kritis** dengan gap logika yang bisa menyebabkan booking validation issues. Sistem saat ini punya fondasi baik tapi butuh hardening untuk production-ready.

---

## 1. BLOCKED DATES - ISSUES & GAPS

### Current Implementation
**File:** `lib/bookings/blocked-dates-service.ts`
```typescript
- isDateBlocked() - Check apakah tanggal full blocked
- getBlockedDatesInRange() - Get semua blocked dates dalam range
- isTimeSlotAvailable() - Check slot considering blocked dates + business hours
- Support untuk recurring patterns: daily, weekly, monthly, yearly
```

### 🚨 CRITICAL ISSUES

#### Issue #1: Recurring Blocked Dates Tidak Ter-Expand
```typescript
// CURRENT - Store hanya 1 record dengan pattern
{
  date: "2024-01-15",
  isRecurring: true,
  recurringPattern: "weekly",
  recurringEndDate: "2024-12-31"
}

// PROBLEM: Tidak ada logic untuk expand recurring dates
// Saat check isDateBlocked(2024-01-22), sistem tidak akan detect
// karena database hanya punya 1 record untuk 2024-01-15
```

**Impact:** Recurring blocked dates (misal: setiap Senin) tidak akan ter-block untuk dates setelah tanggal initial.

#### Issue #2: Partial Day Blocking Tidak Supported
```typescript
// Current: Semua atau ничего (all or nothing)
const isBlocked = await BlockedDatesService.isDateBlocked(tenantId, date);

// TIDAK support: "Block hanya jam 10-12 di tanggal ini"
// TIDAK support: "Block hanya service X untuk hari ini"
```

**Impact:** Tidak bisa block specific time windows dalam sehari.

#### Issue #3: Missing Validation di Booking Creation
```typescript
// booking-service.ts createBooking() - TIDAK ada blocked date check!
const hoursValidation = validateBusinessHours(scheduledAt, businessHoursRecord);
// ✓ Ada check untuk business hours
// ✗ MISSING: Blocked dates check di sini!

// The check hanya ada di:
// - getAvailability() - untuk display slots
// - BlockedDatesService.isTimeSlotAvailable() - utility function
// Tapi TIDAK di booking creation direct!
```

**Scenario:**
```
1. User buka availability API → sees slot X available (blocked dates filter works)
2. User click book slot X
3. Booking dibuat LANGSUNG tanpa check blocked dates again
4. Race condition! Admin bisa block date AFTER availability check tapi BEFORE booking
```

---

## 2. BUSINESS HOURS - ISSUES & GAPS

### Current Implementation
**File:** `lib/database/schema/index.ts`
```typescript
export const businessHours = pgTable('business_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique(),  // ← ONE per tenant only!
  schedule: jsonb('schedule').notNull(), // Day-based schedule
  timezone: text('timezone').default('Asia/Jakarta'),
  updatedAt: timestamp('updated_at'),
});

// schedule JSON structure:
{
  monday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
  tuesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
  // ...
}
```

### 🚨 CRITICAL ISSUES

#### Issue #1: Business Hours adalah Tenant-Wide, Tidak Per-Service
```typescript
// CURRENT: Satu business hours untuk semua service
const businessHoursData = businessHours; // Shared for all services

// PROBLEM: Tidak bisa configure:
// - Service "Haircut" only available 9-18
// - Service "Consultation" available 24/7
// - Service "Event" only on weekends
```

**Impact:** Complex scheduling patterns tidak support.

#### Issue #2: Timezone Handling Sangat Basic & Hardcoded
```typescript
// booking-service.ts line 720
const timezoneOffsets: Record<string, number> = {
  'Asia/Jakarta': 7,
  'Asia/Bangkok': 7,
  'UTC': 0,
  'America/New_York': -5, // ← WRONG! EST hanya valid Oct-Mar
  // ...
};

// PROBLEMS:
// 1. Hardcoded offsets - tidak support DST (Daylight Saving Time)
// 2. Incomplete list - hanya 9 timezone, ada 400+
// 3. Manual offset calculation error-prone
```

**Concrete Bug:**
```
- NY di EDT (summer) = UTC-4, tapi code punya -5 (EST only)
- Booking di June jd calculated di timezone salah
- Slot timing off by 1 hour
```

#### Issue #3: Slot Duration ≠ Service Duration Confusion
```typescript
// service-service.ts
hourlyQuota: integer('hourly_quota').default(10),
slotDurationMinutes: integer('slot_duration_minutes').default(30),

// booking-service.ts getAvailability()
const slotDurationMinutes = service.slotDurationMinutes || 30;  // Display interval
const serviceDuration = request.duration || service.duration;    // Actual booking length

// UI Shows slots every 30 min: [09:00, 09:30, 10:00, 10:30, ...]
// But service is 60 min long
// User bisa see multiple overlapping slots tersedia yang sebenarnya conflict
```

**Visual Bug Example:**
```
Slot Grid:
[09:00] ✓ Available
[09:30] ✓ Available  ← User confused! Can't book if 09:00 booked
[10:00] ✓ Available

Result: User books 09:30, but 09:00 already has 60-min service → CONFLICT
```

#### Issue #4: Missing Break Times Support
```typescript
// validation-service.ts validateBusinessHours() has this:
if (daySchedule.breaks) {
  for (const breakTime of daySchedule.breaks) {
    if (bookingTime >= breakTime.startTime && bookingTime <= breakTime.endTime) {
      return { valid: false, message: `... break time ...` };
    }
  }
}

// ✓ LOGIC ada di validation
// ✗ TAPI database schema TIDAK punya breaks field!
// breaks hanya bisa di JSON schedule, tapi tidak terstructured
```

---

## 3. QUOTA - ISSUES & GAPS

### Current Implementation
**File:** `lib/booking/booking-service.ts` (line ~720)
```typescript
const hourlyQuota = service.hourlyQuota || 10;

// Count bookings per hour
const bookingsPerHour = new Map<string, number>();
(bookings || []).forEach(booking => {
  const bookingTime = new Date(booking.scheduled_at);
  const hourKey = `${bookingTime.getHours()}:00`;  // Only HOUR
  bookingsPerHour.set(hourKey, (bookingsPerHour.get(hourKey) || 0) + 1);
});

// Check quota
if (bookingsInThisHour < hourlyQuota) {
  // Slot is available
}
```

### 🚨 CRITICAL ISSUES

#### Issue #1: Hourly Quota Calculation Wrong for Overlapping Bookings
```typescript
// CURRENT: Count bookings per HOUR only
const hourKey = `${bookingTime.getHours()}:00`;  // "14:00"

// PROBLEM: Tidak account untuk overlapping bookings
// Scenario:
bookings = [
  { scheduled_at: "14:00", duration: 120 }, // 14:00-16:00
  { scheduled_at: "14:30", duration: 60 },  // 14:30-15:30
]

// Jika slotDurationMinutes = 30, cek available slots:
slots = [14:00, 14:30, 15:00, 15:30, 16:00]

// Current logic:
// - 14:00 slot: hour "14" has 2 bookings, quota 10 → Available ✓
// - 14:30 slot: hour "14" has 2 bookings, quota 10 → Available ✓ (WRONG!)
// - 15:00 slot: hour "15" has 1 booking, quota 10 → Available ✓ (might overlap)

// Result: Can show multiple available slots yang actually overlap!
```

#### Issue #2: No Daily/Weekly/Monthly Quota
```typescript
// ONLY hourly quota exists
hourlyQuota: integer('hourly_quota').default(10),

// MISSING:
// dailyQuota? No
// weeklyQuota? No
// monthlyQuota? No
// perStaffQuota? No
```

**Real-world impact:**
```
- Salon: max 50 haircuts/day (regardless of hour distribution)
- Consultant: max 20 calls/week (not per-hour)
- Support team: max 100 tickets/month
→ All impossible with current schema
```

#### Issue #3: No Service-to-Staff Mapping
```typescript
// Current: Service has hourlyQuota
// But: Tidak tau service dilayani oleh siapa

// MISSING:
// - Booking tidak record staff/team member
// - Quota tidak per-staff
// - No way to enforce "Staff A max 8 bookings/day"
```

---

## 4. TIMEZONE ISSUES - DEEP DIVE

### Current Implementation Problems
```typescript
// Issue: Local time vs UTC mismatch
const startDate = new Date(bookingDate);
startDate.setHours(startHourStr, startMinStr, 0, 0);
startDate.setHours(startDate.getHours() - tzOffset);  // ← Adjust UTC

// But:
// - bookingDate dari WHERE? 
// - Apakah already di local time?
// - offset hardcoded, tidak DST-aware
```

### Real Bug Scenario
```
User di Jakarta (UTC+7) booking pada:
- Date: 2024-01-15
- Time: 09:00 (local Jakarta time)

Current Code:
1. Create Date('2024-01-15') → UTC midnight
2. Set hours: 09:00 (still treated as local)
3. Subtract 7 hours → stored as 02:00 UTC

But API returns to user:
- Stored: "2024-01-15T02:00:00Z" (UTC)
- User expects: "2024-01-15T09:00:00" (local)
- Mismatch!

When checking availability next day:
- Fetch dari DB: "2024-01-15T02:00:00Z"
- Convert back: ± might be wrong date if TZ offset applied wrong
```

---

## 5. RECURRING BLOCKED DATES - DETAILED ISSUE

### Current Schema
```typescript
{
  id: "123",
  date: "2024-01-15",  // Initial date
  isRecurring: true,
  recurringPattern: "weekly",
  recurringEndDate: "2024-12-31",
}

// Punya logic cek:
static async getAvailableDatesInRange(tenantId, startDate, endDate) {
  const blockedDates = await this.getBlockedDatesInRange(...);
  const blockedDateSet = new Set(
    blockedDates.map(bd => new Date(bd.date).toDateString())  // ONLY converts stored date
  );
  // ✗ PROBLEM: Recurring pattern NOT expanded!
}
```

### What Should Happen
```
Admin blocks: 2024-01-15 (Monday), recurring weekly until 2024-12-31
Expected behavior:
- 2024-01-15: blocked (initial date)
- 2024-01-22: blocked (1 week later)
- 2024-01-29: blocked (2 weeks later)
- ... all Mondays until Dec 31

Current behavior:
- ONLY 2024-01-15 is blocked
- 2024-01-22 is available (WRONG!)
```

---

## 6. RACE CONDITIONS & EDGE CASES

### Race Condition #1: Availability Check vs Booking Creation
```
Timeline:
T1: Client fetches /api/bookings/availability → slot 14:00 shows available
T2: Admin blocks date
T3: Client submits booking for 14:00
T4: Booking created successfully (should have been blocked!)

Root cause: No transaction lock, no re-check of blocked dates during booking
```

### Race Condition #2: Concurrent Quota Exceed
```
Timeline:
T1: User A fetches slots → sees 10:00 available (3 bookings, quota 10)
T2: User B simultaneously books 10:00
T3: User A books 10:00
T4: Now 4 bookings at 10:00, but system only checked at T1 (2 bookings)

Result: Quota exceeded
```

### Edge Case #1: Overnight Bookings
```typescript
// Current: Not supported
// Example: 22:00-01:00 next day
scheduledAt: "2024-01-15T22:00:00Z"
duration: 180 // 3 hours

// Slot generation hanya 1 hari, so:
// - Check business hours for 2024-01-15
// - But booking ends on 2024-01-16
// - No check for 2024-01-16 hours
```

### Edge Case #2: Booking Past Closing Time
```typescript
// Current validation:
if (startTime < openMinutes || endTime > closeMinutes) {
  return { valid: false };
}

// PROBLEM: Booking hanya 1 end-time check, tidak check:
// - If booking spans multiple hours with different hours (e.g. break)
// - If staff shift changes during booking
```

---

## 7. MISSING FEATURES

| Feature | Current | Status |
|---------|---------|--------|
| Service-specific business hours | ❌ Only tenant-wide | Not implemented |
| Partial day blocking | ❌ All/nothing | Not implemented |
| Per-staff quota | ❌ Only service quota | Not implemented |
| Daily/Weekly/Monthly quota | ❌ Only hourly | Not implemented |
| Recurring blocked dates expansion | ❌ Only manual check | Broken |
| Break times in schema | ❌ Only JSON, no structure | Not implemented |
| DST-aware timezone | ❌ Hardcoded offsets | Not implemented |
| Overnight bookings | ❌ Single day only | Not implemented |
| Booking modification re-validation | ❌ No | Not implemented |
| Concurrent booking locks | ❌ No | Not implemented |
| Quota history/analytics | ❌ No | Not implemented |

---

## 📋 RECOMMENDED FIXES (Priority Order)

### P0 - CRITICAL (Security/Data Integrity)

#### 1. Add Blocked Date Check to Booking Creation
```typescript
// In booking-service.ts createBooking()
const isDateBlocked = await BlockedDatesService.isDateBlocked(tenantId, scheduledAt);
if (isDateBlocked) {
  return { error: 'This date is blocked for bookings' };
}
```

#### 2. Fix Recurring Blocked Dates Expansion
```typescript
// New method in blocked-dates-service.ts
static async expandRecurringBlockedDates(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const blockedDates = await this.getBlockedDatesInRange(tenantId, startDate, endDate);
  const expandedDates: Date[] = [];
  
  for (const bd of blockedDates) {
    if (!bd.isRecurring) {
      expandedDates.push(new Date(bd.date));
      continue;
    }
    
    // Expand recurring
    let current = new Date(bd.date);
    const endRecur = bd.recurringEndDate ? new Date(bd.recurringEndDate) : endDate;
    
    while (current <= endRecur && current <= endDate) {
      expandedDates.push(new Date(current));
      
      switch (bd.recurringPattern) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }
  }
  
  return expandedDates;
}
```

#### 3. Fix Hourly Quota for Overlapping Bookings
```typescript
// Better quota check considering actual time overlap
static getBookingsOverlappingSlot(
  bookings: any[],
  slotStart: Date,
  slotEnd: Date
): number {
  return bookings.filter(b => {
    const bookingStart = new Date(b.scheduled_at);
    const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
    // Check overlap: [slotStart, slotEnd) overlaps with [bookingStart, bookingEnd)
    return slotStart < bookingEnd && slotEnd > bookingStart;
  }).length;
}

// Use in slot availability check:
const overlappingCount = this.getBookingsOverlappingSlot(bookings, slotStart, slotEnd);
if (overlappingCount >= hourlyQuota) {
  isAvailable = false;
}
```

### P1 - HIGH (Feature Completeness)

#### 4. Fix Timezone with Proper Library
```typescript
// Use date-fns-tz or equivalent
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Store timezone in config
const timezone = businessHoursData?.timezone || 'Asia/Jakarta';

// Convert when needed
const zonedDate = toZonedTime(new Date(), timezone);
const utcDate = fromZonedTime(zonedDate, timezone);
```

#### 5. Add Break Times to Schema
```typescript
// New migration
ALTER TABLE business_hours ADD COLUMN breaks JSONB DEFAULT NULL;

// Structure:
{
  "monday": {
    "isOpen": true,
    "openTime": "08:00",
    "closeTime": "18:00",
    "breaks": [
      { "startTime": "12:00", "endTime": "13:00" },
      { "startTime": "15:30", "endTime": "16:00" }
    ]
  }
}

// Validation logic already exists, just need schema support
```

#### 6. Support Service-Specific Hours
```typescript
// New table: service_hours
pgTable('service_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  override: boolean('override').default(false), // If false, use tenant business hours
  schedule: jsonb('schedule').notNull(), // Same structure as business_hours
  timezone: text('timezone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// When checking availability:
const serviceHours = await getServiceHours(serviceId);
const hoursToUse = serviceHours?.override ? serviceHours : tenantBusinessHours;
```

### P2 - MEDIUM (Robustness)

#### 7. Add Daily/Weekly/Monthly Quota
```typescript
// Update services table
pgTable('services', {
  // ... existing fields
  hourlyQuota: integer('hourly_quota').default(10),
  dailyQuota: integer('daily_quota'), // Optional
  weeklyQuota: integer('weekly_quota'), // Optional
  monthlyQuota: integer('monthly_quota'), // Optional
});

// Validation logic in booking-service.ts
if (dailyQuota) {
  const todayCount = countBookingsForDay(tenantId, serviceId, bookingDate);
  if (todayCount >= dailyQuota) return false;
}
```

#### 8. Add Staff/Team Assignment
```typescript
// New table: booking_staff
pgTable('booking_staff', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id),
  staffId: uuid('staff_id').notNull().references(() => staffMembers.id),
  role: text('role'), // 'primary', 'assistant', etc
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Check per-staff quota:
const staffBookingsCount = countBookingsForStaff(staffId, dateRange);
if (staffBookingsCount >= staffQuota) return false;
```

#### 9. Add Booking Lock/Transaction
```typescript
// Use database-level locking
const { data } = await supabase
  .rpc('book_with_lock', {
    tenant_id: tenantId,
    service_id: serviceId,
    scheduled_at: scheduledAt.toISOString(),
    // ... other params
  })
  .single();

// Server function uses BEGIN TRANSACTION + SELECT FOR UPDATE
```

---

## 🧪 TEST SCENARIOS TO ADD

```typescript
describe('Blocking Dates', () => {
  // Test recurring expansion
  test('Should expand weekly recurring block for 3 months');
  
  // Test race condition
  test('Should reject booking if date blocked after availability check');
  
  // Test partial day blocking (future feature)
  test('Should block only specific time window on date');
});

describe('Business Hours', () => {
  // Test timezone
  test('Should correctly convert booking time across DST');
  test('Should handle +12 and -12 timezones');
  
  // Test service hours override
  test('Should use service hours if override=true');
  
  // Test breaks
  test('Should reject booking during break time');
  
  // Test overnight
  test('Should allow booking spanning midnight');
});

describe('Quota', () => {
  // Test overlapping bookings
  test('Should count overlapping bookings, not hourly bookings');
  
  // Test daily quota
  test('Should enforce daily quota independently');
  
  // Test per-staff
  test('Should track quota per staff member');
  
  // Test concurrent booking
  test('Should prevent concurrent bookings exceeding quota');
});
```

---

## 📊 IMPACT ASSESSMENT

| Issue | Severity | Impact | Affected Users |
|-------|----------|--------|---|
| Recurring blocks not expanding | 🔴 HIGH | Wrong availability shown | All with recurring blocks |
| Missing blocked date check in booking | 🔴 CRITICAL | Bookings on blocked dates | All |
| Overlapping quota calc | 🟠 MEDIUM | Overbooking possible | Services with low quota |
| Timezone hardcoded | 🟠 MEDIUM | Wrong times in non-standard TZ | International tenants |
| Race conditions | 🟡 LOW | Occasional overbooking | High-traffic periods |

---

## 🎯 RECOMMENDATION SUMMARY

**Short term (Sprint 1):**
- ✅ Add blocked date check to createBooking
- ✅ Fix recurring blocked dates expansion
- ✅ Fix overlapping quota calculation

**Medium term (Sprint 2-3):**
- ✅ Implement proper timezone with library
- ✅ Add break times support
- ✅ Service-specific hours
- ✅ Daily/weekly/monthly quotas

**Long term (Future):**
- ✅ Staff/team assignment & per-staff quotas
- ✅ Database-level locking for concurrent bookings
- ✅ Overnight booking support
- ✅ Analytics & quota history

---

**Next steps:**
1. Create GitHub issues for each P0 item
2. Add test coverage before fixes
3. Deploy P0 fixes to production ASAP
4. Schedule P1 items for next sprint

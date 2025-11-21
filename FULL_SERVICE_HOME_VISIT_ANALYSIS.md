# 🏠 Analisis: Full Service Home Visit (Makeup Artist Scenario)

## 📋 Problem Statement

**Scenario: Make Up Artist Service**
```
Service: "Professional Makeup" 
- Duration: 120 minutes (2 hours)
- Type: Full service home visit
- Requirements:
  ✓ Can only serve 1 client per appointment
  ✓ Cannot overlap with other bookings
  ✓ Requires travel time between houses (20-30 min min)
  ✓ Max 3 clients per day (only 1 booking per 2-3 hours including travel)
  ✓ Staff: Only Artist Joko can do this service
  ✓ Need to block artist for prep/cleanup time

Current Time: 09:00
Artist availability: 08:00-18:00

Ideal bookings:
- 08:00-10:30 (120 min service + 30 min travel)
- 11:00-13:30 (120 min service + 30 min travel)
- 14:00-16:30 (120 min service + 30 min travel)

Expected behavior:
- System shows max 3 slots on that day
- After 1st booking, other 2 slots reduce
- After 3rd booking, day is FULLY BOOKED
```

---

## 🔍 Current System Analysis

### Issue #1: NO STAFF ASSIGNMENT IN AVAILABILITY CHECK

```typescript
// booking-service.ts getAvailability()
const { data: bookings, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('service_id', request.serviceId)  // ← Only by SERVICE!
  .eq('status', BookingStatus.CONFIRMED)
  .gte('scheduled_at', startOfDay.toISOString())
  .lte('scheduled_at', endOfDay.toISOString());

// ✗ MISSING: .eq('staff_id', staffId)
// Problem: Treats all bookings as if they block EACH OTHER
// Even if handled by different staff members!
```

**Concrete Example:**
```
Service "Makeup" can be handled by:
- Staff A: Joko (Makeup Artist)
- Staff B: Siti (Makeup Artist)

Current system:
- Booking 1: 08:00 with Joko
- Booking 2: 08:00 with Siti ← Should be available!
- Current: Shows CONFLICTING (WRONG!)
```

---

### Issue #2: NO DAILY QUOTA PER STAFF

```typescript
// service-service.ts
hourlyQuota: integer('hourly_quota').default(10),
// ✓ Exists
// ✗ MISSING: dailyQuota
// ✗ MISSING: dailyQuotaPerStaff
// ✗ MISSING: weeklyQuotaPerStaff
// ✗ MISSING: monthlyQuota
```

**Real Scenario:**
```
Makeup Artist Joko:
- Hourly quota: 1 (only 1 booking per hour)
- Daily quota should be: 3 (max 3 appointments)
- Current: No daily quota exists!

What happens:
- Can book 4+ appointments if they're in different hours
- E.g., 09:00, 11:00, 13:00, 15:00 all show available
- But Joko can only do 3!
```

---

### Issue #3: NO TRAVEL TIME BLOCKING

```typescript
// When calculating availability:
// Check if slot conflicts with existing bookings
const conflictingBooking = (bookings || []).find(b => {
  const bookingStart = new Date(b.scheduled_at);
  const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
  return slotStart < bookingEnd && slotEnd > bookingStart;
});

// ✓ Detects time conflicts for service duration
// ✗ MISSING: Considers travel time!

// Example: Joko booking
// A: 09:00-11:00 (Location A: Jakarta Selatan)
// B: 11:00-13:00 (Location B: Jakarta Pusat)
// 
// System: Shows B at 11:00 as available ✓ (no time overlap with A)
// Reality: Joko needs 20-30 min travel from A to B ✗
// Should block until 11:30 or later!
```

---

### Issue #4: NO STAFF AVAILABILITY MATRIX

```typescript
// Database schema:
staff {
  id, name, email, phone, role, ...
}

// ✗ MISSING:
// - dailyHours[] per staff (override business hours?)
// - maxBookingsPerDay per staff?
// - specialization[] (which services can they do?)
// - breakTimes[] (lunch, prayer, etc)?
// - maxTravelTimePerDay (fatigue)?
// - preferredServiceAreas[] (avoid certain regions)?

// Current: Staff table is basic contact/auth info only
```

---

### Issue #5: STAFF NOT LINKED IN BOOKING CREATION

```typescript
// booking-service.ts createBooking()
// When creating a booking:

const { data: newBooking, error: insertError } = await supabase
  .from('bookings')
  .insert({
    // ... all fields
    staff_id: null,  // ← Always NULL!
    // ...
  });

// ✓ staffId column exists in table
// ✗ NEVER populated during booking creation
// ✗ NEVER auto-assigned to available staff

// Result: Bookings created without knowing who will do them!
// Manual assignment needed later (extra step)
```

---

### Issue #6: NO SERVICE -> STAFF MAPPING

```typescript
// Current structure:
services {
  id, name, duration, price, hourlyQuota, ...
  // ✗ MISSING: assignedStaff[] or staffCanHandle[]
}

// Problem: System doesn't know:
// - Which staff can provide service X?
// - Service "Advanced Makeup" only Joko?
// - Service "Basic Makeup" both Joko & Siti?

// Current: Any staff marked as "staff" role can do anything
```

---

### Issue #7: BOOKING SEQUENCE MATTERS BUT NOT TRACKED

```typescript
// For multi-day home visits (rare but possible):
// Day 1: Consultation (1 hour)
// Day 2: Main service (3 hours)

// Current: Treated as independent bookings
// ✗ MISSING: LinkedBooking relationship
// ✗ MISSING: Sequence tracking
// ✗ MISSING: Can't apply "package pricing"
```

---

### Issue #8: NO BUFFER TIME FOR PREP/CLEANUP

```typescript
// Real scenario: Makeup Artist prep/cleanup
// Booking: 09:00-11:00 makeup application
// Actual staff unavailable: 08:30-11:30
// (30 min prep before, 30 min cleanup after)

// Current: Only blocks 09:00-11:00
// ✗ Next slot at 11:00 shows available
// ✗ Staff double-booked!

// ✗ MISSING: bufferTimeMinutesBefore, bufferTimeMinutesAfter
```

---

### Issue #9: NO STAFF AVAILABILITY CHECK IN GETAVAILABILITY

```typescript
// getAvailability() doesn't check:
// - Is staff member active (is_active)?
// - Is staff on vacation/leave?
// - Is staff working today (shift schedule)?
// - Is staff already fully booked for day?

// Current: Only checks service + date
// Not: service + date + staff availability
```

---

## 💾 Database Schema Gaps

### Current (Insufficient):
```typescript
bookings {
  id, tenantId, customerId, serviceId, 
  staffId,  // ← Exists but unused
  status, scheduledAt, duration, 
  // ...
}

staff {
  id, tenantId, name, email, phone, role,
  isActive,
  // ✗ No scheduling info
  // ✗ No service specialization
  // ✗ No daily limits
}
```

### What's Missing:
```typescript
// Proposed: staff_services (many-to-many)
pgTable('staff_services', {
  id,
  staffId,
  serviceId,
  canPerform: boolean (true = can do this service),
  isSpecialist: boolean (true = only this staff for service),
  minExperience?: string,
})

// Proposed: staff_hours (override business hours)
pgTable('staff_hours', {
  id,
  staffId,
  dayOfWeek, // 0-6
  startTime, endTime,
  isAvailable,
})

// Proposed: staff_daily_quota
pgTable('staff_daily_quota', {
  id,
  staffId,
  maxBookingsPerDay,
  maxHoursPerDay,
  maxTravelDistancePerDay,
})

// Proposed: staff_leave
pgTable('staff_leave', {
  id,
  staffId,
  dateStart, dateEnd,
  reason,
})

// Proposed: booking_buffer_time
pgTable('booking_buffer_time', {
  id,
  serviceId,
  minutesBefore,
  minutesAfter,
  description, // "Setup", "Cleanup"
})
```

---

## 🚨 SYSTEM BEHAVIOR - WRONG

### Scenario: 3 Makeup Artist Bookings

**Setup:**
- Service: "Professional Makeup" (120 min, 1 per hour max, duration 2 hours)
- Staff: Joko (only specialist)
- Date: 2024-11-21
- Business hours: 08:00-18:00

**What SHOULD happen:**
```
08:00 → First slot (Joko available) ✓
10:00 → (blocked by Joko's 08:00-10:00 booking + travel 20min = until 10:20)
10:30 → Available (Joko free)
12:30 → Available (Joko free)
14:30 → Available (Joko free)
16:30 → Available (Joko free)
17:30 → NOT available (would end 19:30, past business hours)

Max bookable: 3-4 depending on travel
```

**What ACTUALLY happens:**
```
getAvailability() generates slots every 30 min:
08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, ...

Quota check:
- Hour 08: 0 bookings < 10 quota ✓
- Hour 09: 0 bookings < 10 quota ✓
- Hour 10: 0 bookings < 10 quota ✓
...

Result: ALL SLOTS SHOW AVAILABLE!

User can book:
- 08:00 ✓
- 08:30 ✗ (overlap)
- 09:00 ✗ (overlap)
- 09:30 ✗ (overlap)
- ...eventually:
- 16:00 ✓ (4 hours after first slot)
- 16:30 ✓ (no overlap if duration aligned)

But frontend slot picker might allow user to book BOTH 08:00 and 09:00!
→ System accepts, then double-books Joko!
```

---

## 🧪 TEST CASES THAT WOULD FAIL

```typescript
describe('Full Service Home Visit with Staff', () => {
  test('Should only show one booking per staff per time slot');
  // FAILS: Current shows all as available if in different hours

  test('Should limit daily bookings per staff to dailyQuota');
  // FAILS: No dailyQuota exists

  test('Should block travel time between appointments');
  // FAILS: No travel time consideration

  test('Should assign available staff automatically');
  // FAILS: staffId always null

  test('Should check staff availability before showing slot');
  // FAILS: No staff availability check

  test('Should respect staff specialization');
  // FAILS: No service->staff mapping

  test('Should apply prep/cleanup buffer time');
  // FAILS: No buffer time exists

  test('Should prevent booking if staff already fully booked today');
  // FAILS: No daily quota check

  test('Multiple staff should allow parallel bookings');
  // FAILS: Counts all bookings together regardless of staff
});
```

---

## ❌ CURRENT SYSTEM ISSUES

| Issue | Impact | Severity |
|-------|--------|----------|
| No staff filtering in availability | Can see slots even if staff booked | 🔴 CRITICAL |
| No daily quota per staff | Can overbookbook staff | 🔴 CRITICAL |
| No travel time blocking | Double-books when considering travel | 🔴 CRITICAL |
| staffId not auto-assigned | Manual assignment needed | 🟠 HIGH |
| No staff->service mapping | Any staff shown for any service | 🟠 HIGH |
| No prep/cleanup buffer | Staff back-to-back without time | 🟠 HIGH |
| No staff specialization | Can't limit to specific staff | 🟠 HIGH |
| No staff daily hours override | Can't customize staff schedules | 🟡 MEDIUM |
| No staff leave/vacation | Can book during staff absence | 🟡 MEDIUM |

---

## ✅ RECOMMENDED IMPLEMENTATION

### Phase 1 - CRITICAL (Do First)

#### 1. Add Staff Availability Check to getAvailability()

```typescript
// booking-service.ts
static async getAvailability(tenantId: string, request: AvailabilityRequest): Promise<AvailabilityResponse | null> {
  // ... existing code ...
  
  // CHANGE: Filter bookings by both service AND staff
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('service_id', request.serviceId)
    .eq('status', BookingStatus.CONFIRMED);
    
    // NEW: If staffId provided, also filter by staff
    if (request.staffId) {
      query = query.eq('staff_id', request.staffId);
    }
    // OR if no staff specified, get bookings for ANY staff
    
    query = query
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString());
```

#### 2. Add Daily Quota Check

```typescript
// Get daily bookings count for this staff/service combo
const dailyBookingsCount = bookings.length;

// Check against daily quota
const dailyQuota = service.dailyQuota || 
                   Math.ceil((17 * 60) / service.duration); // Default: max slots in day

if (dailyBookingsCount >= dailyQuota) {
  return {
    date: request.date,
    slots: [], // No slots available, day is full
    businessHours: { isOpen: false },
    reason: 'Staff fully booked today'
  };
}

// Limit available slots to remaining quota
const remainingQuota = dailyQuota - dailyBookingsCount;
```

#### 3. Add Travel Time Blocking

```typescript
// For home visit bookings, add travel buffer
let actualSlotEnd = slotEnd;
if (data.isHomeVisit && service.homeVisitAvailable) {
  // Add 30 min travel buffer for next appointment
  const travelBuffer = 30; // minutes
  actualSlotEnd = new Date(slotEnd.getTime() + travelBuffer * 60000);
}

// Check conflicts including buffer
const conflictingBooking = (bookings || []).find(b => {
  const bookingStart = new Date(b.scheduled_at);
  const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60000);
  // Add travel buffer from previous booking
  const bookingEndWithBuffer = new Date(bookingEnd.getTime() + 30 * 60000);
  return slotStart < bookingEndWithBuffer && actualSlotEnd > bookingStart;
});
```

#### 4. Auto-Assign Staff to Booking

```typescript
// In createBooking():
let assignedStaffId = data.staffId;

if (!assignedStaffId && data.isHomeVisit) {
  // Auto-assign available staff for home visit services
  const availableStaff = await findAvailableStaffForService(
    tenantId,
    data.serviceId,
    scheduledAt
  );
  
  if (!availableStaff) {
    return { error: 'No available staff for this time slot' };
  }
  
  assignedStaffId = availableStaff.id;
}

// Insert booking with staff
await supabase
  .from('bookings')
  .insert({
    // ...
    staff_id: assignedStaffId,
    // ...
  });
```

### Phase 2 - HIGH PRIORITY (Do Next)

#### 5. Create staff_services Mapping

```typescript
// Database migration
CREATE TABLE staff_services (
  id UUID PRIMARY KEY,
  staff_id UUID NOT NULL,
  service_id UUID NOT NULL,
  can_perform BOOLEAN DEFAULT true,
  is_specialist BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE(staff_id, service_id)
);

// Usage in getAvailability():
// Check if staff can actually perform this service
if (request.staffId) {
  const canPerform = await supabase
    .from('staff_services')
    .select('can_perform')
    .eq('staff_id', request.staffId)
    .eq('service_id', request.serviceId)
    .single();
  
  if (!canPerform?.can_perform) {
    return { error: 'Staff cannot perform this service' };
  }
}
```

#### 6. Add Staff Hours Override

```typescript
// Create staff_hours table for per-staff schedule
CREATE TABLE staff_hours (
  id UUID PRIMARY KEY,
  staff_id UUID NOT NULL,
  day_of_week INTEGER (0-6), -- 0=Sunday, 6=Saturday
  start_time TEXT, -- "08:00"
  end_time TEXT,   -- "18:00"
  is_available BOOLEAN DEFAULT true,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

// In getAvailability(), check staff hours if available
const staffHours = await supabase
  .from('staff_hours')
  .select('*')
  .eq('staff_id', request.staffId)
  .eq('day_of_week', dayOfWeek)
  .single();

if (staffHours && !staffHours.is_available) {
  return { error: 'Staff not available this day' };
}

// Use staff hours if available, else use business hours
const effectiveHours = staffHours || businessHours;
```

#### 7. Add Daily Quota Configuration

```typescript
// Update services table with quotas
ALTER TABLE services ADD COLUMN:
- daily_quota_per_staff INTEGER
- max_concurrent_bookings INTEGER (for shared services)
- appointment_type ENUM ('single_only', 'can_share', 'multiple_parallel')

// appointment_type:
// - 'single_only': Makeup Artist - only 1 at a time
// - 'can_share': Zumba class - can fit multiple
// - 'multiple_parallel': Group event - unlimited
```

#### 8. Add Staff Leave Management

```typescript
CREATE TABLE staff_leave (
  id UUID PRIMARY KEY,
  staff_id UUID NOT NULL,
  date_start DATE,
  date_end DATE,
  reason TEXT,
  is_paid BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

// Check in getAvailability()
const staffLeave = await supabase
  .from('staff_leave')
  .select('*')
  .eq('staff_id', request.staffId)
  .lte('date_start', bookingDate)
  .gte('date_end', bookingDate)
  .single();

if (staffLeave) {
  return { error: `Staff on leave: ${staffLeave.reason}` };
}
```

### Phase 3 - NICE TO HAVE

#### 9. Prep/Cleanup Buffer Times

```typescript
CREATE TABLE service_buffer_times (
  id UUID PRIMARY KEY,
  service_id UUID NOT NULL,
  minutes_before INTEGER DEFAULT 0,
  minutes_after INTEGER DEFAULT 0,
  description TEXT, -- "Setup", "Cleanup"
);

// Usage in availability:
const bufferTimes = await getBufferTimes(service.id);
const prepTime = bufferTimes.minutesBefore || 0;
const cleanupTime = bufferTimes.minutesAfter || 0;

const effectiveSlotStart = new Date(slotStart.getTime() - prepTime * 60000);
const effectiveSlotEnd = new Date(slotEnd.getTime() + cleanupTime * 60000);

// Check conflicts with effective times
```

#### 10. Travel Time Integration

```typescript
// When staff has multiple home visits:
// Calculate travel time between locations
const previousBooking = bookings
  .filter(b => b.staff_id === staffId)
  .filter(b => b.scheduled_at < slotStart)
  .sort((a, b) => b.scheduled_at - a.scheduled_at)[0];

if (previousBooking && previousBooking.is_home_visit) {
  const travelCalc = await LocationService.calculateTravel({
    origin: previousBooking.home_visit_address,
    destination: data.homeVisitAddress,
    tenantId
  });
  
  const requiredStartTime = new Date(
    previousBooking.scheduled_at + 
    previousBooking.duration * 60000 + 
    travelCalc.duration * 60000
  );
  
  if (slotStart < requiredStartTime) {
    isAvailable = false; // Not enough travel time
  }
}
```

---

## 📊 IMPACT OF FIXES

| Fix | Impact | Priority |
|-----|--------|----------|
| Staff filtering in availability | Prevents overbooking | P0 |
| Daily quota check | Limits staff to N bookings/day | P0 |
| Travel time blocking | Realistic scheduling | P0 |
| Staff auto-assignment | Streamlines workflow | P1 |
| Staff->service mapping | Ensures qualified staff | P1 |
| Staff hours override | Customizes per staff | P1 |
| Daily quota UI | Shows remaining slots | P2 |
| Travel time UI | Estimates arrival | P2 |

---

## 🎯 RESULT AFTER FIXES

**Same Makeup Artist Scenario:**

```
Service: "Professional Makeup" 
Staff: Joko (only specialist)
Date: 2024-11-21

System calculation:
- Available hours: 08:00-18:00 (10 hours = 600 minutes)
- Service duration: 120 minutes
- Travel buffer: 30 minutes
- Effective per booking: 150 minutes
- Possible slots: 600 / 150 = 4 max

getAvailability() returns:
- 08:00 slot ✓ (Joko: 08:00-10:30 with travel)
- 10:30 slot ✓ (Joko: 10:30-13:00 with travel)
- 13:00 slot ✓ (Joko: 13:00-15:30 with travel)
- 15:30 slot ✓ (Joko: 15:30-18:00 with travel)
- After 4th booking: NO MORE SLOTS TODAY ✓

User books first slot:
- 08:00 confirmed
- Remaining slots: 3
- Joko blocked until 10:30

User books second slot:
- 10:30 confirmed
- Remaining slots: 2
- Joko blocked until 13:00

User books third slot:
- 13:00 confirmed
- Remaining slots: 1
- Joko blocked until 15:30

User books fourth slot:
- 15:30 confirmed
- Remaining slots: 0
- DAY FULLY BOOKED ✓
- No more bookings possible ✓

Result: Perfect capacity management!
```

---

## 🚀 MIGRATION PATH

**Step 1: Update Services Table** (1 day)
- Add `daily_quota_per_staff`, `appointment_type`

**Step 2: Create Staff Service Mapping** (2 days)
- Create `staff_services` table
- Populate from existing staff roles

**Step 3: Update getAvailability()** (2 days)
- Add staff filtering
- Add daily quota check
- Add travel time blocking

**Step 4: Create Staff Hours** (1 day)
- Create `staff_hours` table
- Migration to populate defaults

**Step 5: Add Staff Leave** (1 day)
- Create `staff_leave` table
- Frontend for admin to manage

**Total: ~1 week of development**

---

## ✅ VERIFICATION CHECKLIST

After implementation:
- [ ] System respects daily quota per staff
- [ ] Can't overbookbook staff
- [ ] Travel time blocks overlapping bookings
- [ ] Staff auto-assigned to bookings
- [ ] Only qualified staff shown for services
- [ ] Staff hours customizable per person
- [ ] Can mark staff as unavailable (leave)
- [ ] Frontend shows remaining slots for day
- [ ] Admin can view staff utilization
- [ ] Notifications sent to assigned staff
- [ ] Tests pass for all scenarios
- [ ] Production booking works correctly


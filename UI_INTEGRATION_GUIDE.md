# UI Integration Guide - Home Visit & Staff Management

## 📁 New Components Created

### 1. **HomeVisitConfig** 
**File:** `components/services/home-visit-config.tsx`

Configure service type, full day booking, travel buffers, and daily quotas.

**Usage:**
```tsx
import { HomeVisitConfig } from '@/components/services/home-visit-config';

export default function ServiceEditPage() {
  return (
    <HomeVisitConfig 
      serviceId={serviceId}
      tenantId={tenantId}
      onSave={(config) => console.log('Saved:', config)}
    />
  );
}
```

**Props:**
- `serviceId` (string, required) - Service ID
- `tenantId` (string, required) - Tenant ID  
- `onSave` (function, optional) - Callback when config saved

---

### 2. **StaffAssignment**
**File:** `components/services/staff-assignment.tsx`

Assign staff members to services with specialist status.

**Usage:**
```tsx
import { StaffAssignment } from '@/components/services/staff-assignment';

export default function ServiceEditPage() {
  return (
    <StaffAssignment 
      serviceId={serviceId}
      tenantId={tenantId}
    />
  );
}
```

**Props:**
- `serviceId` (string, required) - Service ID
- `tenantId` (string, required) - Tenant ID

---

### 3. **StaffSchedule**
**File:** `components/staff/staff-schedule.tsx`

Manage per-staff working hours (overrides business hours).

**Usage:**
```tsx
import { StaffSchedule } from '@/components/staff/staff-schedule';

export default function StaffDetailPage() {
  return (
    <StaffSchedule 
      staffId={staffId}
      tenantId={tenantId}
      staffName="John Doe"
    />
  );
}
```

**Props:**
- `staffId` (string, required) - Staff ID
- `tenantId` (string, required) - Tenant ID
- `staffName` (string, optional) - Staff name for display

---

### 4. **StaffLeave**
**File:** `components/staff/staff-leave.tsx`

Track vacation and sick leave records.

**Usage:**
```tsx
import { StaffLeave } from '@/components/staff/staff-leave';

export default function StaffDetailPage() {
  return (
    <StaffLeave 
      staffId={staffId}
      tenantId={tenantId}
      staffName="John Doe"
    />
  );
}
```

**Props:**
- `staffId` (string, required) - Staff ID
- `tenantId` (string, required) - Tenant ID
- `staffName` (string, optional) - Staff name for display

---

## 🔗 Integration Points

### Service Edit Page
**File:** `app/tenant/admin/services/[id]/edit/content.tsx`

Add to service edit page:

```tsx
'use client';

import { HomeVisitConfig } from '@/components/services/home-visit-config';
import { StaffAssignment } from '@/components/services/staff-assignment';

export function ServiceEditContent({ serviceId }: { serviceId: string }) {
  const tenantId = useCurrentTenant(); // Get from context
  
  return (
    <div className="space-y-6">
      {/* ... existing content ... */}
      
      {/* New Home Visit Configuration Section */}
      <HomeVisitConfig 
        serviceId={serviceId}
        tenantId={tenantId}
      />
      
      {/* New Staff Assignment Section */}
      <StaffAssignment 
        serviceId={serviceId}
        tenantId={tenantId}
      />
    </div>
  );
}
```

---

### Staff Detail Page
**File:** `app/tenant/admin/staff/[id]/page.tsx` (create if doesn't exist)

Add to staff detail page:

```tsx
'use client';

import { StaffSchedule } from '@/components/staff/staff-schedule';
import { StaffLeave } from '@/components/staff/staff-leave';

export function StaffDetailContent({ staffId, staffName }: Props) {
  const tenantId = useCurrentTenant();
  
  return (
    <div className="space-y-6">
      {/* ... existing content ... */}
      
      {/* Working Schedule Section */}
      <StaffSchedule 
        staffId={staffId}
        tenantId={tenantId}
        staffName={staffName}
      />
      
      {/* Leave Management Section */}
      <StaffLeave 
        staffId={staffId}
        tenantId={tenantId}
        staffName={staffName}
      />
    </div>
  );
}
```

---

## 📊 UI Workflow

### Service Management Workflow

1. **Create/Edit Service**
   - Go to Admin → Services → [Service]
   - Scroll to "Home Visit Configuration"
   - Set service type (on_premise/home_visit/both)
   - Configure travel buffers and daily quotas

2. **Assign Staff**
   - In same service page, scroll to "Staff Assignment"
   - Click "Assign Staff"
   - Select staff members
   - Confirm assignment

### Staff Management Workflow

1. **Set Working Schedule**
   - Go to Admin → Staff → [Staff Member]
   - Scroll to "Working Schedule"
   - Customize hours per day (overrides business hours)
   - Save for each day

2. **Manage Leave**
   - In same staff page, scroll to "Leave Management"
   - Click "Add Leave"
   - Set date range, reason, paid/unpaid status
   - Confirm

---

## 🎨 Component Features

### HomeVisitConfig
- ✅ Service type dropdown (on_premise, home_visit, both)
- ✅ Full day booking toggle
- ✅ Travel buffer minutes input
- ✅ Daily quota per staff input (optional)
- ✅ Requires staff assignment toggle
- ✅ Real-time validation
- ✅ Success/error alerts

### StaffAssignment
- ✅ List assigned staff
- ✅ Dialog to assign new staff
- ✅ Specialist badge display
- ✅ Remove staff button
- ✅ Search/filter support

### StaffSchedule
- ✅ All 7 days of week
- ✅ Toggle availability per day
- ✅ Start/end time inputs
- ✅ Save per day
- ✅ Loading states
- ✅ Error handling

### StaffLeave
- ✅ Create leave records
- ✅ Date range picker
- ✅ Reason selection
- ✅ Paid/unpaid toggle
- ✅ Active leave badge
- ✅ Delete leave records
- ✅ Formatted date display

---

## 🚀 Quick Implementation Checklist

### Step 1: Create Staff Detail Page (if missing)
```bash
# Create page structure
mkdir -p app/tenant/admin/staff/[id]
touch app/tenant/admin/staff/[id]/page.tsx
```

### Step 2: Add Components to Service Edit Page
```tsx
// In app/tenant/admin/services/[id]/edit/content.tsx
import { HomeVisitConfig } from '@/components/services/home-visit-config';
import { StaffAssignment } from '@/components/services/staff-assignment';

// Add to component JSX
```

### Step 3: Add Components to Staff Page
```tsx
// In app/tenant/admin/staff/[id]/page.tsx or detail view
import { StaffSchedule } from '@/components/staff/staff-schedule';
import { StaffLeave } from '@/components/staff/staff-leave';

// Add to component JSX
```

### Step 4: Ensure Required UI Components Exist
Check you have these Shadcn components installed:
- ✅ Button
- ✅ Input
- ✅ Label
- ✅ Card
- ✅ Switch
- ✅ Checkbox
- ✅ Select
- ✅ Dialog
- ✅ Alert
- ✅ Badge

If missing, install:
```bash
npx shadcn-ui@latest add [component-name]
```

---

## 📱 Mobile Responsive

All components are fully responsive:
- ✅ Mobile-first design
- ✅ Stacked layout on small screens
- ✅ Touch-friendly buttons
- ✅ Readable on all devices

---

## 🔐 Security & Permissions

All components:
- ✅ Require `X-Tenant-ID` header
- ✅ Validate tenant ownership
- ✅ Support role-based access (via API)
- ✅ Safe form handling
- ✅ No XSS vulnerabilities

---

## 🧪 Testing the UI

### Manual Testing Checklist

#### HomeVisitConfig
- [ ] Change service type and save
- [ ] Toggle full day booking
- [ ] Adjust travel buffer minutes
- [ ] Set daily quota
- [ ] See success message
- [ ] Refresh page, settings persist

#### StaffAssignment
- [ ] Open assign staff dialog
- [ ] Select staff members
- [ ] Click assign
- [ ] New staff appears in list
- [ ] Remove staff works
- [ ] Error handling works

#### StaffSchedule
- [ ] Toggle day availability
- [ ] Adjust start/end times
- [ ] Save per day
- [ ] Verify changes persist
- [ ] Toggle day off works

#### StaffLeave
- [ ] Add new leave record
- [ ] Set date range
- [ ] Choose reason
- [ ] Toggle paid/unpaid
- [ ] See active badge
- [ ] Delete works
- [ ] Format dates correctly

---

## 📡 API Integration

Components use these endpoints (already created):

**Services:**
- POST/GET `/api/services/[id]/home-visit-config` - Config
- GET/POST `/api/services/[id]/staff` - Staff assignment

**Staff:**
- GET/POST `/api/staff/[id]/schedule` - Schedule
- GET/POST/DELETE `/api/staff/[id]/leave` - Leave

All endpoints require `X-Tenant-ID` header.

---

## 🐛 Troubleshooting

### Components not showing?
- Check `X-Tenant-ID` header is being sent
- Verify tenant context is available
- Check browser console for errors

### API errors?
- Verify database migrations ran
- Check API endpoints are created
- Review browser network tab

### Styling issues?
- Ensure Shadcn UI components installed
- Check Tailwind CSS is configured
- Verify theme CSS imported

---

## 📝 Example Integration Code

### Complete Service Edit Page
```tsx
'use client';

import { useState } from 'react';
import { HomeVisitConfig } from '@/components/services/home-visit-config';
import { StaffAssignment } from '@/components/services/staff-assignment';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

export function ServiceEditContent({ serviceId }: { serviceId: string }) {
  const tenantId = useCurrentTenant();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      {/* Basic service info form here */}
      
      {/* Home Visit Configuration */}
      <HomeVisitConfig
        serviceId={serviceId}
        tenantId={tenantId}
        onSave={(config) => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      />

      {/* Staff Assignment */}
      <StaffAssignment
        serviceId={serviceId}
        tenantId={tenantId}
      />
    </div>
  );
}
```

### Complete Staff Detail Page
```tsx
'use client';

import { StaffSchedule } from '@/components/staff/staff-schedule';
import { StaffLeave } from '@/components/staff/staff-leave';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

export function StaffDetailContent({ 
  staffId, 
  staffName,
  staffEmail 
}: Props) {
  const tenantId = useCurrentTenant();

  return (
    <div className="space-y-6">
      {/* Staff info card here */}
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Working Schedule */}
        <StaffSchedule
          staffId={staffId}
          tenantId={tenantId}
          staffName={staffName}
        />

        {/* Leave Management */}
        <StaffLeave
          staffId={staffId}
          tenantId={tenantId}
          staffName={staffName}
        />
      </div>
    </div>
  );
}
```

---

## ✅ Next Steps

1. **Integrate into Service Edit Page** 
   - Add HomeVisitConfig component
   - Add StaffAssignment component

2. **Create/Update Staff Detail Page**
   - Add StaffSchedule component
   - Add StaffLeave component

3. **Test All Workflows**
   - Configure home visit service
   - Assign staff
   - Set schedules
   - Add leave

4. **Deploy to Production**
   - Push to main branch
   - Vercel auto-deploys
   - Test in production

---

**All UI components ready for integration!** 🎉

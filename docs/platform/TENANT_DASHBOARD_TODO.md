# Tenant Dashboard Development Roadmap

**Last Updated:** 2025-10-17  
**Status:** In Development  
**Target:** Complete tenant admin dashboard with all core features

---

## ⚡ IMPORTANT DISCOVERY

**All core business logic components ALREADY EXIST!** Located in `/components/`:

### Existing Components to Integrate:
- **Booking**: `BookingManagement.tsx`, `BookingCalendar.tsx`, `BookingDialog.tsx`, `RecurringBookingManager.tsx`, `HomeVisitBookingManager.tsx`, `PricingCalculator.tsx`
- **Customer**: `CustomerManagement.tsx`, `CustomerDetailsDialog.tsx`, `CustomerSearch.tsx`
- **Invoices**: `InvoiceManagement.tsx`, `InvoicePreview.tsx`, `FinancialDashboard.tsx`
- **Analytics**: `PlatformAnalyticsDashboard.tsx` (needs tenant-specific variant)
- **And more in**: `/components/dashboard/`, `/components/financial/`, `/components/settings/`, `/components/security/`

### Action Items (Simplified):
Instead of building from scratch, the actual work is:
1. **Fix tenant/staff authentication** so they can login
2. **Import existing components** into `/tenant/admin/*` pages
3. **Update component props** to work with tenant context instead of super-admin context
4. **Update APIs** to filter by tenant_id instead of showing all data

**Estimated real effort:** 1-2 weeks instead of 4-6 weeks! ✨

---

## 📋 Overview

Complete development roadmap for Booqing tenant dashboard (`tenant.booqing.my.id/admin`) including landing page enhancements and staff management.

### Current Status
- ✅ Tenant landing page renders correctly
- ✅ Staff creation API implemented
- ✅ Dashboard structure & navigation created
- ✅ **ALL Core Components Already Exist!** (booking, customer, services, analytics, etc)
- ❌ Authentication for tenant/staff needed
- ❌ Components need to be integrated to `/tenant/admin/*` pages

---

---

## 🚀 SIMPLIFIED INTEGRATION ROADMAP

### Quick Reference - What Already Exists
```
Components/                              → Ready to use in /tenant/admin/
├── booking/BookingManagement.tsx        → /tenant/admin/bookings
├── customer/CustomerManagement.tsx      → /tenant/admin/customers  
├── settings/BusinessSettingsPanel.tsx   → /tenant/admin/settings
├── financial/FinancialDashboard.tsx     → /tenant/admin/finance
├── analytics/                           → /tenant/admin/analytics
├── dashboard/                           → /tenant/admin/
└── ... more components ready
```

### Integration Tasks (New Priority Order):

---

## 🚀 Phase 1: Authentication & Access Control

### Task 1.1: Implement Tenant/Staff Login
- [ ] Create login page for tenant subdomain (`/tenant/login`)
- [ ] Update auth-actions for staff authentication flow
- [ ] Add session management for staff users
- [ ] Implement password reset flow for staff
- [ ] Add "remember me" functionality
- [ ] Create protected route middleware for `/tenant/admin/*`
- [ ] Add role-based access to dashboard features
- **Priority:** 🔴 CRITICAL
- **Estimated:** 3-4 hours

### Task 1.2: User Session Persistence
- [ ] Implement cookie-based session storage
- [ ] Add session validation on page load
- [ ] Handle session expiration with auto-logout
- [ ] Redirect to login if session invalid
- [ ] Add "Keep me logged in" option
- **Priority:** 🔴 CRITICAL
- **Estimated:** 2 hours

### Task 1.3: Multi-Role Access Control
- [ ] Define permission matrix (staff, admin, owner)
- [ ] Implement RBAC middleware
- [ ] Restrict features by role
- [ ] Add permission checking in API endpoints
- [ ] Create audit trail for access logs
- **Priority:** 🟠 HIGH
- **Estimated:** 2-3 hours

---

## 📅 Phase 2: Integrate Booking Management

**Component Available:** `components/booking/BookingManagement.tsx` ✅

### Task 2.1: Import & Use BookingManagement
- [ ] Update `/tenant/admin/bookings/page.tsx`
- [ ] Import `BookingManagement` component
- [ ] Pass `tenantId` from context/params
- [ ] Fetch tenant services & customers
- [ ] Pass as props to component
- **Priority:** 🔴 CRITICAL
- **Estimated:** 1-2 hours

### Task 2.2: Update API Endpoints for Tenant Context
- [ ] Update `/api/bookings` to filter by `tenant_id` 
- [ ] Update `/api/bookings/availability` to use tenant context
- [ ] Update `/api/bookings/[id]` for tenant validation
- [ ] All APIs should check: "is this booking for the current tenant?"
- **Priority:** 🔴 CRITICAL
- **Estimated:** 2-3 hours

### Task 2.3: Add Booking Dialog/Creation
- [ ] Component `BookingDialog.tsx` already exists ✅
- [ ] Integrate into BookingManagement page
- [ ] Update submit handler to send to tenant-specific API
- **Priority:** 🔴 CRITICAL
- **Estimated:** 1 hour

### Task 2.4: Test Complete Booking Flow
- [ ] Login as staff/tenant owner
- [ ] Create new booking
- [ ] Update booking status
- [ ] Cancel booking
- [ ] Test recurring bookings
- **Priority:** 🔴 CRITICAL
- **Estimated:** 1-2 hours

---

## 👥 Phase 3: Integrate Customer Management

**Component Available:** `components/customer/CustomerManagement.tsx` ✅

### Task 3.1: Import & Use CustomerManagement
- [ ] Create `/tenant/admin/customers` page
- [ ] Fetch all customers for tenant
- [ ] Display in table format with columns:
  - Name
  - Phone/WhatsApp
  - Email
  - Total bookings
  - Lifetime value
  - Last booking date
  - Status (active/inactive)
- [ ] Add pagination
- [ ] Add search by name/phone
- [ ] Add filtering by status, booking count
- [ ] Add sorting
- **Priority:** 🔴 CRITICAL
- **Estimated:** 3-4 hours

### Task 3.2: Add New Customer
- [ ] Create `/tenant/admin/customers/new` page
- [ ] Form with fields:
  - Name (required)
  - Phone (required, validate format)
  - Email
  - Address
  - Notes/preferences
- [ ] Validate phone is unique per tenant
- [ ] Auto-detect WhatsApp availability
- [ ] Save to database
- [ ] Allow quick add from booking page
- **Priority:** 🔴 CRITICAL
- **Estimated:** 2-3 hours

### Task 3.3: Customer Detail Page
- [ ] Create `/tenant/admin/customers/[id]` page
- [ ] Display customer information
- [ ] Show booking history
- [ ] Show total spent
- [ ] Show lifetime value
- [ ] Allow editing customer info
- [ ] Add notes/tags
- [ ] Show WhatsApp conversation history
- **Priority:** 🔴 CRITICAL
- **Estimated:** 4 hours

### Task 3.4: Customer Lifecycle Management
- [ ] Track customer status (active, inactive, VIP, blacklist)
- [ ] Auto-calculate customer metrics:
  - Total bookings
  - Lifetime value
  - Average booking value
  - Last booking date
  - Next booking (if scheduled)
- [ ] Create customer segments for marketing
- [ ] Send re-engagement campaigns to inactive customers
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3 hours

---

## 💼 Phase 4: Service Management

### Task 4.1: Service List Page
- [ ] Create `/tenant/admin/services` page
- [ ] Display services in table/card format with:
  - Service name
  - Category
  - Duration
  - Price
  - Active status
  - Number of bookings
- [ ] Add pagination
- [ ] Add filtering by category, status
- [ ] Add search
- **Priority:** 🔴 CRITICAL
- **Estimated:** 3 hours

### Task 4.2: Create Service
- [ ] Create `/tenant/admin/services/new` page
- [ ] Form with fields:
  - Name (required)
  - Description
  - Category
  - Duration (in minutes)
  - Price
  - Home visit available (checkbox)
  - Home visit surcharge (if checked)
  - Service area (multi-select)
  - Requirements (list/tags)
  - Images (upload multiple)
- [ ] Validate inputs
- [ ] Save to database
- [ ] **Priority:** 🔴 CRITICAL
- **Estimated:** 3-4 hours

### Task 4.3: Edit Service
- [ ] Create `/tenant/admin/services/[id]/edit` page
- [ ] Allow editing all service details
- [ ] Handle image upload/removal
- [ ] Prevent editing if booking history exists (show warning)
- [ ] Archive old versions
- **Priority:** 🟠 HIGH
- **Estimated:** 2-3 hours

### Task 4.4: Service Performance Analytics
- [ ] Show bookings per service
- [ ] Show revenue per service
- [ ] Show average rating per service
- [ ] Identify top performing services
- [ ] Show booking trends
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3 hours

### Task 4.5: Service Area Management
- [ ] Create service area configuration
- [ ] Define coverage area (map-based or address list)
- [ ] Calculate travel distance/time
- [ ] Apply location-based surcharge
- [ ] Validate customer location on home visit booking
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4-5 hours

---

## 💰 Phase 5: Financial Management

### Task 5.1: Invoice Generation & Management
- [ ] Create `/tenant/admin/invoices` page
- [ ] Auto-generate invoices on booking completion
- [ ] Display invoice list with:
  - Invoice number
  - Customer name
  - Amount
  - Status (draft, issued, paid, overdue, cancelled)
  - Due date
  - Created date
- [ ] Add filtering by status, date range
- **Priority:** 🟠 HIGH
- **Estimated:** 3-4 hours

### Task 5.2: Invoice Details & Editing
- [ ] Create `/tenant/admin/invoices/[id]` page
- [ ] Show invoice details with breakdown
- [ ] Allow editing before marking as issued
- [ ] Add notes/memo field
- [ ] Add tax configuration
- [ ] Allow manual invoice creation
- **Priority:** 🟠 HIGH
- **Estimated:** 3 hours

### Task 5.3: Invoice Export & PDF
- [ ] Generate PDF invoice
- [ ] Export as Excel/CSV
- [ ] Send invoice via email
- [ ] Send invoice via WhatsApp
- [ ] Print invoice
- **Priority:** 🟠 HIGH
- **Estimated:** 3-4 hours

### Task 5.4: Payment Tracking
- [ ] Track payment status per invoice
- [ ] Mark as paid/partial paid
- [ ] Track payment date & method
- [ ] Generate payment receipts
- [ ] Send payment reminders
- [ ] Handle refunds
- **Priority:** 🟠 HIGH
- **Estimated:** 3 hours

### Task 5.5: Revenue Analytics
- [ ] Create revenue dashboard
- [ ] Show total revenue (daily, weekly, monthly, yearly)
- [ ] Show revenue by service
- [ ] Show revenue by customer
- [ ] Revenue trends chart
- [ ] Show outstanding payments
- [ ] Show payment collection rate
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4 hours

---

## 📱 Phase 6: WhatsApp Integration

### Task 6.1: Message Management Page
- [ ] Create `/tenant/admin/messages` page
- [ ] Show list of customers with conversations
- [ ] Display latest message preview
- [ ] Show unread count
- [ ] Mark conversations as read/unread
- **Priority:** 🟠 HIGH
- **Estimated:** 3 hours

### Task 6.2: Conversation View
- [ ] Create message thread view
- [ ] Display conversation history
- [ ] Show message timestamps
- [ ] Show message status (sent, delivered, read)
- [ ] Show media/attachments
- **Priority:** 🟠 HIGH
- **Estimated:** 3 hours

### Task 6.3: Send Messages
- [ ] Add message input box
- [ ] Send text messages
- [ ] Support media attachments
- [ ] Add quick reply templates
- [ ] Schedule messages
- [ ] Bulk messaging to customer segments
- **Priority:** 🟠 HIGH
- **Estimated:** 4 hours

### Task 6.4: Message Templates
- [ ] Create `/tenant/admin/messages/templates` page
- [ ] Manage message templates (CRUD)
- [ ] Template variables support
- [ ] Use templates in automated scenarios:
  - Booking confirmation
  - Booking reminder (24h before, 1h before)
  - Booking completion
  - Invoice sent
  - Payment reminder
- **Priority:** 🟠 HIGH
- **Estimated:** 3 hours

### Task 6.5: Automated Notifications
- [ ] Send booking confirmation WhatsApp
- [ ] Send appointment reminders (24h, 1h before)
- [ ] Send invoice links
- [ ] Send payment reminders
- [ ] Send post-service feedback request
- [ ] Configure automation rules
- **Priority:** 🟠 HIGH
- **Estimated:** 4 hours

---

## 📊 Phase 7: Analytics & Reporting

### Task 7.1: Dashboard Analytics
- [ ] Create `/tenant/admin/analytics` page (home dashboard already has basic stats)
- [ ] Show KPIs:
  - Total revenue (current period vs previous)
  - Total bookings
  - Average booking value
  - Customer count
  - Booking conversion rate
- [ ] Charts:
  - Revenue trend chart
  - Bookings trend chart
  - Service popularity chart
  - Customer acquisition chart
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4 hours

### Task 7.2: Customer Analytics
- [ ] Customer acquisition trends
- [ ] Customer retention rate
- [ ] Lifetime value distribution
- [ ] Customer segmentation
- [ ] Churn analysis
- [ ] Customer acquisition cost analysis
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3 hours

### Task 7.3: Service Analytics
- [ ] Service revenue breakdown
- [ ] Service booking trends
- [ ] Service popularity ranking
- [ ] Service cancellation rates
- [ ] Best time slots for each service
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3 hours

### Task 7.4: Reports & Export
- [ ] Generate custom reports
- [ ] Date range selection
- [ ] Filter by service, customer, status
- [ ] Export to Excel/PDF
- [ ] Schedule automated reports
- [ ] Email reports to owner
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3 hours

---

## ⚙️ Phase 8: Settings & Configuration

### Task 8.1: Business Settings
- [ ] Create `/tenant/admin/settings` page
- [ ] Configure business information:
  - Business name, emoji, description
  - Contact info (phone, email, address)
  - Website
  - Business hours (per day)
- [ ] Add logo/branding images
- [ ] Configure brand colors
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2-3 hours

### Task 8.2: Booking Configuration
- [ ] Configure booking settings:
  - Advance booking period (how many days in advance)
  - Minimum booking notice
  - Cancellation window (time before booking to cancel)
  - Blackout dates
  - Buffer time between bookings
  - Recurring booking limits
- [ ] Configure payment settings:
  - Accept payment online or cash only
  - Deposit percentage required
  - Payment methods
  - Cancellation refund policy
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2-3 hours

### Task 8.3: Notification Settings
- [ ] Configure which notifications to send
- [ ] Template customization
- [ ] Notification schedule
- [ ] Email notification settings
- [ ] WhatsApp notification settings
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2 hours

### Task 8.4: Staff Management (in Dashboard)
- [ ] Create `/tenant/admin/staff` page
- [ ] List all staff members
- [ ] Assign roles & permissions
- [ ] Set allowed services per staff
- [ ] Track staff schedule
- [ ] View staff performance metrics
- [ ] Reset staff passwords
- [ ] Deactivate staff
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4 hours

---

## 👤 Phase 9: Staff & Permissions

### Task 9.1: Permission Matrix
- [ ] Define granular permissions:
  - Manage bookings (view, create, edit, delete, change status)
  - Manage customers (view, create, edit, delete)
  - Manage services (view, create, edit, delete)
  - Manage invoices (view, create, edit, delete, export)
  - Manage messages (view, send, manage templates)
  - Manage staff (view, create, edit, delete)
  - View analytics (view reports)
  - Manage settings
- [ ] Create role templates (admin, manager, staff, viewer)
- [ ] Allow custom permission combinations
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2 hours

### Task 9.2: Staff Performance Tracking
- [ ] Track bookings per staff
- [ ] Track customer ratings per staff
- [ ] Track revenue generated by staff
- [ ] Track staff attendance/schedule
- [ ] Show staff performance dashboard
- **Priority:** 🟢 LOW
- **Estimated:** 3 hours

---

## 🎨 Phase 10: Landing Page Enhancements

### Task 10.1: Online Booking Form
- [ ] Add booking request form to landing page
- [ ] Select service
- [ ] Choose date/time from available slots
- [ ] Enter customer info (name, phone, email)
- [ ] Submit booking request
- [ ] Send confirmation email/WhatsApp
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4 hours

### Task 10.2: Service Display Enhancement
- [ ] Show detailed service information
- [ ] Add service images/gallery
- [ ] Show service reviews & ratings
- [ ] Show service availability calendar
- [ ] Quick booking button per service
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3-4 hours

### Task 10.3: Customer Reviews & Ratings
- [ ] Request review after booking completion
- [ ] Display customer reviews on landing page
- [ ] Show star ratings
- [ ] Filter reviews by service
- [ ] Show recent/top reviews
- **Priority:** 🟢 LOW
- **Estimated:** 3 hours

### Task 10.4: Business Hours Display
- [ ] Show business hours on landing page
- [ ] Show current status (open/closed)
- [ ] Show countdown to next opening
- [ ] Disable bookings outside hours
- **Priority:** 🟢 LOW
- **Estimated:** 2 hours

---

## 🔒 Phase 11: Security & Compliance

### Task 11.1: Audit Logging
- [ ] Log all user actions (create, edit, delete)
- [ ] Log login attempts
- [ ] Log permission changes
- [ ] Create audit trail page (`/tenant/admin/audit-logs`)
- [ ] Export audit logs
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2-3 hours

### Task 11.2: Data Protection
- [ ] Implement data encryption at rest
- [ ] Encrypt sensitive fields (phone, email)
- [ ] GDPR compliance (data export, deletion)
- [ ] Data retention policies
- [ ] Backup & recovery procedures
- **Priority:** 🟡 MEDIUM
- **Estimated:** 3-4 hours

### Task 11.3: Rate Limiting & Protection
- [ ] Rate limit API endpoints
- [ ] DDOS protection
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- **Priority:** 🟡 MEDIUM
- **Estimated:** 2-3 hours

---

## 🧪 Phase 12: Testing & QA

### Task 12.1: Unit Tests
- [ ] Write unit tests for business logic
- [ ] Test booking calculations
- [ ] Test permission checks
- [ ] Test invoice generation
- [ ] Coverage target: 80%
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4-5 hours

### Task 12.2: Integration Tests
- [ ] Test auth flows
- [ ] Test booking workflow (create → confirm → complete)
- [ ] Test invoice generation & payment
- [ ] Test WhatsApp notifications
- [ ] Test permission enforcement
- **Priority:** 🟡 MEDIUM
- **Estimated:** 5-6 hours

### Task 12.3: E2E Tests
- [ ] Test complete booking flow
- [ ] Test staff login & dashboard
- [ ] Test customer interaction
- [ ] Test admin operations
- **Priority:** 🟡 MEDIUM
- **Estimated:** 4-5 hours

---

## 📈 Implementation Priority

### 🔴 CRITICAL (Start Immediately)
1. **Phase 1 - Authentication** - Required to use dashboard
2. **Phase 2 - Booking Management** - Core feature
3. **Phase 3 - Customer Management** - Core feature
4. **Phase 4 - Service Management** - Core feature

### 🟠 HIGH (Phase 2)
5. **Phase 5 - Financial Management** - Essential for revenue
6. **Phase 6 - WhatsApp Integration** - Key differentiator
7. **Phase 8 - Settings** - Business configuration
8. **Phase 9 - Staff Management** - Team operations

### 🟡 MEDIUM (Phase 3)
9. **Phase 7 - Analytics** - Business insights
10. **Phase 11 - Security** - Production requirements

### 🟢 LOW (Phase 4)
11. **Phase 10 - Landing Page Enhancements** - Nice to have
12. **Phase 12 - Testing** - Ongoing

---

## 📊 Effort Estimation

| Phase | Tasks | Est. Hours | Priority |
|-------|-------|-----------|----------|
| 1 - Auth | 3 | 7-9 | 🔴 CRITICAL |
| 2 - Bookings | 5 | 16-20 | 🔴 CRITICAL |
| 3 - Customers | 4 | 12-15 | 🔴 CRITICAL |
| 4 - Services | 5 | 15-18 | 🔴 CRITICAL |
| 5 - Financial | 5 | 15-18 | 🟠 HIGH |
| 6 - WhatsApp | 5 | 14-18 | 🟠 HIGH |
| 7 - Analytics | 4 | 14-16 | 🟡 MEDIUM |
| 8 - Settings | 4 | 6-8 | 🟠 HIGH |
| 9 - Permissions | 2 | 5-7 | 🟡 MEDIUM |
| 10 - Landing | 4 | 10-14 | 🟢 LOW |
| 11 - Security | 3 | 7-10 | 🟡 MEDIUM |
| 12 - Testing | 3 | 13-16 | 🟡 MEDIUM |
| **TOTAL** | **47** | **134-169 hours** | |

**Estimated Timeline:** 4-6 weeks (with 1 developer full-time)

---

## 🔄 Dependencies

```
Phase 1 (Auth) 
    ↓
Phase 2 (Bookings) ← Phase 3 (Customers) ← Phase 4 (Services)
    ↓                   ↓                      ↓
Phase 5 (Financial) Phase 6 (WhatsApp) Phase 7 (Analytics)
    ↓
Phase 8 (Settings) & Phase 9 (Permissions)
    ↓
Phase 10 (Landing Page) & Phase 11 (Security) & Phase 12 (Testing)
```

---

## 📝 Notes

- All pages should have consistent UI using shadcn/ui components
- All API endpoints should have proper error handling
- All user actions should be logged for audit purposes
- All features should be mobile-responsive
- Implement loading states for all async operations
- Add confirmation dialogs for destructive actions
- Implement undo functionality where applicable

---

**Version:** 1.0  
**Last Updated:** 2025-10-17  
**Next Review:** After Phase 1 Completion

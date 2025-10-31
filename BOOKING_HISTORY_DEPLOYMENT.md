# Booking History Tracking - Deployment Guide

## Overview

This update adds comprehensive audit logging for all booking events. The history menu now records all actions like:
- Booking created
- Payment recorded (with amount, method, timestamp)
- Status changes
- Invoice generation
- Invoice sending

## Step 1: Apply SQL Migration in Supabase

1. Open **Supabase Dashboard** → Your Project → **SQL Editor**
2. Create a new query and copy all content from `SQL_MIGRATION_BOOKING_HISTORY.sql`
3. Run the migration
4. Verify success - you should see:
   - `booking_history` table created
   - Indexes created successfully
   - RLS policies applied

### Alternative: Manual SQL

Run this in Supabase SQL Editor:

```sql
-- Booking History table (audit log for all booking events)
CREATE TABLE IF NOT EXISTS booking_history (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    actor TEXT DEFAULT 'System',
    actor_type TEXT DEFAULT 'system',
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for booking_history
CREATE INDEX IF NOT EXISTS booking_history_booking_id_idx ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS booking_history_tenant_id_idx ON booking_history(tenant_id);
CREATE INDEX IF NOT EXISTS booking_history_created_at_idx ON booking_history(created_at);
CREATE INDEX IF NOT EXISTS booking_history_action_idx ON booking_history(action);
```

## Step 2: Deploy Application

```bash
git push origin main
```

Wait for Vercel deployment to complete (~2 minutes)

## Step 3: Test Booking History

### Test Case 1: Create Booking and Check History

1. Create a new booking with Down Payment (DP)
   - Service: Any service
   - Customer: Any customer
   - Amount: Rp 150,000 (DP)
   - Payment Method: Transfer

2. Open the booking details → **History Tab**
   - Should show: "Booking created - [timestamp]"
   - Should show metadata: total amount, DP, service, payment method

### Test Case 2: Record Payment and Check History

1. From the same booking, click "Mark as Paid"
   - Payment Method: Cash
   - Amount: Rp 200,000 (remaining)

2. Open booking details → **History Tab**
   - Should now show TWO events:
     1. "Booking created - [timestamp]"
     2. "Payment recorded - 200000 cash - [timestamp]"

3. Each event should show timestamp and relevant metadata

### Test Case 3: Generate Invoice and Check History

1. With fully paid booking, click "Generate Invoice"

2. Open booking details → **History Tab**
   - Should show events including invoice generation

## Database Verification

Run these queries in Supabase SQL Editor to verify data:

```sql
-- Check if booking_history table was created
SELECT COUNT(*) FROM booking_history;

-- Check history for a specific booking
SELECT id, action, description, actor, created_at 
FROM booking_history
WHERE booking_id = 'YOUR_BOOKING_ID'
ORDER BY created_at DESC;

-- Check history count by action
SELECT action, COUNT(*) as count
FROM booking_history
GROUP BY action
ORDER BY count DESC;
```

## Events Tracked

| Action | Triggered When | Metadata |
|--------|----------------|----------|
| BOOKING_CREATED | New booking created | totalAmount, dpAmount, serviceId, paymentMethod |
| PAYMENT_RECORDED | Additional payment recorded | paymentAmount, paymentMethod, notes |
| STATUS_CHANGED | Booking status updated | oldStatus, newStatus |
| INVOICE_GENERATED | Invoice created from booking | invoiceId, invoiceNumber, totalAmount |
| INVOICE_SENT | Invoice sent via email/WhatsApp | invoiceId, method |

## History Tab Display

The History Tab now shows:
- **Event Description** - Human-readable action description
- **Timestamp** - When event occurred (ISO format)
- **Actor** - Who triggered event (System, Admin user, etc.)
- **Metadata** - Additional details if available

## API Endpoints

### Fetch Booking History

```bash
GET /api/bookings/{bookingId}/history?tenantId={tenantId}&limit=50

Response:
{
  "success": true,
  "bookingId": "...",
  "history": [
    {
      "id": "...",
      "bookingId": "...",
      "action": "BOOKING_CREATED",
      "description": "Booking created - BK-20251031-XXXXX",
      "actor": "System",
      "actorType": "system",
      "metadata": {
        "totalAmount": 350000,
        "dpAmount": 150000,
        "serviceId": "...",
        "paymentMethod": "transfer"
      },
      "createdAt": "2025-10-31T10:00:00Z"
    },
    ...
  ],
  "count": 5
}
```

## Troubleshooting

### History Tab Empty

1. Check browser console (F12) for errors
2. Verify API endpoint is working:
   ```bash
   curl "http://localhost:3000/api/bookings/{bookingId}/history?tenantId={tenantId}"
   ```
3. Check Supabase table has data:
   ```sql
   SELECT * FROM booking_history LIMIT 5;
   ```

### Logging Not Working

Check server logs in Vercel for:
- `[BookingHistoryService.logEvent]` messages
- `[BookingService.createBooking]` messages with history logging

### RLS Policy Blocking

If getting "RLS policy" errors:
1. Go to Supabase Dashboard
2. Click on `booking_history` table
3. Click "RLS" tab
4. Check policies are created correctly

## Future Enhancements

- [ ] Add filters (by action type, date range, actor)
- [ ] Add booking history export (CSV)
- [ ] Add history timeline visualization
- [ ] Add status change tracking
- [ ] Add staff assignment tracking
- [ ] Add admin action audit trail

## Rollback

If issues occur, you can disable history tracking:

```sql
-- Disable history logging temporarily
DROP TABLE IF EXISTS booking_history;

-- Code will continue to work but won't log events
```

Then reapply migration after fixes.

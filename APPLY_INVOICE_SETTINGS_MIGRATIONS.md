# Apply Invoice Settings Migrations

**IMPORTANT**: Run these SQL migrations in Supabase SQL Editor BEFORE using invoice settings features.

## Step 1: Add columns to `bookings` table

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tax_percentage REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_amount REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fees_amount REAL DEFAULT 0;
```

## Step 2: Add columns to `invoices` table

```sql
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_percentage REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_amount REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fees_amount REAL DEFAULT 0;
```

## Step 3: Add columns to `sales_transactions` table

```sql
ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS tax_percentage REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_amount REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fees_amount REAL DEFAULT 0;
```

## Step 4: Create `invoice_tax_service_charge` table

```sql
CREATE TABLE IF NOT EXISTS invoice_tax_service_charge (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    tax_percentage REAL DEFAULT 0,
    service_charge_type TEXT DEFAULT 'fixed' CHECK (service_charge_type IN ('fixed', 'percentage')),
    service_charge_value REAL DEFAULT 0,
    service_charge_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_tax_service_charge_tenant ON invoice_tax_service_charge (tenant_id);
```

## Step 5: Create `invoice_additional_fees` table

```sql
CREATE TABLE IF NOT EXISTS invoice_additional_fees (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_additional_fees_tenant ON invoice_additional_fees (tenant_id);
```

## Verification

After running migrations, verify with:

```sql
-- Check bookings columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('tax_percentage', 'service_charge_amount', 'additional_fees_amount')
ORDER BY column_name;

-- Check invoices columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('tax_percentage', 'service_charge_amount', 'additional_fees_amount')
ORDER BY column_name;

-- Check sales_transactions columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'sales_transactions' 
AND column_name IN ('tax_percentage', 'service_charge_amount', 'additional_fees_amount')
ORDER BY column_name;

-- Check invoice_tax_service_charge table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('invoice_tax_service_charge', 'invoice_additional_fees');
```

## What This Enables

Once migrations are applied:

1. **Booking Details** - Shows breakdown of base service + tax + service charge + additional fees
2. **Invoice Settings Menu** - Can configure tax %, service charge, and additional fees
3. **Booking Creation** - Automatically applies configured fees to total amount
4. **Invoice Generation** - Automatically applies configured fees to invoice total
5. **Sales Transactions** - Automatically applies configured fees to transaction total

## Features

### Tax
- Percentage-based (e.g., 10%)
- Automatically applied to all bookings/invoices/sales

### Service Charge
- Can be fixed amount (Rp) or percentage (%)
- Can be marked as required (auto-applied) or optional (user chooses)

### Additional Fees
- Multiple custom fees can be created
- Each can be fixed or percentage
- Examples: "Biaya Admin", "Biaya Pengiriman", etc.

## Impact

**Old Bookings/Invoices** (created before migration):
- Will show: tax_percentage = 0, service_charge_amount = 0, additional_fees_amount = 0
- Will NOT show breakdown (only base service amount)

**New Bookings/Invoices** (after running migrations + setting up Invoice Settings):
- Will automatically include tax, service charge, and additional fees in total amount
- Will show detailed breakdown in booking details and invoice preview
- Customers will see complete cost breakdown when booking via landing page

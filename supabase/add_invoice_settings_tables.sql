-- Invoice Tax and Service Charge Settings table
CREATE TABLE IF NOT EXISTS invoice_tax_service_charge (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    tax_percentage REAL DEFAULT 0,
    service_charge_type TEXT DEFAULT 'fixed' CHECK (service_charge_type IN ('fixed', 'percentage')),
    service_charge_value REAL DEFAULT 0,
    service_charge_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Additional Fees table
CREATE TABLE IF NOT EXISTS invoice_additional_fees (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_tax_service_charge_tenant ON invoice_tax_service_charge (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_additional_fees_tenant ON invoice_additional_fees (tenant_id);

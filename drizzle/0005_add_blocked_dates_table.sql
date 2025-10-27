-- Create blocked_dates table for managing blocked/unavailable dates
CREATE TABLE IF NOT EXISTS blocked_dates (
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

-- Create indexes for better query performance
CREATE INDEX idx_blocked_dates_tenant_id ON blocked_dates(tenant_id);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_blocked_dates_tenant_date ON blocked_dates(tenant_id, date);

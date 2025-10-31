-- Booking History table (audit log for all booking events)
CREATE TABLE IF NOT EXISTS booking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

-- Enable RLS for booking_history
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_history
CREATE POLICY "Tenants can view their own booking history"
  ON booking_history
  FOR SELECT
  USING (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tenants WHERE id = auth.uid() AND id = booking_history.tenant_id)
  );

CREATE POLICY "Tenants can insert their own booking history"
  ON booking_history
  FOR INSERT
  WITH CHECK (
    tenant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM tenants WHERE id = auth.uid() AND id = booking_history.tenant_id)
  );

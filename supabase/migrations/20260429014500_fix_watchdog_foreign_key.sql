-- Add foreign key constraint to link global_watchdog_events.tenant_id to tenants.id
-- First we need to alter the tenant_id column type to match tenants.id (UUID)
ALTER TABLE global_watchdog_events 
  ALTER COLUMN tenant_id TYPE UUID USING tenant_id::uuid;

-- Then add the explicit foreign key
ALTER TABLE global_watchdog_events
  ADD CONSTRAINT fk_watchdog_tenant
  FOREIGN KEY (tenant_id) 
  REFERENCES tenants(id)
  ON DELETE CASCADE;

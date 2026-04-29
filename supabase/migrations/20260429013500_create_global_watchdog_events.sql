-- Create global_watchdog_events table for centralized NOC monitoring
CREATE TABLE IF NOT EXISTS global_watchdog_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL, -- e.g., 'orchestrator', 'odoo', 'llm', 'webhook'
    status VARCHAR(50) NOT NULL, -- e.g., 'ok', 'fail', 'timeout'
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false
);

-- Index for timeline fetching (latest first)
CREATE INDEX IF NOT EXISTS idx_watchdog_events_created_at ON global_watchdog_events(created_at DESC);

-- Index for unresolved events filtering
CREATE INDEX IF NOT EXISTS idx_watchdog_events_unresolved ON global_watchdog_events(is_resolved) WHERE is_resolved = false;

-- Index for tenant drill-down
CREATE INDEX IF NOT EXISTS idx_watchdog_events_tenant_id ON global_watchdog_events(tenant_id);

-- Enable RLS (Assuming admins access this)
ALTER TABLE global_watchdog_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to read all events
CREATE POLICY "Admins can view all watchdog events"
    ON global_watchdog_events
    FOR SELECT
    USING (true); -- Requires auth logic integration depending on current Mission Control setup

-- Policy: Service role can insert events
CREATE POLICY "Service role can insert watchdog events"
    ON global_watchdog_events
    FOR INSERT
    WITH CHECK (true);

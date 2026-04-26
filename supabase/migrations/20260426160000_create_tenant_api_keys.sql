CREATE TABLE tenant_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tenant_id, provider)
);

-- Enable RLS
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Allow all for now (simulating dev)
CREATE POLICY "Allow all for authenticated users" ON tenant_api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

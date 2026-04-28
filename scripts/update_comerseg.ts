import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tenantId = '7c7fb7d2-e565-43a1-8e1b-285d5c54bcae';
  
  const orchestratorUrl = 'https://crm-agentico-orchestrator-cyxizsjbka-uc.a.run.app';
  // Como no proporcionaste un ID de bóveda exacto, usaré el slug por defecto
  const vaultKeyId = 'comerseg_vault_01'; 

  // 1. Update tenants
  const { data: tenantData, error: tenantErr } = await supabase
    .from('tenants')
    .update({
      orchestrator_url: orchestratorUrl,
      api_key_vault_id: vaultKeyId
    })
    .eq('id', tenantId)
    .select();

  if (tenantErr) console.error(tenantErr);
  
  // 2. Update tenant_configs
  // Fetch existing config first
  const { data: config } = await supabase.from('tenant_configs').select('features').eq('tenant_id', tenantId).single();
  
  let features = config?.features || {};
  features.channels = {
    ...features.channels,
    email_address: "fleetco@fleetco.mx",
    // We put @fleetcobot in tg_bot_token temporarily as a placeholder or hint
    tg_bot_token: "@fleetcobot",
    // Put phone in wa_phone_id as placeholder
    wa_phone_id: "+525610800923"
  };
  
  features.mcp_servers = [
    {
      id: "odoo_main",
      type: "sse",
      url: "https://odoo-mcp.fleetco.mx/sse", // placeholder based on domain
      env: []
    }
  ];

  const { data: configData, error: configErr } = await supabase
    .from('tenant_configs')
    .update({ features })
    .eq('tenant_id', tenantId)
    .select();

  if (configErr) console.error(configErr);
  
  console.log("Tenant Update:", tenantData);
  console.log("Config Update:", configData);
}

run();

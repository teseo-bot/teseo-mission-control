import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Vamos a eliminar el Tenant "Fleetco" que presumiblemente no está ligado a los canales de la POC de Comerseg
  const { data: fleetco, error } = await supabase
    .from('tenants')
    .delete()
    .eq('name', 'Fleetco')
    .select();
    
  if (error) console.error("Error deleting Fleetco:", error);
  console.log("Deleted Tenant:", fleetco);
  
  // Limpiamos los features dummy de Comerseg para dejarlos estructurados en el nuevo formato omnicanal vacío listo para llenar
  const { data: comerseg, error: updateError } = await supabase
    .from('tenant_configs')
    .update({ 
      features: {
        channels: {
          tg_bot_token: "",
          tg_authorized_groups: "",
          wa_phone_id: "",
          wa_verify_token: "",
          wa_access_token: "",
          email_address: "",
          email_password: "",
          email_imap_host: "",
          email_smtp_host: ""
        },
        mcp_servers: []
      }
    })
    .eq('tenant_id', '7c7fb7d2-e565-43a1-8e1b-285d5c54bcae')
    .select();
    
  if (updateError) console.error("Error updating Comerseg config:", updateError);
  console.log("Updated Tenant Config for Comerseg:", comerseg);
}
run();

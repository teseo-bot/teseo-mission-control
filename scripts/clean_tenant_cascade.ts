import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const fleetcoId = 'a47fdd32-b768-4f79-91ce-c5bf5d3e58a2';

  // Eliminar referencias en prompt_versions y prompt_templates
  console.log("Eliminando prompt_versions...");
  const { data: pt } = await supabase.from('prompt_templates').select('id').eq('tenant_id', fleetcoId);
  if (pt && pt.length > 0) {
    const templateIds = pt.map(p => p.id);
    await supabase.from('prompt_versions').delete().in('template_id', templateIds);
  }

  console.log("Eliminando prompt_templates...");
  await supabase.from('prompt_templates').delete().eq('tenant_id', fleetcoId);

  // Eliminar referencias en tenant_memories
  console.log("Eliminando tenant_memories...");
  await supabase.from('tenant_memories').delete().eq('tenant_id', fleetcoId);

  // Eliminar el tenant
  console.log("Eliminando Tenant Fleetco...");
  const { data: fleetco, error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', fleetcoId)
    .select();
    
  if (error) console.error("Error deleting Fleetco:", error);
  else console.log("Deleted Tenant:", fleetco);
}
run();

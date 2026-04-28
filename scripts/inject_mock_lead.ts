import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tenantId = '7c7fb7d2-e565-43a1-8e1b-285d5c54bcae'; // Comerseg

  const mockLead = {
    tenant_id: tenantId,
    name: "Carlos Prospecto",
    company: "Corporativo B2B",
    email: "carlos@corporativo.b2b",
    phone: "+52 55 9999 8888",
    status: "Contacted",
    source: "inbound_whatsapp",
    icp_score: 92,
    assigned_node: "sdr",
    metadata: { note: "Prueba técnica de Kanban inyectada." },
    sort_order: 1
  };

  const { data, error } = await supabase.from('leads').insert([mockLead]).select().single();
  if (error) {
    console.error("Error inserting lead:", error);
  } else {
    console.log("Successfully injected mock lead:", data);
  }
}
run();

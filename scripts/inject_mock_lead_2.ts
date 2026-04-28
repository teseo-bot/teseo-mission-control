import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tenantId = '7c7fb7d2-e565-43a1-8e1b-285d5c54bcae'; // Comerseg

  const mockLeads = [
    {
      tenant_id: tenantId,
      name: "Ana Martínez",
      company: "Logística Express",
      status: "New",
      source: "inbound_web",
      sort_order: 1
    },
    {
      tenant_id: tenantId,
      name: "Ricardo Silva",
      company: "Grupo Modelo",
      status: "Qualified",
      source: "outbound_hunter",
      icp_score: 95,
      sort_order: 1
    }
  ];

  const { data, error } = await supabase.from('leads').insert(mockLeads).select();
  if (error) {
    console.error("Error inserting leads:", error);
  } else {
    console.log("Successfully injected mock leads:", data);
  }
}
run();

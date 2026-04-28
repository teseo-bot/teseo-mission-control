import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lrptuwekwgbjutklctwr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHR1d2Vrd2dianV0a2xjdHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1MzQwOSwiZXhwIjoyMDkyMTI5NDA5fQ.iuWXzabPzQbR1XygZCCmDx-lBZREMHRl-eyDm6bsk0c";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error("Error:", error);
    }
  } else {
    console.log("Bucket created:", data);
  }
}
run();

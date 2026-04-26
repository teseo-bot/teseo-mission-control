import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real multi-tenant architecture, the user has a linked tenant_id.
    // For this dashboard, we might fetch the first tenant they have access to,
    // or rely on a generic dashboard branding if applicable.
    // Let's assume there's a master branding or the first active tenant config.
    const { data: configs, error: dbError } = await supabase
      .from("tenant_configs")
      .select("*")
      .limit(1);

    if (dbError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (configs && configs.length > 0) {
      return NextResponse.json(configs[0]);
    }

    return NextResponse.json({ primary_color: null, theme_mode: "SYSTEM", logo_url: null });
  } catch (err) {
    console.error("Error fetching tenant config:", err);
    // Return fallback safely instead of 500 to keep UI alive
    return NextResponse.json({ primary_color: null, theme_mode: "SYSTEM", logo_url: null });
  }
}

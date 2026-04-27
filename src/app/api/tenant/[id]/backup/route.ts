import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const tenantId = resolvedParams.id;
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 });
    }

    // Usar la Service Role Key para operaciones de administración
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.MISSION_CONTROL_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MISSION_CONTROL_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificamos que el tenant exista
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("id, status")
      .eq("id", tenantId)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 2. Aquí iría la lógica pesada de pg_dump o invocación al Worker de Backups
    // Como Mission Control orquesta, emitimos un registro de "Backup Request"
    // en una tabla de auditoría/jobs, o actualizamos un metadato "last_backup_status".
    // Para este MVP, insertaremos un log simulando la orquestación del pg_dump asíncrono.
    
    // (Opcional) Guardar log del trigger
    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      action: "KILL_SWITCH_BACKUP_TRIGGERED",
      details: { timestamp: new Date().toISOString(), requested_by: "mission_control" }
    });

    // 3. Suspendemos al tenant de forma segura atómica
    const { error: updateError } = await supabase
      .from("tenants")
      .update({ 
        status: "suspended",
        updated_at: new Date().toISOString()
      })
      .eq("id", tenantId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Backup policy triggered and Tenant suspended successfully." 
    });

  } catch (error: any) {
    console.error("Backup & Suspend error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

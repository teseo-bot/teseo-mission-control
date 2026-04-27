import { NextResponse, NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { updateRoleSchema } from "@/lib/schemas/tenant";

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
       return NextResponse.json({ error: "Missing Supabase admin config" }, { status: 500 });
    }

    const { id: tenantId } = await context.params;

    // Fetch tenant_users
    const { data: tenantUsers, error: dbError } = await supabaseAdmin
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", tenantId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Fetch auth users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
       return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const emailMap = new Map(authData.users.map(u => [u.id, u.email]));

    const usersWithEmail = tenantUsers.map(tu => ({
      ...tu,
      email: emailMap.get(tu.user_id) || "Unknown",
    }));

    return NextResponse.json({ users: usersWithEmail });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await context.params;
    
    // Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
       return NextResponse.json({ error: "Missing Supabase admin config" }, { status: 500 });
    }

    const { data: currentMembership } = await supabaseAdmin
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (!currentMembership || !["OWNER", "ADMIN"].includes(currentMembership.role)) {
      return NextResponse.json({ error: "Forbidden: Solo OWNER/ADMIN pueden cambiar roles" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, role } = updateRoleSchema.parse(body);

    const { error: updateError } = await supabaseAdmin
      .from("tenant_users")
      .update({ role })
      .eq("tenant_id", tenantId)
      .eq("user_id", user_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

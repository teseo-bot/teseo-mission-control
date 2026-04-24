import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // TODO: Wire up to Supabase / Trigger notifications
    console.log("Received L1 Agent Alert:", body);

    return NextResponse.json({ success: true, message: "Alert received" }, { status: 200 });
  } catch (error) {
    console.error("Error parsing webhook:", error);
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }
}

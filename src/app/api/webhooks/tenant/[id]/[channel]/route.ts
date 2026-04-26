import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cache in-memory para no saturar Supabase en Webhooks de alta frecuencia
const urlCache = new Map<string, { url: string; expires: number }>();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; channel: string }> | { id: string; channel: string } }) {
  return handleProxy(req, params);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; channel: string }> | { id: string; channel: string } }) {
  return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, params: Promise<{ id: string; channel: string }> | { id: string; channel: string }) {
  // Manejo seguro para Next.js 14 o 15 (params como Promise o como objeto directo)
  const resolvedParams = await params;
  const { id, channel } = resolvedParams;
  
  if (!id || !channel) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    let orchestratorUrl = "";
    const now = Date.now();
    const cached = urlCache.get(id);

    if (cached && cached.expires > now) {
      orchestratorUrl = cached.url;
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase variables missing");
        return new Response("Internal Server Error", { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from("tenants")
        .select("orchestrator_url")
        .eq("id", id)
        .single();

      if (error || !data?.orchestrator_url) {
        console.error(`Tenant ${id} not found or missing orchestrator_url:`, error);
        return new Response("Tenant Not Found or Missing URL", { status: 404 });
      }

      orchestratorUrl = data.orchestrator_url;
      // Cache for 5 minutes (300,000 ms)
      urlCache.set(id, { url: orchestratorUrl, expires: now + 300000 });
    }

    // Normalizar URL eliminando slash final
    const baseUrl = orchestratorUrl.replace(/\/$/, "");
    
    // Si viene con query parameters (ej: GET de Meta con hub.challenge), mantenerlos
    const url = new URL(req.url);
    const targetUrl = `${baseUrl}/api/webhook/${channel}${url.search}`;

    // Armar headers omitiendo 'host' para evitar conflictos de DNS
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("connection");

    // Inyectar el tenantId en el header para el Ingestion Gateway
    headers.set("x-tenant-id", id);

    // Preservar RAW body para validación HMAC en el destino
    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : null;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error("Webhook proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

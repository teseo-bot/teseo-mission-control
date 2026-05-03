import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Validar auth y tenant_id
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return new Response('Missing tenant_id', { status: 400 });
  }

  // 2. Conectar a PostgreSQL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing DATABASE_URL environment variable.");
    return new Response('Internal Server Error: Missing DB configuration', { status: 500 });
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    await client.query('LISTEN leads_changes');
  } catch (err) {
    console.error("Failed to connect to PG:", err);
    return new Response('Internal Server Error: DB connection failed', { status: 500 });
  }

  // 3. Establecer el stream SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      client.on('notification', (msg) => {
        if (msg.channel === 'leads_changes') {
          try {
            const payload = JSON.parse(msg.payload || '{}');
            // Validar que el evento emitido corresponda al tenant solicitado
            // Se asume que el payload de la BD incluye la propiedad record.tenant_id o tenant_id
            const recordTenantId = payload.data?.tenant_id || payload.tenant_id;
            
            if (recordTenantId === tenantId) {
              controller.enqueue(encoder.encode(`data: ${msg.payload}\n\n`));
            }
          } catch (e) {
            console.error("Error parsing PG notification payload:", e);
          }
        }
      });

      req.signal.addEventListener('abort', () => {
        client.end();
        controller.close();
      });
    },
    cancel() {
      client.end();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

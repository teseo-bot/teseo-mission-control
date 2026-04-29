import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TELEGRAM_BOT_TOKEN = process.env.WATCHDOG_TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.WATCHDOG_CHAT_ID

// Supabase client para verificar la alerta
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // payload esperado del microservicio python/node de los probes:
    // { tenant_id, service_name, status, latency_ms, error_message }
    const { tenant_id, service_name, status, latency_ms, error_message } = body

    if (!tenant_id || !service_name || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Insertar en DB
    const { data, error } = await supabase
      .from('global_watchdog_events')
      .insert([{
        tenant_id,
        service_name,
        status,
        latency_ms,
        error_message
      }])
      .select('*, tenants(name)')
      .single()

    if (error) throw error;

    // 2. Notificar a Telegram si es un fallo y si están configuradas las vars
    if (status !== 'ok' && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const tenantName = data?.tenants?.name || tenant_id
      const message = `🚨 *WATCHDOG ALERT*\n\n` +
        `*Tenant:* ${tenantName}\n` +
        `*Service:* \`${service_name}\`\n` +
        `*Status:* 🔴 ${status.toUpperCase()}\n` +
        `*Latency:* ${latency_ms || 'N/A'}ms\n\n` +
        `*Error:* \`${error_message || 'Timeout/Unknown'}\`\n\n` +
        `[Ver en Mission Control](${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/alerts)`

      // Dispatch asíncrono, no bloqueamos la respuesta
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.error('Error enviando a Telegram:', err))
    }

    return NextResponse.json({ success: true, event_id: data.id })
  } catch (err: any) {
    console.error('Webhook Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

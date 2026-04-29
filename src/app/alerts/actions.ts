'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function resolveWatchdogEvent(eventId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { error } = await supabase
    .from('global_watchdog_events')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('id', eventId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/alerts')
}

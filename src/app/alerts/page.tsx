import { createClient } from '@supabase/supabase-js'
import WatchdogGlobalFeed from './components/WatchdogGlobalFeed'
import ClusterHealthCards from './components/ClusterHealthCards'

export const revalidate = 0 // Disable cache for NOC dashboard

export default async function AlertsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: events, error } = await supabase
    .from('global_watchdog_events')
    .select('*, tenants(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Global Watchdog / NOC</h1>
        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 font-mono">
          [DB_ERROR] Fallo al cargar eventos: {error.message}
        </div>
      ) : (
        <>
          <ClusterHealthCards events={events || []} />
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Timeline de Eventos</h2>
            <WatchdogGlobalFeed initialEvents={events || []} />
          </div>
        </>
      )}
    </div>
  )
}

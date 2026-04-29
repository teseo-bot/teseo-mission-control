import { AlertTriangle, Activity, ServerCrash } from 'lucide-react'

export default function ClusterHealthCards({ events }: { events: any[] }) {
  // Calculamos sobre los eventos ACTIVOS
  const activeEvents = events.filter(e => !e.is_resolved)
  const failedEvents = activeEvents.filter(e => e.status !== 'ok').length
  const failureRate = activeEvents.length > 0 ? ((failedEvents / activeEvents.length) * 100).toFixed(1) : 0
  
  const okEvents = events.filter(e => e.status === 'ok')
  const avgLatency = okEvents.length > 0 
    ? Math.round(okEvents.reduce((acc, curr) => acc + (curr.latency_ms || 0), 0) / okEvents.length)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="p-6 bg-white border rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-red-100 rounded-full">
          <ServerCrash className="text-red-600 w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Eventos Críticos (Últimos)</p>
          <p className="text-2xl font-bold text-gray-900">{failedEvents}</p>
        </div>
      </div>
      
      <div className="p-6 bg-white border rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-yellow-100 rounded-full">
          <AlertTriangle className="text-yellow-600 w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tasa de Fallo Global</p>
          <p className="text-2xl font-bold text-gray-900">{failureRate}%</p>
        </div>
      </div>

      <div className="p-6 bg-white border rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-full">
          <Activity className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Latencia Promedio (Healthy)</p>
          <p className="text-2xl font-bold text-gray-900">{avgLatency} ms</p>
        </div>
      </div>
    </div>
  )
}

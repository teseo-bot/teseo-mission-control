'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, FilterX } from 'lucide-react'
import ResolveButton from './ResolveButton'

export default function WatchdogGlobalFeed({ initialEvents }: { initialEvents: any[] }) {
  const [filterService, setFilterService] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Extraer servicios únicos
  const uniqueServices = Array.from(new Set(initialEvents.map(e => e.service_name)))

  // Filtrado reactivo
  const activeEvents = initialEvents.filter(e => {
    if (e.is_resolved) return false;
    if (filterService !== 'all' && e.service_name !== filterService) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  })

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border">
        <div className="text-sm font-medium text-gray-500">Filtros:</div>
        <select 
          className="text-sm border-gray-300 rounded p-1.5 bg-white border"
          value={filterService} 
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="all">Todos los Servicios</option>
          {uniqueServices.map(srv => <option key={srv as string} value={srv as string}>{srv}</option>)}
        </select>

        <select 
          className="text-sm border-gray-300 rounded p-1.5 bg-white border"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Cualquier Estado</option>
          <option value="fail">Solo Críticos (Fail)</option>
          <option value="timeout">Solo Timeouts</option>
          <option value="ok">Solo OK</option>
        </select>

        {(filterService !== 'all' || filterStatus !== 'all') && (
          <button 
            onClick={() => { setFilterService('all'); setFilterStatus('all'); }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 ml-auto"
          >
            <FilterX className="w-4 h-4" /> Limpiar
          </button>
        )}
      </div>

      {/* Lista de Eventos */}
      {activeEvents.length === 0 ? (
        <div className="text-gray-500 mt-4 p-4 text-center bg-gray-50 rounded-lg">
          No hay incidentes activos con estos filtros.
        </div>
      ) : (
        <div className="space-y-4">
          {activeEvents.map((event) => (
            <div key={event.id} className={`p-4 border rounded-lg flex items-start space-x-4 ${event.status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
              <div className="mt-1">
                {event.status === 'fail' ? (
                  <AlertCircle className="text-red-500 w-6 h-6" />
                ) : event.status === 'ok' ? (
                  <CheckCircle2 className="text-green-500 w-6 h-6" />
                ) : (
                  <Clock className="text-yellow-500 w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">
                    {event.tenants?.name || event.tenant_id} - <span className="uppercase text-sm">{event.service_name}</span>
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                {event.error_message && (
                  <p className="text-red-600 mt-1 text-sm font-mono bg-red-100 p-2 rounded">{event.error_message}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-600">
                    {event.latency_ms && <span>Latencia: {event.latency_ms}ms</span>}
                    <Link href={`/tenants/${event.tenant_id}`} className="text-blue-600 hover:underline">
                      Investigar Tenant →
                    </Link>
                  </div>
                  <ResolveButton eventId={event.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

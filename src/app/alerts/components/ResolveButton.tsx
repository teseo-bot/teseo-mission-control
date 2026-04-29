'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { resolveWatchdogEvent } from '../actions'
import { toast } from 'sonner'

export default function ResolveButton({ eventId }: { eventId: string }) {
  const [isPending, setIsPending] = useState(false)

  async function handleResolve() {
    setIsPending(true)
    try {
      await resolveWatchdogEvent(eventId)
      toast.success('Alerta resuelta y archivada')
    } catch (error: any) {
      toast.error('Error al resolver: ' + error.message)
      setIsPending(false) // solo restauramos si falla, sino desaparece de UI
    }
  }

  return (
    <button
      onClick={handleResolve}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
    >
      <Check className="w-4 h-4" />
      {isPending ? 'Resolviendo...' : 'Resolver'}
    </button>
  )
}

// Modificamos el sidebar temporalmente (o si existe navigation) para poder entrar a Alerts
import Link from 'next/link'

export default function TenantsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tenants</h1>
      <Link href="/alerts" className="text-blue-600 underline">
        Ir al Panel Global de Watchdog (NOC)
      </Link>
    </div>
  )
}

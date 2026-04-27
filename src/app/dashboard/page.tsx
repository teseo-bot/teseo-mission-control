"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mission Control Dashboard</h1>
        <p className="text-muted-foreground">Métricas globales y KPIs de la operación B2B (Global View).</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingreso Global (MRR Estimado)</CardDescription>
            <CardTitle className="text-4xl text-green-600 dark:text-green-400">$45,231.89</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+20% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Costo Operativo Total (LLMs + Infra)</CardDescription>
            <CardTitle className="text-4xl text-red-600 dark:text-red-400">$8,450.00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Margen bruto actual: 81.3%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eventos Procesados (Mensajes)</CardDescription>
            <CardTitle className="text-4xl">1.2M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top 10 Consumo por Tenant</CardTitle>
            <CardDescription>Tenants con mayor gasto en tokens LLM.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Comerseg Seguros", cost: "$1,245.00", pct: "100%" },
                { name: "InnovateX Corp", cost: "$850.20", pct: "70%" },
                { name: "TechStudio Devs", cost: "$430.15", pct: "40%" },
                { name: "Global Logistics", cost: "$210.00", pct: "20%" },
                { name: "Acme SA de CV", cost: "$105.00", pct: "10%" }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{i+1}</div>
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: t.pct }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{t.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribución de Modelos IA</CardTitle>
            <CardDescription>Preferencia global de motores en Tenants activos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center border-dashed border-2 rounded-lg bg-muted/20">
             <p className="text-muted-foreground text-sm text-center max-w-[200px]">Gráfica de Dona pendiente de integración (Recharts).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

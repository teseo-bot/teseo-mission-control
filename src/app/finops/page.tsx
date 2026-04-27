"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function FinOpsPage() {
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("global");
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchTenants() {
      const { data } = await supabase.from("tenants").select("id, name").order("name");
      if (data) setTenants(data);
    }
    fetchTenants();
  }, [supabase]);

  // Mock calculations based on selection
  const isGlobal = selectedTenant === "global";
  const spend = isGlobal ? "$1,245.00" : "$104.50";
  const tokens = isGlobal ? "45.2M" : "3.8M";
  const activeTenants = isGlobal ? "12" : "1";

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">FinOps Dashboard</h1>
          <p className="text-muted-foreground">Analíticas de uso de tokens y facturación en la nube.</p>
        </div>
        
        <div className="w-[300px]">
          <Select value={selectedTenant} onValueChange={(val) => setSelectedTenant(val || "global")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">🌐 Vista Global (Todos los Tenants)</SelectItem>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total API Spend (Este Mes)</CardDescription>
            <CardTitle className="text-4xl">{spend}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{isGlobal ? "+12% vs mes anterior" : "+2% vs mes anterior"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens Procesados</CardDescription>
            <CardTitle className="text-4xl">{tokens}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Distribuidos en 3 modelos (Gemini, Claude)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{isGlobal ? "Tenants Activos" : "Estado Financiero"}</CardDescription>
            <CardTitle className="text-4xl">{activeTenants}</CardTitle>
          </CardHeader>
          <CardContent>
            {isGlobal ? (
              <p className="text-xs text-muted-foreground">3 incorporados esta semana</p>
            ) : (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 mt-1">Al Día</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historial de Consumo LLM</CardTitle>
          <CardDescription>Esta vista analítica aún está simulada hasta que el pipeline de Ledger de Tokens ingrese a producción (RFC-138).</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 m-4 rounded-lg bg-muted/20">
          <p className="text-muted-foreground">Aquí irá la gráfica de barras de uso de Tokens / Costo (Integración pendiente de Recharts).</p>
        </CardContent>
      </Card>
    </div>
  );
}

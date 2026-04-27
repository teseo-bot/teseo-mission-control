"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { createClient } from "@/lib/supabase";
import { operationSchema } from "@/lib/schemas/tenant";
import { Trash2 } from "lucide-react";

type OperationFormValues = z.infer<typeof operationSchema>;

export function OperationTab() {
  const { tenant, config, setTenant, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      status: tenant?.status || "active",
      orchestrator_url: tenant?.orchestrator_url || "",
      api_key_vault_id: tenant?.api_key_vault_id || "",
      domain: tenant?.domain || "",
      llm_tier: (config?.llm_tier as "gemini-flash" | "claude-sonnet" | "claude-opus") || "gemini-flash",
      features: config?.features || {},
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        status: tenant.status || "active",
        orchestrator_url: tenant.orchestrator_url || "",
        api_key_vault_id: tenant.api_key_vault_id || "",
        domain: tenant.domain || "",
        llm_tier: (config?.llm_tier as "gemini-flash" | "claude-sonnet" | "claude-opus") || "gemini-flash",
        features: config?.features || {},
      });
    }
  }, [tenant, config, form]);

  if (!tenant || !config) return null;

  async function onSubmit(data: OperationFormValues) {
    if (!tenant) return;
    try {
      setSaving("core", true);
      
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          status: data.status,
          orchestrator_url: data.orchestrator_url ?? null,
          api_key_vault_id: data.api_key_vault_id ?? null,
          domain: data.domain ?? null,
        })
        .eq("id", tenant.id);
        
      if (tenantError) throw tenantError;

      const { error: configError } = await supabase
        .from("tenant_configs")
        .upsert({
          tenant_id: tenant.id,
          llm_tier: data.llm_tier,
          features: data.features,
        }, { onConflict: "tenant_id" });

      if (configError) throw configError;

      setTenant({ ...tenant, status: data.status, orchestrator_url: data.orchestrator_url ?? null, api_key_vault_id: data.api_key_vault_id ?? null, domain: data.domain ?? null });
      setConfig({ ...config, llm_tier: data.llm_tier, features: data.features } as typeof config);
      
      toast.success("Operación guardada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar operación: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("core", false);
    }
  }

  const handleKillSwitch = async () => {
    if (!tenant) return;
    if (!confirm("¿Estás seguro de que quieres SUSPENDER este tenant? Esto detendrá toda su operación.")) return;
    
    try {
      setSaving("core", true);
      const { error } = await supabase.from("tenants").update({ status: "suspended" }).eq("id", tenant.id);
      if (error) throw error;
      setTenant({ ...tenant, status: "suspended" });
      form.setValue("status", "suspended");
      toast.success("Tenant suspendido exitosamente");
    } catch (err) {
      toast.error("Error al suspender tenant: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("core", false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidad & Routing</CardTitle>
              <CardDescription>Estado base del tenant y webhooks de orquestación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dominio Personalizado (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="app.ejemplo.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Debe ser único en toda la plataforma.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orchestrator_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orchestrator URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="api_key_vault_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vault Key ID</FormLabel>
                    <FormControl>
                      <Input placeholder="vault-xyz" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Peligro</CardTitle>
                <CardDescription>Acciones destructivas o críticas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="destructive" onClick={handleKillSwitch} disabled={saving["core"]}>
                  <Trash2 className="w-4 h-4 mr-2" /> Kill Switch (Suspender)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving["core"]} size="lg">
            {saving["core"] ? "Guardando..." : "Guardar Cambios de Operación"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

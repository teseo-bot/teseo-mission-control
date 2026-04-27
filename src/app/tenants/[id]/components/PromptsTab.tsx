"use client";

import { QuickEditPanel } from "./QuickEditPanel";
import { PromptStudioPanel } from "./prompts/PromptStudioPanel";
import { PromptVersionsPanel } from "./prompts/PromptVersionsPanel";
import { PromptVariablesPanel } from "./prompts/PromptVariablesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { operationSchema } from "@/lib/schemas/tenant";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type OperationFormValues = z.infer<typeof operationSchema>;

export function PromptsTab({ tenantId }: { tenantId: string }) {
  const { tenant, config, setConfig, saving, setSaving } = useTenantDetailStore();
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
    if (config) {
      form.reset({
        status: tenant?.status || "active",
        orchestrator_url: tenant?.orchestrator_url || "",
        api_key_vault_id: tenant?.api_key_vault_id || "",
        domain: tenant?.domain || "",
        llm_tier: (config.llm_tier as "gemini-flash" | "claude-sonnet" | "claude-opus") || "gemini-flash",
        features: config.features || {},
      });
    }
  }, [config, tenant, form]);

  async function onSubmitConfig(data: OperationFormValues) {
    if (!tenant) return;
    try {
      setSaving("prompts", true);
      const { error: configError } = await supabase
        .from("tenant_configs")
        .upsert({
          tenant_id: tenant.id,
          llm_tier: data.llm_tier,
          features: data.features,
        }, { onConflict: "tenant_id" });

      if (configError) throw configError;

      setConfig({ ...config, llm_tier: data.llm_tier, features: data.features } as typeof config);
      toast.success("Configuración de IA guardada");
    } catch (err) {
      toast.error("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("prompts", false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Engine Config</CardTitle>
          <CardDescription>LLM Tiers y configuración central.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitConfig)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="llm_tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LLM Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                          <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
                          <SelectItem value="claude-opus">Claude Opus</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving["prompts"]}>
                  Guardar Configuración IA
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Tabs defaultValue="quick-edit" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="quick-edit">Edición Rápida (Legacy)</TabsTrigger>
          <TabsTrigger value="studio">Prompt Studio</TabsTrigger>
          <TabsTrigger value="versions">Versiones (A/B)</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-edit" className="space-y-6">
          <QuickEditPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="studio" className="space-y-6">
          <PromptStudioPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <PromptVersionsPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <PromptVariablesPanel tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

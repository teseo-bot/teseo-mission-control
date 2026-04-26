"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { BrandingTab } from "./components/BrandingTab";
import { PromptsTab } from "./components/PromptsTab";

interface Tenant {
  id: string;
  name: string;
  status: "active" | "suspended" | "onboarding";
  created_at: string;
  orchestrator_url?: string;
  api_key_vault_id?: string;
}

interface TenantConfig {
  id?: string;
  tenant_id: string;
  semantic_prompts: { sdr: string; gatekeeper: string; rag_l1: string };
  llm_tier: string;
  features: Record<string, unknown>;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [config, setConfig] = useState<TenantConfig>({
    tenant_id: id,
    semantic_prompts: { sdr: "", gatekeeper: "", rag_l1: "" },
    llm_tier: "gemini-3.1-pro",
    features: {}
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch Tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", id)
          .single();
          
        if (tenantError) throw tenantError;
        setTenant(tenantData);

        // Fetch Config
        const { data: configData, error: configError } = await supabase
          .from("tenant_configs")
          .select("*")
          .eq("tenant_id", id)
          .maybeSingle();

        if (configError) throw configError;
        if (configData) {
          setConfig(configData);
        }
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to fetch tenant details: " + msg);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id, supabase]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!tenant) return;

      // 1. Update Tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          status: tenant.status,
          orchestrator_url: tenant.orchestrator_url,
          api_key_vault_id: tenant.api_key_vault_id
        })
        .eq("id", id);
        
      if (tenantError) throw tenantError;

      // 2. Upsert Config
      const { error: configError } = await supabase
        .from("tenant_configs")
        .upsert({
          tenant_id: id,
          semantic_prompts: config.semantic_prompts,
          llm_tier: config.llm_tier,
          features: config.features
        }, { onConflict: "tenant_id" });

      if (configError) throw configError;

      toast.success("Tenant configuration saved successfully");
    } catch (err: unknown) {
      console.error("Save error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save changes: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return <div className="container mx-auto py-10 flex justify-center">Loading tenant details...</div>;
  }

  if (!tenant) {
    return <div className="container mx-auto py-10 flex justify-center text-red-500">Tenant not found.</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/tenants")}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            ID: {tenant.id}
            <button onClick={() => copyToClipboard(tenant.id)} className="hover:text-foreground">
              <CopyIcon className="size-3" />
            </button>
          </p>
        </div>
      </div>

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="core">Operación</TabsTrigger>
          <TabsTrigger value="branding">Branding & UI</TabsTrigger>
          <TabsTrigger value="prompts">Prompts & IA</TabsTrigger>
          <TabsTrigger value="access">Accesos & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity & Core Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Identidad & Routing</CardTitle>
                <CardDescription>
                  Estado base del tenant y webhooks de orquestación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={tenant.status} 
                    onValueChange={(val) => setTenant({ ...tenant, status: val as "active" | "suspended" | "onboarding" })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orchestrator_url">Orchestrator URL (LangGraph Webhook)</Label>
                  <Input 
                    id="orchestrator_url" 
                    value={tenant.orchestrator_url || ""} 
                    onChange={(e) => setTenant({ ...tenant, orchestrator_url: e.target.value })}
                    placeholder="https://api.teseo.lat/tenant-hook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key_vault_id">Vault Key ID</Label>
                  <Input 
                    id="api_key_vault_id" 
                    value={tenant.api_key_vault_id || ""} 
                    onChange={(e) => setTenant({ ...tenant, api_key_vault_id: e.target.value })}
                    placeholder="vault-xyz"
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Core Settings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Engine Config</CardTitle>
                <CardDescription>
                  LLM Tiers y feature flags base.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm_tier">LLM Tier</Label>
                  <Select 
                    value={config.llm_tier || "gemini-flash"} 
                    onValueChange={(val) => setConfig({ ...config, llm_tier: val || "gemini-flash" })}
                  >
                    <SelectTrigger id="llm_tier">
                      <SelectValue placeholder="Select LLM Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-flash">Gemini Flash (Default)</SelectItem>
                      <SelectItem value="claude-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-opus">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? "Guardando..." : "Guardar Cambios de Operación"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="mt-0">
          <BrandingTab tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="prompts" className="mt-0">
          <PromptsTab tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="access" className="mt-0">
           <Card>
            <CardHeader>
              <CardTitle>Accesos y Roles</CardTitle>
              <CardDescription>Gestión de usuarios del Tenant (Migrando...)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-10 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Modulo RBAC en construcción
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

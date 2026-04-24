"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeftIcon, CopyIcon } from "lucide-react";

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
  features: Record<string, any>;
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
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toast.error("Failed to fetch tenant details: " + err.message);
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
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save changes: " + err.message);
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
          <p className="text-muted-foreground text-sm">ID: {tenant.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity & Core Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Identity & Routing</CardTitle>
            <CardDescription>
              Core tenant state and orchestration webhooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={tenant.status} 
                onValueChange={(val) => setTenant({ ...tenant, status: val as any })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended (Kill-Switch)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orchestrator_url">Orchestrator Internal URL (Cloud Run)</Label>
              <Input 
                id="orchestrator_url" 
                placeholder="https://cloudrun-url..." 
                value={tenant.orchestrator_url || ""}
                onChange={(e) => setTenant({ ...tenant, orchestrator_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key_vault_id">API Key Vault ID (Secret Manager)</Label>
              <Input 
                id="api_key_vault_id" 
                placeholder="e.g. projects/.../secrets/..." 
                value={tenant.api_key_vault_id || ""}
                onChange={(e) => setTenant({ ...tenant, api_key_vault_id: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhook Endpoints */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>External Webhook Endpoints (API Gateway)</CardTitle>
            <CardDescription>
              Static public endpoints to configure in Meta, Telegram or external providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Webhook URL</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/tenant/${tenant.id}/whatsapp` : ''} 
                  className="bg-muted font-mono text-sm"
                />
                <Button 
                  variant="secondary" 
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/tenant/${tenant.id}/whatsapp` : '')}
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telegram Webhook URL</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/tenant/${tenant.id}/telegram` : ''} 
                  className="bg-muted font-mono text-sm"
                />
                <Button 
                  variant="secondary" 
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/tenant/${tenant.id}/telegram` : '')}
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Behavior & Prompting */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Behavior Config</CardTitle>
            <CardDescription>
              Remote dynamic prompting and LLM tier assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="llm_tier">LLM Tier</Label>
              <Select 
                value={config.llm_tier} 
                onValueChange={(val) => setConfig({ ...config, llm_tier: val || "gemini-3.1-pro" })}
              >
                <SelectTrigger id="llm_tier">
                  <SelectValue placeholder="Select model tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3.1-pro">Gemini 3.1 Pro</SelectItem>
                  <SelectItem value="gemini-3.1-flash">Gemini 3.1 Flash</SelectItem>
                  <SelectItem value="claude-3-7-sonnet">Claude 3.7 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3.5 Haiku</SelectItem>
                  <SelectItem value="llama-3-8b">Llama 3 8B (Edge/Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 h-[300px] flex flex-col">
              <Label>Semantic Prompts</Label>
              <Tabs defaultValue="sdr" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sdr">SDR</TabsTrigger>
                  <TabsTrigger value="gatekeeper">Gatekeeper</TabsTrigger>
                  <TabsTrigger value="rag_l1">RAG L1</TabsTrigger>
                </TabsList>
                <TabsContent value="sdr" className="flex-1 mt-2">
                  <Textarea 
                    className="h-full font-mono text-sm resize-none"
                    placeholder="You are an expert SDR..."
                    value={config.semantic_prompts?.sdr || ""}
                    onChange={(e) => setConfig({ ...config, semantic_prompts: { ...config.semantic_prompts, sdr: e.target.value } })}
                  />
                </TabsContent>
                <TabsContent value="gatekeeper" className="flex-1 mt-2">
                  <Textarea 
                    className="h-full font-mono text-sm resize-none"
                    placeholder="You are a gatekeeper agent..."
                    value={config.semantic_prompts?.gatekeeper || ""}
                    onChange={(e) => setConfig({ ...config, semantic_prompts: { ...config.semantic_prompts, gatekeeper: e.target.value } })}
                  />
                </TabsContent>
                <TabsContent value="rag_l1" className="flex-1 mt-2">
                  <Textarea 
                    className="h-full font-mono text-sm resize-none"
                    placeholder="RAG L1 specific instructions..."
                    value={config.semantic_prompts?.rag_l1 || ""}
                    onChange={(e) => setConfig({ ...config, semantic_prompts: { ...config.semantic_prompts, rag_l1: e.target.value } })}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}

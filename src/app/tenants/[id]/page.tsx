"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { OperationTab } from "./components/OperationTab";
import { BrandingTab } from "./components/BrandingTab";
import { PromptsTab } from "./components/PromptsTab";
import { AccessTab } from "./components/AccessTab";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [supabase] = useState(() => createClient());
  const { tenant, loading, setTenant, setConfig, setLoading } = useTenantDetailStore();

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
        } else {
          setConfig({
            id: null,
            tenant_id: id,
            semantic_prompts: { sdr: "", gatekeeper: "", rag_l1: "" },
            llm_tier: "gemini-flash",
            features: {},
            primary_color: null,
            accent_color: null,
            logo_url: null,
            theme_mode: "SYSTEM"
          });
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
  }, [id, supabase, setTenant, setConfig, setLoading]);

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
          <OperationTab />
        </TabsContent>

        <TabsContent value="branding" className="mt-0">
          <BrandingTab tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="prompts" className="mt-0">
          <PromptsTab tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="access" className="mt-0">
           <AccessTab tenantId={tenant.id} />
        </TabsContent>

      </Tabs>
    </div>
  );
}

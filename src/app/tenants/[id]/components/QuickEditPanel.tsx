"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";

export function QuickEditPanel({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  
  const [prompts, setPrompts] = useState({
    sdr: config?.semantic_prompts?.sdr || "",
    gatekeeper: config?.semantic_prompts?.gatekeeper || "",
    rag_l1: config?.semantic_prompts?.rag_l1 || ""
  });

  const handleSave = async () => {
    if (!config) return;
    setSaving("prompts_quick", true);
    const { error } = await supabase
      .from("tenant_configs")
      .update({ semantic_prompts: prompts })
      .eq("tenant_id", tenantId);
    
    setSaving("prompts_quick", false);
    if (error) {
      toast.error("Error al guardar los Semantic Prompts");
      console.error(error);
    } else {
      setConfig({ ...config, semantic_prompts: prompts });
      toast.success("Comportamiento de IA actualizado exitosamente");
    }
  };

  return (
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>Semantic Prompts (Quick Edit)</CardTitle>
        <CardDescription>
          Ajuste fino de las directivas del sistema (System Prompts). Estos valores alteran drásticamente el comportamiento de la IA para este Tenant.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="sdr" className="flex-1 flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sdr">SDR (Negociación)</TabsTrigger>
            <TabsTrigger value="gatekeeper">Gatekeeper (Clasificación)</TabsTrigger>
            <TabsTrigger value="rag_l1">RAG L1 (Restricciones)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sdr" className="flex-1 flex flex-col mt-4 min-h-0">
            <Label className="mb-2 text-muted-foreground">Contexto del Vendedor Digital (SDR)</Label>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Eres un experto cerrador de ventas. Tu objetivo es agendar una llamada..."
              value={prompts.sdr}
              onChange={(e) => setPrompts({ ...prompts, sdr: e.target.value })}
            />
          </TabsContent>
          
          <TabsContent value="gatekeeper" className="flex-1 flex flex-col mt-4 min-h-0">
            <Label className="mb-2 text-muted-foreground">Reglas de Clasificación de Leads</Label>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Clasifica la urgencia del lead del 1 al 10 basándote en palabras clave como 'inmediato'..."
              value={prompts.gatekeeper}
              onChange={(e) => setPrompts({ ...prompts, gatekeeper: e.target.value })}
            />
          </TabsContent>
          
          <TabsContent value="rag_l1" className="flex-1 flex flex-col mt-4 min-h-0">
            <Label className="mb-2 text-muted-foreground">Barandillas (Guardrails) y Lectura Documental</Label>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Nunca ofrezcas descuentos mayores al 10%. Usa los documentos adjuntos solo como referencia, no los cites textualmente..."
              value={prompts.rag_l1}
              onChange={(e) => setPrompts({ ...prompts, rag_l1: e.target.value })}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="justify-between border-t bg-muted/10 pt-6">
        <p className="text-xs text-muted-foreground">
          Los cambios se aplican de inmediato en el Orquestador.
        </p>
        <Button onClick={handleSave} disabled={saving["prompts_quick"]} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {saving["prompts_quick"] ? "Inyectando Prompts..." : "Guardar Comportamiento AI"}
        </Button>
      </CardFooter>
    </Card>
  );
}

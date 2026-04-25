"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SaveIcon, RefreshCwIcon } from "lucide-react";

export function PromptsTab({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [prompts, setPrompts] = useState({
    sdr: "",
    gatekeeper: "",
    rag_l1: ""
  });
  const supabase = createClient();

  useEffect(() => {
    loadPrompts();
  }, [tenantId]);

  const loadPrompts = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("tenant_configs")
      .select("semantic_prompts")
      .eq("tenant_id", tenantId)
      .single();
      
    if (data && data.semantic_prompts) {
      setPrompts({
        sdr: data.semantic_prompts.sdr || "",
        gatekeeper: data.semantic_prompts.gatekeeper || "",
        rag_l1: data.semantic_prompts.rag_l1 || ""
      });
    }
    setFetching(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("tenant_configs")
      .update({ semantic_prompts: prompts })
      .eq("tenant_id", tenantId);
    
    setLoading(false);
    if (error) {
      toast.error("Error al guardar los Semantic Prompts");
      console.error(error);
    } else {
      toast.success("Comportamiento de IA actualizado exitosamente");
    }
  };

  return (
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>Semantic Prompts & Comportamiento Base</CardTitle>
        <CardDescription>
          Ajuste fino de las directivas del sistema (System Prompts). Estos valores alteran drásticamente el comportamiento de la IA para este Tenant.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {fetching ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <RefreshCwIcon className="w-5 h-5 animate-spin mr-2" />
            Cargando configuración neuronal...
          </div>
        ) : (
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
        )}
      </CardContent>
      
      <CardFooter className="justify-between border-t bg-muted/10 pt-6">
        <p className="text-xs text-muted-foreground">
          Los cambios se aplican de inmediato en el Orquestador (LangGraph) para nuevas conversaciones.
        </p>
        <Button onClick={handleSave} disabled={loading || fetching} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {loading ? "Inyectando Prompts..." : "Guardar Comportamiento AI"}
        </Button>
      </CardFooter>
    </Card>
  );
}
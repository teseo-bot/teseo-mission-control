"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";

export function QuickEditPanel({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  
  const [prompts, setPrompts] = useState({
    sdr: config?.semantic_prompts?.sdr || "",
    gatekeeper: config?.semantic_prompts?.gatekeeper || "",
    rag_l1: config?.semantic_prompts?.rag_l1 || "",
    chitchat: config?.semantic_prompts?.chitchat || "",
    sdr_llm_tier: config?.semantic_prompts?.sdr_llm_tier || "gemini-flash",
    gatekeeper_llm_tier: config?.semantic_prompts?.gatekeeper_llm_tier || "gemini-flash",
    rag_llm_tier: config?.semantic_prompts?.rag_llm_tier || "gemini-flash"
  });

  const handleSave = async () => {
    if (!config) return;
    setSaving("prompts_quick", true);
    const { error } = await supabase
      .from("tenant_configs")
      .update({ semantic_prompts: prompts })
      .eq("tenant_id", tenantId);

    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      setConfig({ ...config, semantic_prompts: prompts });
      toast.success("Prompts inyectados con éxito.");
    }
    setSaving("prompts_quick", false);
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="shrink-0">
        <CardTitle>Semantic Prompts (Quick Edit)</CardTitle>
        <CardDescription>Ajuste fino de las directivas del sistema (System Prompts). Estos valores alteran drásticamente el comportamiento de la IA para este Tenant.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="sdr" className="flex-1 flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="chitchat">Chit-Chat</TabsTrigger>
            <TabsTrigger value="sdr">SDR</TabsTrigger>
            <TabsTrigger value="gatekeeper">Gatekeeper</TabsTrigger>
            <TabsTrigger value="rag_l1">RAG L1</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chitchat" className="flex-1 flex flex-col mt-4 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Recepción y Empatía Humana</Label>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Eres la recepcionista. Saluda amablemente, no des información técnica, solo averigua en qué puedes ayudar de manera coloquial..."
              value={prompts.chitchat}
              onChange={(e) => setPrompts({ ...prompts, chitchat: e.target.value })}
            />
          </TabsContent>

          <TabsContent value="sdr" className="flex-1 flex flex-col mt-4 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Contexto del Vendedor Digital (SDR)</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Modelo de Razonamiento:</span>
                <Select value={prompts.sdr_llm_tier} onValueChange={(v) => setPrompts({ ...prompts, sdr_llm_tier: v || "gemini-flash" })}>
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-flash">Gemini Flash (Rápido)</SelectItem>
                    <SelectItem value="claude-sonnet">Claude Sonnet (Balance)</SelectItem>
                    <SelectItem value="claude-opus">Claude Opus (Profundo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Eres un experto cerrador de ventas. Tu objetivo es agendar una llamada..."
              value={prompts.sdr}
              onChange={(e) => setPrompts({ ...prompts, sdr: e.target.value })}
            />
          </TabsContent>
          
          <TabsContent value="gatekeeper" className="flex-1 flex flex-col mt-4 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Reglas de Clasificación de Leads</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Modelo de Clasificación:</span>
                <Select value={prompts.gatekeeper_llm_tier} onValueChange={(v) => setPrompts({ ...prompts, gatekeeper_llm_tier: v || "gemini-flash" })}>
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-flash">Gemini Flash (Costo/Velocidad)</SelectItem>
                    <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
                    <SelectItem value="claude-opus">Claude Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
              placeholder="Ej: Clasifica la urgencia del lead del 1 al 10 basándote en palabras clave como 'inmediato'..."
              value={prompts.gatekeeper}
              onChange={(e) => setPrompts({ ...prompts, gatekeeper: e.target.value })}
            />
          </TabsContent>
          
          <TabsContent value="rag_l1" className="flex-1 flex flex-col mt-4 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-muted-foreground">Barandillas (Guardrails) y Lectura Documental</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Modelo Analítico (RAG):</span>
                <Select value={prompts.rag_llm_tier} onValueChange={(v) => setPrompts({ ...prompts, rag_llm_tier: v || "gemini-flash" })}>
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                    <SelectItem value="claude-sonnet">Claude Sonnet (Precisión)</SelectItem>
                    <SelectItem value="claude-opus">Claude Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";

export function PromptStudioPanel({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  
  const [draft, setDraft] = useState(
    ((config?.features as any)?.prompt_studio_draft as string) || ""
  );

  const handleSave = async () => {
    if (!config) return;
    setSaving("prompt_studio", true);
    
    const newFeatures = {
      ...(config.features as object || {}),
      prompt_studio_draft: draft
    };

    const { error } = await supabase
      .from("tenant_configs")
      .update({ features: newFeatures })
      .eq("tenant_id", tenantId);
    
    setSaving("prompt_studio", false);
    if (error) {
      toast.error("Error al guardar en Prompt Studio");
    } else {
      setConfig({ ...config, features: newFeatures });
      toast.success("Draft de Prompt Studio actualizado exitosamente");
    }
  };

  return (
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>Prompt Studio</CardTitle>
        <CardDescription>
          Diseña y estructura prompts complejos. Este es tu entorno de pruebas o borrador principal antes de publicarlos en la edición rápida.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Label className="mb-2 text-muted-foreground">Master Prompt Draft</Label>
        <Textarea 
          className="flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50"
          placeholder="Ej: Eres el orquestador principal. Las variables disponibles son {{user_name}}..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </CardContent>
      
      <CardFooter className="justify-between border-t bg-muted/10 pt-6">
        <p className="text-xs text-muted-foreground">
          Guardado en la configuración extendida del Tenant (features).
        </p>
        <Button onClick={handleSave} disabled={saving["prompt_studio"]} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {saving["prompt_studio"] ? "Guardando..." : "Guardar Draft"}
        </Button>
      </CardFooter>
    </Card>
  );
}

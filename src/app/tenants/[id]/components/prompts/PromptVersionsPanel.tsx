"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";

export function PromptVersionsPanel({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  
  const initialData = ((config?.features as any)?.prompt_versions) || { versionA: "", versionB: "", active: "A" };
  const [data, setData] = useState({
    versionA: initialData.versionA || "",
    versionB: initialData.versionB || "",
    active: initialData.active || "A",
  });

  const handleSave = async () => {
    if (!config) return;
    setSaving("prompt_versions", true);
    
    const newFeatures = {
      ...(config.features as object || {}),
      prompt_versions: data
    };

    const { error } = await supabase
      .from("tenant_configs")
      .update({ features: newFeatures })
      .eq("tenant_id", tenantId);
    
    setSaving("prompt_versions", false);
    if (error) {
      toast.error("Error al guardar Versiones A/B");
    } else {
      setConfig({ ...config, features: newFeatures });
      toast.success("Versiones A/B actualizadas exitosamente");
    }
  };

  return (
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>Versiones A/B</CardTitle>
        <CardDescription>
          Configura y alterna entre dos variantes del comportamiento de IA para medir rendimiento.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-6 min-h-0">
        <div>
          <Label className="mb-2 block font-semibold">Versión Activa</Label>
          <RadioGroup 
            value={data.active} 
            onValueChange={(val) => setData({ ...data, active: val })}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="rA" />
              <Label htmlFor="rA">Variante A</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="rB" />
              <Label htmlFor="rB">Variante B</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div className="flex flex-col">
            <Label className="mb-2 text-muted-foreground">Variante A</Label>
            <Textarea 
              className={`flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50 ${data.active === 'A' ? 'border-primary border-2' : ''}`}
              placeholder="Prompt para versión A..."
              value={data.versionA}
              onChange={(e) => setData({ ...data, versionA: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-2 text-muted-foreground">Variante B</Label>
            <Textarea 
              className={`flex-1 font-mono text-sm resize-none bg-muted/30 focus-visible:ring-primary/50 ${data.active === 'B' ? 'border-primary border-2' : ''}`}
              placeholder="Prompt para versión B..."
              value={data.versionB}
              onChange={(e) => setData({ ...data, versionB: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between border-t bg-muted/10 pt-6">
        <p className="text-xs text-muted-foreground">
          El Orchestrator utilizará la versión marcada como activa.
        </p>
        <Button onClick={handleSave} disabled={saving["prompt_versions"]} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {saving["prompt_versions"] ? "Guardando..." : "Guardar Variantes"}
        </Button>
      </CardFooter>
    </Card>
  );
}

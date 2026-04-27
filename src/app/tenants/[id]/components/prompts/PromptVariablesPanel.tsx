"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { SaveIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";

export function PromptVariablesPanel({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  
  const initialData = ((config?.features as any)?.prompt_variables as { key: string, value: string }[]) || [];
  const [variables, setVariables] = useState<{ key: string, value: string }[]>(initialData);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newKey.trim()) return;
    setVariables([...variables, { key: newKey.trim(), value: newValue }]);
    setNewKey("");
    setNewValue("");
  };

  const handleRemove = (idx: number) => {
    setVariables(variables.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving("prompt_variables", true);
    
    const newFeatures = {
      ...(config.features as object || {}),
      prompt_variables: variables
    };

    const { error } = await supabase
      .from("tenant_configs")
      .update({ features: newFeatures })
      .eq("tenant_id", tenantId);
    
    setSaving("prompt_variables", false);
    if (error) {
      toast.error("Error al guardar Variables");
    } else {
      setConfig({ ...config, features: newFeatures });
      toast.success("Variables dinámicas guardadas exitosamente");
    }
  };

  return (
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader>
        <CardTitle>Variables Dinámicas</CardTitle>
        <CardDescription>
          Configura pares clave-valor que el Orchestrator inyectará en los Prompts (ej. {'{{empresa}}'} = "Mi Empresa").
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="flex items-end gap-4 bg-muted/20 p-4 rounded-lg border">
          <div className="flex-1 space-y-2">
            <Label>Clave de Variable</Label>
            <Input placeholder="nombre_empresa" value={newKey} onChange={e => setNewKey(e.target.value)} />
          </div>
          <div className="flex-[2] space-y-2">
            <Label>Valor</Label>
            <Input placeholder="El valor que reemplazará a la clave..." value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          </div>
          <Button onClick={handleAdd} type="button" variant="secondary">
            <PlusIcon className="w-4 h-4 mr-2" /> Agregar
          </Button>
        </div>

        <Table className="border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-[100px]">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No hay variables configuradas.
                </TableCell>
              </TableRow>
            ) : (
              variables.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{v.key}</TableCell>
                  <TableCell>{v.value}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(i)}>
                      <Trash2Icon className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      <CardFooter className="justify-between border-t bg-muted/10 pt-6">
        <p className="text-xs text-muted-foreground">
          Asegúrate de referenciar las claves exactamente igual en tus prompts.
        </p>
        <Button onClick={handleSave} disabled={saving["prompt_variables"]} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {saving["prompt_variables"] ? "Guardando..." : "Guardar Variables"}
        </Button>
      </CardFooter>
    </Card>
  );
}

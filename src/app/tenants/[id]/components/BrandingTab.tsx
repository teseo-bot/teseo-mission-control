/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";

const oklchSchema = z.string().regex(/^oklch\(\s*\d*\.?\d+%?\s+\d*\.?\d+%?\s+\d*\.?\d+(?:deg|rad|turn|grad|%?)?\s*\)$/i, "El color debe tener el formato oklch(L C H)");

import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function BrandingTab({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("oklch(0.205 0 0)");
  const [themeMode, setThemeMode] = useState("SYSTEM");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from("tenant_configs")
        .select("primary_color, theme_mode, logo_url")
        .eq("tenant_id", tenantId)
        .single();
      if (data) {
        setPrimaryColor(data.primary_color || "oklch(0.205 0 0)");
        setThemeMode(data.theme_mode || "SYSTEM");
        setLogoUrl(data.logo_url || "");
      }
    }
    loadConfig();
  }, [tenantId, supabase]);

  const handleSave = async () => {
    try {
      oklchSchema.parse(primaryColor);
    } catch {
      toast.error("Formato de color inválido. Use oklch(L C H), ej. oklch(0.205 0 0)");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("tenant_configs")
      .update({ primary_color: primaryColor, theme_mode: themeMode, logo_url: logoUrl })
      .eq("tenant_id", tenantId);
    
    setLoading(false);
    if (error) {
      toast.error("Error al guardar branding");
    } else {
      toast.success("Branding actualizado correctamente");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${tenantId}/branding/logo-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Error al subir el logotipo al bucket");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('tenant-assets').getPublicUrl(filePath);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logotipo subido y procesado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding y UI</CardTitle>
        <CardDescription>Personaliza la apariencia del Command Center para este cliente. Esto sobreescribe los valores por defecto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Logotipo del Tenant</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="h-16 w-32 bg-muted/20 border rounded-md flex items-center justify-center p-2">
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-16 w-32 bg-muted/20 border border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">
                Sin logo
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="max-w-xs" />
          </div>
          <p className="text-[10px] text-muted-foreground">Formato recomendado: PNG transparente, máx 2MB. Se almacenará en el bucket seguro de tenant-assets.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Color Primario (OKLCH)</Label>
            <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="Ej. oklch(0.205 0 0)" />
          </div>
          <div className="space-y-2">
            <Label>Preferencia de Tema</Label>
            <Select value={themeMode} onValueChange={(v) => setThemeMode(v || "SYSTEM")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LIGHT">Forzar Claro</SelectItem>
                <SelectItem value="DARK">Forzar Oscuro</SelectItem>
                <SelectItem value="SYSTEM">Adaptativo (Sistema)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={loading || uploading}>
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </CardFooter>
    </Card>
  );
}
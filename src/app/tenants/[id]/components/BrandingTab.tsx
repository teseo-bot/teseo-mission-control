"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { brandingSchema } from "@/lib/schemas/tenant";

type BrandingFormValues = z.infer<typeof brandingSchema>;

export function BrandingTab({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema) as any,
    defaultValues: {
      primary_color: config?.primary_color || "oklch(0.205 0 0)",
      accent_color: config?.accent_color || "oklch(0.97 0.01 106.42)",
      theme_mode: config?.theme_mode || "SYSTEM",
      logo_url: config?.logo_url || "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const filePath = `${tenantId}/branding/logo-${uniqueId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Error al subir el logotipo al bucket");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('tenant-assets').getPublicUrl(filePath);
    form.setValue("logo_url", data.publicUrl, { shouldDirty: true, shouldValidate: true });
    setUploading(false);
    toast.success("Logotipo subido y procesado");
  };

  async function onSubmit(data: BrandingFormValues) {
    if (!config) return;

    const normalizeOklch = (val: string | null | undefined) => {
      if (!val) return val;
      const bareOklchRegex = /^[\d.%-]+\s+[\d.%-]+\s+[\d.%-]+(?:\s*\/\s*[\d.%-]+)?$/;
      const trimmed = val.trim();
      return bareOklchRegex.test(trimmed) ? `oklch(${trimmed})` : val;
    };

    const primary_color = normalizeOklch(data.primary_color) as string;
    const accent_color = normalizeOklch(data.accent_color);

    try {
      setSaving("branding", true);
      const { error } = await supabase
        .from("tenant_configs")
        .update({
          primary_color,
          accent_color: accent_color ?? null,
          theme_mode: data.theme_mode,
          logo_url: data.logo_url ?? null,
        })
        .eq("tenant_id", tenantId);
      
      if (error) throw error;
      
      setConfig({
        ...config,
        primary_color,
        accent_color: accent_color ?? null,
        theme_mode: data.theme_mode,
        logo_url: data.logo_url ?? null,
      });

      // Actualizar formulario con valores normalizados
      form.setValue("primary_color", primary_color);
      if (accent_color) form.setValue("accent_color", accent_color);

      toast.success("Branding actualizado correctamente");
    } catch (err) {
      toast.error("Error al guardar branding: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("branding", false);
    }
  }

  const currentLogoUrl = useWatch({
    control: form.control,
    name: "logo_url",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding y UI</CardTitle>
            <CardDescription>Personaliza la apariencia del Command Center para este cliente. Esto sobreescribe los valores por defecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Logotipo del Tenant</Label>
              <div className="flex items-center gap-4">
                {currentLogoUrl ? (
                  <div className="h-16 w-32 bg-muted/20 border rounded-md flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Primario (OKLCH)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. oklch(0.205 0 0)" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accent_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color de Acento (OKLCH)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. oklch(0.97 0.01 106.42)" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="theme_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferencia de Tema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LIGHT">Forzar Claro</SelectItem>
                        <SelectItem value="DARK">Forzar Oscuro</SelectItem>
                        <SelectItem value="SYSTEM">Adaptativo (Sistema)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <Button type="submit" disabled={saving["branding"] || uploading}>
              {saving["branding"] ? "Guardando..." : "Guardar Cambios de Branding"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

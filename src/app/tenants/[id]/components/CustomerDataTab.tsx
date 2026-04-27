"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { createClient } from "@/lib/supabase";
import { SaveIcon } from "lucide-react";

// Simple Schema for Customer Data (Saved into tenant_configs.features or dedicated columns if added later)
// For now, we will save this inside `tenant_configs.features.customer_data` JSON to avoid schema migrations for basic fields.
const customerDataSchema = z.object({
  razon_social: z.string().optional(),
  rfc: z.string().optional(),
  direccion: z.string().optional(),
  admin_name: z.string().optional(),
  admin_phone: z.string().optional(),
  admin_email: z.string().email("Correo inválido").optional().or(z.literal("")),
});

type CustomerDataValues = z.infer<typeof customerDataSchema>;

export function CustomerDataTab({ tenantId }: { tenantId: string }) {
  const { config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();

  const form = useForm<CustomerDataValues>({
    resolver: zodResolver(customerDataSchema),
    defaultValues: {
      razon_social: "",
      rfc: "",
      direccion: "",
      admin_name: "",
      admin_phone: "",
      admin_email: "",
    },
  });

  useEffect(() => {
    if (config) {
      const existingData = (config.features?.customer_data as any) || {};
      form.reset({
        razon_social: existingData.razon_social || "",
        rfc: existingData.rfc || "",
        direccion: existingData.direccion || "",
        admin_name: existingData.admin_name || "",
        admin_phone: existingData.admin_phone || "",
        admin_email: existingData.admin_email || "",
      });
    }
  }, [config, form]);

  const onSubmit = async (data: CustomerDataValues) => {
    if (!config) return;
    setSaving("customer_data", true);
    try {
      const currentFeatures = config.features || {};
      const updatedFeatures = {
        ...currentFeatures,
        customer_data: data,
      };

      const { error } = await supabase
        .from("tenant_configs")
        .update({ features: updatedFeatures })
        .eq("tenant_id", tenantId);

      if (error) throw error;

      setConfig({ ...config, features: updatedFeatures } as any);
      toast.success("Datos del cliente guardados");
    } catch (err) {
      toast.error("Error al guardar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("customer_data", false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales del Cliente</CardTitle>
        <CardDescription>Información administrativa y fiscal del propietario del tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Identidad Corporativa</h3>
                <FormField control={form.control} name="razon_social" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social / Nombre Comercial</FormLabel>
                    <FormControl><Input placeholder="Empresa S.A. de C.V." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rfc" render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC / Tax ID</FormLabel>
                    <FormControl><Input placeholder="ABC123456T9" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="direccion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección Fiscal / Operativa</FormLabel>
                    <FormControl><Input placeholder="Av. Insurgentes Sur 123..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contacto Principal</h3>
                <FormField control={form.control} name="admin_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Ejecutivo</FormLabel>
                    <FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="admin_email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl><Input type="email" placeholder="admin@empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="admin_phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono / WhatsApp</FormLabel>
                    <FormControl><Input placeholder="+52 55 1234 5678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving["customer_data"]} className="gap-2">
                <SaveIcon className="w-4 h-4" />
                {saving["customer_data"] ? "Guardando..." : "Guardar Datos"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

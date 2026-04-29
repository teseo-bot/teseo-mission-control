"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { createClient } from "@/lib/supabase";
import { humanizerSchema } from "@/lib/schemas/tenant";

type HumanizerFormValues = z.infer<typeof humanizerSchema>;

export function BehaviorTab() {
  const { tenant, config, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();

  const form = useForm<z.infer<typeof humanizerSchema>>({
    resolver: zodResolver(humanizerSchema),
    defaultValues: {
      enabled: false,
      wpm: 120,
      chunkSize: 20,
      minDelay: 500,
      maxDelay: 2000,
    },
  });

  useEffect(() => {
    // @ts-ignore - features is typed as Record<string, unknown> currently
    if (config?.features?.humanizer) {
      // @ts-ignore
      form.reset(config.features.humanizer);
    }
  }, [config, form]);

  async function onSubmit(data: HumanizerFormValues) {
    if (!tenant || !config) return;
    try {
      setSaving("behavior", true);
      
      const updatedFeatures = {
        ...(config.features || {}),
        humanizer: data
      };

      const updatedConfig = {
        ...config,
        features: updatedFeatures
      };

      const { error } = await supabase
        .from("tenant_configs")
        .update({ features: updatedFeatures })
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      setConfig(updatedConfig as any);
      toast.success("Comportamiento y latencias guardadas correctamente");
    } catch (err) {
      toast.error("Error al guardar comportamiento: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("behavior", false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Humanizador de Salida</CardTitle>
            <CardDescription>
              Configura los retrasos de escritura, la fragmentación de mensajes y la velocidad aparente (WPM) para simular comportamiento humano en WhatsApp/Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Habilitar Humanizador</FormLabel>
                    <FormDescription>
                      Activa el middleware de delay dinámico antes de enviar el mensaje al orquestador.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wpm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palabras por Minuto (WPM): {field.value}</FormLabel>
                  <FormDescription>Velocidad de "escritura". Afecta el cálculo del tiempo de typing estático.</FormDescription>
                  <FormControl>
                    <Slider
                      min={10}
                      max={400}
                      step={5}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange((vals as number[])[0] ?? vals)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chunkSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fragmentación (Chunk Size): {field.value} caracteres</FormLabel>
                  <FormDescription>Si el mensaje excede este tamaño, el bot lo dividirá en múltiples burbujas consecutivas.</FormDescription>
                  <FormControl>
                    <Slider
                      min={10}
                      max={500}
                      step={10}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange((vals as number[])[0] ?? vals)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="minDelay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retraso Mínimo (ms): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={5000}
                        step={100}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange((vals as number[])[0] ?? vals)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDelay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retraso Máximo (ms): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange((vals as number[])[0] ?? vals)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={saving["behavior"]}>
              {saving["behavior"] ? "Guardando..." : "Guardar Comportamiento"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

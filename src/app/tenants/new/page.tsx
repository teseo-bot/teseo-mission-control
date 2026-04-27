"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

const newTenantSchema = z.object({
  id: z.string().min(3).max(50).regex(/^[a-z0-9-_]+$/, "Solo minúsculas, números, guiones y guiones bajos"),
  name: z.string().min(3).max(100),
});

type NewTenantForm = z.infer<typeof newTenantSchema>;

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<NewTenantForm>({
    resolver: zodResolver(newTenantSchema),
    defaultValues: {
      id: "",
      name: "",
    },
  });

  async function onSubmit(data: NewTenantForm) {
    try {
      setLoading(true);
      const { error } = await supabase.from("tenants").insert({
        id: data.id,
        name: data.name,
        status: "onboarding",
      });

      if (error) throw error;
      
      toast.success("Tenant creado exitosamente");
      router.push(`/tenants/${data.id}`);
    } catch (err: unknown) {
      toast.error("Error al crear tenant: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft className="w-4 h-4 mr-2" /> Volver
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Tenant</CardTitle>
          <CardDescription>
            Registra una nueva instancia de cliente en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID del Tenant</FormLabel>
                    <FormControl>
                      <Input placeholder="empresa-demo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Empresa Demo S.A. de C.V." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Crear Tenant"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

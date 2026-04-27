"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { createClient } from "@/lib/supabase";
import { operationSchema } from "@/lib/schemas/tenant";
import { Trash2, Plus, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OperationFormValues = z.infer<typeof operationSchema>;

export function OperationTab() {
  const { tenant, config, setTenant, setConfig, saving, setSaving } = useTenantDetailStore();
  const supabase = createClient();
  const [domainHost, setDomainHost] = useState("");

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      status: tenant?.status || "active",
      orchestrator_url: tenant?.orchestrator_url || "",
      api_key_vault_id: tenant?.api_key_vault_id || "",
      domain: tenant?.domain || "",
      tg_bot_token: "",
      tg_authorized_groups: "",
      wa_phone_id: "",
      wa_verify_token: "",
      wa_access_token: "",
      email_address: "",
      email_password: "",
      email_imap_host: "",
      email_smtp_host: "",
      mcp_servers: []
    },
  });

  const { fields: mcpFields, append: appendMcp, remove: removeMcp } = useFieldArray({
    control: form.control,
    name: "mcp_servers"
  });

  // Escuchar cambios en el input del dominio para la tarjeta DNS
  const currentDomain = form.watch("domain");

  useEffect(() => {
    if (tenant && config) {
      const channels = (config.features?.channels as any) || {};
      const storedMcps = (config.features?.mcp_servers as any[]) || [];
      
      form.reset({
        status: tenant.status || "active",
        orchestrator_url: tenant.orchestrator_url || "",
        api_key_vault_id: tenant.api_key_vault_id || "",
        domain: tenant.domain || "",
        tg_bot_token: channels.tg_bot_token || "",
        tg_authorized_groups: channels.tg_authorized_groups || "",
        wa_phone_id: channels.wa_phone_id || "",
        wa_verify_token: channels.wa_verify_token || "",
        wa_access_token: channels.wa_access_token || "",
        email_address: channels.email_address || "",
        email_password: channels.email_password || "",
        email_imap_host: channels.email_imap_host || "",
        email_smtp_host: channels.email_smtp_host || "",
        mcp_servers: storedMcps
      });
    }
  }, [tenant, config, form]);

  if (!tenant || !config) return null;

  async function onSubmit(data: OperationFormValues) {
    if (!tenant || !config) return;
    try {
      setSaving("core", true);
      
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          status: data.status,
          orchestrator_url: data.orchestrator_url ?? null,
          api_key_vault_id: data.api_key_vault_id ?? null,
          domain: data.domain ?? null,
        })
        .eq("id", tenant.id);
        
      if (tenantError) throw tenantError;

      // Guardar configs de canales en JSONB features
      const currentFeatures = config.features || {};
      const updatedFeatures = {
        ...currentFeatures,
        channels: {
          tg_bot_token: data.tg_bot_token,
          tg_authorized_groups: data.tg_authorized_groups,
          wa_phone_id: data.wa_phone_id,
          wa_verify_token: data.wa_verify_token,
          wa_access_token: data.wa_access_token,
          email_address: data.email_address,
          email_password: data.email_password,
          email_imap_host: data.email_imap_host,
          email_smtp_host: data.email_smtp_host,
        },
        mcp_servers: data.mcp_servers || []
      };

      const { error: configError } = await supabase
        .from("tenant_configs")
        .update({ features: updatedFeatures })
        .eq("tenant_id", tenant.id);

      if (configError) throw configError;

      setTenant({ ...tenant, status: data.status, orchestrator_url: data.orchestrator_url ?? null, api_key_vault_id: data.api_key_vault_id ?? null, domain: data.domain ?? null });
      setConfig({ ...config, features: updatedFeatures } as any);
      
      toast.success("Operación y Canales guardados correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar operación: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("core", false);
    }
  }

  const handleKillSwitch = async () => {
    if (!tenant) return;
    if (!confirm("¿Estás seguro de que quieres SUSPENDER este tenant? Esto detendrá toda su operación y forzará un respaldo de base de datos.")) return;
    
    try {
      setSaving("core", true);
      
      const response = await fetch(`/api/tenant/${tenant.id}/backup`, {
        method: 'POST',
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.error || "Error invoking backup and suspend endpoint");
      }

      setTenant({ ...tenant, status: "suspended" });
      form.setValue("status", "suspended");
      toast.success("Tenant respaldado y suspendido exitosamente");
    } catch (err) {
      toast.error("Error al suspender tenant: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving("core", false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identidad & Routing</CardTitle>
                <CardDescription>Estado base del tenant y webhooks de orquestación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="suspended">Suspendido</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dominio Personalizado (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="app.ejemplo.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Debe ser único en toda la plataforma.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {currentDomain && currentDomain.length > 3 && (
                  <div className="bg-muted/40 border border-muted-foreground/20 rounded-md p-3 text-sm">
                    <p className="font-semibold mb-1">Instrucciones DNS para el cliente:</p>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-black/10 dark:bg-white/10 p-2 rounded">
                      <span className="text-muted-foreground">TIPO</span>
                      <span className="text-muted-foreground">HOST / NOMBRE</span>
                      <span className="text-muted-foreground">DESTINO / VALOR</span>
                      <span>CNAME</span>
                      <span>{currentDomain}</span>
                      <span>ghs.googlehosted.com</span>
                    </div>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="orchestrator_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orchestrator URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="api_key_vault_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vault Key ID (Gestor de Secretos)</FormLabel>
                      <FormControl>
                        <Input placeholder="Supabase Vault ID o Secret Manager ID" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>Evita guardar tokens maestros en texto plano.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-500">Peligro</CardTitle>
                <CardDescription>Acciones destructivas o críticas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" onClick={handleKillSwitch} disabled={saving["core"]}>
                  <Trash2 className="w-4 h-4 mr-2" /> Kill Switch (Suspender)
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Canales & Conectores</CardTitle>
                <CardDescription>Endpoints de comunicación y extensiones MCP.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="telegram" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="telegram">Telegram</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="email">Correo</TabsTrigger>
                    <TabsTrigger value="mcp">MCPs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="telegram" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tg_bot_token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bot Token</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tg_authorized_groups"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grupos Autorizados (IDs)</FormLabel>
                          <FormControl>
                            <Input placeholder="-100123456789, -100987654321" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>Separados por comas.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="whatsapp" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="wa_phone_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number ID (Meta)</FormLabel>
                          <FormControl>
                            <Input placeholder="10593847281923" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wa_verify_token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verify Token (Webhook)</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu_Token_Secreto" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wa_access_token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System User Access Token (API Key)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="EAAI... (Token permanente de Meta)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>Permite al Orchestrator enviar mensajes de salida.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico (Usuario)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="agente@empresa.com" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña de Aplicación (App Password)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••••••" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email_imap_host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servidor IMAP (Lectura)</FormLabel>
                            <FormControl>
                              <Input placeholder="imap.gmail.com:993" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email_smtp_host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Servidor SMTP (Envío)</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.gmail.com:465" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="mcp" className="space-y-4">
                    <div className="bg-muted/30 p-3 rounded-md mb-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Configuración para múltiples conectores Model Context Protocol (SSE).</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendMcp({ id: "", type: "sse", url: "", env: [] })}>
                        <Plus className="w-4 h-4 mr-1" /> Añadir
                      </Button>
                    </div>
                    
                    {mcpFields.map((field, index) => (
                      <div key={field.id} className="border p-4 rounded-md space-y-4 relative">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:bg-red-50"
                          onClick={() => removeMcp(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4 pr-6">
                          <FormField
                            control={form.control}
                            name={`mcp_servers.${index}.id`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>ID del MCP</FormLabel>
                                <FormControl>
                                  <Input placeholder="odoo_mcp" {...f} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`mcp_servers.${index}.type`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Protocolo</FormLabel>
                                <Select onValueChange={f.onChange} defaultValue={f.value}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="sse">HTTP / SSE</SelectItem>
                                    <SelectItem value="stdio" disabled>STDIO (Local)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`mcp_servers.${index}.url`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Endpoint URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://api.mi-mcp.com/sse" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-2 mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <FormLabel>Variables de Entorno (Credenciales)</FormLabel>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs px-2"
                              onClick={() => {
                                const currentEnv = form.getValues(`mcp_servers.${index}.env`) || [];
                                form.setValue(`mcp_servers.${index}.env`, [...currentEnv, { key: "", value: "" }]);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Var
                            </Button>
                          </div>
                          
                          {form.watch(`mcp_servers.${index}.env`)?.map((envItem, envIndex) => (
                            <div key={envIndex} className="flex items-center gap-2">
                              <FormField
                                control={form.control}
                                name={`mcp_servers.${index}.env.${envIndex}.key`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormControl><Input placeholder="ODOO_DB" className="h-8 text-xs" {...f} /></FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`mcp_servers.${index}.env.${envIndex}.value`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormControl><Input type="password" placeholder="Valor" className="h-8 text-xs" {...f} /></FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => {
                                  const currentEnv = form.getValues(`mcp_servers.${index}.env`) || [];
                                  form.setValue(`mcp_servers.${index}.env`, currentEnv.filter((_, i) => i !== envIndex));
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {(!form.watch(`mcp_servers.${index}.env`) || form.watch(`mcp_servers.${index}.env`)?.length === 0) && (
                            <p className="text-xs text-muted-foreground italic">Sin variables de entorno.</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {mcpFields.length === 0 && (
                      <div className="text-center p-6 border border-dashed rounded-md bg-muted/10">
                        <p className="text-sm text-muted-foreground">No hay servidores MCP configurados.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={saving["core"]} size="lg">
            {saving["core"] ? "Guardando..." : "Guardar Cambios de Operación"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

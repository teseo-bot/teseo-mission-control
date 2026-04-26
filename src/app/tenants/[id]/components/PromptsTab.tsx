"use client";

import { QuickEditPanel } from "./QuickEditPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PromptsTab({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="quick-edit" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="quick-edit">Edición Rápida (Legacy)</TabsTrigger>
          <TabsTrigger value="studio">Prompt Studio</TabsTrigger>
          <TabsTrigger value="versions">Versiones (A/B)</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-edit" className="space-y-6">
          <QuickEditPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="studio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Studio</CardTitle>
              <CardDescription>Gestión avanzada de templates por rol.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-10 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Módulo Prompt Studio en construcción.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Control de Versiones</CardTitle>
              <CardDescription>Historial y A/B testing de Prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-10 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Módulo Version Editor en construcción.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variables Dinámicas</CardTitle>
              <CardDescription>Variables de contexto (ej. {'{nombre_empresa}'}).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-10 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Módulo Variable Manager en construcción.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

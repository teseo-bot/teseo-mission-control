"use client";

import { QuickEditPanel } from "./QuickEditPanel";
import { PromptStudioPanel } from "./prompts/PromptStudioPanel";
import { PromptVersionsPanel } from "./prompts/PromptVersionsPanel";
import { PromptVariablesPanel } from "./prompts/PromptVariablesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { operationSchema } from "@/lib/schemas/tenant";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type OperationFormValues = z.infer<typeof operationSchema>;

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
          <PromptStudioPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <PromptVersionsPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <PromptVariablesPanel tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VaultTabProps {
  tenantId: string;
}

export function VaultTab({ tenantId }: VaultTabProps) {
  const [supabase] = useState(() => createClient());
  const [keys, setKeys] = useState<{ id: string; provider: string; api_key: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, [tenantId]);

  async function fetchKeys() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_api_keys")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setKeys(data);
    }
    setLoading(false);
  }

  async function handleAddKey() {
    if (!apiKey) return toast.error("Please enter an API key");
    setSaving(true);
    
    // Check if key already exists for this provider
    const existing = keys.find(k => k.provider === provider);
    
    let error;
    if (existing) {
       const res = await supabase.from("tenant_api_keys")
        .update({ api_key: apiKey })
        .eq("id", existing.id);
       error = res.error;
    } else {
       const res = await supabase.from("tenant_api_keys")
        .insert({ tenant_id: tenantId, provider, api_key: apiKey });
       error = res.error;
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save API key: " + error.message);
    } else {
      toast.success("API key saved successfully");
      setApiKey("");
      fetchKeys();
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("tenant_api_keys").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete key");
    } else {
      toast.success("Key deleted");
      fetchKeys();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Key Vault</CardTitle>
          <CardDescription>
            Securely manage API keys for external providers (OpenAI, Anthropic). 
            These keys are used by the AI Orchestrator on behalf of this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-2 col-span-1">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(val) => setProvider(val || "openai")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google/Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>API Key</Label>
              <Input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                placeholder="sk-..." 
              />
            </div>
            <div className="col-span-1">
              <Button onClick={handleAddKey} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Key"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : keys.length === 0 ? (
            <div className="text-sm text-muted-foreground">No API keys configured yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Key Fragment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-semibold capitalize">{k.provider}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {k.api_key.substring(0, 5)}...{k.api_key.substring(k.api_key.length - 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(k.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
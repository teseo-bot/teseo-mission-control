"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  name: string;
  status: string;
  created_at: string;
  orchestrator_url?: string;
}

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize client once
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchTenants() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from("tenants")
          .select("*")
          .order("created_at", { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        setTenants(data || []);
      } catch (err: unknown) {
        console.error("Error fetching tenants:", err);
        const msg = err instanceof Error ? err.message : "Failed to fetch tenants.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "suspended": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "onboarding": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              List of all tenants registered in the Mission Control platform. Click a row to view and edit details.
            </CardDescription>
          </div>
          <Button onClick={() => router.push("/tenants/new")}>
            <Plus className="w-4 h-4 mr-2" /> New Tenant
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading tenants...</div>
          ) : error ? (
            <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
              Error: {error}
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-gray-500 p-4 text-center">
              No tenants found.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Orchestrator URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow 
                      key={tenant.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/tenants/${tenant.id}`)}
                    >
                      <TableCell className="font-medium font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                        {tenant.id}
                      </TableCell>
                      <TableCell className="font-semibold">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">
                        {tenant.orchestrator_url || "Not configured"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(tenant.status)}>
                          {tenant.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

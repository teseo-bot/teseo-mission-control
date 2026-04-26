"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTenantDetailStore } from "@/hooks/useTenantDetailStore";
import { inviteUserSchema } from "@/lib/schemas/tenant";
import { UserPlus, Loader2 } from "lucide-react";

type InviteFormValues = z.infer<typeof inviteUserSchema>;

export function AccessTab({ tenantId }: { tenantId: string }) {
  const { users, setUsers } = useTenantDetailStore();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/tenant/${tenantId}/users`);
      if (!res.ok) throw new Error("Error al obtener usuarios");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const res = await fetch(`/api/tenant/${tenantId}/users`);
        if (!res.ok) throw new Error("Error al obtener usuarios");
        const data = await res.json();
        if (active) {
          setUsers(data.users);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    };
    loadUsers();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function onSubmit(data: InviteFormValues) {
    setInviting(true);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al invitar");
      }
      toast.success("Usuario invitado correctamente");
      form.reset();
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setInviting(false);
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/tenant/${tenantId}/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al actualizar rol");
      }
      
      toast.success("Rol actualizado");
      setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" } : u));
    } catch (err) {
      toast.error("Error al actualizar rol: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invitar Usuario</CardTitle>
          <CardDescription>Invita a un nuevo miembro a este tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="w-[200px]">
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OWNER">Propietario</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="MEMBER">Miembro</SelectItem>
                        <SelectItem value="VIEWER">Lector</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={inviting}>
                {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Invitar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Tenant</CardTitle>
          <CardDescription>Lista de miembros con acceso a este tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Agregado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No hay usuarios en este tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(val) => handleRoleChange(u.user_id, val as string)}>
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER">Propietario</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                            <SelectItem value="MEMBER">Miembro</SelectItem>
                            <SelectItem value="VIEWER">Lector</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

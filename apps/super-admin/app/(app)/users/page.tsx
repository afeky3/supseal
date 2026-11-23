"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth, ApiError } from "@/contexts/auth-context";
import { listBrands } from "@/lib/brands";
import { createUser, listUsers, reactivateUser, suspendUser, type CreateUserInput } from "@/lib/users";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  BRAND_ADMIN: "Brand Admin",
  BRAND_STAFF: "Brand Staff",
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleCreate(input: CreateUserInput) {
    await createUser(input);
    toast.success("User created");
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await (active ? suspendUser(id) : reactivateUser(id));
      toast.success(active ? "User suspended" : "User reactivated");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Every account on the platform, all roles.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New user
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !users || users.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <UsersIcon className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No users yet</h2>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                  <TableCell className="text-muted-foreground">{u.brand?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "default" : "destructive"}>
                      {u.active ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    {u.id !== me?.id && (
                      <Button size="sm" variant="outline" onClick={() => toggleActive(u.id, u.active)}>
                        {u.active ? "Suspend" : "Reactivate"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brands={brands ?? []}
        onSubmit={handleCreate}
      />
    </div>
  );
}

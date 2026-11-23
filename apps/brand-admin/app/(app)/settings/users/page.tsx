"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { InviteStaffDialog } from "@/components/invite-staff-dialog";
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
import { inviteStaff, listUsers, reactivateUser, suspendUser } from "@/lib/users";
import { toast } from "sonner";

export default function UsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const [dialogOpen, setDialogOpen] = useState(false);
  const canManage = me?.role === "BRAND_ADMIN";

  async function handleInvite(email: string, password: string) {
    await inviteStaff(email, password);
    toast.success("Staff account created");
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
          <p className="text-sm text-muted-foreground">Your brand&apos;s admin and staff accounts.</p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Invite staff
          </Button>
        )}
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
              <Users className="size-5 text-muted-foreground" />
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
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{u.role === "BRAND_ADMIN" ? "Brand Admin" : "Brand Staff"}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "default" : "destructive"}>
                      {u.active ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {u.id !== me?.id && (
                        <Button size="sm" variant="outline" onClick={() => toggleActive(u.id, u.active)}>
                          {u.active ? "Suspend" : "Reactivate"}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <InviteStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleInvite} />
    </div>
  );
}

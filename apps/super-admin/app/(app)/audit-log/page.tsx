"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchAuditLog } from "@/lib/audit-log";

export default function AuditLogPage() {
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit-log", action, entity],
    queryFn: () => searchAuditLog({ action: action || undefined, entity: entity || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Every privileged action taken on the platform, most recent first.
        </p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Filter by action (e.g. batch.approve)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by entity (e.g. brand)"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No matching entries.</p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.user?.email ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.entity}
                    {entry.entityId ? ` (${entry.entityId.slice(0, 8)})` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { FraudStatusBadge } from "@/components/fraud-status-badge";
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
import { listFraudFlags } from "@/lib/fraud";

export default function FraudPage() {
  const router = useRouter();
  const { data: flags, isLoading } = useQuery({ queryKey: ["fraud-flags"], queryFn: listFraudFlags });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Fraud Flags</h1>
        <p className="text-sm text-muted-foreground">
          Anomalies automatically detected on your products&apos; verifications.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !flags || flags.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <ShieldAlert className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No fraud flags</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Nothing suspicious has been detected yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Raised</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => (
                <TableRow
                  key={flag.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/fraud/${flag.id}`)}
                >
                  <TableCell className="font-medium">
                    {flag.verificationEvent.code?.batch.product.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{flag.reason}</TableCell>
                  <TableCell>{flag.severity}</TableCell>
                  <TableCell>
                    <FraudStatusBadge status={flag.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(flag.createdAt).toLocaleDateString()}
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

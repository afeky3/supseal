"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FraudStatusBadge } from "@/components/fraud-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/contexts/auth-context";
import { getFraudFlag, resolveFraudFlag } from "@/lib/fraud";
import { toast } from "sonner";

export default function FraudDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: flag, isLoading } = useQuery({
    queryKey: ["fraud-flags", params.id],
    queryFn: () => getFraudFlag(params.id),
  });
  const [busy, setBusy] = useState(false);

  async function handleResolve(resolution: "RESOLVED" | "ESCALATED") {
    setBusy(true);
    try {
      await resolveFraudFlag(params.id, resolution);
      toast.success(resolution === "RESOLVED" ? "Flag resolved" : "Flag escalated");
      await queryClient.invalidateQueries({ queryKey: ["fraud-flags"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !flag) {
    return (
      <div className="max-w-lg space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const ctx = flag.verificationEvent;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/fraud"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Fraud Flags
        </Link>
        <h1 className="text-lg font-semibold">{ctx.code?.batch.product.name ?? "Unknown product"}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">{flag.severity} severity</CardTitle>
          <FraudStatusBadge status={flag.status} />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Reason</div>
            <p>{flag.reason}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Result</div>
              <p>{ctx.result}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">When</div>
              <p>{new Date(ctx.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Device</div>
              <p className="truncate">{ctx.deviceFingerprint ?? "—"}</p>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">IP</div>
              <p>{ctx.ipAddress ?? "—"}</p>
            </div>
          </div>

          {flag.status === "OPEN" && (
            <div className="flex gap-2 pt-2">
              <Button disabled={busy} onClick={() => handleResolve("RESOLVED")}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Mark resolved
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => handleResolve("ESCALATED")}>
                Escalate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

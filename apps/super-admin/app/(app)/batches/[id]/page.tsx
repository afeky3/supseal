"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { ReconcileDialog } from "@/components/reconcile-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/contexts/auth-context";
import {
  deliverBatch,
  downloadBatchPdf,
  getBatch,
  reconcileBatch,
  revokeBatch,
  sendToPrint,
  shipBatch,
} from "@/lib/batches";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FULFILLMENT_STEPS = [
  { key: "sentToPrintAt", label: "Sent to print" },
  { key: "shippedAt", label: "Shipped" },
  { key: "deliveredAt", label: "Delivered" },
  { key: "reconciledAt", label: "Reconciled" },
] as const;

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: batch, isLoading } = useQuery({
    queryKey: ["batches", params.id],
    queryFn: () => getBatch(params.id),
    refetchInterval: (query) => (query.state.data?.status === "PROCESSING" ? 3000 : false),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["batches", params.id] });
    await queryClient.invalidateQueries({ queryKey: ["batches"] });
  }

  async function handleDownload() {
    try {
      await downloadBatchPdf(params.id);
    } catch {
      toast.error("Couldn't download the PDF");
    }
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !batch) {
    return (
      <div className="max-w-xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const canRevoke = !["REVOKED", "PROCESSING", "FAILED"].includes(batch.status);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/batches"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Sticker Batches
        </Link>
        <h1 className="text-lg font-semibold">
          {batch.product.brand?.name} — {batch.product.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {batch.quantity.toLocaleString()} codes · requested{" "}
          {new Date(batch.requestedAt).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <BatchStatusBadge status={batch.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {batch.status === "PROCESSING" && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Generating {batch.quantity.toLocaleString()} codes and building the PDF.
            </div>
          )}

          {batch.status === "FAILED" && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Generation failed{batch.failureReason ? `: ${batch.failureReason}` : "."}
            </div>
          )}

          {batch.pdfPath && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Print-ready PDF</div>
                <div className="text-xs text-muted-foreground">
                  QR code + hidden code for every sticker in this batch
                </div>
              </div>
              <Button size="sm" onClick={handleDownload}>
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {batch.printRequested
              ? "This brand asked SUPSEAL to print and ship."
              : "Self-print — the brand handles printing themselves. Nothing for SUPSEAL to fulfill."}
          </div>

          {canRevoke && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() =>
                runAction(() => revokeBatch(batch.id), "Batch revoked — all codes disabled")
              }
            >
              Revoke batch
            </Button>
          )}
        </CardContent>
      </Card>

      {batch.printRequested && batch.pdfPath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              {FULFILLMENT_STEPS.map((step) => {
                const value = batch[step.key];
                const done = Boolean(value);
                return (
                  <li key={step.key} className="flex items-center gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 className="size-4 text-chart-2" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <span className={cn(!done && "text-muted-foreground")}>{step.label}</span>
                    {value && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(value).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {batch.status === "CODES_GENERATED" && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => runAction(() => sendToPrint(batch.id), "Marked sent to print")}
                >
                  Mark sent to print
                </Button>
              )}
              {batch.status === "SENT_TO_PRINT" && (
                <Button size="sm" disabled={busy} onClick={() => runAction(() => shipBatch(batch.id), "Marked shipped")}>
                  Mark shipped
                </Button>
              )}
              {batch.status === "SHIPPED" && (
                <Button size="sm" disabled={busy} onClick={() => runAction(() => deliverBatch(batch.id), "Marked delivered")}>
                  Mark delivered
                </Button>
              )}
              {batch.status === "DELIVERED" && (
                <Button size="sm" disabled={busy} onClick={() => setReconcileOpen(true)}>
                  Reconcile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ReconcileDialog
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
        quantity={batch.quantity}
        onSubmit={(printedCount) =>
          reconcileBatch(batch.id, printedCount).then(() => {
            toast.success("Batch reconciled");
            return refresh();
          })
        }
      />
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadBatchPdf, getBatch } from "@/lib/batches";
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
  const { data: batch, isLoading } = useQuery({
    queryKey: ["batches", params.id],
    queryFn: () => getBatch(params.id),
    refetchInterval: (query) => (query.state.data?.status === "PROCESSING" ? 3000 : false),
  });

  async function handleDownload() {
    try {
      await downloadBatchPdf(params.id);
    } catch {
      toast.error("Couldn't download the PDF");
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
        <h1 className="text-lg font-semibold">{batch.product.name}</h1>
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
              Generating {batch.quantity.toLocaleString()} codes and building your PDF — this page
              updates automatically.
            </div>
          )}

          {batch.status === "FAILED" && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Generation failed{batch.failureReason ? `: ${batch.failureReason}` : "."} Contact
              support.
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
              ? "SUPSEAL is printing and shipping this batch for you."
              : "Self-print — send the PDF to your own print vendor."}
          </div>
        </CardContent>
      </Card>

      {batch.printRequested && batch.pdfPath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

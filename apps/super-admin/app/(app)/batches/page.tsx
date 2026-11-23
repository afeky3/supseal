"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Printer, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
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
import { cn } from "@/lib/utils";
import { deliverBatch, listBatches, listPrintQueue, sendToPrint, shipBatch } from "@/lib/batches";
import { toast } from "sonner";

const NEXT_ACTION: Record<string, { label: string; action: (id: string) => Promise<unknown> }> = {
  CODES_GENERATED: { label: "Mark sent to print", action: sendToPrint },
  SENT_TO_PRINT: { label: "Mark shipped", action: shipBatch },
  SHIPPED: { label: "Mark delivered", action: deliverBatch },
};

export default function BatchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"queue" | "all">("queue");

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches", view],
    queryFn: () => (view === "queue" ? listPrintQueue() : listBatches()),
  });

  async function handleAction(e: React.MouseEvent, id: string, status: string) {
    e.stopPropagation();
    const next = NEXT_ACTION[status];
    if (!next) return;
    try {
      await next.action(id);
      toast.success(next.label);
      await queryClient.invalidateQueries({ queryKey: ["batches"] });
    } catch {
      toast.error("Couldn't update this batch");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sticker Batches</h1>
          <p className="text-sm text-muted-foreground">
            Batches generate on their own now — this is the queue for ones brands asked SUPSEAL to
            print and ship.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              view === "queue" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => setView("queue")}
          >
            <Truck className="size-3.5" />
            Print queue
          </button>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              view === "all" ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => setView("all")}
          >
            <Package className="size-3.5" />
            All batches
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !batches || batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <Printer className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">
              {view === "queue" ? "Nothing waiting on us" : "No batches yet"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {view === "queue"
                ? "Every brand-requested print job has been actioned."
                : "Batches appear here as brands create them."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Printing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const next = batch.printRequested ? NEXT_ACTION[batch.status] : undefined;
                return (
                  <TableRow
                    key={batch.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/batches/${batch.id}`)}
                  >
                    <TableCell className="font-medium">{batch.product.brand?.name}</TableCell>
                    <TableCell>{batch.product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.printRequested ? "SUPSEAL prints" : "Self-print"}
                    </TableCell>
                    <TableCell>
                      <BatchStatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>
                      {next && (
                        <Button size="sm" variant="outline" onClick={(e) => handleAction(e, batch.id, batch.status)}>
                          {next.label}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

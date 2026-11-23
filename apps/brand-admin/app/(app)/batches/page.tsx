"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { CreateBatchDialog } from "@/components/create-batch-dialog";
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
import { createBatch, downloadBatchPdf, listBatches, type CreateBatchInput } from "@/lib/batches";
import { listProducts } from "@/lib/products";
import { toast } from "sonner";

export default function BatchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: listBatches,
    // Poll while anything's still generating so "Ready" shows up on its own
    // — this is the in-platform notification for "your PDF is done".
    refetchInterval: (query) =>
      query.state.data?.some((b) => b.status === "PROCESSING") ? 3000 : false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleCreate(input: CreateBatchInput) {
    await createBatch(input);
    toast.success("Batch created — generating codes now");
    await queryClient.invalidateQueries({ queryKey: ["batches"] });
  }

  async function handleDownload(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await downloadBatchPdf(id);
    } catch {
      toast.error("Couldn't download the PDF");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sticker Batches</h1>
          <p className="text-sm text-muted-foreground">
            Request codes for a product — no approval step, just a short wait while they generate.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!products?.length}>
          <Plus className="size-4" />
          New batch
        </Button>
      </div>

      {!products?.length && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Add a product first — batches are requested against one.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !batches || batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <QrCode className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No batches yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Request your first sticker batch to start generating QR codes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Printing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/batches/${batch.id}`)}
                >
                  <TableCell className="font-medium">{batch.product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {batch.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {batch.printRequested ? "SUPSEAL prints" : "Self-print"}
                  </TableCell>
                  <TableCell>
                    <BatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(batch.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {batch.pdfPath && (
                      <Button size="sm" variant="outline" onClick={(e) => handleDownload(e, batch.id)}>
                        <Download className="size-3.5" />
                        PDF
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateBatchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products ?? []}
        onSubmit={handleCreate}
      />
    </div>
  );
}

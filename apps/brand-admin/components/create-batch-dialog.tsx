"use client";

import type { Product } from "@supseal/shared-types";
import { Loader2, Printer, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApiError } from "@/contexts/auth-context";
import type { CreateBatchInput } from "@/lib/batches";

export function CreateBatchDialog({
  open,
  onOpenChange,
  products,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSubmit: (input: CreateBatchInput) => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [printRequested, setPrintRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId(products[0]?.id ?? "");
      setQuantity("100");
      setPrintRequested(false);
      setError(null);
    }
  }, [open, products]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!productId) {
      setError("Choose a product first.");
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Quantity must be a whole number of at least 1.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ productId, quantity: qty, printRequested });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New sticker batch</DialogTitle>
          <DialogDescription>
            Codes and your print-ready PDF generate automatically — no approval needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product">Product</Label>
            <Select value={productId} onValueChange={(v) => setProductId(v ?? "")} disabled={submitting}>
              <SelectTrigger id="product" className="w-full">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={100_000}
              required
              disabled={submitting}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Printing</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPrintRequested(false)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  !printRequested ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60",
                )}
              >
                <Printer className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">I&apos;ll print it myself</span>
                <span className="text-xs text-muted-foreground">
                  Download the PDF and send it to your own print vendor.
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPrintRequested(true)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  printRequested ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60",
                )}
              >
                <Truck className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ask SUPSEAL to print & ship</span>
                <span className="text-xs text-muted-foreground">
                  We handle printing and shipping the physical stickers to you.
                </span>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !productId}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

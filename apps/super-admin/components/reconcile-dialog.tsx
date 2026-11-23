"use client";

import { Loader2 } from "lucide-react";
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
import { ApiError } from "@/contexts/auth-context";

export function ReconcileDialog({
  open,
  onOpenChange,
  quantity,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quantity: number;
  onSubmit: (printedCount: number) => Promise<void>;
}) {
  const [printedCount, setPrintedCount] = useState(String(quantity));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPrintedCount(String(quantity));
      setError(null);
    }
  }, [open, quantity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(Number(printedCount));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reconcile batch</DialogTitle>
          <DialogDescription>
            Confirm the number of units actually printed and shipped matches the{" "}
            {quantity.toLocaleString()} codes generated. A mismatch must be investigated first.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="printedCount">Units printed</Label>
            <Input
              id="printedCount"
              type="number"
              min={0}
              required
              disabled={submitting}
              value={printedCount}
              onChange={(e) => setPrintedCount(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Confirm reconciliation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

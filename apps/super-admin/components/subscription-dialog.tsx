"use client";

import type { BrandSubscriptionRow } from "@supseal/shared-types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/contexts/auth-context";
import type { UpsertSubscriptionInput } from "@/lib/subscriptions";

export function SubscriptionDialog({
  open,
  onOpenChange,
  brand,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandSubscriptionRow | null;
  onSubmit: (brandId: string, input: UpsertSubscriptionInput) => Promise<void>;
}) {
  const [tier, setTier] = useState<UpsertSubscriptionInput["tier"]>("STARTER");
  const [billingStatus, setBillingStatus] =
    useState<NonNullable<UpsertSubscriptionInput["billingStatus"]>>("ACTIVE");
  const [renewalDate, setRenewalDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && brand) {
      setTier(brand.subscription?.tier ?? "STARTER");
      setBillingStatus(brand.subscription?.billingStatus ?? "ACTIVE");
      setRenewalDate(brand.subscription?.renewalDate?.slice(0, 10) ?? "");
      setError(null);
    }
  }, [open, brand]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(brand.id, {
        tier,
        billingStatus,
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : undefined,
      });
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
          <DialogTitle>{brand?.name}</DialogTitle>
          <DialogDescription>Assign or change this brand&apos;s subscription.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tier</Label>
            <Select value={tier} onValueChange={(v) => v && setTier(v as typeof tier)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="GROWTH">Growth</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Billing status</Label>
            <Select
              value={billingStatus}
              onValueChange={(v) => v && setBillingStatus(v as typeof billingStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAST_DUE">Past due</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="renewalDate">Renewal date</Label>
            <Input
              id="renewalDate"
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

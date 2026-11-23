"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOwnSubscription } from "@/lib/subscription";

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
};

export default function BillingPage() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: getOwnSubscription,
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Subscription &amp; Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your plan controls analytics depth, seats, and coupon/loyalty tooling — independent of
          sticker purchase volume.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !subscription ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No plan assigned yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              A SUPSEAL Super Admin assigns your subscription tier during onboarding.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{TIER_LABELS[subscription.tier] ?? subscription.tier}</CardTitle>
              <Badge variant={subscription.billingStatus === "ACTIVE" ? "default" : "destructive"}>
                {subscription.billingStatus.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>Sticker purchases are billed separately, per batch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium text-muted-foreground">Renewal date</div>
            <p className="text-sm">
              {subscription.renewalDate
                ? new Date(subscription.renewalDate).toLocaleDateString()
                : "Not set"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

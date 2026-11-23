"use client";

import type { BrandSubscriptionRow } from "@supseal/shared-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SubscriptionDialog } from "@/components/subscription-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSubscriptions, upsertSubscription, type UpsertSubscriptionInput } from "@/lib/subscriptions";
import { toast } from "sonner";

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
};

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: listSubscriptions,
  });
  const [editing, setEditing] = useState<BrandSubscriptionRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleSubmit(brandId: string, input: UpsertSubscriptionInput) {
    await upsertSubscription(brandId, input);
    toast.success("Subscription updated");
    await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Assign and change plan tiers across every brand.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Billing status</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    {row.subscription ? TIER_LABELS[row.subscription.tier] : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.subscription && (
                      <Badge
                        variant={row.subscription.billingStatus === "ACTIVE" ? "default" : "destructive"}
                      >
                        {row.subscription.billingStatus.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.subscription?.renewalDate
                      ? new Date(row.subscription.renewalDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        setDialogOpen(true);
                      }}
                    >
                      {row.subscription ? "Edit" : "Assign"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

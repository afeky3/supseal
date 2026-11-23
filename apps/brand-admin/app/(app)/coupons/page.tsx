"use client";

import { useQuery } from "@tanstack/react-query";
import { Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { listCoupons } from "@/lib/coupons";

export default function CouponsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["coupons"], queryFn: listCoupons });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Issued automatically on every first-time VERIFIED result.
        </p>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {isLoading || !data ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:w-1/2">
                <KpiCard label="Issued" value={data.stats.issued.toLocaleString()} />
                <KpiCard
                  label="Redeemed"
                  value={data.stats.redeemed.toLocaleString()}
                  sublabel={
                    data.stats.issued > 0
                      ? `${Math.round((data.stats.redeemed / data.stats.issued) * 100)}% redemption rate`
                      : undefined
                  }
                />
              </div>

              {data.coupons.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                      <Percent className="size-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold">No coupons issued yet</h2>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Coupons appear here the first time a consumer verifies one of your products.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-mono text-xs">{coupon.code}</TableCell>
                          <TableCell>
                            {coupon.verificationEvent.code?.batch.product.name ?? "—"}
                          </TableCell>
                          <TableCell>{parseFloat(coupon.discountPct)}%</TableCell>
                          <TableCell>
                            <Badge variant={coupon.redeemed ? "default" : "secondary"}>
                              {coupon.redeemed ? "Redeemed" : "Unused"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Current rule (platform default)</CardTitle>
              <CardDescription>
                Per-product / per-campaign configuration isn&apos;t available yet — every first-time
                VERIFIED currently issues the same default coupon.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Discount</div>
                <p>5%</p>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Validity</div>
                <p>30 days from issuance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformDashboard } from "@/lib/analytics";
import { listBrands } from "@/lib/brands";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export default function DashboardPage() {
  const [brandId, setBrandId] = useState<string>("all");
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const { data, isLoading } = useQuery({
    queryKey: ["platform-dashboard", brandId],
    queryFn: () => getPlatformDashboard(brandId === "all" ? undefined : brandId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Verification activity across every brand on SUPSEAL.
          </p>
        </div>
        <Select value={brandId} onValueChange={(v) => setBrandId(v ?? "all")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="Stickers generated"
              value={data.kpis.totalStickersGenerated.toLocaleString()}
            />
            <KpiCard
              label="Total verifications"
              value={data.kpis.totalVerifications.toLocaleString()}
            />
            <KpiCard label="First-time" value={data.kpis.firstTimeVerifications.toLocaleString()} />
            <KpiCard label="Repeat checks" value={data.kpis.repeatVerifications.toLocaleString()} />
            <KpiCard label="Suspicious" value={data.kpis.suspiciousVerifications.toLocaleString()} />
            <KpiCard label="Verification rate" value={`${data.kpis.verificationRatePct}%`} />
            <KpiCard
              label="Sticker revenue"
              value={`${data.kpis.stickerRevenueEgp.toLocaleString()} EGP`}
              sublabel="Subscription revenue not yet tracked"
            />
          </div>

          <ChartCard title="Verification trends (last 14 days)">
            <LineChart data={data.charts.verificationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="verified" name="Verified" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="verifiedBefore"
                name="Verified before"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="unverified"
                name="Unverified"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Verification by product">
              <BarChart data={data.charts.verificationByProduct} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="product"
                  width={100}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Verifications" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Verification by region">
              <BarChart data={data.charts.verificationByRegion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="region"
                  width={100}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Verifications" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Fraud detection insights</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {data.charts.fraudInsights.open}
                  </div>
                  <div className="text-xs text-muted-foreground">Open flags</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {data.charts.fraudInsights.resolved}
                  </div>
                  <div className="text-xs text-muted-foreground">Resolved flags</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Coupon usage</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {data.charts.couponUsage.issued}
                  </div>
                  <div className="text-xs text-muted-foreground">Issued</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {data.charts.couponUsage.redeemed}
                  </div>
                  <div className="text-xs text-muted-foreground">Redeemed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

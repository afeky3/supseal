import { Injectable } from "@nestjs/common";
import { Prisma } from "@supseal/database";
import { PrismaService } from "../prisma/prisma.service";

const TREND_DAYS = 14;
const STICKER_PRICE_EGP = 6; // SRS Section 1.4 — sold to brands at 6 EGP/unit

interface EventRow {
  result: "VERIFIED" | "VERIFIED_BEFORE" | "UNVERIFIED";
  geoLocation: string | null;
  createdAt: Date;
  productName: string;
  couponIssued: boolean;
  couponRedeemed: boolean;
}

export interface DashboardData {
  kpis: {
    totalStickersGenerated: number;
    totalVerifications: number;
    firstTimeVerifications: number;
    repeatVerifications: number;
    suspiciousVerifications: number;
    verificationRatePct: number;
    stickerRevenueEgp: number;
  };
  charts: {
    verificationTrends: { date: string; verified: number; verifiedBefore: number; unverified: number }[];
    verificationByProduct: { product: string; count: number }[];
    verificationByRegion: { region: string; count: number }[];
    fraudInsights: { open: number; resolved: number };
    couponUsage: { issued: number; redeemed: number };
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  dashboardForBrand(brandId: string): Promise<DashboardData> {
    return this.prisma.withBrandContext(brandId, (tx) => this.build(tx, { brandId }));
  }

  dashboardForPlatform(brandId?: string): Promise<DashboardData> {
    return this.prisma.withSuperAdminContext((tx) => this.build(tx, { brandId }));
  }

  private async build(
    tx: Prisma.TransactionClient,
    scope: { brandId?: string },
  ): Promise<DashboardData> {
    const brandFilter = scope.brandId ? { product: { brandId: scope.brandId } } : {};

    const batches = await tx.stickerBatch.findMany({
      where: { status: { notIn: ["REQUESTED", "APPROVED"] }, ...brandFilter },
      select: { quantity: true },
    });
    const totalStickersGenerated = batches.reduce((sum, b) => sum + b.quantity, 0);

    // Events with no codeId (a guess that matched nothing real) can't be
    // attributed to any brand or product — excluded here by design, not an
    // oversight; see the RLS policy on verification_events.
    const events = await tx.verificationEvent.findMany({
      where: { code: { batch: brandFilter } },
      select: {
        result: true,
        geoLocation: true,
        createdAt: true,
        coupon: { select: { redeemed: true } },
        code: { select: { batch: { select: { product: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000, // JS-side aggregation below is fine at this scale; move to SQL/materialized views (Technical Plan Section 9) if this ever needs to page.
    });

    const rows: EventRow[] = events.map((e) => ({
      result: e.result,
      geoLocation: e.geoLocation,
      createdAt: e.createdAt,
      productName: e.code?.batch.product.name ?? "Unknown",
      couponIssued: e.coupon !== null,
      couponRedeemed: e.coupon?.redeemed ?? false,
    }));

    const firstTimeVerifications = rows.filter((r) => r.result === "VERIFIED").length;
    const repeatVerifications = rows.filter((r) => r.result === "VERIFIED_BEFORE").length;
    const totalVerifications = firstTimeVerifications + repeatVerifications;

    const fraudWhere = scope.brandId
      ? { verificationEvent: { code: { batch: { product: { brandId: scope.brandId } } } } }
      : {};
    const [openFlags, resolvedFlags] = await Promise.all([
      tx.fraudFlag.count({ where: { status: "OPEN", ...fraudWhere } }),
      tx.fraudFlag.count({ where: { status: { in: ["RESOLVED", "ESCALATED"] }, ...fraudWhere } }),
    ]);

    return {
      kpis: {
        totalStickersGenerated,
        totalVerifications,
        firstTimeVerifications,
        repeatVerifications,
        suspiciousVerifications: openFlags,
        verificationRatePct:
          totalStickersGenerated > 0
            ? Math.round((totalVerifications / totalStickersGenerated) * 1000) / 10
            : 0,
        stickerRevenueEgp: totalStickersGenerated * STICKER_PRICE_EGP,
      },
      charts: {
        verificationTrends: this.buildTrends(rows),
        verificationByProduct: this.groupCount(rows, (r) => r.productName, "product"),
        verificationByRegion: this.groupCount(rows, (r) => r.geoLocation ?? "Unknown", "region"),
        fraudInsights: { open: openFlags, resolved: resolvedFlags },
        couponUsage: {
          issued: rows.filter((r) => r.couponIssued).length,
          redeemed: rows.filter((r) => r.couponRedeemed).length,
        },
      },
    };
  }

  private buildTrends(rows: EventRow[]) {
    const days: { date: string; verified: number; verifiedBefore: number; unverified: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayRows = rows.filter((r) => r.createdAt.toISOString().slice(0, 10) === dateStr);
      days.push({
        date: dateStr,
        verified: dayRows.filter((r) => r.result === "VERIFIED").length,
        verifiedBefore: dayRows.filter((r) => r.result === "VERIFIED_BEFORE").length,
        unverified: dayRows.filter((r) => r.result === "UNVERIFIED").length,
      });
    }
    return days;
  }

  private groupCount<K extends string>(
    rows: EventRow[],
    keyFn: (r: EventRow) => string,
    fieldName: K,
  ): (Record<K, string> & { count: number })[] {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = keyFn(row);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ [fieldName]: key, count }) as Record<K, string> & { count: number });
  }
}

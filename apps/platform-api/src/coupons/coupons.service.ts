import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const couponInclude = {
  verificationEvent: {
    select: {
      createdAt: true,
      code: {
        select: {
          batch: {
            select: {
              product: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private async summarize<T extends { redeemed: boolean }>(coupons: T[]) {
    return {
      issued: coupons.length,
      redeemed: coupons.filter((c) => c.redeemed).length,
    };
  }

  async listForBrand(brandId: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const coupons = await tx.coupon.findMany({
        include: couponInclude,
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      return { coupons, stats: await this.summarize(coupons) };
    });
  }

  async listAll(brandId?: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const coupons = await tx.coupon.findMany({
        where: brandId
          ? { verificationEvent: { code: { batch: { product: { brandId } } } } }
          : undefined,
        include: couponInclude,
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      return { coupons, stats: await this.summarize(coupons) };
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertSubscriptionDto } from "./dto/upsert-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.brand.findMany({
        select: { id: true, name: true, status: true, subscription: true },
        orderBy: { name: "asc" },
      }),
    );
  }

  async upsert(brandId: string, actorId: string, dto: UpsertSubscriptionDto) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { brandId },
        create: {
          brandId,
          tier: dto.tier,
          billingStatus: dto.billingStatus ?? "ACTIVE",
          renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
        },
        update: {
          tier: dto.tier,
          billingStatus: dto.billingStatus,
          renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "subscription.change",
          entity: "subscription",
          entityId: subscription.id,
          metadata: { brandId, tier: dto.tier },
        },
      });
      return subscription;
    });
  }

  getOwn(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.subscription.findUnique({ where: { brandId } }),
    );
  }
}

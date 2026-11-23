import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ResolveFlagDto } from "./dto/resolve-flag.dto";

const flagInclude = {
  verificationEvent: {
    select: {
      id: true,
      result: true,
      deviceFingerprint: true,
      ipAddress: true,
      geoLocation: true,
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
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  listForBrand(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.fraudFlag.findMany({ include: flagInclude, orderBy: { createdAt: "desc" } }),
    );
  }

  listAll(status?: string) {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.fraudFlag.findMany({
        where: status ? { status: status as never } : undefined,
        include: flagInclude,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getOneForBrand(brandId: string, id: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const flag = await tx.fraudFlag.findUnique({ where: { id }, include: flagInclude });
      if (!flag) throw new NotFoundException("Fraud flag not found");
      return flag;
    });
  }

  async getOneForSuperAdmin(id: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const flag = await tx.fraudFlag.findUnique({ where: { id }, include: flagInclude });
      if (!flag) throw new NotFoundException("Fraud flag not found");
      return flag;
    });
  }

  async resolve(id: string, actorId: string, dto: ResolveFlagDto, brandId?: string) {
    const runner = brandId
      ? <T>(fn: (tx: import("@supseal/database").Prisma.TransactionClient) => Promise<T>) =>
          this.prisma.withBrandContext(brandId, fn)
      : <T>(fn: (tx: import("@supseal/database").Prisma.TransactionClient) => Promise<T>) =>
          this.prisma.withSuperAdminContext(fn);

    return runner(async (tx) => {
      const flag = await tx.fraudFlag.findUnique({ where: { id } });
      if (!flag) throw new NotFoundException("Fraud flag not found");
      const updated = await tx.fraudFlag.update({
        where: { id },
        data: { status: dto.resolution, resolvedById: actorId, resolvedAt: new Date() },
        include: flagInclude,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: dto.resolution === "RESOLVED" ? "fraud_flag.resolve" : "fraud_flag.escalate",
          entity: "fraud_flag",
          entityId: id,
        },
      });
      return updated;
    });
  }
}

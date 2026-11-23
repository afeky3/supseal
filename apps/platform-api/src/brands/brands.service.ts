import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { UpdateBrandProfileDto } from "./dto/update-brand-profile.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  // Super Admin surface — platform-wide, bypasses brand RLS by design.
  listAll() {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.brand.findMany({ orderBy: { createdAt: "desc" } }),
    );
  }

  create(dto: CreateBrandDto, actorId: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const brand = await tx.brand.create({
        data: {
          name: dto.name,
          industryCategory: dto.industryCategory,
          description: dto.description,
          contactEmail: dto.contactEmail,
        },
      });
      await tx.auditLog.create({
        data: { userId: actorId, action: "brand.create", entity: "brand", entityId: brand.id },
      });
      return brand;
    });
  }

  async setStatus(id: string, status: "ACTIVE" | "SUSPENDED", actorId: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const brand = await tx.brand.findUnique({ where: { id } });
      if (!brand) throw new NotFoundException("Brand not found");
      const updated = await tx.brand.update({ where: { id }, data: { status } });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: status === "SUSPENDED" ? "brand.suspend" : "brand.reinstate",
          entity: "brand",
          entityId: id,
        },
      });
      return updated;
    });
  }

  async getOneAsSuperAdmin(id: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const brand = await tx.brand.findUnique({
        where: { id },
        include: { _count: { select: { products: true, users: true } } },
      });
      if (!brand) throw new NotFoundException("Brand not found");
      return brand;
    });
  }

  async update(id: string, dto: UpdateBrandDto, actorId: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const brand = await tx.brand.findUnique({ where: { id } });
      if (!brand) throw new NotFoundException("Brand not found");
      const updated = await tx.brand.update({ where: { id }, data: dto });
      await tx.auditLog.create({
        data: { userId: actorId, action: "brand.update", entity: "brand", entityId: id },
      });
      return updated;
    });
  }

  // Brand Admin/Staff surface — RLS-scoped to the caller's own brand.
  async getOwn(brandId: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const brand = await tx.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new NotFoundException("Brand not found");
      return brand;
    });
  }

  async updateOwn(brandId: string, dto: UpdateBrandProfileDto, actorId: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const brand = await tx.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new NotFoundException("Brand not found");
      const updated = await tx.brand.update({ where: { id: brandId }, data: dto });
      await tx.auditLog.create({
        data: { userId: actorId, action: "brand.update_profile", entity: "brand", entityId: brandId },
      });
      return updated;
    });
  }
}

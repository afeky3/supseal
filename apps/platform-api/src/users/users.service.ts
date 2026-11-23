import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@supseal/database";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { InviteStaffDto } from "./dto/invite-staff.dto";

const userSelect = {
  id: true,
  email: true,
  role: true,
  brandId: true,
  active: true,
  mfaEnabled: true,
  lastLoginAt: true,
  createdAt: true,
  brand: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Super Admin surface — all roles, platform-wide ─────────────────────

  listAll() {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } }),
    );
  }

  async create(dto: CreateUserDto, actorId: string) {
    const passwordHash = await argon2.hash(dto.password);
    try {
      return await this.prisma.withSuperAdminContext(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: dto.role,
            brandId: dto.role === "SUPER_ADMIN" ? null : dto.brandId,
          },
          select: userSelect,
        });
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: "user.create",
            entity: "user",
            entityId: user.id,
            metadata: { role: dto.role },
          },
        });
        return user;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("A user with this email already exists");
      }
      throw err;
    }
  }

  async setActive(id: string, active: boolean, actorId: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException("User not found");
      const updated = await tx.user.update({ where: { id }, data: { active }, select: userSelect });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: active ? "user.reactivate" : "user.suspend",
          entity: "user",
          entityId: id,
        },
      });
      return updated;
    });
  }

  // ── Brand Admin surface — own brand's staff only ────────────────────────

  listForBrand(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.user.findMany({ where: { brandId }, select: userSelect, orderBy: { createdAt: "desc" } }),
    );
  }

  async inviteStaff(brandId: string, dto: InviteStaffDto, actorId: string) {
    const passwordHash = await argon2.hash(dto.password);
    try {
      return await this.prisma.withBrandContext(brandId, async (tx) => {
        const user = await tx.user.create({
          data: { email: dto.email, passwordHash, role: "BRAND_STAFF", brandId },
          select: userSelect,
        });
        await tx.auditLog.create({
          data: { userId: actorId, action: "user.invite_staff", entity: "user", entityId: user.id },
        });
        return user;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("A user with this email already exists");
      }
      throw err;
    }
  }

  async setActiveForBrand(brandId: string, id: string, active: boolean, actorId: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user || user.brandId !== brandId) throw new NotFoundException("User not found");
      const updated = await tx.user.update({ where: { id }, data: { active }, select: userSelect });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: active ? "user.reactivate" : "user.suspend",
          entity: "user",
          entityId: id,
        },
      });
      return updated;
    });
  }
}

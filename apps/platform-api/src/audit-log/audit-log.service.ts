import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SearchAuditLogDto } from "./dto/search-audit-log.dto";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  search(dto: SearchAuditLogDto) {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.auditLog.findMany({
        where: {
          userId: dto.userId,
          action: dto.action ? { contains: dto.action, mode: "insensitive" } : undefined,
          entity: dto.entity,
          createdAt: {
            gte: dto.from ? new Date(dto.from) : undefined,
            lte: dto.to ? new Date(dto.to) : undefined,
          },
        },
        include: { user: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: dto.limit ?? 50,
      }),
    );
  }
}

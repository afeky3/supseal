import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  list(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.supportTicket.findMany({ orderBy: { createdAt: "desc" } }),
    );
  }

  async getOne(brandId: string, id: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const ticket = await tx.supportTicket.findUnique({ where: { id } });
      if (!ticket || ticket.brandId !== brandId) throw new NotFoundException("Ticket not found");
      return ticket;
    });
  }

  async updateStatus(brandId: string, id: string, dto: UpdateTicketStatusDto) {
    await this.getOne(brandId, id);
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.supportTicket.update({ where: { id }, data: { status: dto.status } }),
    );
  }
}

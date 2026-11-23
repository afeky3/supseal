import { Body, Controller, ForbiddenException, Get, Param, Patch } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { SupportTicketsService } from "./support-tickets.service";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
@Controller("support-tickets")
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.supportTicketsService.list(requireBrandId(user));
  }

  @Get(":id")
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.supportTicketsService.getOne(requireBrandId(user), id);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportTicketsService.updateStatus(requireBrandId(user), id, dto);
  }
}

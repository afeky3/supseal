import { Controller, Get, Query } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditLogService } from "./audit-log.service";
import { SearchAuditLogDto } from "./dto/search-audit-log.dto";

@Roles(UserRole.SUPER_ADMIN)
@Controller("audit-log")
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  search(@Query() dto: SearchAuditLogDto) {
    return this.auditLogService.search(dto);
  }
}

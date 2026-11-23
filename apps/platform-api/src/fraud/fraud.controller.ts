import { Body, Controller, ForbiddenException, Get, Param, Patch, Query } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { ResolveFlagDto } from "./dto/resolve-flag.dto";
import { FraudService } from "./fraud.service";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
@Controller("fraud-flags")
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("status") status?: string) {
    if (user.role === UserRole.SUPER_ADMIN) return this.fraudService.listAll(status);
    return this.fraudService.listForBrand(requireBrandId(user));
  }

  @Get(":id")
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === UserRole.SUPER_ADMIN) return this.fraudService.getOneForSuperAdmin(id);
    return this.fraudService.getOneForBrand(requireBrandId(user), id);
  }

  @Patch(":id/resolve")
  resolve(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: ResolveFlagDto) {
    const brandId = user.role === UserRole.SUPER_ADMIN ? undefined : requireBrandId(user);
    return this.fraudService.resolve(id, user.sub, dto, brandId);
  }
}

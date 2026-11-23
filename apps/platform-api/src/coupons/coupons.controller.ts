import { Controller, ForbiddenException, Get, Query } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { CouponsService } from "./coupons.service";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get()
  listForBrand(@CurrentUser() user: JwtPayload) {
    if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
    return this.couponsService.listForBrand(user.brandId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get("platform")
  listAll(@Query("brandId") brandId?: string) {
    return this.couponsService.listAll(brandId);
  }
}

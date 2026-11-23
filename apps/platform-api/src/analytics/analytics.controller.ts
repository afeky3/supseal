import { Controller, ForbiddenException, Get, Query } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get("dashboard")
  brandDashboard(@CurrentUser() user: JwtPayload) {
    if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
    return this.analyticsService.dashboardForBrand(user.brandId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get("platform-dashboard")
  platformDashboard(@Query("brandId") brandId?: string) {
    return this.analyticsService.dashboardForPlatform(brandId);
  }
}

import { Body, Controller, ForbiddenException, Get, Param, Put } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { UpsertSubscriptionDto } from "./dto/upsert-subscription.dto";
import { SubscriptionsService } from "./subscriptions.service";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.subscriptionsService.listAll();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put(":brandId")
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param("brandId") brandId: string,
    @Body() dto: UpsertSubscriptionDto,
  ) {
    return this.subscriptionsService.upsert(brandId, user.sub, dto);
  }

  @Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get("me")
  getOwn(@CurrentUser() user: JwtPayload) {
    if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
    return this.subscriptionsService.getOwn(user.brandId);
  }
}

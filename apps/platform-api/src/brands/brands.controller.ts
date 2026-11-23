import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { UpdateBrandProfileDto } from "./dto/update-brand-profile.dto";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  listAll() {
    return this.brandsService.listAll();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto, user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/suspend")
  suspend(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.brandsService.setStatus(id, "SUSPENDED", user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/reinstate")
  reinstate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.brandsService.setStatus(id, "ACTIVE", user.sub);
  }

  // Registered before the ":id" catch-all below so "me" is never swallowed
  // by the param route.
  @Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get("me")
  getOwn(@CurrentUser() user: JwtPayload) {
    return this.brandsService.getOwn(requireBrandId(user));
  }

  @Roles(UserRole.BRAND_ADMIN)
  @Patch("me")
  updateOwn(@CurrentUser() user: JwtPayload, @Body() dto: UpdateBrandProfileDto) {
    return this.brandsService.updateOwn(requireBrandId(user), dto, user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get(":id")
  getOneAsSuperAdmin(@Param("id") id: string) {
    return this.brandsService.getOneAsSuperAdmin(id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto, user.sub);
  }
}

import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { CreateUserDto } from "./dto/create-user.dto";
import { InviteStaffDto } from "./dto/invite-staff.dto";
import { UsersService } from "./users.service";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN) return this.usersService.listAll();
    return this.usersService.listForBrand(requireBrandId(user));
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(dto, user.sub);
  }

  @Roles(UserRole.BRAND_ADMIN)
  @Post("invite")
  inviteStaff(@CurrentUser() user: JwtPayload, @Body() dto: InviteStaffDto) {
    return this.usersService.inviteStaff(requireBrandId(user), dto, user.sub);
  }

  @Patch(":id/suspend")
  suspend(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === UserRole.SUPER_ADMIN) return this.usersService.setActive(id, false, user.sub);
    if (user.role === UserRole.BRAND_ADMIN) {
      return this.usersService.setActiveForBrand(requireBrandId(user), id, false, user.sub);
    }
    throw new ForbiddenException("Only Brand Admin or Super Admin can suspend users");
  }

  @Patch(":id/reactivate")
  reactivate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === UserRole.SUPER_ADMIN) return this.usersService.setActive(id, true, user.sub);
    if (user.role === UserRole.BRAND_ADMIN) {
      return this.usersService.setActiveForBrand(requireBrandId(user), id, true, user.sub);
    }
    throw new ForbiddenException("Only Brand Admin or Super Admin can reactivate users");
  }
}

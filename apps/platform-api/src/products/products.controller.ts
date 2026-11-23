import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { UserRole } from "@supseal/database";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Roles(UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.productsService.list(requireBrandId(user));
  }

  @Get(":id")
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.productsService.getOne(requireBrandId(user), id);
  }

  @Roles(UserRole.BRAND_ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.productsService.create(requireBrandId(user), dto);
  }

  @Roles(UserRole.BRAND_ADMIN)
  @Patch(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(requireBrandId(user), id, dto);
  }
}

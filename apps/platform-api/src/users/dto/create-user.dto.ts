import { IsEmail, IsIn, IsString, MinLength, ValidateIf } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(["SUPER_ADMIN", "BRAND_ADMIN", "BRAND_STAFF"])
  role!: "SUPER_ADMIN" | "BRAND_ADMIN" | "BRAND_STAFF";

  @ValidateIf((o) => o.role !== "SUPER_ADMIN")
  @IsString()
  brandId?: string;
}

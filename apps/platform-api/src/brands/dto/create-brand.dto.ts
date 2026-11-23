import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateBrandDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  industryCategory!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

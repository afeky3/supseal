import { IsEmail, IsOptional, IsString, IsUrl } from "class-validator";

// Brand Admin surface (FR-BRAND-04): logo, description, contact only — not
// name/industryCategory/status, which are platform-controlled.
export class UpdateBrandProfileDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

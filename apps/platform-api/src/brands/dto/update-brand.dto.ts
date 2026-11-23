import { PartialType } from "@nestjs/mapped-types";
import { CreateBrandDto } from "./create-brand.dto";

// Super Admin surface — full edit, including name/industryCategory.
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

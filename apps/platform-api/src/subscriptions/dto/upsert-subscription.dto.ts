import { IsIn, IsISO8601, IsOptional } from "class-validator";

export class UpsertSubscriptionDto {
  @IsIn(["STARTER", "GROWTH", "ENTERPRISE"])
  tier!: "STARTER" | "GROWTH" | "ENTERPRISE";

  @IsOptional()
  @IsIn(["ACTIVE", "PAST_DUE", "CANCELED"])
  billingStatus?: "ACTIVE" | "PAST_DUE" | "CANCELED";

  @IsOptional()
  @IsISO8601()
  renewalDate?: string;
}

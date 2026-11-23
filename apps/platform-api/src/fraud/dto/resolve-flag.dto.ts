import { IsIn } from "class-validator";

export class ResolveFlagDto {
  @IsIn(["RESOLVED", "ESCALATED"])
  resolution!: "RESOLVED" | "ESCALATED";
}

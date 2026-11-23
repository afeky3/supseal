import { IsInt, Min } from "class-validator";

export class ReconcileBatchDto {
  @IsInt()
  @Min(0)
  printedCount!: number;
}

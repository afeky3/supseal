import { IsString, Length } from "class-validator";

export class CreateFraudReportDto {
  @IsString()
  eventId!: string;

  @IsString()
  @Length(1, 300)
  purchaseLocation!: string;
}

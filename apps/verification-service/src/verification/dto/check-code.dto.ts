import { IsOptional, IsString, Length } from "class-validator";

export class CheckCodeDto {
  @IsString()
  @Length(4, 64)
  hiddenCode!: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

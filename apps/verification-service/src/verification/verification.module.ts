import { Module } from "@nestjs/common";
import { RateLimitService } from "./rate-limit.service";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  controllers: [VerificationController],
  providers: [VerificationService, RateLimitService],
})
export class VerificationModule {}

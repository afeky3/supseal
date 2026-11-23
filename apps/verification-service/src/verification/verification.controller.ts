import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Headers,
  HttpException,
} from "@nestjs/common";
import { CheckCodeDto } from "./dto/check-code.dto";
import { CreateFraudReportDto } from "./dto/create-fraud-report.dto";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { VerificationService } from "./verification.service";

@Controller("verify")
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get("context/:qrToken")
  getContext(@Param("qrToken") qrToken: string) {
    return this.verificationService.getContext(qrToken);
  }

  @Post("check")
  @HttpCode(HttpStatus.OK)
  async check(
    @Body() dto: CheckCodeDto,
    @Ip() ip: string,
    @Headers("cf-connecting-ip") cfIp: string | undefined,
  ) {
    // Behind Cloudflare, the socket IP is Cloudflare's edge, not the client —
    // prefer the CF-Connecting-IP header when present (Traefik/Cloudflare set it).
    const clientIp = cfIp ?? ip;

    const result = await this.verificationService.checkCode(dto.hiddenCode, {
      ip: clientIp,
      deviceFingerprint: dto.deviceFingerprint,
    });

    if (result.outcome === "RATE_LIMITED") {
      throw new HttpException(
        { message: "Too many attempts", requiresCaptcha: result.requiresCaptcha },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // FR-VER-08: UNVERIFIED and "well-formed but never issued" must be
    // indistinguishable from each other in shape and status code — both
    // return this same 200 response, never a 404.
    return result;
  }

  // FR-SUP-01 — reachable from the VERIFIED / VERIFIED BEFORE result pages.
  @Post("support")
  @HttpCode(HttpStatus.OK)
  createSupportTicket(@Body() dto: CreateSupportTicketDto) {
    return this.verificationService.createSupportTicket(dto.eventId, dto.subject, dto.message);
  }

  // FR-FRD-04 — reachable from the UNVERIFIED result page.
  @Post("report")
  @HttpCode(HttpStatus.OK)
  createFraudReport(@Body() dto: CreateFraudReportDto) {
    return this.verificationService.createFraudReport(dto.eventId, dto.purchaseLocation);
  }
}

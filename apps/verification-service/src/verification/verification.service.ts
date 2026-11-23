import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hashHiddenCode } from "@supseal/database";
import { PrismaService } from "../prisma/prisma.service";
import { RateLimitService } from "./rate-limit.service";

export type CheckResult =
  | { outcome: "VERIFIED"; eventId: string; product: unknown; brand: unknown; couponCode: string | null }
  | { outcome: "VERIFIED_BEFORE"; eventId: string; firstVerifiedAt: Date; verificationCount: number }
  | { outcome: "UNVERIFIED"; eventId: string }
  | { outcome: "RATE_LIMITED"; requiresCaptcha: boolean };

interface AtomicUpdateRow {
  id: string;
  verification_count: number;
  first_verified_at: Date;
}

const COUPON_DEFAULT_DISCOUNT_PCT = 5;
const COUPON_VALIDITY_DAYS = 30;

@Injectable()
export class VerificationService {
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService,
  ) {
    this.pepper = this.config.getOrThrow<string>("HIDDEN_CODE_PEPPER");
  }

  async getContext(qrToken: string) {
    const code = await this.prisma.stickerCode.findUnique({
      where: { qrToken },
      select: {
        batch: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                usageInstructions: true,
                imageUrl: true,
                supportContact: true,
                brand: {
                  select: { id: true, name: true, logoUrl: true, description: true, contactEmail: true },
                },
              },
            },
          },
        },
      },
    });

    if (!code) {
      throw new NotFoundException("Unknown QR code");
    }

    return {
      product: code.batch.product,
      brand: code.batch.product.brand,
    };
  }

  async checkCode(
    hiddenCode: string,
    meta: { ip: string; deviceFingerprint?: string },
  ): Promise<CheckResult> {
    const sourceKey = `${meta.ip}:${meta.deviceFingerprint ?? "unknown"}`;
    const rate = await this.rateLimit.hit(sourceKey);
    if (!rate.allowed) {
      return { outcome: "RATE_LIMITED", requiresCaptcha: rate.requiresCaptcha };
    }
    // TODO: once the consumer frontend exists, enforce rate.requiresCaptcha by
    // requiring and verifying a Cloudflare Turnstile token here before
    // proceeding — see CheckCodeDto.captchaToken. Not wired yet (no frontend
    // to source a token from in this pass).

    const hash = hashHiddenCode(hiddenCode, this.pepper);

    // Single atomic statement: the UPDATE's row lock serializes concurrent
    // checks of the same code, so exactly one caller ever observes
    // verification_count = 1 (see SUPSEAL_Technical_Plan Section 6 / FR-VER-03).
    const rows = await this.prisma.$queryRaw<AtomicUpdateRow[]>`
      UPDATE sticker_codes
      SET verification_count = verification_count + 1,
          status = 'USED',
          first_verified_at = COALESCE(first_verified_at, now())
      WHERE hidden_code_hash = ${hash} AND status != 'REVOKED'
      RETURNING id, verification_count, first_verified_at
    `;

    if (rows.length === 0) {
      const event = await this.prisma.verificationEvent.create({
        data: {
          codeId: null,
          result: "UNVERIFIED",
          deviceFingerprint: meta.deviceFingerprint,
          ipAddress: meta.ip,
        },
      });
      return { outcome: "UNVERIFIED", eventId: event.id };
    }

    const row = rows[0];
    const isFirstTime = row.verification_count === 1;

    const event = await this.prisma.verificationEvent.create({
      data: {
        codeId: row.id,
        result: isFirstTime ? "VERIFIED" : "VERIFIED_BEFORE",
        deviceFingerprint: meta.deviceFingerprint,
        ipAddress: meta.ip,
      },
    });

    if (!isFirstTime) {
      return {
        outcome: "VERIFIED_BEFORE",
        eventId: event.id,
        firstVerifiedAt: row.first_verified_at,
        verificationCount: row.verification_count,
      };
    }

    const [codeWithContext, coupon] = await Promise.all([
      this.prisma.stickerCode.findUniqueOrThrow({
        where: { id: row.id },
        select: {
          batch: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  usageInstructions: true,
                  imageUrl: true,
                  supportContact: true,
                  brand: {
                    select: { id: true, name: true, logoUrl: true, description: true, contactEmail: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.coupon.create({
        data: {
          verificationEventId: event.id,
          code: `SUPSEAL-${event.id.slice(0, 8).toUpperCase()}`,
          discountPct: COUPON_DEFAULT_DISCOUNT_PCT,
          expiresAt: new Date(Date.now() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const { brand, ...product } = codeWithContext.batch.product;
    return { outcome: "VERIFIED", eventId: event.id, product, brand, couponCode: coupon.code };
  }

  /**
   * FR-SUP-01: the "customer service" action on a VERIFIED/VERIFIED BEFORE
   * result page. Only reachable from an event that resolved to a real code,
   * so the brand can always be resolved from it — a support ticket without
   * a brand to route to isn't representable in the schema (support_tickets
   * requires brandId).
   */
  async createSupportTicket(eventId: string, subject: string, message: string) {
    const event = await this.prisma.verificationEvent.findUnique({
      where: { id: eventId },
      select: {
        codeId: true,
        code: { select: { batch: { select: { product: { select: { brandId: true } } } } } },
      },
    });
    if (!event || !event.codeId || !event.code) {
      throw new NotFoundException("This verification has no associated product to route a ticket to");
    }
    return this.prisma.supportTicket.create({
      data: {
        brandId: event.code.batch.product.brandId,
        codeId: event.codeId,
        subject,
        message,
      },
      select: { id: true },
    });
  }

  /**
   * FR-FRD-04: "voluntarily report a suspected counterfeit purchase
   * location from the UNVERIFIED result page." An UNVERIFIED check for a
   * code that matches nothing has no brand to attach a support ticket to —
   * this is deliberately a platform-wide FraudFlag on the verification
   * event instead, which is exactly what Super Admin's fraud queue is for.
   */
  async createFraudReport(eventId: string, purchaseLocation: string) {
    const event = await this.prisma.verificationEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Verification event not found");
    return this.prisma.fraudFlag.create({
      data: {
        verificationEventId: eventId,
        reason: `Consumer-reported counterfeit. Purchase location: ${purchaseLocation.slice(0, 300)}`,
        severity: "MEDIUM",
        status: "OPEN",
      },
      select: { id: true },
    });
  }
}

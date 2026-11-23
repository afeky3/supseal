import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@supseal/database";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { JwtPayload } from "./jwt-payload";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_DAYS = 7;
const ACCESS_TOKEN_TTL = "15m";

function hashRefreshToken(token: string): string {
  // Refresh tokens are 48 bytes of CSPRNG output (384 bits of entropy), so an
  // unsalted SHA-256 lookup hash is safe here — unlike passwords, there is no
  // low-entropy input for an attacker to dictionary-attack against.
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private signAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>("JWT_SECRET"),
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private async issueRefreshToken(tx: Prisma.TransactionClient, userId: string): Promise<string> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await tx.refreshToken.create({
      data: { userId, tokenHash: hashRefreshToken(token), expiresAt },
    });
    return token;
  }

  async login(email: string, password: string) {
    // Login is inherently a pre-RLS-context lookup: we don't know which
    // brand (or whether Super Admin) this email belongs to until after we
    // find it, so there is no brandId to scope by yet. withSuperAdminContext
    // is the mechanism for exactly this — see PrismaService's comment.
    // (Not scoped to the `users` table's own RLS policy, so the "no session
    // vars set" fail-closed default that protects every other query here
    // does not silently make login return nothing.)
    return this.prisma.withSuperAdminContext(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (!user || !user.active) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // NOTE: MFA (TOTP) verification for Super Admin / batch-approving
      // Brand Admin accounts (FR-AUTH-02) is not implemented in this first
      // pass — tracked as a follow-up before any production credential is issued.

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        brandId: user.brandId,
      };

      const accessToken = this.signAccessToken(payload);
      const refreshToken = await this.issueRefreshToken(tx, user.id);

      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await tx.auditLog.create({
        data: { userId: user.id, action: "auth.login", entity: "user", entityId: user.id },
      });

      return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role, brandId: user.brandId },
      };
    });
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    return this.prisma.withSuperAdminContext(async (tx) => {
      const stored = await tx.refreshToken.findFirst({
        where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
        include: { user: true },
      });
      if (!stored || !stored.user.active) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      // Rotate: revoke the used token and issue a new one, so a leaked
      // refresh token can only be replayed once before rotation invalidates it.
      await tx.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      const newRefreshToken = await this.issueRefreshToken(tx, stored.user.id);

      const payload: JwtPayload = {
        sub: stored.user.id,
        email: stored.user.email,
        role: stored.user.role,
        brandId: stored.user.brandId,
      };

      return {
        accessToken: this.signAccessToken(payload),
        refreshToken: newRefreshToken,
        user: {
          id: stored.user.id,
          email: stored.user.email,
          role: stored.user.role,
          brandId: stored.user.brandId,
        },
      };
    });
  }

  async logout(refreshToken: string) {
    // refresh_tokens carries no brand RLS policy (see the RLS migration's
    // notes) — it's always looked up by its own token hash, never by brand.
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
    return { success: true };
  }
}

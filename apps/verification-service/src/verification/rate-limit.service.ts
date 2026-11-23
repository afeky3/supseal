import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";

export interface RateLimitResult {
  count: number;
  allowed: boolean;
  requiresCaptcha: boolean;
}

/**
 * Fixed-window counter keyed by source (IP + device fingerprint). A sliding
 * window log would be more precise at the window boundary, but a fixed
 * window is the standard, well-understood tradeoff for this kind of
 * abuse-rate limiting and is one INCR + one conditional EXPIRE per request —
 * cheap enough to stay well inside the <800ms p95 budget.
 */
@Injectable()
export class RateLimitService {
  private readonly windowSeconds: number;
  private readonly maxAttempts: number;
  private readonly captchaThreshold: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.windowSeconds = Number(config.get("RATE_LIMIT_WINDOW_SECONDS") ?? 300);
    this.maxAttempts = Number(config.get("RATE_LIMIT_MAX_ATTEMPTS") ?? 20);
    this.captchaThreshold = Number(config.get("RATE_LIMIT_CAPTCHA_THRESHOLD") ?? 5);
  }

  async hit(sourceKey: string): Promise<RateLimitResult> {
    const key = `ratelimit:verify:${sourceKey}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }
    return {
      count,
      allowed: count <= this.maxAttempts,
      requiresCaptcha: count > this.captchaThreshold,
    };
  }
}

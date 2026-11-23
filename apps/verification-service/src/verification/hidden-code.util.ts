import { createHmac } from "crypto";

/**
 * Hidden verification codes are hashed with HMAC-SHA256 + a server-side
 * pepper, NOT Argon2id/bcrypt. This is deliberate and differs from password
 * storage: Argon2id's memory-hard slowness defends against offline brute
 * force of LOW-entropy secrets (human passwords), but it also makes the hash
 * non-deterministic per input, which breaks indexed lookup — you'd have to
 * argon2.verify() against every row in the table to find a match, which
 * cannot scale to FR-STK-07's 1,000,000+ codes per batch.
 *
 * Hidden codes are HIGH-entropy, server-generated random tokens (not
 * something a human chose), so a fast deterministic hash is both safe
 * against offline brute force (the search space is the bottleneck, not hash
 * speed) and gives O(1) indexed lookup via a unique constraint on the hash
 * column. Online guessing is separately defended by rate limiting + CAPTCHA
 * (see rate-limit.service.ts), per FR-STK-02/03 and NFR-Security.
 */
export function hashHiddenCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code.trim().toUpperCase()).digest("hex");
}

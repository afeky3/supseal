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
 * column. Online guessing is separately defended by rate limiting + CAPTCHA,
 * per FR-STK-02/03 and NFR-Security.
 *
 * Shared between platform-api (generates + hashes codes at batch creation)
 * and verification-service (hashes the submitted code to look it up) — both
 * MUST use this exact function with the same HIDDEN_CODE_PEPPER, or
 * generated codes would never match on verification.
 */
export function hashHiddenCode(code: string, pepper: string): string {
  // Strip everything but letters/digits before hashing: the printed code is
  // grouped as "ABCD-EFGH-2345" for readability, but a consumer might type
  // it with or without the dashes/spaces — both must hash identically, or
  // a perfectly correct code gets rejected as UNVERIFIED.
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return createHmac("sha256", pepper).update(normalized).digest("hex");
}

const QR_TOKEN_BYTES = 16; // 128 bits
const HIDDEN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids ambiguity when typed by hand
const HIDDEN_CODE_LENGTH = 12; // ~60 bits of entropy from a 33-symbol alphabet

function randomFrom(alphabet: string, length: number, randomBytesFn: (n: number) => Buffer): string {
  const bytes = randomBytesFn(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Generates one sticker's QR token (plaintext, embedded in the QR image)
 * and hidden code (plaintext, shown only under the scratch panel — the
 * caller must hash it with hashHiddenCode() before persisting and must not
 * retain the plaintext beyond the batch's print-file export). Both use
 * crypto.randomBytes, never a sequence, per FR-STK-02.
 */
export function generateStickerCodes(randomBytesFn: (n: number) => Buffer): {
  qrToken: string;
  hiddenCode: string;
} {
  const qrToken = randomBytesFn(QR_TOKEN_BYTES).toString("base64url");
  const rawHidden = randomFrom(HIDDEN_CODE_ALPHABET, HIDDEN_CODE_LENGTH, randomBytesFn);
  // Group into 4-4-4 for human readability on the printed sticker.
  const hiddenCode = `${rawHidden.slice(0, 4)}-${rawHidden.slice(4, 8)}-${rawHidden.slice(8, 12)}`;
  return { qrToken, hiddenCode };
}

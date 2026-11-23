const STORAGE_KEY = "supseal_device_id";

/**
 * A stable-per-browser, random identifier — not a real fingerprinting
 * library. It only needs to be consistent enough for the rate limiter
 * (see verification-service/rate-limit.service.ts) to recognize repeated
 * attempts from the same device; it carries no other identifying signal.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

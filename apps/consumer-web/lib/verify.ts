import type { CheckCodeResult, VerifyContext } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function getContext(qrToken: string) {
  return apiFetch<VerifyContext>(`/verify/context/${encodeURIComponent(qrToken)}`);
}

export function checkCode(hiddenCode: string, deviceFingerprint: string) {
  return apiFetch<CheckCodeResult>("/verify/check", {
    method: "POST",
    body: JSON.stringify({ hiddenCode, deviceFingerprint }),
  });
}

export function createSupportTicket(eventId: string, subject: string, message: string) {
  return apiFetch<{ id: string }>("/verify/support", {
    method: "POST",
    body: JSON.stringify({ eventId, subject, message }),
  });
}

export function createFraudReport(eventId: string, purchaseLocation: string) {
  return apiFetch<{ id: string }>("/verify/report", {
    method: "POST",
    body: JSON.stringify({ eventId, purchaseLocation }),
  });
}

import type { FraudFlag } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function listFraudFlags() {
  return apiFetch<FraudFlag[]>("/api/fraud-flags");
}

export function getFraudFlag(id: string) {
  return apiFetch<FraudFlag>(`/api/fraud-flags/${id}`);
}

export function resolveFraudFlag(id: string, resolution: "RESOLVED" | "ESCALATED") {
  return apiFetch<FraudFlag>(`/api/fraud-flags/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolution }),
  });
}

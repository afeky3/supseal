import type { BrandSubscriptionRow, Subscription } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface UpsertSubscriptionInput {
  tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  billingStatus?: "ACTIVE" | "PAST_DUE" | "CANCELED";
  renewalDate?: string;
}

export function listSubscriptions() {
  return apiFetch<BrandSubscriptionRow[]>("/api/subscriptions");
}

export function upsertSubscription(brandId: string, input: UpsertSubscriptionInput) {
  return apiFetch<Subscription>(`/api/subscriptions/${brandId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

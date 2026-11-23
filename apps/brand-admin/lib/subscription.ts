import type { Subscription } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function getOwnSubscription() {
  return apiFetch<Subscription | null>("/api/subscriptions/me");
}

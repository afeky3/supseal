import type { Brand } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface BrandProfileInput {
  logoUrl?: string;
  description?: string;
  contactEmail?: string;
}

export function getOwnBrand() {
  return apiFetch<Brand>("/api/brands/me");
}

export function updateOwnBrand(input: BrandProfileInput) {
  return apiFetch<Brand>("/api/brands/me", { method: "PATCH", body: JSON.stringify(input) });
}

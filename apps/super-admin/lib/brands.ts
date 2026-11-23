import type { Brand, BrandDetail } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface CreateBrandInput {
  name: string;
  industryCategory: string;
  description?: string;
  contactEmail?: string;
}

export type UpdateBrandInput = Partial<CreateBrandInput>;

export function listBrands() {
  return apiFetch<Brand[]>("/api/brands");
}

export function getBrand(id: string) {
  return apiFetch<BrandDetail>(`/api/brands/${id}`);
}

export function createBrand(input: CreateBrandInput) {
  return apiFetch<Brand>("/api/brands", { method: "POST", body: JSON.stringify(input) });
}

export function updateBrand(id: string, input: UpdateBrandInput) {
  return apiFetch<Brand>(`/api/brands/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function suspendBrand(id: string) {
  return apiFetch<Brand>(`/api/brands/${id}/suspend`, { method: "PATCH" });
}

export function reinstateBrand(id: string) {
  return apiFetch<Brand>(`/api/brands/${id}/reinstate`, { method: "PATCH" });
}

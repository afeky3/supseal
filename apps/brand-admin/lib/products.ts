import type { Product } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  description?: string;
  usageInstructions?: string;
  imageUrl?: string;
  supportContact?: string;
}

export function listProducts() {
  return apiFetch<Product[]>("/api/products");
}

export function createProduct(input: ProductInput) {
  return apiFetch<Product>("/api/products", { method: "POST", body: JSON.stringify(input) });
}

export function updateProduct(id: string, input: Partial<ProductInput>) {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

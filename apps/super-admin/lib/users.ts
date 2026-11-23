import type { PlatformUser, UserRole } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  brandId?: string;
}

export function listUsers() {
  return apiFetch<PlatformUser[]>("/api/users");
}

export function createUser(input: CreateUserInput) {
  return apiFetch<PlatformUser>("/api/users", { method: "POST", body: JSON.stringify(input) });
}

export function suspendUser(id: string) {
  return apiFetch<PlatformUser>(`/api/users/${id}/suspend`, { method: "PATCH" });
}

export function reactivateUser(id: string) {
  return apiFetch<PlatformUser>(`/api/users/${id}/reactivate`, { method: "PATCH" });
}

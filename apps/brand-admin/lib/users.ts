import type { PlatformUser } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function listUsers() {
  return apiFetch<PlatformUser[]>("/api/users");
}

export function inviteStaff(email: string, password: string) {
  return apiFetch<PlatformUser>("/api/users/invite", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function suspendUser(id: string) {
  return apiFetch<PlatformUser>(`/api/users/${id}/suspend`, { method: "PATCH" });
}

export function reactivateUser(id: string) {
  return apiFetch<PlatformUser>(`/api/users/${id}/reactivate`, { method: "PATCH" });
}

import type { AuditLogEntry } from "@supseal/shared-types";
import { apiFetch } from "./api";

export interface AuditLogFilters {
  action?: string;
  entity?: string;
}

export function searchAuditLog(filters: AuditLogFilters) {
  const params = new URLSearchParams();
  if (filters.action) params.set("action", filters.action);
  if (filters.entity) params.set("entity", filters.entity);
  const qs = params.toString();
  return apiFetch<AuditLogEntry[]>(`/api/audit-log${qs ? `?${qs}` : ""}`);
}

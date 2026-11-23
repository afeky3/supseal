import type { DashboardData } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function getPlatformDashboard(brandId?: string) {
  const qs = brandId ? `?brandId=${brandId}` : "";
  return apiFetch<DashboardData>(`/api/analytics/platform-dashboard${qs}`);
}

import type { DashboardData } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function getDashboard() {
  return apiFetch<DashboardData>("/api/analytics/dashboard");
}

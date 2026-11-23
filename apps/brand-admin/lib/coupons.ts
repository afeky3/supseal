import type { CouponList } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function listCoupons() {
  return apiFetch<CouponList>("/api/coupons");
}

import type { BatchStatus } from "@supseal/shared-types";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<BatchStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  PROCESSING: "Generating…",
  CODES_GENERATED: "Ready",
  SENT_TO_PRINT: "Sent to print",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RECONCILED: "Reconciled",
  REVOKED: "Revoked",
  FAILED: "Failed",
};

const VARIANTS: Record<BatchStatus, "default" | "secondary" | "destructive" | "outline"> = {
  REQUESTED: "secondary",
  APPROVED: "secondary",
  PROCESSING: "secondary",
  CODES_GENERATED: "default",
  SENT_TO_PRINT: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  RECONCILED: "outline",
  REVOKED: "destructive",
  FAILED: "destructive",
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}

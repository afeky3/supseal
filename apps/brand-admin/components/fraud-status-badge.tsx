import type { FraudStatus } from "@supseal/shared-types";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<FraudStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  RESOLVED: "default",
  ESCALATED: "outline",
};

export function FraudStatusBadge({ status }: { status: FraudStatus }) {
  return <Badge variant={VARIANTS[status]}>{status}</Badge>;
}

import type { SupportTicketStatus } from "@supseal/shared-types";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<SupportTicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  IN_PROGRESS: "secondary",
  RESOLVED: "default",
  CLOSED: "outline",
};

export function TicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  return <Badge variant={VARIANTS[status]}>{status.replace("_", " ")}</Badge>;
}

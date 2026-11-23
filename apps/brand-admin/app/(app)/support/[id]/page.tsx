"use client";

import type { SupportTicketStatus } from "@supseal/shared-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/contexts/auth-context";
import { getTicket, updateTicketStatus } from "@/lib/support-tickets";
import { toast } from "sonner";

const STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-tickets", params.id],
    queryFn: () => getTicket(params.id),
  });

  async function handleStatusChange(status: string | null) {
    if (!status) return;
    try {
      await updateTicketStatus(params.id, status as SupportTicketStatus);
      toast.success("Status updated");
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["support-tickets", params.id] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (isLoading || !ticket) {
    return (
      <div className="max-w-lg space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/support"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Support Tickets
        </Link>
        <h1 className="text-lg font-semibold">{ticket.subject}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Opened {new Date(ticket.createdAt).toLocaleString()}
          </CardTitle>
          <TicketStatusBadge status={ticket.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{ticket.message ?? "No message provided."}</p>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Status</div>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

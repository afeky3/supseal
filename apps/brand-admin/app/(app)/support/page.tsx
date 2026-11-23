"use client";

import { useQuery } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { useRouter } from "next/navigation";
import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTickets } from "@/lib/support-tickets";

export default function SupportPage() {
  const router = useRouter();
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: listTickets,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Raised by consumers from a verification result page.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !tickets || tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <LifeBuoy className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No tickets yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tickets will appear here once the consumer verification site is live and someone
              taps &quot;contact support&quot; from a result page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/support/${ticket.id}`)}
                >
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

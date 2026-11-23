import type { SupportTicket, SupportTicketStatus } from "@supseal/shared-types";
import { apiFetch } from "./api";

export function listTickets() {
  return apiFetch<SupportTicket[]>("/api/support-tickets");
}

export function getTicket(id: string) {
  return apiFetch<SupportTicket>(`/api/support-tickets/${id}`);
}

export function updateTicketStatus(id: string, status: SupportTicketStatus) {
  return apiFetch<SupportTicket>(`/api/support-tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

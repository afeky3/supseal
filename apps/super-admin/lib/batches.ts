import type { BatchStatus, StickerBatch } from "@supseal/shared-types";
import { apiFetch, downloadFile } from "./api";

export function listBatches(filters?: { status?: BatchStatus; printRequested?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.printRequested !== undefined) params.set("printRequested", String(filters.printRequested));
  const qs = params.toString();
  return apiFetch<StickerBatch[]>(`/api/batches${qs ? `?${qs}` : ""}`);
}

// The print-fulfillment queue: batches a brand asked SUPSEAL to print, whose
// codes are ready and haven't been sent to print yet.
export function listPrintQueue() {
  return listBatches({ status: "CODES_GENERATED", printRequested: true });
}

export function getBatch(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}`);
}

export function downloadBatchPdf(id: string) {
  return downloadFile(`/api/batches/${id}/pdf`, `supseal-batch-${id}.pdf`);
}

export function sendToPrint(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}/send-to-print`, { method: "PATCH" });
}

export function shipBatch(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}/ship`, { method: "PATCH" });
}

export function deliverBatch(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}/deliver`, { method: "PATCH" });
}

export function reconcileBatch(id: string, printedCount: number) {
  return apiFetch<StickerBatch>(`/api/batches/${id}/reconcile`, {
    method: "PATCH",
    body: JSON.stringify({ printedCount }),
  });
}

export function revokeBatch(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}/revoke`, { method: "PATCH" });
}

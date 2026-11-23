import type { StickerBatch } from "@supseal/shared-types";
import { apiFetch, downloadFile } from "./api";

export interface CreateBatchInput {
  productId: string;
  quantity: number;
  printRequested: boolean;
}

export function listBatches() {
  return apiFetch<StickerBatch[]>("/api/batches");
}

export function getBatch(id: string) {
  return apiFetch<StickerBatch>(`/api/batches/${id}`);
}

export function createBatch(input: CreateBatchInput) {
  return apiFetch<StickerBatch>("/api/batches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function downloadBatchPdf(id: string) {
  return downloadFile(`/api/batches/${id}/pdf`, `supseal-batch-${id}.pdf`);
}

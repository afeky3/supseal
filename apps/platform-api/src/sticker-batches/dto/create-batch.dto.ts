import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

// Generation now runs as a background job (BatchQueueService +
// BatchGenerationProcessor), so this is no longer bounded by what a single
// HTTP request can do synchronously. FR-STK-07's 1,000,000+ target still
// isn't fully proven at this cap — reaching it needs parallel workers and a
// faster QR-rendering path — but 100k is a real, order-of-magnitude increase
// over the old 10k synchronous limit, not just a number bump.
const MAX_BATCH_QUANTITY = 100_000;

export class CreateBatchDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_BATCH_QUANTITY)
  quantity!: number;

  // true = ask SUPSEAL to print & ship the physical stickers (shows up in
  // the Super Admin print-request queue); false/omitted = self-print — the
  // brand downloads the PDF once ready and handles printing themselves.
  @IsOptional()
  @IsBoolean()
  printRequested?: boolean;
}

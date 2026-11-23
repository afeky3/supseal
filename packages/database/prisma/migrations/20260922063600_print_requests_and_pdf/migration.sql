-- AlterTable
ALTER TABLE "sticker_batches" ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "pdf_path" TEXT,
ADD COLUMN     "print_requested" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'PROCESSING';

-- CreateIndex
CREATE INDEX "sticker_batches_status_print_requested_idx" ON "sticker_batches"("status", "print_requested");

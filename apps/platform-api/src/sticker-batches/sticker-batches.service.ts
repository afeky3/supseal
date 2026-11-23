import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateStickerCodes, hashHiddenCode, Prisma } from "@supseal/database";
import { randomBytes } from "crypto";
import { mkdir } from "fs/promises";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { BatchPdfBuilder } from "./batch-pdf.util";
import { BatchQueueService } from "./batch-queue.service";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ReconcileBatchDto } from "./dto/reconcile-batch.dto";

const GENERATION_CHUNK_SIZE = 1_000;
const DEFAULT_VERIFY_BASE_URL = "https://supseal.msaratech.com/v";
const DEFAULT_EXPORTS_DIR = "/data/exports";

export interface GeneratedCode {
  qrToken: string;
  hiddenCode: string;
}

@Injectable()
export class StickerBatchesService {
  private readonly logger = new Logger(StickerBatchesService.name);
  private readonly pepper: string;
  private readonly verifyBaseUrl: string;
  private readonly exportsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly queue: BatchQueueService,
  ) {
    this.pepper = this.config.getOrThrow<string>("HIDDEN_CODE_PEPPER");
    this.verifyBaseUrl = this.config.get<string>("PUBLIC_VERIFY_BASE_URL") ?? DEFAULT_VERIFY_BASE_URL;
    this.exportsDir = this.config.get<string>("EXPORTS_DIR") ?? DEFAULT_EXPORTS_DIR;
  }

  // ── Brand Admin/Staff surface ──────────────────────────────────────────

  list(brandId: string) {
    return this.prisma.withBrandContext(brandId, (tx) =>
      tx.stickerBatch.findMany({
        where: { product: { brandId } },
        include: { product: { select: { id: true, name: true, sku: true } } },
        orderBy: { requestedAt: "desc" },
      }),
    );
  }

  async getOne(brandId: string, id: string) {
    return this.prisma.withBrandContext(brandId, async (tx) => {
      const batch = await tx.stickerBatch.findUnique({
        where: { id },
        include: { product: { select: { id: true, name: true, sku: true, brandId: true } } },
      });
      if (!batch || batch.product.brandId !== brandId) {
        throw new NotFoundException("Batch not found");
      }
      return batch;
    });
  }

  /**
   * Brand-initiated, no approval gate: the batch is created and its codes +
   * print-ready PDF start generating immediately in the background. This
   * replaced an earlier request→approve→generate flow — Super Admin
   * involvement now only happens if the brand asks SUPSEAL to physically
   * print & ship (dto.printRequested), which is a fulfillment queue, not a
   * gate in front of every batch.
   */
  async create(brandId: string, requestedById: string, dto: CreateBatchDto) {
    const batch = await this.prisma.withBrandContext(brandId, async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product || product.brandId !== brandId) {
        throw new NotFoundException("Product not found");
      }
      const created = await tx.stickerBatch.create({
        data: {
          productId: product.id,
          quantity: dto.quantity,
          requestedById,
          printRequested: dto.printRequested ?? false,
          status: "PROCESSING",
        },
      });
      await tx.auditLog.create({
        data: {
          userId: requestedById,
          action: "batch.create",
          entity: "sticker_batch",
          entityId: created.id,
          metadata: { quantity: dto.quantity, printRequested: dto.printRequested ?? false },
        },
      });
      return created;
    });

    await this.queue.enqueueGeneration(batch.id);
    return batch;
  }

  /** Streams the print-ready PDF — brand must own the batch (via RLS). */
  async getPdfPathForBrand(brandId: string, id: string): Promise<string> {
    const batch = await this.getOne(brandId, id);
    if (!batch.pdfPath) throw new NotFoundException("PDF not ready yet");
    return batch.pdfPath;
  }

  // ── Super Admin surface ─────────────────────────────────────────────────

  listAll(filters: { status?: string; printRequested?: boolean }) {
    return this.prisma.withSuperAdminContext((tx) =>
      tx.stickerBatch.findMany({
        where: {
          status: filters.status ? (filters.status as never) : undefined,
          printRequested: filters.printRequested,
        },
        include: {
          product: { select: { id: true, name: true, sku: true, brand: { select: { id: true, name: true } } } },
        },
        orderBy: { requestedAt: "desc" },
      }),
    );
  }

  async getOneAsSuperAdmin(id: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const batch = await tx.stickerBatch.findUnique({
        where: { id },
        include: {
          product: { select: { id: true, name: true, sku: true, brand: { select: { id: true, name: true } } } },
          _count: { select: { codes: true } },
        },
      });
      if (!batch) throw new NotFoundException("Batch not found");
      return batch;
    });
  }

  async getPdfPathForSuperAdmin(id: string): Promise<string> {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const batch = await tx.stickerBatch.findUnique({ where: { id } });
      if (!batch) throw new NotFoundException("Batch not found");
      if (!batch.pdfPath) throw new NotFoundException("PDF not ready yet");
      return batch.pdfPath;
    });
  }

  async advance(id: string, to: "SENT_TO_PRINT" | "SHIPPED" | "DELIVERED") {
    const from: Record<typeof to, string> = {
      SENT_TO_PRINT: "CODES_GENERATED",
      SHIPPED: "SENT_TO_PRINT",
      DELIVERED: "SHIPPED",
    };
    return this.prisma.withSuperAdminContext(async (tx) => {
      const batch = await this.requireStatus(tx, id, from[to]);
      if (to === "SENT_TO_PRINT" && !batch.printRequested) {
        throw new BadRequestException("This brand is self-printing — there is nothing for SUPSEAL to fulfill");
      }
      const timestampField =
        to === "SENT_TO_PRINT" ? "sentToPrintAt" : to === "SHIPPED" ? "shippedAt" : "deliveredAt";
      return tx.stickerBatch.update({
        where: { id: batch.id },
        data: { status: to, [timestampField]: new Date() },
      });
    });
  }

  async reconcile(id: string, dto: ReconcileBatchDto) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const batch = await this.requireStatus(tx, id, "DELIVERED");
      if (dto.printedCount !== batch.quantity) {
        throw new BadRequestException(
          `Printed count (${dto.printedCount}) does not match codes generated (${batch.quantity}) — investigate before reconciling.`,
        );
      }
      return tx.stickerBatch.update({
        where: { id: batch.id },
        data: { status: "RECONCILED", reconciledAt: new Date() },
      });
    });
  }

  async revoke(id: string, actorId: string) {
    return this.prisma.withSuperAdminContext(async (tx) => {
      const batch = await tx.stickerBatch.findUnique({ where: { id } });
      if (!batch) throw new NotFoundException("Batch not found");
      if (["REVOKED", "PROCESSING", "FAILED"].includes(batch.status)) {
        throw new BadRequestException(`Cannot revoke a batch in ${batch.status} status`);
      }
      await tx.stickerCode.updateMany({
        where: { batchId: id, status: { not: "REVOKED" } },
        data: { status: "REVOKED" },
      });
      const updated = await tx.stickerBatch.update({ where: { id }, data: { status: "REVOKED" } });
      await tx.auditLog.create({
        data: { userId: actorId, action: "batch.revoke", entity: "sticker_batch", entityId: id },
      });
      return updated;
    });
  }

  // ── Background worker entry point ──────────────────────────────────────

  /**
   * Called by BatchGenerationProcessor, never directly by an HTTP request.
   * Generates codes and the print-ready PDF in chunks so memory stays
   * bounded regardless of batch size, hashes each code before it ever
   * touches the database, and writes the plaintext only into the PDF file —
   * the one artifact where it's meant to exist.
   */
  async processGeneration(batchId: string): Promise<void> {
    // No RLS context here deliberately: this runs off the request path, with
    // no authenticated brand/admin session to scope to. It operates on
    // exactly one batch by id, already created by an authorized request.
    const batch = await this.prisma.withSuperAdminContext((tx) =>
      tx.stickerBatch.findUniqueOrThrow({
        where: { id: batchId },
        include: { product: { include: { brand: true } } },
      }),
    );

    if (batch.status !== "PROCESSING") {
      this.logger.warn(`Batch ${batchId} is ${batch.status}, not PROCESSING — skipping (already handled)`);
      return;
    }

    await mkdir(this.exportsDir, { recursive: true });
    const pdfPath = join(this.exportsDir, `${batchId}.pdf`);
    const pdf = new BatchPdfBuilder(pdfPath, {
      brandName: batch.product.brand.name,
      productName: batch.product.name,
      sku: batch.product.sku,
      batchId: batch.id,
    });

    let remaining = batch.quantity;
    while (remaining > 0) {
      const chunkSize = Math.min(GENERATION_CHUNK_SIZE, remaining);
      const chunk = this.generateUniqueCodes(chunkSize);

      const rows = chunk.map((c) => ({
        batchId: batch.id,
        qrToken: c.qrToken,
        hiddenCodeHash: hashHiddenCode(c.hiddenCode, this.pepper),
      }));

      try {
        await this.prisma.withSuperAdminContext((tx) => tx.stickerCode.createMany({ data: rows }));
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Astronomically unlikely — a collision against rows from a prior
          // batch. Surface as a thrown error so BullMQ retries the whole job.
          throw new ConflictException("Code generation hit a duplicate token — retrying");
        }
        throw err;
      }

      for (const code of chunk) {
        const verifyUrl = `${this.verifyBaseUrl}/${code.qrToken}`;
        await pdf.addCode(code.qrToken, code.hiddenCode, verifyUrl);
      }

      remaining -= chunkSize;
    }

    await pdf.finish();

    await this.prisma.withSuperAdminContext(async (tx) => {
      await tx.stickerBatch.update({
        where: { id: batch.id },
        data: { status: "CODES_GENERATED", codesGeneratedAt: new Date(), pdfPath },
      });
      await tx.auditLog.create({
        data: {
          userId: batch.requestedById,
          action: "batch.generate_codes",
          entity: "sticker_batch",
          entityId: batch.id,
          metadata: { quantity: batch.quantity },
        },
      });
    });
  }

  async markFailed(batchId: string, reason: string): Promise<void> {
    await this.prisma.withSuperAdminContext((tx) =>
      tx.stickerBatch.update({
        where: { id: batchId },
        data: { status: "FAILED", failureReason: reason.slice(0, 500) },
      }),
    );
  }

  // ── helpers ─────────────────────────────────────────────────────────────

  private async requireStatus(tx: Prisma.TransactionClient, id: string, expected: string) {
    const batch = await tx.stickerBatch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException("Batch not found");
    if (batch.status !== expected) {
      throw new BadRequestException(
        `Batch is ${batch.status}, expected ${expected} for this action`,
      );
    }
    return batch;
  }

  private generateUniqueCodes(quantity: number): GeneratedCode[] {
    const seenQr = new Set<string>();
    const seenHidden = new Set<string>();
    const out: GeneratedCode[] = [];
    while (out.length < quantity) {
      const { qrToken, hiddenCode } = generateStickerCodes(randomBytes);
      if (seenQr.has(qrToken) || seenHidden.has(hiddenCode)) continue; // re-roll an in-chunk collision
      seenQr.add(qrToken);
      seenHidden.add(hiddenCode);
      out.push({ qrToken, hiddenCode });
    }
    return out;
  }
}

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { BATCH_GENERATION_QUEUE, BatchGenerationJobData } from "./batch-queue.service";
import { StickerBatchesService } from "./sticker-batches.service";

/**
 * Consumer side. Runs in-process alongside the HTTP server rather than as a
 * separate worker deployment — a deliberate simplification for this phase
 * (one Node process, one small VPS); see SUPSEAL_Technical_Plan Section 5
 * for the eventual split. concurrency: 1 because code generation is
 * CPU-bound (QR rendering) and this box has limited cores — running batches
 * one at a time keeps the API responsive rather than starving it.
 */
@Injectable()
export class BatchGenerationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BatchGenerationProcessor.name);
  private worker!: Worker<BatchGenerationJobData>;
  private connection!: IORedis;

  constructor(
    private readonly config: ConfigService,
    private readonly batchesService: StickerBatchesService,
  ) {}

  onModuleInit() {
    this.connection = new IORedis(this.config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.worker = new Worker<BatchGenerationJobData>(
      BATCH_GENERATION_QUEUE,
      async (job: Job<BatchGenerationJobData>) => {
        await this.batchesService.processGeneration(job.data.batchId);
      },
      { connection: this.connection, concurrency: 1 },
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Batch generation job ${job?.id} attempt failed: ${err.message}`);
      const exhausted = !job || job.attemptsMade >= (job.opts.attempts ?? 1);
      if (exhausted && job) {
        this.batchesService
          .markFailed(job.data.batchId, err.message)
          .catch((e) => this.logger.error(`Failed to mark batch ${job.data.batchId} as failed: ${e}`));
      }
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.connection?.disconnect();
  }
}

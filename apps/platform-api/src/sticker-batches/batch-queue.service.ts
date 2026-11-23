import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const BATCH_GENERATION_QUEUE = "batch-generation";

export interface BatchGenerationJobData {
  batchId: string;
}

/**
 * Producer side only. BullMQ wants its own dedicated Redis connections
 * (blocking commands on the worker side), so this doesn't share a client
 * with anything else in the app — see BatchGenerationProcessor for the
 * consumer side.
 */
@Injectable()
export class BatchQueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  readonly queue: Queue<BatchGenerationJobData>;

  constructor(config: ConfigService) {
    this.connection = new IORedis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<BatchGenerationJobData>(BATCH_GENERATION_QUEUE, {
      connection: this.connection,
    });
  }

  enqueueGeneration(batchId: string) {
    return this.queue.add(
      "generate",
      { batchId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86_400 },
      },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
    this.connection.disconnect();
  }
}

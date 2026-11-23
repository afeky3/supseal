import { Module } from "@nestjs/common";
import { BatchGenerationProcessor } from "./batch-generation.processor";
import { BatchQueueService } from "./batch-queue.service";
import { StickerBatchesController } from "./sticker-batches.controller";
import { StickerBatchesService } from "./sticker-batches.service";

@Module({
  controllers: [StickerBatchesController],
  providers: [StickerBatchesService, BatchQueueService, BatchGenerationProcessor],
})
export class StickerBatchesModule {}

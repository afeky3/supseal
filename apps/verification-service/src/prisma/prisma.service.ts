import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@supseal/database";

/**
 * Connects as the supseal_verify Postgres role (BYPASSRLS — see
 * infra/postgres-init/01-roles.sh), because the verification lookup is
 * intentionally cross-brand and unauthenticated: it has no brand_id to scope
 * by until after it finds the code. No withBrandContext() wrapper here —
 * that pattern belongs to platform-api only.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

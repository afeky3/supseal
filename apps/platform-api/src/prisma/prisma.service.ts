import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@supseal/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Row-Level Security (SUPSEAL_Technical_Plan Section 8) checks two Postgres
 * session variables — app.current_brand_id and app.is_super_admin — on every
 * tenant-scoped table's policy (see prisma/sql/001_rls.sql). Both are
 * per-connection, and Prisma's pool can hand different queries different
 * connections, so setting them and running the dependent queries must happen
 * inside the same $transaction — never as two separate top-level calls.
 * withBrandContext()/withSuperAdminContext() are the only supported entry
 * points for tenant-scoped queries; nothing else should call tx.$executeRaw
 * with these session variables directly.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withBrandContext<T>(
    brandId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { timeout?: number },
  ): Promise<T> {
    if (!UUID_RE.test(brandId)) {
      throw new Error("Invalid brandId passed to withBrandContext()");
    }
    return this.$transaction(
      async (tx) => {
        // SET does not support bind parameters over the Postgres wire protocol;
        // the UUID format check above is what makes this interpolation safe.
        await tx.$executeRawUnsafe(`SET LOCAL app.current_brand_id = '${brandId}'`);
        await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'false'`);
        return fn(tx);
      },
      options?.timeout ? { timeout: options.timeout } : undefined,
    );
  }

  /** Super Admin path only — every tenant-scoped RLS policy explicitly allows app.is_super_admin = 'true'. */
  async withSuperAdminContext<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { timeout?: number },
  ): Promise<T> {
    return this.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'true'`);
        return fn(tx);
      },
      options?.timeout ? { timeout: options.timeout } : undefined,
    );
  }
}

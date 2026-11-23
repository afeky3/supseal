import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";
export * from "./hidden-code";

let prisma: PrismaClient | undefined;

/**
 * Shared PrismaClient singleton so every service in the monorepo reuses one
 * connection pool per process instead of opening a new one per import.
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient — évite d'ouvrir de multiples connexions en dev
 * (hot-reload Next.js). Importer via `@da/db/client`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";

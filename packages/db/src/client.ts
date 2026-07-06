import { PrismaClient } from "@prisma/client";

/**
 * Neon (serverless) met le compute en veille après inactivité. Sans marge,
 * Prisma abandonne au bout de ~5 s et renvoie « Can't reach database server »
 * → une page 500 au premier accès à froid. On ajoute un connect_timeout
 * généreux pour laisser le compute se réveiller (idempotent : ignoré si déjà
 * présent dans l'URL, et pgbouncer/paramètres existants sont préservés).
 */
function resilientDbUrl(): string | undefined {
  const u = process.env.DATABASE_URL;
  if (!u) return undefined;
  return /[?&]connect_timeout=/.test(u)
    ? u
    : `${u}${u.includes("?") ? "&" : "?"}connect_timeout=15`;
}

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
    datasourceUrl: resilientDbUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";

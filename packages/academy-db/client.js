// Client Prisma de la base DÉDIÉE Access Academy (séparée de la base du web).
// Écrit en CommonJS et exposé comme package EXTERNE (serverExternalPackages)
// afin que Next ne bundle PAS le moteur Prisma (le require dynamique du moteur
// provoquait un context-glob webpack qui remontait jusqu'à une jonction Windows
// protégée → EPERM au build). Chargé au runtime par Node, comme @prisma/client.
const generated = require("./generated/client");
const { PrismaClient } = generated;

function resilientDbUrl() {
  const u = process.env.ACADEMY_DATABASE_URL;
  if (!u) return undefined;
  // Neon met le compute en veille : marge de réveil pour éviter une 500 à froid.
  return /[?&]connect_timeout=/.test(u) ? u : `${u}${u.includes("?") ? "&" : "?"}connect_timeout=15`;
}

const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.academyPrisma ??
  new PrismaClient({
    datasourceUrl: resilientDbUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.academyPrisma = prisma;

module.exports = { ...generated, prisma };

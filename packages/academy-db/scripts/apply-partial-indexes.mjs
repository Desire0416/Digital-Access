// Applique les index partiels d'unicité (prisma/partial-indexes.sql) sur la base
// dédiée Academy. Idempotent (IF NOT EXISTS). À rejouer après un `prisma db push`.
//   node --env-file=../../.env scripts/apply-partial-indexes.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const url = process.env.ACADEMY_DATABASE_URL_UNPOOLED || process.env.ACADEMY_DATABASE_URL;
if (!url) {
  console.error("❌ ACADEMY_DATABASE_URL(_UNPOOLED) manquante (charger la racine .env).");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "..", "prisma", "partial-indexes.sql"), "utf8");

// Retire les lignes de commentaire, puis découpe sur « ; ».
const statements = raw
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const prisma = new PrismaClient({ datasourceUrl: url });

try {
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log("✓", stmt.split("\n")[0].slice(0, 80));
  }
  console.log(`\n✅ ${statements.length} index partiels appliqués.`);
} catch (e) {
  console.error("❌ Échec :", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

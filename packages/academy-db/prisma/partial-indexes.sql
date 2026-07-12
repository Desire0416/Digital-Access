-- ════════════════════════════════════════════════════════════════════════════
-- Index partiels d'unicité — NON exprimables dans schema.prisma (clause WHERE).
-- À REJOUER après chaque `prisma db push` (qui peut les supprimer, ne les
-- connaissant pas). Script d'application : `pnpm --filter @da/academy-db partial-indexes`
-- (scripts/apply-partial-indexes.mjs). Idempotent grâce à IF NOT EXISTS.
--
-- Garantit deux invariants de concurrence du cahier des charges :
--   · au plus UN paiement PENDING par cible et par apprenant (anti-course §27) ;
--   · au plus UN certificat ACTIF par cible+type et par apprenant (§40.9).
-- ════════════════════════════════════════════════════════════════════════════

-- Paiement : un seul PENDING par (apprenant, formation)
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pending_course_uq"
  ON "Payment" ("userId", "courseId")
  WHERE "status" = 'PENDING' AND "courseId" IS NOT NULL;

-- Paiement : un seul PENDING par (apprenant, parcours)
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_pending_path_uq"
  ON "Payment" ("userId", "careerPathId")
  WHERE "status" = 'PENDING' AND "careerPathId" IS NOT NULL;

-- Certificat : un seul ACTIF par (apprenant, formation, type)
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_active_course_uq"
  ON "Certificate" ("userId", "courseId", "type")
  WHERE "status" = 'ACTIVE' AND "courseId" IS NOT NULL;

-- Certificat : un seul ACTIF par (apprenant, parcours, type)
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_active_path_uq"
  ON "Certificate" ("userId", "careerPathId", "type")
  WHERE "status" = 'ACTIVE' AND "careerPathId" IS NOT NULL;

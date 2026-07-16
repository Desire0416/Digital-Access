import "server-only";

import { Prisma, type AccessType, type EnrollmentStatus } from "@da/academy-db/client";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Helper transactionnel PARTAGÉ — adhésion à une cohorte + inscription
   pédagogique sous-jacente (§23). Unique source de la création d'accès en
   cohorte : appelé par `joinFreeCohort` (cohorte gratuite) ET par
   `approvePayment` (cohorte payante, après validation admin). Ne crée JAMAIS
   d'accès en dehors de ces deux chemins (invariant de sécurité du paiement).

   Miroir exact de la logique d'inscription de lib/payments.ts (branches COURSE
   / CAREER_PATH) : formation → Enrollment ; parcours → CareerPathEnrollment +
   formations obligatoires. Reconnaissance des acquis respectée (règle 40.6) :
   une inscription déjà ACQUISE n'est jamais rétrogradée ni dupliquée.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export interface CohortEnrollTarget {
  id: string;
  courseId: string | null;
  careerPathId: string | null;
}

/**
 * Crée (idempotemment) l'adhésion `CohortMember` ACTIVE et l'inscription
 * pédagogique sous-jacente de la cohorte, dans la transaction fournie.
 * `origin: COHORT` marque la provenance ; `accessType` = FREE ou PAID.
 */
export async function enrollMemberIntoCohortTx(
  tx: Prisma.TransactionClient,
  args: { cohort: CohortEnrollTarget; userId: string; accessType: AccessType },
): Promise<void> {
  const { cohort, userId, accessType } = args;

  // 1) Adhésion à la cohorte (une seule par apprenant — @@unique).
  await tx.cohortMember.upsert({
    where: { cohortId_userId: { cohortId: cohort.id, userId } },
    create: { cohortId: cohort.id, userId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  // 2) Inscription à la FORMATION cible.
  if (cohort.courseId) {
    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: cohort.courseId } },
      select: { id: true, status: true },
    });
    if (existing && ACQUIRED.includes(existing.status)) {
      // Déjà acquise — ne rien rétrograder (règle 40.6).
    } else if (existing) {
      await tx.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", origin: "COHORT", accessType, enrolledAt: new Date() },
      });
    } else {
      await tx.enrollment.create({
        data: { userId, courseId: cohort.courseId, status: "ACTIVE", origin: "COHORT", accessType },
      });
    }
  }

  // 3) Inscription au PARCOURS cible (+ formations obligatoires).
  if (cohort.careerPathId) {
    const existingPE = await tx.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId, careerPathId: cohort.careerPathId } },
      select: { id: true, status: true },
    });
    if (existingPE && ACQUIRED.includes(existingPE.status)) {
      // Déjà inscrit au parcours.
    } else if (existingPE) {
      await tx.careerPathEnrollment.update({
        where: { id: existingPE.id },
        data: { status: "ACTIVE", enrolledAt: new Date() },
      });
    } else {
      await tx.careerPathEnrollment.create({
        data: { userId, careerPathId: cohort.careerPathId, status: "ACTIVE" },
      });
    }

    const links = await tx.careerPathCourse.findMany({
      where: { careerPathId: cohort.careerPathId, isRequired: true },
      select: { courseId: true },
    });
    const requiredIds = links.map((l) => l.courseId);
    if (requiredIds.length > 0) {
      const existingEnrollments = await tx.enrollment.findMany({
        where: { userId, courseId: { in: requiredIds } },
        select: { id: true, courseId: true, status: true },
      });
      const byCourse = new Map(existingEnrollments.map((e) => [e.courseId, e]));
      for (const courseId of requiredIds) {
        const existing = byCourse.get(courseId);
        if (existing && ACQUIRED.includes(existing.status)) continue;
        if (existing) {
          await tx.enrollment.update({
            where: { id: existing.id },
            data: { status: "ACTIVE", origin: "COHORT", accessType, enrolledAt: new Date() },
          });
        } else {
          await tx.enrollment.create({
            data: { userId, courseId, status: "ACTIVE", origin: "COHORT", accessType },
          });
        }
      }
    }
  }
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@da/academy-db/client";
import { currentUser } from "./guards";
import { createNotification } from "./notify";
import { enrollMemberIntoCohortTx } from "./cohort-enroll";

/* ══════════════════════════════════════════════════════════════════════════
   Actions cohortes apprenant (cahier §23). INVARIANTS :
   · L'accès pédagogique n'est JAMAIS créé ici directement : on délègue au helper
     transactionnel partagé `enrollMemberIntoCohortTx` (unique source d'accès en
     cohorte, mutualisée avec l'approbation de paiement).
   · Une cohorte PAYANTE ne s'obtient pas gratuitement : si le prix effectif > 0,
     on redirige vers le tunnel de paiement — jamais d'adhésion directe.
   · La capacité est revérifiée DANS la transaction (garde anti-course :
     inscriptions concurrentes au dernier siège).
   · Quitter une cohorte ne supprime PAS l'inscription pédagogique sous-jacente :
     l'apprenant garde l'accès à la formation / au parcours déjà déverrouillé.
   ══════════════════════════════════════════════════════════════════════════ */

export type CohortActionResult =
  | { ok: true; message?: string }
  | { ok: false; error?: string; redirect?: string };

/* ─── Rejoindre une cohorte gratuite ───────────────────────────────────────── */

export async function joinFreeCohort(cohortId: string): Promise<CohortActionResult> {
  const parsed = z.string().min(1).safeParse(cohortId);
  if (!parsed.success) return { ok: false, error: "Cohorte invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: "/connexion?callbackUrl=/espace/cohortes" };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre adresse email d'abord." };

  const cohort = await prisma.cohort.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      slug: true,
      status: true,
      price: true,
      capacity: true,
      enrollmentDeadline: true,
      endDate: true,
      courseId: true,
      careerPathId: true,
      course: { select: { price: true } },
      careerPath: { select: { price: true } },
    },
  });
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };

  if (cohort.status !== "OPEN") {
    return { ok: false, error: "Les inscriptions à cette cohorte ne sont pas ouvertes." };
  }
  const now = new Date();
  if (cohort.enrollmentDeadline && cohort.enrollmentDeadline < now) {
    return { ok: false, error: "La date limite d'inscription à cette cohorte est dépassée." };
  }
  if (cohort.endDate && cohort.endDate < now) {
    return { ok: false, error: "Cette cohorte est déjà terminée." };
  }

  // Prix effectif : prix propre à la cohorte, sinon prix de la cible sous-jacente.
  const effectivePrice = cohort.price ?? cohort.course?.price ?? cohort.careerPath?.price ?? 0;
  if (effectivePrice > 0) {
    return { ok: false, redirect: `/paiement/cohorte/${cohort.slug}` };
  }

  const existing = await prisma.cohortMember.findUnique({
    where: { cohortId_userId: { cohortId: cohort.id, userId: user.id } },
    select: { status: true },
  });
  if (existing && existing.status === "ACTIVE") {
    return { ok: false, error: "Vous faites déjà partie de cette cohorte." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Garde anti-course : verrou consultatif transactionnel par cohorte, qui
      // SÉRIALISE les adhésions concurrentes à la même cohorte (un simple COUNT
      // sous READ COMMITTED laisserait passer deux « dernières places »
      // simultanées). Le verrou est relâché à la fin de la transaction.
      if (cohort.capacity != null) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${cohort.id}))`;
        const count = await tx.cohortMember.count({
          where: { cohortId: cohort.id, status: "ACTIVE" },
        });
        if (count >= cohort.capacity) throw new Error("COHORT_FULL");
      }
      await enrollMemberIntoCohortTx(tx, {
        cohort: { id: cohort.id, courseId: cohort.courseId, careerPathId: cohort.careerPathId },
        userId: user.id,
        accessType: "FREE",
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "COHORT_FULL") {
      return { ok: false, error: "Cette cohorte est complète." };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Adhésion concurrente : l'apprenant est déjà membre — succès idempotent.
      return { ok: true, message: "Vous faites déjà partie de cette cohorte." };
    }
    throw err;
  }

  await createNotification({
    userId: user.id,
    type: "COHORT",
    title: "Bienvenue dans la cohorte",
    message:
      "Votre place est confirmée. Retrouvez le programme, les sessions et les annonces dans votre espace cohorte.",
    link: `/espace/cohortes/${cohort.id}`,
  });
  revalidatePath("/espace/cohortes");
  revalidatePath("/espace");
  return { ok: true, message: "Inscription confirmée !" };
}

/* ─── Quitter une cohorte (l'accès pédagogique acquis est conservé) ─────────── */

export async function leaveCohort(cohortId: string): Promise<CohortActionResult> {
  const parsed = z.string().min(1).safeParse(cohortId);
  if (!parsed.success) return { ok: false, error: "Cohorte invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: "/connexion?callbackUrl=/espace/cohortes" };

  // On retire l'adhésion (WITHDRAWN) sans toucher à l'Enrollment / CareerPathEnrollment :
  // l'apprenant garde l'accès à la formation ou au parcours déjà déverrouillé.
  await prisma.cohortMember.updateMany({
    where: { cohortId: parsed.data, userId: user.id },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/espace/cohortes");
  revalidatePath("/espace");
  return { ok: true, message: "Vous avez quitté la cohorte." };
}

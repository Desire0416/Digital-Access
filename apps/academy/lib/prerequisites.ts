import "server-only";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Prérequis structurés inter-formations (cahier §22.1).
   Un prérequis est « satisfait » quand l'apprenant a TERMINÉ la formation
   requise (Enrollment COMPLETED). Source unique de vérité, utilisée par :
   · le verrou d'inscription (learn-actions.enrollFreeCourse, payments.submit…)
   · l'affichage de la fiche (learn-queries.getCourseUserState).
   Seuls les prérequis PUBLIÉS verrouillent (un prérequis dépublié ne doit pas
   bloquer indéfiniment). La vérification ne porte QUE sur les prérequis directs
   (pas de récursivité) → un éventuel cycle reste inoffensif.
   ══════════════════════════════════════════════════════════════════════════ */

export type PrereqCourse = { id: string; slug: string; title: string; level: string };

export type PrerequisiteStatus = {
  /** true si aucun prérequis publié OU tous terminés. */
  met: boolean;
  /** slugs des prérequis publiés déjà terminés par l'apprenant. */
  acquiredSlugs: string[];
  /** prérequis publiés NON terminés (bloquants). */
  unmet: PrereqCourse[];
};

/** Prérequis directs PUBLIÉS d'une formation. */
async function publishedRequirements(courseId: string): Promise<PrereqCourse[]> {
  const rows = await prisma.coursePrerequisite.findMany({
    where: { courseId, requiresCourse: { status: "PUBLISHED" } },
    select: { requiresCourse: { select: { id: true, slug: true, title: true, level: true } } },
  });
  return rows.map((r) => r.requiresCourse);
}

/**
 * État des prérequis d'une formation pour un apprenant.
 * `userId` null (visiteur) → non évalué : met=true (l'inscription passe d'abord
 * par la création de compte ; le verrou s'appliquera une fois connecté).
 */
export async function getPrerequisiteStatus(
  userId: string | null,
  courseId: string,
): Promise<PrerequisiteStatus> {
  const required = await publishedRequirements(courseId);
  if (required.length === 0 || !userId) {
    return { met: true, acquiredSlugs: [], unmet: [] };
  }

  const completed = await prisma.enrollment.findMany({
    where: { userId, status: "COMPLETED", courseId: { in: required.map((c) => c.id) } },
    select: { courseId: true },
  });
  const done = new Set(completed.map((e) => e.courseId));

  const acquiredSlugs = required.filter((c) => done.has(c.id)).map((c) => c.slug);
  const unmet = required.filter((c) => !done.has(c.id));
  return { met: unmet.length === 0, acquiredSlugs, unmet };
}

/** Message d'erreur normalisé pour un verrou d'inscription. */
export function unmetPrerequisitesMessage(unmet: PrereqCourse[]): string {
  const list = unmet.map((c) => `« ${c.title} »`).join(", ");
  return unmet.length === 1
    ? `Terminez d'abord le prérequis ${list} pour vous inscrire.`
    : `Terminez d'abord ces prérequis pour vous inscrire : ${list}.`;
}

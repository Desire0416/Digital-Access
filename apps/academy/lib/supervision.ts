import "server-only";
import { cache } from "react";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Périmètre de supervision d'un formateur/encadrant (cahier §7.4 / §23).

   Un formateur encadre une formation de DEUX manières :
   1. assignation directe à la formation (CourseInstructor) ;
   2. encadrement d'une COHORTE rattachée à cette formation (CohortInstructor →
      cohort.courseId), ou à un parcours contenant la formation
      (cohort.careerPathId → CareerPathCourse).

   Historiquement la file de correction ne regardait QUE CourseInstructor : les
   dépôts des apprenants d'une cohorte n'apparaissaient jamais côté encadrant.
   Ces helpers centralisent le calcul, réutilisé par la file de correction
   (lib/correction-queries.ts) et les mutations de correction (lib/learn-actions.ts).
   ══════════════════════════════════════════════════════════════════════════ */

export interface SupervisedScope {
  courseIds: string[];
  careerPathIds: string[];
}

/**
 * Formations + parcours supervisés par cet utilisateur (union des deux voies).
 * Les formations d'un parcours ciblé par une cohorte sont incluses dans courseIds.
 *
 * Mémoïsé par requête (React `cache`) : la file de correction appelle ce calcul
 * plusieurs fois (file + badge, projets + devoirs) — un seul aller-retour DB.
 */
export const supervisedScope = cache(async function supervisedScope(
  userId: string,
): Promise<SupervisedScope> {
  const [instructed, cohortLinks] = await Promise.all([
    prisma.courseInstructor.findMany({
      where: { userId },
      select: {
        courseId: true,
        course: { select: { careerPaths: { select: { careerPathId: true } } } },
      },
    }),
    prisma.cohortInstructor.findMany({
      where: { userId },
      select: { cohort: { select: { courseId: true, careerPathId: true } } },
    }),
  ]);

  const courseIds = new Set<string>();
  const careerPathIds = new Set<string>();

  for (const ci of instructed) {
    courseIds.add(ci.courseId);
    for (const cp of ci.course.careerPaths) careerPathIds.add(cp.careerPathId);
  }

  const cohortPathIds: string[] = [];
  for (const link of cohortLinks) {
    if (link.cohort.courseId) courseIds.add(link.cohort.courseId);
    if (link.cohort.careerPathId) {
      careerPathIds.add(link.cohort.careerPathId);
      cohortPathIds.push(link.cohort.careerPathId);
    }
  }

  // Cohorte rattachée à un parcours → les formations de ce parcours sont supervisées.
  if (cohortPathIds.length) {
    const cpCourses = await prisma.course.findMany({
      where: { careerPaths: { some: { careerPathId: { in: cohortPathIds } } } },
      select: { id: true },
    });
    for (const c of cpCourses) courseIds.add(c.id);
  }

  return { courseIds: [...courseIds], careerPathIds: [...careerPathIds] };
});

/** Identifiants des formations supervisées (union CourseInstructor + cohortes). */
export async function supervisedCourseIds(userId: string): Promise<string[]> {
  return (await supervisedScope(userId)).courseIds;
}

/** Ce formateur supervise-t-il cette formation ? (assignation directe OU cohorte) */
export async function isCourseSupervised(userId: string, courseId: string | null): Promise<boolean> {
  if (!courseId) return false;
  const ids = await supervisedCourseIds(userId);
  return ids.includes(courseId);
}

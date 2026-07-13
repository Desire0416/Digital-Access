import "server-only";
import { prisma } from "@da/academy-db/client";

/* Options de prérequis pour le constructeur de formation (§22.1) : les
   formations PUBLIÉES sélectionnables (hors la formation éditée). Lecture non
   gardée — la page éditrice est déjà protégée par requireCourseEditor. */

export type PrerequisiteOption = { id: string; slug: string; title: string; level: string };

export async function getCoursePrerequisiteOptions(excludeCourseId?: string): Promise<PrerequisiteOption[]> {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", ...(excludeCourseId ? { id: { not: excludeCourseId } } : {}) },
    orderBy: { title: "asc" },
    select: { id: true, slug: true, title: true, level: true },
  });
  return rows;
}

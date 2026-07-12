import "server-only";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Tarification des parcours — reconnaissance des acquis (cahier §13.7, §27.4,
   règles 40.4 / 40.5) : le prix affiché d'un parcours = prix plein − Σ prix
   des formations du parcours DÉJÀ ACQUISES par l'utilisateur (inscription
   ACTIVE ou COMPLETED), plancher 0. Une formation acquise n'est JAMAIS
   facturée deux fois.
   ══════════════════════════════════════════════════════════════════════════ */

export interface CareerPathPricing {
  /** Prix plein du parcours (FCFA). */
  fullPrice: number;
  /** Montant déduit au titre des formations déjà acquises (FCFA). */
  deduction: number;
  /** Prix final à payer (FCFA, plancher 0). */
  finalPrice: number;
  /** Formations du parcours déjà acquises par l'utilisateur. */
  acquiredCourses: { id: string; title: string; slug: string; price: number }[];
}

/** Statuts d'inscription qui valent « formation acquise ». */
export const ACQUIRED_STATUSES = ["ACTIVE", "COMPLETED"] as const;

export async function computeCareerPathPricing(
  careerPathId: string,
  userId?: string | null,
): Promise<CareerPathPricing> {
  const path = await prisma.careerPath.findUnique({
    where: { id: careerPathId },
    select: {
      price: true,
      courses: {
        select: { course: { select: { id: true, title: true, slug: true, price: true } } },
      },
    },
  });
  if (!path) return { fullPrice: 0, deduction: 0, finalPrice: 0, acquiredCourses: [] };

  const fullPrice = path.price;
  if (!userId) return { fullPrice, deduction: 0, finalPrice: fullPrice, acquiredCourses: [] };

  const courseIds = path.courses.map((c) => c.course.id);
  if (courseIds.length === 0) return { fullPrice, deduction: 0, finalPrice: fullPrice, acquiredCourses: [] };

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, courseId: { in: courseIds }, status: { in: [...ACQUIRED_STATUSES] } },
    select: { courseId: true },
  });
  const acquiredIds = new Set(enrollments.map((e) => e.courseId));

  const acquiredCourses = path.courses
    .filter((c) => acquiredIds.has(c.course.id))
    .map((c) => ({ id: c.course.id, title: c.course.title, slug: c.course.slug, price: c.course.price }));

  const deductionRaw = acquiredCourses.reduce((sum, c) => sum + c.price, 0);
  // La déduction ne dépasse jamais le prix plein (plancher 0).
  const deduction = Math.min(deductionRaw, fullPrice);
  const finalPrice = Math.max(0, fullPrice - deductionRaw);

  return { fullPrice, deduction, finalPrice, acquiredCourses };
}

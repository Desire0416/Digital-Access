import "server-only";
import { prisma } from "@da/academy-db/client";
import { isAdmin, type SessionUser } from "./guards";
import { countSubmissionsToReview } from "./correction-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Espace formateur — LECTURES (cahier §18). Cloisonnement : un formateur ne
   voit QUE les formations qu'il encadre (CourseInstructor où userId = lui).
   Un administrateur pédagogique (isAdmin) n'est PAS restreint : il voit tout.
   Toutes les requêtes utilisent des `select` précis (jamais l'objet entier).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED = ["ACTIVE", "COMPLETED"] as const;

/** Filtre Prisma des formations visibles par cet utilisateur. */
function courseScope(user: SessionUser) {
  return isAdmin(user) ? {} : { instructors: { some: { userId: user.id } } };
}

/* ─── Mes formations (§18.2) ───────────────────────────────────────────────── */

/**
 * Formations que l'utilisateur encadre (ou TOUTES s'il est admin), avec les
 * agrégats de pilotage. Triées par mise à jour décroissante.
 */
export async function getInstructorCourses(user: SessionUser) {
  const courses = await prisma.course.findMany({
    where: courseScope(user),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      level: true,
      coverImage: true,
      updatedAt: true,
      _count: { select: { enrollments: true } },
      modules: {
        where: { status: "PUBLISHED" },
        select: { lessons: { where: { status: "PUBLISHED" }, select: { id: true } } },
      },
    },
  });
  if (courses.length === 0) return [];

  // Moyenne et nombre d'avis, agrégés en une passe (approuvés uniquement).
  const ratingRows = await prisma.review.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courses.map((c) => c.id) }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingByCourse = new Map(
    ratingRows.map((r) => [
      r.courseId,
      { avg: r._avg.rating, count: r._count._all },
    ]),
  );

  return courses.map((c) => {
    const rating = ratingByCourse.get(c.id);
    const avgRating =
      rating && rating.avg !== null ? Math.round(rating.avg * 10) / 10 : null;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: c.status,
      level: c.level,
      coverImage: c.coverImage,
      updatedAt: c.updatedAt,
      learnerCount: c._count.enrollments,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((n, m) => n + m.lessons.length, 0),
      avgRating,
      reviewCount: rating?.count ?? 0,
    };
  });
}

export type InstructorCourse = Awaited<ReturnType<typeof getInstructorCourses>>[number];

/* ─── Tableau de bord formateur (§18.1) ────────────────────────────────────── */

export async function getInstructorDashboard(user: SessionUser) {
  const courses = await getInstructorCourses(user);
  const courseIds = courses.map((c) => c.id);

  // Inscrits DISTINCTS sur l'ensemble des formations encadrées.
  const [distinctLearners, ratingGlobal, pendingReviews] = await Promise.all([
    courseIds.length
      ? prisma.enrollment.findMany({
          where: { courseId: { in: courseIds } },
          select: { userId: true },
          distinct: ["userId"],
        })
      : Promise.resolve([]),
    courseIds.length
      ? prisma.review.aggregate({
          where: { courseId: { in: courseIds }, status: "APPROVED" },
          _avg: { rating: true },
        })
      : Promise.resolve({ _avg: { rating: null } }),
    countSubmissionsToReview(user),
  ]);

  const globalAvg = ratingGlobal._avg.rating;

  return {
    courses: courses.slice(0, 6),
    stats: {
      courseCount: courses.length,
      publishedCount: courses.filter((c) => c.status === "PUBLISHED").length,
      learnerCount: distinctLearners.length,
      avgRating: globalAvg !== null ? Math.round(globalAvg * 10) / 10 : null,
    },
    pendingReviews,
  };
}

export type InstructorDashboard = Awaited<ReturnType<typeof getInstructorDashboard>>;

/* ─── Mes apprenants (§18.3) — une ligne par (apprenant × formation) ───────── */

/**
 * Apprenants inscrits aux formations encadrées, avec progression calculée
 * (leçons PUBLISHED terminées / total). Optionnellement restreint à une
 * formation — mais seulement si elle fait partie du périmètre de l'utilisateur,
 * sinon le filtre est ignoré (aucune fuite). Plafonné à 200 lignes.
 */
export async function getInstructorLearners(user: SessionUser, courseId?: string) {
  const admin = isAdmin(user);

  // Périmètre de formations : ids encadrés (ou toutes pour un admin).
  const scoped = await prisma.course.findMany({
    where: courseScope(user),
    select: { id: true, title: true },
  });
  let scopedCourses = scoped;
  if (courseId) {
    const inScope = scoped.some((c) => c.id === courseId);
    if (!inScope && !admin) return []; // courseId hors périmètre → rien
    scopedCourses = scoped.filter((c) => c.id === courseId);
  }
  if (scopedCourses.length === 0) return [];

  const courseIds = scopedCourses.map((c) => c.id);
  const titleByCourse = new Map(scopedCourses.map((c) => [c.id, c.title]));

  // Total de leçons PUBLISHED par formation (dénominateur de progression).
  const modules = await prisma.module.findMany({
    where: { courseId: { in: courseIds }, status: "PUBLISHED" },
    select: {
      courseId: true,
      lessons: { where: { status: "PUBLISHED" }, select: { id: true } },
    },
  });
  const lessonIdsByCourse = new Map<string, string[]>();
  for (const m of modules) {
    const arr = lessonIdsByCourse.get(m.courseId) ?? [];
    for (const l of m.lessons) arr.push(l.id);
    lessonIdsByCourse.set(m.courseId, arr);
  }

  // Inscriptions (une par apprenant × formation), plus récentes actives d'abord.
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { user: { lastActiveAt: { sort: "desc", nulls: "last" } } },
    take: 200,
    select: {
      courseId: true,
      status: true,
      user: {
        select: { id: true, name: true, email: true, avatar: true, lastActiveAt: true },
      },
    },
  });
  if (enrollments.length === 0) return [];

  // Leçons terminées par apprenant, restreintes aux leçons publiées du périmètre.
  const allLessonIds = [...lessonIdsByCourse.values()].flat();
  const learnerIds = [...new Set(enrollments.map((e) => e.user.id))];
  const progressRows =
    allLessonIds.length && learnerIds.length
      ? await prisma.lessonProgress.findMany({
          where: { userId: { in: learnerIds }, lessonId: { in: allLessonIds } },
          select: { userId: true, lessonId: true },
        })
      : [];
  // Set des leçons terminées par apprenant, pour intersecter avec chaque formation.
  const completedByUser = new Map<string, Set<string>>();
  for (const p of progressRows) {
    const set = completedByUser.get(p.userId) ?? new Set<string>();
    set.add(p.lessonId);
    completedByUser.set(p.userId, set);
  }

  return enrollments.map((e) => {
    const lessonIds = lessonIdsByCourse.get(e.courseId) ?? [];
    const done = completedByUser.get(e.user.id);
    const completed = done ? lessonIds.filter((id) => done.has(id)).length : 0;
    const progress = lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0;
    return {
      userId: e.user.id,
      name: e.user.name,
      email: e.user.email,
      avatar: e.user.avatar,
      courseId: e.courseId,
      courseTitle: titleByCourse.get(e.courseId) ?? "",
      enrollmentStatus: e.status,
      progress,
      lastActiveAt: e.user.lastActiveAt,
    };
  });
}

export type InstructorLearner = Awaited<ReturnType<typeof getInstructorLearners>>[number];

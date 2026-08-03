import "server-only";
import { prisma } from "@da/academy-db/client";
import { isAdmin, type SessionUser } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Espace formateur — LECTURES cohortes. Cloisonnement : un formateur ne
   voit QUE les cohortes où il est CohortInstructor (userId = lui).
   Un admin voit toutes les cohortes. Select précis partout.
   ══════════════════════════════════════════════════════════════════════════ */

function cohortScope(user: SessionUser) {
  return isAdmin(user) ? {} : { instructors: { some: { userId: user.id } } };
}

/* ─── Liste des cohortes assignées ─────────────────────────────────────── */

export async function getInstructorCohorts(user: SessionUser) {
  return prisma.cohort.findMany({
    where: { ...cohortScope(user), status: { not: "DRAFT" } },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      capacity: true,
      coverImage: true,
      course: { select: { id: true, title: true, slug: true } },
      careerPath: { select: { id: true, title: true, slug: true } },
      _count: {
        select: {
          members: { where: { status: { not: "WITHDRAWN" } } },
          events: true,
          announcements: true,
        },
      },
    },
  });
}

export type InstructorCohort = Awaited<ReturnType<typeof getInstructorCohorts>>[number];

/* ─── Détail d'une cohorte (tableau de bord encadrant) ─────────────────── */

export async function getInstructorCohortDetail(cohortId: string, user: SessionUser) {
  const cohort = await prisma.cohort.findFirst({
    where: { id: cohortId, ...cohortScope(user) },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      status: true,
      description: true,
      rules: true,
      rhythm: true,
      startDate: true,
      endDate: true,
      enrollmentDeadline: true,
      capacity: true,
      coverImage: true,
      courseId: true,
      careerPathId: true,
      course: { select: { id: true, title: true, slug: true } },
      careerPath: { select: { id: true, title: true, slug: true } },
      instructors: {
        orderBy: { roleLabel: "asc" },
        select: {
          id: true,
          roleLabel: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      members: {
        where: { status: { not: "WITHDRAWN" } },
        orderBy: { joinedAt: "desc" },
        take: 200,
        select: {
          id: true,
          status: true,
          joinedAt: true,
          completedAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true, lastActiveAt: true } },
        },
      },
      events: {
        orderBy: { startAt: "asc" },
        select: { id: true, title: true, startAt: true, endAt: true, location: true, status: true, type: true },
      },
      announcements: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: { id: true, title: true, body: true, pinned: true, createdAt: true },
      },
      _count: {
        select: {
          members: { where: { status: { not: "WITHDRAWN" } } },
          events: true,
          announcements: true,
        },
      },
    },
  });
  if (!cohort) return null;

  // Progression des membres si la cohorte cible une formation
  let memberProgress: Map<string, number> = new Map();
  if (cohort.courseId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: cohort.courseId,
        userId: { in: cohort.members.map((m) => m.user.id) },
      },
      select: { userId: true, progress: true },
    });
    memberProgress = new Map(enrollments.map((e) => [e.userId, e.progress]));
  }

  // Stats agrégées
  const activeCount = cohort.members.filter((m) => m.status === "ACTIVE").length;
  const completedCount = cohort.members.filter((m) => m.status === "COMPLETED").length;
  const avgProgress =
    cohort.members.length > 0
      ? Math.round(
          cohort.members.reduce((sum, m) => sum + (memberProgress.get(m.user.id) ?? 0), 0) /
            cohort.members.length,
        )
      : 0;

  return {
    ...cohort,
    stats: {
      totalMembers: cohort._count.members,
      activeCount,
      completedCount,
      avgProgress,
      eventCount: cohort._count.events,
    },
    membersWithProgress: cohort.members.map((m) => ({
      ...m,
      progress: memberProgress.get(m.user.id) ?? 0,
    })),
  };
}

export type InstructorCohortDetail = NonNullable<Awaited<ReturnType<typeof getInstructorCohortDetail>>>;

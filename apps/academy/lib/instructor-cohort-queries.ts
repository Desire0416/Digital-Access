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

  const memberIds = cohort.members.map((m) => m.user.id);

  // Progression des membres si la cohorte cible une formation
  let memberProgress: Map<string, number> = new Map();
  if (cohort.courseId && memberIds.length) {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: cohort.courseId, userId: { in: memberIds } },
      select: { userId: true, progress: true },
    });
    memberProgress = new Map(enrollments.map((e) => [e.userId, e.progress]));
  }

  // Livrables EN ATTENTE de correction déposés par les membres, pour la
  // formation de la cohorte — devoirs (AssessmentAttempt) + projets (Submission).
  // Chaque entrée porte un lien direct vers sa fiche de correction.
  type PendingReview = {
    id: string;
    kind: "assignment" | "project";
    title: string;
    userId: string;
    learnerName: string;
    learnerAvatar: string | null;
    submittedAt: Date | null;
    href: string;
  };
  let pendingReviews: PendingReview[] = [];
  const pendingByMember = new Map<string, number>();
  if (cohort.courseId && memberIds.length) {
    const [attempts, submissions] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where: {
          status: "SUBMITTED",
          userId: { in: memberIds },
          assessment: { type: "ASSIGNMENT", courseId: cohort.courseId },
        },
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          submittedAt: true,
          userId: true,
          user: { select: { name: true, avatar: true } },
          assessment: { select: { title: true } },
        },
      }),
      prisma.submission.findMany({
        where: {
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
          userId: { in: memberIds },
          project: { courseId: cohort.courseId },
        },
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          submittedAt: true,
          userId: true,
          user: { select: { name: true, avatar: true } },
          project: { select: { title: true } },
        },
      }),
    ]);

    pendingReviews = [
      ...attempts.map((a) => ({
        id: a.id,
        kind: "assignment" as const,
        title: a.assessment.title,
        userId: a.userId,
        learnerName: a.user.name,
        learnerAvatar: a.user.avatar,
        submittedAt: a.submittedAt,
        href: `/correction/devoir/${a.id}`,
      })),
      ...submissions.map((s) => ({
        id: s.id,
        kind: "project" as const,
        title: s.project.title,
        userId: s.userId,
        learnerName: s.user.name,
        learnerAvatar: s.user.avatar,
        submittedAt: s.submittedAt,
        href: `/correction/${s.id}`,
      })),
    ].sort((x, y) => (x.submittedAt?.getTime() ?? 0) - (y.submittedAt?.getTime() ?? 0));

    for (const p of pendingReviews) {
      pendingByMember.set(p.userId, (pendingByMember.get(p.userId) ?? 0) + 1);
    }
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
      pendingReviews: pendingReviews.length,
    },
    membersWithProgress: cohort.members.map((m) => ({
      ...m,
      progress: memberProgress.get(m.user.id) ?? 0,
      pendingReviews: pendingByMember.get(m.user.id) ?? 0,
    })),
    pendingReviews,
  };
}

export type InstructorCohortDetail = NonNullable<Awaited<ReturnType<typeof getInstructorCohortDetail>>>;

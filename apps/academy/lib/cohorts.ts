import "server-only";

import {
  prisma,
  type Prisma,
  type CohortType,
  type CohortStatus,
  type CohortMemberStatus,
  type EventType,
} from "@da/academy-db/client";
import { currentUserFresh, isAdmin } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Cohortes — lectures seules (cahier §23 cohortes, §24 événements/sessions,
   §25 annonces). PRINCIPE : une cohorte cible UNE formation OU UN parcours ;
   l'inscription pédagogique sous-jacente est créée par le helper transactionnel
   partagé (cohort-enroll.ts), jamais ici. La progression affichée est DÉRIVÉE
   de l'Enrollment / CareerPathEnrollment de l'apprenant (jamais recalculée ici).
   Sécurité niveau ligne : `getMyCohorts` filtre par userId ; `getCohortForMember`
   n'ouvre l'espace qu'aux membres, formateurs de la cohorte et administrateurs.
   ══════════════════════════════════════════════════════════════════════════ */

type CohortTargetView = { kind: "course" | "careerPath"; slug: string; title: string } | null;

function toTarget(
  course: { slug: string; title: string } | null,
  careerPath: { slug: string; title: string } | null,
): CohortTargetView {
  if (course) return { kind: "course", slug: course.slug, title: course.title };
  if (careerPath) return { kind: "careerPath", slug: careerPath.slug, title: careerPath.title };
  return null;
}

/* ─── Cohortes ouvertes à l'inscription pour une cible (§23.4) ──────────────── */

export interface PublicCohort {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: CohortType;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  enrollmentDeadline: Date | null;
  rhythm: string | null;
  coverImage: string | null;
  capacity: number | null;
  /** Prix effectif (FCFA) : prix propre à la cohorte, sinon prix de la cible. */
  effectivePrice: number;
  seatsTaken: number;
  seatsLeft: number | null;
  isFull: boolean;
  target: CohortTargetView;
  instructors: { name: string; roleLabel: string }[];
}

/**
 * Cohortes ouvertes à l'inscription pour une formation OU un parcours :
 * status OPEN, deadline non dépassée (ou nulle), fin non dépassée (ou nulle).
 */
export async function getOpenCohorts(target: {
  courseId?: string;
  careerPathId?: string;
}): Promise<PublicCohort[]> {
  const now = new Date();
  const where: Prisma.CohortWhereInput = {
    status: "OPEN",
    AND: [
      { OR: [{ enrollmentDeadline: null }, { enrollmentDeadline: { gte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  };
  if (target.courseId) where.courseId = target.courseId;
  else if (target.careerPathId) where.careerPathId = target.careerPathId;
  else return [];

  const rows = await prisma.cohort.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: 50,
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      startDate: true,
      endDate: true,
      enrollmentDeadline: true,
      rhythm: true,
      coverImage: true,
      capacity: true,
      price: true,
      course: { select: { slug: true, title: true, price: true } },
      careerPath: { select: { slug: true, title: true, price: true } },
      instructors: {
        orderBy: { roleLabel: "asc" },
        select: { roleLabel: true, user: { select: { name: true } } },
      },
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
  });

  return rows.map((c) => {
    const seatsTaken = c._count.members;
    const targetPrice = c.course?.price ?? c.careerPath?.price ?? 0;
    const effectivePrice = c.price ?? targetPrice;
    const seatsLeft = c.capacity != null ? Math.max(0, c.capacity - seatsTaken) : null;
    const isFull = c.capacity != null && seatsTaken >= c.capacity;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      slug: c.slug,
      type: c.type,
      description: c.description,
      startDate: c.startDate,
      endDate: c.endDate,
      enrollmentDeadline: c.enrollmentDeadline,
      rhythm: c.rhythm,
      coverImage: c.coverImage,
      capacity: c.capacity,
      effectivePrice,
      seatsTaken,
      seatsLeft,
      isFull,
      target: toTarget(c.course, c.careerPath),
      instructors: c.instructors.map((i) => ({ name: i.user.name, roleLabel: i.roleLabel })),
    };
  });
}

/* ─── Mes cohortes (§16.1, §23.5) ──────────────────────────────────────────── */

export interface MyCohort {
  id: string;
  name: string;
  slug: string;
  type: CohortType;
  status: CohortStatus;
  startDate: Date;
  endDate: Date | null;
  memberStatus: CohortMemberStatus;
  target: CohortTargetView;
  /** Progression DÉRIVÉE de l'inscription pédagogique sous-jacente (%). */
  progress: number;
  nextSession: { title: string; startAt: Date; meetingUrl: string | null } | null;
}

export async function getMyCohorts(userId: string): Promise<MyCohort[]> {
  const now = new Date();
  const memberships = await prisma.cohortMember.findMany({
    where: { userId, status: { not: "WITHDRAWN" } },
    orderBy: { cohort: { startDate: "desc" } },
    take: 100,
    select: {
      status: true,
      cohort: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          courseId: true,
          careerPathId: true,
          course: { select: { slug: true, title: true } },
          careerPath: { select: { slug: true, title: true } },
          events: {
            where: { status: "PUBLISHED", startAt: { gte: now } },
            orderBy: { startAt: "asc" },
            take: 1,
            select: { title: true, startAt: true, meetingUrl: true },
          },
        },
      },
    },
  });

  // Progression dérivée — batch : une requête par type de cible (évite le N+1).
  const courseIds = [
    ...new Set(memberships.map((m) => m.cohort.courseId).filter((v): v is string => !!v)),
  ];
  const pathIds = [
    ...new Set(memberships.map((m) => m.cohort.careerPathId).filter((v): v is string => !!v)),
  ];
  const [enrollments, pathEnrollments] = await Promise.all([
    courseIds.length
      ? prisma.enrollment.findMany({
          where: { userId, courseId: { in: courseIds } },
          select: { courseId: true, progress: true },
        })
      : Promise.resolve([]),
    pathIds.length
      ? prisma.careerPathEnrollment.findMany({
          where: { userId, careerPathId: { in: pathIds } },
          select: { careerPathId: true, progress: true },
        })
      : Promise.resolve([]),
  ]);
  const progByCourse = new Map(enrollments.map((e) => [e.courseId, e.progress]));
  const progByPath = new Map(pathEnrollments.map((e) => [e.careerPathId, e.progress]));

  return memberships.map((m) => {
    const c = m.cohort;
    const progress = c.courseId
      ? progByCourse.get(c.courseId) ?? 0
      : c.careerPathId
        ? progByPath.get(c.careerPathId) ?? 0
        : 0;
    const next = c.events[0];
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      memberStatus: m.status,
      target: toTarget(c.course, c.careerPath),
      progress,
      nextSession: next
        ? { title: next.title, startAt: next.startAt, meetingUrl: next.meetingUrl }
        : null,
    };
  });
}

/* ─── Espace d'une cohorte (membre / formateur / admin) (§23.5, §25) ────────── */

export interface CohortSessionView {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  startAt: Date;
  endAt: Date | null;
  meetingUrl: string | null;
  location: string | null;
  replayUrl: string | null;
  summary: string | null;
}

export interface CohortMemberView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  type: CohortType;
  status: CohortStatus;
  startDate: Date;
  endDate: Date | null;
  enrollmentDeadline: Date | null;
  rhythm: string | null;
  target: CohortTargetView;
  members: { name: string; avatar: string | null; status: CohortMemberStatus }[];
  memberCount: number;
  instructors: { name: string; roleLabel: string }[];
  upcomingSessions: CohortSessionView[];
  pastSessions: CohortSessionView[];
  announcements: {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    createdAt: Date;
    author: string | null;
  }[];
  /** Progression DÉRIVÉE de l'inscription pédagogique de l'utilisateur (%). */
  myProgress: number;
  /** Peut publier une annonce : formateur de la cohorte OU administrateur. */
  canPost: boolean;
}

/**
 * Vue complète de l'espace cohorte. AUTORISATION : renvoie null si l'utilisateur
 * n'est ni membre, ni formateur de cette cohorte, ni administrateur.
 */
export async function getCohortForMember(
  cohortId: string,
  userId: string,
): Promise<CohortMemberView | null> {
  const [membership, instructorLink, fresh] = await Promise.all([
    prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      select: { status: true },
    }),
    prisma.cohortInstructor.findUnique({
      where: { cohortId_userId: { cohortId, userId } },
      select: { id: true },
    }),
    currentUserFresh(),
  ]);
  const admin = isAdmin(fresh);
  const isInstructor = !!instructorLink;
  // Un membre RETIRÉ (WITHDRAWN) ne conserve PAS l'accès à l'espace cohorte
  // (liens de session privés, annonces, liste des membres) — cohérent avec
  // getMyCohorts / getCohortAnnouncements / getUpcomingAgenda.
  const isMember = !!membership && membership.status !== "WITHDRAWN";
  if (!isMember && !isInstructor && !admin) return null;

  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      rules: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      enrollmentDeadline: true,
      rhythm: true,
      courseId: true,
      careerPathId: true,
      course: { select: { slug: true, title: true } },
      careerPath: { select: { slug: true, title: true } },
      instructors: {
        orderBy: { roleLabel: "asc" },
        select: { roleLabel: true, user: { select: { name: true } } },
      },
      members: {
        where: { status: { not: "WITHDRAWN" } },
        orderBy: { joinedAt: "asc" },
        take: 100,
        select: { status: true, user: { select: { name: true, avatar: true } } },
      },
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          startAt: true,
          endAt: true,
          meetingUrl: true,
          location: true,
          replayUrl: true,
          summary: true,
        },
      },
      announcements: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          title: true,
          body: true,
          pinned: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
      _count: { select: { members: { where: { status: { not: "WITHDRAWN" } } } } },
    },
  });
  if (!cohort) return null;

  const now = new Date();
  const sessions: CohortSessionView[] = cohort.events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt,
    meetingUrl: e.meetingUrl,
    location: e.location,
    replayUrl: e.replayUrl,
    summary: e.summary,
  }));
  const upcomingSessions = sessions.filter((e) => e.startAt >= now); // asc (prochaine d'abord)
  const pastSessions = sessions.filter((e) => e.startAt < now).reverse(); // desc (plus récente d'abord)

  // Progression dérivée de l'inscription pédagogique de l'utilisateur.
  let myProgress = 0;
  if (cohort.courseId) {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: cohort.courseId } },
      select: { progress: true },
    });
    myProgress = e?.progress ?? 0;
  } else if (cohort.careerPathId) {
    const pe = await prisma.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId, careerPathId: cohort.careerPathId } },
      select: { progress: true },
    });
    myProgress = pe?.progress ?? 0;
  }

  return {
    id: cohort.id,
    name: cohort.name,
    slug: cohort.slug,
    description: cohort.description,
    rules: cohort.rules,
    type: cohort.type,
    status: cohort.status,
    startDate: cohort.startDate,
    endDate: cohort.endDate,
    enrollmentDeadline: cohort.enrollmentDeadline,
    rhythm: cohort.rhythm,
    target: toTarget(cohort.course, cohort.careerPath),
    members: cohort.members.map((m) => ({
      name: m.user.name,
      avatar: m.user.avatar,
      status: m.status,
    })),
    memberCount: cohort._count.members,
    instructors: cohort.instructors.map((i) => ({ name: i.user.name, roleLabel: i.roleLabel })),
    upcomingSessions,
    pastSessions,
    announcements: cohort.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      pinned: a.pinned,
      createdAt: a.createdAt,
      author: a.author?.name ?? null,
    })),
    myProgress,
    canPost: isInstructor || admin,
  };
}

import "server-only";

import { prisma, type EnrollmentStatus, type MentorMessageKind } from "@da/academy-db/client";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Mentorat / tutorat (cahier §7.5) — LECTURES.
   INVARIANT DE CLOISONNEMENT : un mentor n'accède QU'aux apprenants qui lui
   sont assignés (MentorAssignment). Chaque lecture filtre par mentorId ET
   vérifie l'assignation (getMenteeDetail renvoie null si non assigné).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export interface MenteeSummary {
  learnerId: string;
  name: string;
  email: string;
  avatar: string | null;
  activeCourses: number;
  completedCourses: number;
  activePaths: number;
  /** Progression moyenne sur les inscriptions ACTIVE (0 si aucune). */
  avgProgress: number;
  lastActiveAt: Date | null;
  assignedAt: Date;
}

/** Les apprenants assignés au mentor, avec un résumé de progression. */
export async function getMyMentees(mentorId: string): Promise<MenteeSummary[]> {
  const links = await prisma.mentorAssignment.findMany({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      learner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastActiveAt: true,
          enrollments: { select: { status: true, progress: true } },
          pathEnrollments: { select: { status: true } },
        },
      },
    },
  });

  return links.map((l) => {
    const enr = l.learner.enrollments;
    const active = enr.filter((e) => e.status === "ACTIVE");
    const avg = active.length ? Math.round(active.reduce((s, e) => s + e.progress, 0) / active.length) : 0;
    return {
      learnerId: l.learner.id,
      name: l.learner.name,
      email: l.learner.email,
      avatar: l.learner.avatar,
      activeCourses: active.length,
      completedCourses: enr.filter((e) => e.status === "COMPLETED").length,
      activePaths: l.learner.pathEnrollments.filter((p) => p.status === "ACTIVE").length,
      avgProgress: avg,
      lastActiveAt: l.learner.lastActiveAt,
      assignedAt: l.createdAt,
    };
  });
}

/** Compteur pour la pastille / le tableau de bord mentor. */
export async function countMyMentees(mentorId: string): Promise<number> {
  return prisma.mentorAssignment.count({ where: { mentorId } });
}

/* ─── Détail d'un mentoré (cloisonné) ──────────────────────────────────────── */

export interface MenteeCourseRow {
  id: string;
  title: string;
  slug: string;
  status: EnrollmentStatus;
  progress: number;
}
export interface MenteePathRow {
  id: string;
  title: string;
  targetJob: string;
  status: EnrollmentStatus;
  progress: number;
}
export interface MenteeAttemptRow {
  id: string;
  assessmentTitle: string;
  courseTitle: string | null;
  score: number | null;
  passed: boolean | null;
  startedAt: Date;
}
export interface MentorMessageRow {
  id: string;
  body: string;
  kind: MentorMessageKind;
  createdAt: Date;
}
export interface MenteeDetail {
  learnerId: string;
  name: string;
  email: string;
  avatar: string | null;
  lastActiveAt: Date | null;
  objective: string | null;
  experienceLevel: string | null;
  note: string | null;
  courses: MenteeCourseRow[];
  paths: MenteePathRow[];
  recentAttempts: MenteeAttemptRow[];
  certificatesCount: number;
  messages: MentorMessageRow[];
}

/**
 * Détail d'un mentoré. CLOISONNEMENT : renvoie null si l'apprenant n'est PAS
 * assigné à ce mentor (le filtre est la clé unique mentorId+learnerId).
 */
export async function getMenteeDetail(mentorId: string, learnerId: string): Promise<MenteeDetail | null> {
  const assignment = await prisma.mentorAssignment.findUnique({
    where: { mentorId_learnerId: { mentorId, learnerId } },
    select: {
      note: true,
      messages: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, body: true, kind: true, createdAt: true } },
      learner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          lastActiveAt: true,
          objective: true,
          experienceLevel: true,
          enrollments: {
            orderBy: { enrolledAt: "desc" },
            take: 100,
            select: { status: true, progress: true, course: { select: { id: true, title: true, slug: true } } },
          },
          pathEnrollments: {
            orderBy: { enrolledAt: "desc" },
            take: 50,
            select: { status: true, progress: true, careerPath: { select: { id: true, title: true, targetJob: true } } },
          },
          attempts: {
            orderBy: { startedAt: "desc" },
            take: 6,
            select: {
              id: true,
              score: true,
              passed: true,
              startedAt: true,
              assessment: { select: { title: true, course: { select: { title: true } } } },
            },
          },
        },
      },
    },
  });
  if (!assignment) return null;

  const learnerCertificates = await prisma.certificate.count({
    where: { userId: learnerId, status: "ACTIVE", type: { not: "SKILL_BADGE" } },
  });

  const L = assignment.learner;
  return {
    learnerId: L.id,
    name: L.name,
    email: L.email,
    avatar: L.avatar,
    lastActiveAt: L.lastActiveAt,
    objective: L.objective,
    experienceLevel: L.experienceLevel,
    note: assignment.note,
    courses: L.enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      status: e.status,
      progress: e.progress,
    })),
    paths: L.pathEnrollments.map((p) => ({
      id: p.careerPath.id,
      title: p.careerPath.title,
      targetJob: p.careerPath.targetJob,
      status: p.status,
      progress: p.progress,
    })),
    recentAttempts: L.attempts.map((a) => ({
      id: a.id,
      assessmentTitle: a.assessment.title,
      courseTitle: a.assessment.course?.title ?? null,
      score: a.score,
      passed: a.passed,
      startedAt: a.startedAt,
    })),
    certificatesCount: learnerCertificates,
    messages: assignment.messages,
  };
}

/* ─── Tableau de bord mentor ────────────────────────────────────────────────── */

export interface MentorDashboard {
  menteeCount: number;
  /** Mentorés dont la progression moyenne est faible (< 25 %) — à accompagner. */
  needAttention: MenteeSummary[];
  mentees: MenteeSummary[];
}

export async function getMentorDashboard(mentorId: string): Promise<MentorDashboard> {
  const mentees = await getMyMentees(mentorId);
  const needAttention = mentees.filter((m) => m.activeCourses > 0 && m.avgProgress < 25);
  return { menteeCount: mentees.length, needAttention, mentees };
}

/** Vérifie l'assignation mentor↔apprenant (utilisé par les actions). */
export async function isMentorOf(mentorId: string, learnerId: string): Promise<boolean> {
  const a = await prisma.mentorAssignment.findUnique({
    where: { mentorId_learnerId: { mentorId, learnerId } },
    select: { id: true },
  });
  return !!a;
}

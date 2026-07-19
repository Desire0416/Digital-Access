import "server-only";
import { prisma } from "@da/academy-db/client";
import { isAdmin, type SessionUser } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Espace correcteur — LECTURES (cahier §7.4 / §19.4).
   File d'attente et fiche de correction des soumissions de projet.

   CLOISONNEMENT (identique à lib/learn-actions.ts:763-779) : un correcteur ou
   formateur NON-admin ne voit QUE les soumissions des formations qu'il encadre
   (CourseInstructor). Pour un projet transversal (rattaché à un parcours), il
   est autorisé s'il encadre au moins une formation de ce parcours. Les
   administrateurs pédagogiques ne sont pas restreints.
   ══════════════════════════════════════════════════════════════════════════ */

const REVIEWABLE = ["SUBMITTED", "UNDER_REVIEW"] as const;

/** Champs projet nécessaires au contrôle de cloisonnement. */
type ProjectScope = { courseId: string | null; careerPathId: string | null };

/** Reproduit la garde de cloisonnement de reviewSubmission pour un projet donné. */
async function isReviewerAllowed(reviewer: SessionUser, project: ProjectScope): Promise<boolean> {
  if (isAdmin(reviewer)) return true;
  if (project.courseId) {
    return !!(await prisma.courseInstructor.findFirst({
      where: { courseId: project.courseId, userId: reviewer.id },
      select: { id: true },
    }));
  }
  if (project.careerPathId) {
    // Projet transversal : autorisé s'il encadre au moins une formation du parcours.
    return !!(await prisma.courseInstructor.findFirst({
      where: { userId: reviewer.id, course: { careerPaths: { some: { careerPathId: project.careerPathId } } } },
      select: { id: true },
    }));
  }
  return false;
}

/**
 * Construit le filtre Prisma des projets dont les soumissions sont visibles par
 * le correcteur. `null` = aucune restriction (admin). `{}` compatible avec un
 * `where` de projet imbriqué.
 */
async function scopeProjectFilter(reviewer: SessionUser) {
  if (isAdmin(reviewer)) return null;

  // Formations encadrées + parcours qui contiennent l'une d'elles.
  const instructed = await prisma.courseInstructor.findMany({
    where: { userId: reviewer.id },
    select: { courseId: true, course: { select: { careerPaths: { select: { careerPathId: true } } } } },
  });
  const courseIds = [...new Set(instructed.map((c) => c.courseId))];
  const careerPathIds = [
    ...new Set(instructed.flatMap((c) => c.course.careerPaths.map((cp) => cp.careerPathId))),
  ];

  // Le terme parcours ne matche QUE les projets sans courseId, pour rester
  // aligné sur la garde autoritative isReviewerAllowed (branche courseId
  // prioritaire) : un projet lié à un cours non encadré ne doit jamais fuiter
  // dans la file au motif que son careerPathId figure dans un parcours encadré.
  const or = [
    ...(courseIds.length ? [{ courseId: { in: courseIds } }] : []),
    ...(careerPathIds.length ? [{ AND: [{ courseId: null }, { careerPathId: { in: careerPathIds } }] }] : []),
  ];
  return { courseIds, careerPathIds, or };
}

function asLinks(value: unknown): string[] {
  return Array.isArray(value) ? (value.filter((v) => typeof v === "string") as string[]) : [];
}
function asFiles(value: unknown): { name: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is { name: string; url: string } => !!v && typeof v === "object" && "url" in (v as object),
  );
}

/* ─── File d'attente (§19.4) ───────────────────────────────────────────────── */

/**
 * Soumissions à corriger (SUBMITTED / UNDER_REVIEW) visibles par ce correcteur,
 * les plus anciennes d'abord.
 */
export async function getSubmissionsToReview(reviewer: SessionUser) {
  const scope = await scopeProjectFilter(reviewer);
  if (scope && scope.or.length === 0) return []; // correcteur sans aucune formation encadrée

  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: [...REVIEWABLE] },
      ...(scope ? { project: { OR: scope.or } } : {}),
    },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      attemptNumber: true,
      submittedAt: true,
      content: true,
      links: true,
      files: true,
      status: true,
      user: { select: { name: true, email: true, avatar: true } },
      project: {
        select: {
          title: true,
          minScore: true,
          course: { select: { title: true, slug: true } },
          careerPath: { select: { title: true, slug: true } },
        },
      },
    },
  });

  return submissions.map((s) => ({
    id: s.id,
    attemptNumber: s.attemptNumber,
    submittedAt: s.submittedAt,
    status: s.status,
    content: s.content,
    links: asLinks(s.links),
    files: asFiles(s.files),
    user: s.user,
    project: {
      title: s.project.title,
      minScore: s.project.minScore,
      course: s.project.course,
      careerPath: s.project.careerPath,
    },
  }));
}

export type ReviewQueueItem = Awaited<ReturnType<typeof getSubmissionsToReview>>[number];

/* ─── Fiche de correction (§19.4) ──────────────────────────────────────────── */

/**
 * Détail complet d'une soumission à corriger : consignes du projet, apprenant,
 * soumission courante et historique des tentatives précédentes (même projet +
 * même apprenant). Applique le MÊME cloisonnement → `null` si non autorisé,
 * introuvable, ou déjà corrigée.
 */
export async function getSubmissionForReview(id: string, reviewer: SessionUser) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      userId: true,
      attemptNumber: true,
      status: true,
      content: true,
      links: true,
      files: true,
      score: true,
      feedback: true,
      submittedAt: true,
      reviewedAt: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
      project: {
        select: {
          id: true,
          title: true,
          context: true,
          objectives: true,
          deliverables: true,
          rubric: true,
          minScore: true,
          maxAttempts: true,
          isRequired: true,
          courseId: true,
          careerPathId: true,
          course: { select: { title: true, slug: true } },
          careerPath: { select: { title: true, slug: true } },
        },
      },
    },
  });
  if (!submission) return null;
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) return null;

  const allowed = await isReviewerAllowed(reviewer, {
    courseId: submission.project.courseId,
    careerPathId: submission.project.careerPathId,
  });
  if (!allowed) return null;

  // Historique : tentatives précédentes du même apprenant sur ce projet.
  const history = await prisma.submission.findMany({
    where: {
      projectId: submission.projectId,
      userId: submission.userId,
      id: { not: submission.id },
    },
    orderBy: { attemptNumber: "desc" },
    select: {
      id: true,
      attemptNumber: true,
      status: true,
      score: true,
      feedback: true,
      submittedAt: true,
      reviewedAt: true,
    },
  });

  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    status: submission.status,
    content: submission.content,
    links: asLinks(submission.links),
    files: asFiles(submission.files),
    submittedAt: submission.submittedAt,
    learner: submission.user,
    project: {
      id: submission.project.id,
      title: submission.project.title,
      context: submission.project.context,
      objectives: submission.project.objectives,
      deliverables: submission.project.deliverables,
      rubric: submission.project.rubric,
      minScore: submission.project.minScore,
      maxAttempts: submission.project.maxAttempts,
      isRequired: submission.project.isRequired,
      course: submission.project.course,
      careerPath: submission.project.careerPath,
    },
    history,
  };
}

export type SubmissionReviewDetail = NonNullable<Awaited<ReturnType<typeof getSubmissionForReview>>>;

/* ─── Compteur (badge) ─────────────────────────────────────────────────────── */

/** Nombre de soumissions à corriger visibles par ce correcteur (pour un badge). */
export async function countSubmissionsToReview(reviewer: SessionUser): Promise<number> {
  const scope = await scopeProjectFilter(reviewer);
  if (scope && scope.or.length === 0) return 0;
  return prisma.submission.count({
    where: {
      status: { in: [...REVIEWABLE] },
      ...(scope ? { project: { OR: scope.or } } : {}),
    },
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   DEVOIRS (AssessmentType.ASSIGNMENT) — dépôts déposés dans le lecteur, corrigés
   manuellement (§18). Même cloisonnement que les projets, mais un devoir est
   TOUJOURS rattaché à une formation (assessment.courseId) : le correcteur voit
   uniquement les dépôts des formations qu'il encadre (CourseInstructor).
   ══════════════════════════════════════════════════════════════════════════ */

/** Identifiants des formations encadrées par ce correcteur. `null` = admin (aucune restriction). */
async function scopeCourseIds(reviewer: SessionUser): Promise<string[] | null> {
  if (isAdmin(reviewer)) return null;
  const instructed = await prisma.courseInstructor.findMany({
    where: { userId: reviewer.id },
    select: { courseId: true },
  });
  return [...new Set(instructed.map((c) => c.courseId))];
}

/** Dépôts de devoir à corriger (status SUBMITTED) visibles par ce correcteur. */
export async function getAssignmentsToReview(reviewer: SessionUser) {
  const courseIds = await scopeCourseIds(reviewer);
  if (courseIds && courseIds.length === 0) return [];

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      status: "SUBMITTED",
      assessment: { type: "ASSIGNMENT", ...(courseIds ? { courseId: { in: courseIds } } : {}) },
    },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      attemptNumber: true,
      submittedAt: true,
      content: true,
      links: true,
      files: true,
      status: true,
      user: { select: { name: true, email: true, avatar: true } },
      assessment: {
        select: {
          title: true,
          passingScore: true,
          course: { select: { title: true, slug: true } },
          module: { select: { title: true } },
        },
      },
    },
  });

  return attempts.map((a) => ({
    id: a.id,
    attemptNumber: a.attemptNumber,
    submittedAt: a.submittedAt,
    status: a.status,
    content: a.content,
    links: asLinks(a.links),
    files: asFiles(a.files),
    user: a.user,
    assessment: {
      title: a.assessment.title,
      passingScore: a.assessment.passingScore,
      course: a.assessment.course,
      moduleTitle: a.assessment.module?.title ?? null,
    },
  }));
}

export type AssignmentQueueItem = Awaited<ReturnType<typeof getAssignmentsToReview>>[number];

/** Fiche de correction d'un dépôt de devoir. `null` si non autorisé/introuvable/déjà corrigé. */
export async function getAssignmentForReview(id: string, reviewer: SessionUser) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id },
    select: {
      id: true,
      attemptNumber: true,
      status: true,
      content: true,
      links: true,
      files: true,
      score: true,
      feedback: true,
      submittedAt: true,
      userId: true,
      assessmentId: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
      assessment: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          passingScore: true,
          attemptsAllowed: true,
          isRequired: true,
          courseId: true,
          module: { select: { title: true } },
          course: { select: { title: true, slug: true } },
        },
      },
    },
  });
  if (!attempt || attempt.assessment.type !== "ASSIGNMENT") return null;
  if (attempt.status !== "SUBMITTED") return null;

  if (!isAdmin(reviewer)) {
    const allowed = await prisma.courseInstructor.findFirst({
      where: { courseId: attempt.assessment.courseId, userId: reviewer.id },
      select: { id: true },
    });
    if (!allowed) return null;
  }

  const history = await prisma.assessmentAttempt.findMany({
    where: { assessmentId: attempt.assessmentId, userId: attempt.userId, id: { not: attempt.id } },
    orderBy: { attemptNumber: "desc" },
    select: { id: true, attemptNumber: true, status: true, score: true, feedback: true, submittedAt: true, gradedAt: true },
  });

  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    content: attempt.content,
    links: asLinks(attempt.links),
    files: asFiles(attempt.files),
    submittedAt: attempt.submittedAt,
    learner: attempt.user,
    assessment: {
      id: attempt.assessment.id,
      title: attempt.assessment.title,
      description: attempt.assessment.description,
      passingScore: attempt.assessment.passingScore,
      attemptsAllowed: attempt.assessment.attemptsAllowed,
      isRequired: attempt.assessment.isRequired,
      moduleTitle: attempt.assessment.module?.title ?? null,
      course: attempt.assessment.course,
    },
    history,
  };
}

export type AssignmentReviewDetail = NonNullable<Awaited<ReturnType<typeof getAssignmentForReview>>>;

/** Nombre de dépôts de devoir à corriger visibles par ce correcteur (badge). */
export async function countAssignmentsToReview(reviewer: SessionUser): Promise<number> {
  const courseIds = await scopeCourseIds(reviewer);
  if (courseIds && courseIds.length === 0) return 0;
  return prisma.assessmentAttempt.count({
    where: {
      status: "SUBMITTED",
      assessment: { type: "ASSIGNMENT", ...(courseIds ? { courseId: { in: courseIds } } : {}) },
    },
  });
}

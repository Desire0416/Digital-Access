import { prisma } from "@da/db/client";
import type { Level } from "./types";
import type {
  ProjectCard,
  ProjectWorkspace,
  MySubmission,
  ReviewQueueItem,
  ReviewDetail,
  PublicCertificate,
  SubmissionLink,
  SubmissionFile,
  RubricCriterion,
  SubmissionStatus,
} from "./project-types";

/* ══════════════════════════════════════════════════════════════════════════
   Lecture du moteur de projets & certification. Sécurité niveau ligne côté
   apprenant (learnerId === utilisateur). La file de relecture est protégée en
   amont par requireRole (voir les pages). Requêtes résilientes (try/catch).
   ══════════════════════════════════════════════════════════════════════════ */

function asLinks(raw: unknown): SubmissionLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is { label?: unknown; url?: unknown } => Boolean(l) && typeof l === "object")
    .map((l) => ({ label: String((l as { label?: unknown }).label ?? "Lien"), url: String((l as { url?: unknown }).url ?? "") }))
    .filter((l) => l.url);
}
function asFiles(raw: unknown): SubmissionFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is { url?: unknown; name?: unknown } => Boolean(f) && typeof f === "object")
    .map((f) => ({ url: String((f as { url?: unknown }).url ?? ""), name: String((f as { name?: unknown }).name ?? "Fichier") }))
    .filter((f) => f.url);
}
function asCriteria(raw: unknown): RubricCriterion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
    .map((c) => ({
      label: String(c.label ?? "Critère"),
      points: Number(c.points ?? 0),
      description: c.description ? String(c.description) : undefined,
    }));
}

function mapSubmission(s: {
  id: string;
  status: string;
  links: unknown;
  files: unknown;
  comment: string | null;
  aiDeclaration: string | null;
  score: number | null;
  feedback: string | null;
  version: number;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewer: { name: string } | null;
}): MySubmission {
  return {
    id: s.id,
    status: s.status as SubmissionStatus,
    links: asLinks(s.links),
    files: asFiles(s.files),
    comment: s.comment,
    aiDeclaration: s.aiDeclaration,
    score: s.score,
    feedback: s.feedback,
    version: s.version,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    reviewerName: s.reviewer?.name ?? null,
  };
}

/** Projets des parcours suivis par l'apprenant + statut de sa soumission. */
export async function getMyProjects(userId: string): Promise<ProjectCard[]> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { learnerId: userId, careerPathId: { not: null } },
      select: {
        careerPath: {
          select: {
            title: true,
            slug: true,
            projects: {
              where: { status: "PUBLISHED" },
              orderBy: { createdAt: "asc" },
              select: {
                id: true, slug: true, title: true, projectType: true, level: true,
                isPortfolioEligible: true, requiresSubmission: true, estimatedDuration: true,
              },
            },
          },
        },
      },
    });

    const projects = enrollments.flatMap((e) =>
      (e.careerPath?.projects ?? []).map((p) => ({ ...p, careerPathTitle: e.careerPath!.title, careerPathSlug: e.careerPath!.slug })),
    );
    if (!projects.length) return [];

    const subs = await prisma.projectSubmission.findMany({
      where: { learnerId: userId, projectId: { in: projects.map((p) => p.id) } },
      orderBy: { version: "desc" },
      select: { projectId: true, status: true, score: true },
    });
    const byProject = new Map<string, { status: string; score: number | null }>();
    for (const s of subs) if (!byProject.has(s.projectId)) byProject.set(s.projectId, { status: s.status, score: s.score });

    return projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      projectType: p.projectType,
      level: p.level as Level,
      careerPathTitle: p.careerPathTitle,
      careerPathSlug: p.careerPathSlug,
      isPortfolioEligible: p.isPortfolioEligible,
      requiresSubmission: p.requiresSubmission,
      estimatedDuration: p.estimatedDuration,
      status: (byProject.get(p.id)?.status as SubmissionStatus) ?? "NOT_STARTED",
      score: byProject.get(p.id)?.score ?? null,
    }));
  } catch {
    return [];
  }
}

/** Espace de travail d'un projet : brief + grille + ma soumission (+ accès). */
export async function getProjectWorkspace(slug: string, userId?: string): Promise<ProjectWorkspace | null> {
  try {
    const project = await prisma.professionalProject.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, projectType: true, level: true,
        context: true, problem: true, mission: true, objectives: true, deliverables: true,
        constraints: true, estimatedDuration: true, requiresDefense: true, isPortfolioEligible: true,
        careerPath: { select: { id: true, title: true, slug: true } },
        rubric: { select: { title: true, totalPoints: true, passingScore: true, criteria: true } },
      },
    });
    if (!project || !project.careerPath) return null;

    const [enrollment, submission] = await Promise.all([
      userId
        ? prisma.enrollment.findFirst({ where: { learnerId: userId, careerPathId: project.careerPath.id }, select: { id: true } })
        : Promise.resolve(null),
      userId
        ? prisma.projectSubmission.findFirst({
            where: { learnerId: userId, projectId: project.id },
            orderBy: { version: "desc" },
            select: {
              id: true, status: true, links: true, files: true, comment: true, aiDeclaration: true,
              score: true, feedback: true, version: true, submittedAt: true, reviewedAt: true,
              reviewer: { select: { name: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      projectType: project.projectType,
      level: project.level as Level,
      context: project.context,
      problem: project.problem,
      mission: project.mission,
      objectives: project.objectives,
      deliverables: project.deliverables,
      constraints: project.constraints,
      estimatedDuration: project.estimatedDuration,
      requiresDefense: project.requiresDefense,
      isPortfolioEligible: project.isPortfolioEligible,
      careerPathTitle: project.careerPath.title,
      careerPathSlug: project.careerPath.slug,
      rubric: project.rubric
        ? {
            title: project.rubric.title,
            totalPoints: project.rubric.totalPoints,
            passingScore: project.rubric.passingScore,
            criteria: asCriteria(project.rubric.criteria),
          }
        : null,
      enrolled: Boolean(enrollment),
      submission: submission ? mapSubmission(submission) : null,
    };
  } catch {
    return null;
  }
}

/** File de relecture : soumissions en attente d'évaluation (rôle relecteur requis en amont). */
export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  try {
    const subs = await prisma.projectSubmission.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: [{ submittedAt: "asc" }],
      select: {
        id: true, status: true, version: true, submittedAt: true,
        learner: { select: { name: true } },
        project: { select: { title: true, slug: true, projectType: true, careerPath: { select: { title: true } } } },
      },
    });
    return subs.map((s) => ({
      submissionId: s.id,
      projectTitle: s.project.title,
      projectSlug: s.project.slug,
      projectType: s.project.projectType,
      careerPathTitle: s.project.careerPath?.title ?? "—",
      learnerName: s.learner.name,
      status: s.status as SubmissionStatus,
      version: s.version,
      submittedAt: s.submittedAt?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

/** Détail d'une soumission pour le relecteur (rôle vérifié en amont). */
export async function getSubmissionForReview(id: string): Promise<ReviewDetail | null> {
  try {
    const s = await prisma.projectSubmission.findUnique({
      where: { id },
      select: {
        id: true, status: true, links: true, files: true, comment: true, aiDeclaration: true,
        score: true, feedback: true, version: true, submittedAt: true,
        learner: { select: { id: true, name: true, email: true } },
        project: {
          select: {
            title: true, slug: true, projectType: true, context: true, problem: true, mission: true,
            objectives: true, deliverables: true, careerPath: { select: { title: true } },
            rubric: { select: { title: true, totalPoints: true, passingScore: true, criteria: true } },
          },
        },
      },
    });
    if (!s) return null;
    return {
      submissionId: s.id,
      status: s.status as SubmissionStatus,
      links: asLinks(s.links),
      files: asFiles(s.files),
      comment: s.comment,
      aiDeclaration: s.aiDeclaration,
      score: s.score,
      feedback: s.feedback,
      version: s.version,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      learner: { id: s.learner.id, name: s.learner.name, email: s.learner.email },
      project: {
        title: s.project.title,
        slug: s.project.slug,
        projectType: s.project.projectType,
        context: s.project.context,
        problem: s.project.problem,
        mission: s.project.mission,
        objectives: s.project.objectives,
        deliverables: s.project.deliverables,
        careerPathTitle: s.project.careerPath?.title ?? "—",
      },
      rubric: s.project.rubric
        ? {
            title: s.project.rubric.title,
            totalPoints: s.project.rubric.totalPoints,
            passingScore: s.project.rubric.passingScore,
            criteria: asCriteria(s.project.rubric.criteria),
          }
        : null,
    };
  } catch {
    return null;
  }
}

/** Vérification publique d'un certificat par son numéro (aucune authentification). */
export async function getCertificateByNumber(certificateNumber: string): Promise<PublicCertificate | null> {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber },
      select: {
        title: true, certificateType: true, mention: true, finalScore: true, issuedAt: true,
        certificateNumber: true, skillsValidated: true, status: true,
        learner: { select: { name: true } },
      },
    });
    if (!cert) return null;
    return {
      valid: cert.status === "ACTIVE",
      learnerName: cert.learner.name,
      courseTitle: cert.title,
      certificateType: cert.certificateType,
      mention: cert.mention,
      finalScore: cert.finalScore,
      issuedAt: cert.issuedAt.toISOString(),
      certificateNumber: cert.certificateNumber,
      skillsValidated: cert.skillsValidated,
      status: cert.status,
    };
  } catch {
    return null;
  }
}

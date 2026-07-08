"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser, hasRole } from "@da/auth/guards";
import { createNotification } from "./notifications";
import { issueCertificateIfEligible } from "./certificates";
import type { SubmissionLink, SubmissionFile } from "./project-types";

/* ══════════════════════════════════════════════════════════════════════════
   Mutations du moteur de projets & certification.
   Apprenant : dépôt/soumission de ses propres projets (sécurité niveau ligne).
   Relecteur (REVIEWER/INSTRUCTOR/ADMIN) : évaluation → validation décerne badge
   par preuve, enrichit le portfolio et déclenche l'éligibilité au certificat.
   ══════════════════════════════════════════════════════════════════════════ */

export type ProjectResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

const REVIEWER_ROLES = ["REVIEWER", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"];

/* ─── Assainissement des entrées ───────────────────────────────────────────── */

function cleanLinks(raw: unknown): SubmissionLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map((l) => {
      const url = String((l as { url?: unknown })?.url ?? "").trim().slice(0, 500);
      const label = String((l as { label?: unknown })?.label ?? "").trim().slice(0, 120) || "Lien";
      return { label, url };
    })
    .filter((l) => /^https?:\/\//i.test(l.url));
}
function cleanFiles(raw: unknown): SubmissionFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map((f) => ({
      url: String((f as { url?: unknown })?.url ?? "").trim().slice(0, 500),
      name: (String((f as { name?: unknown })?.name ?? "").trim().slice(0, 160) || "Fichier"),
    }))
    .filter((f) => /^https?:\/\//i.test(f.url));
}

/* ─── Apprenant : brouillon & soumission ───────────────────────────────────── */

async function loadEnrolledProject(userId: string, projectId: string) {
  const project = await prisma.professionalProject.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, careerPathId: true, isPortfolioEligible: true },
  });
  if (!project || !project.careerPathId) return null;
  const enrolled = await prisma.enrollment.findFirst({
    where: { learnerId: userId, careerPathId: project.careerPathId },
    select: { id: true },
  });
  return enrolled ? project : null;
}

export async function saveSubmissionDraft(
  projectId: string,
  input: { links?: unknown; files?: unknown; comment?: unknown; aiDeclaration?: unknown },
): Promise<ProjectResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  try {
    const project = await loadEnrolledProject(user.id, projectId);
    if (!project) return { ok: false, error: "Inscrivez-vous au parcours pour déposer ce projet." };

    const latest = await prisma.projectSubmission.findFirst({
      where: { learnerId: user.id, projectId },
      orderBy: { version: "desc" },
      select: { id: true, status: true },
    });
    // Modifiable uniquement en brouillon ou après demande de révision — jamais
    // pendant l'évaluation ni une fois finalisée.
    if (latest && latest.status !== "IN_PROGRESS" && latest.status !== "REVISION_REQUESTED") {
      return {
        ok: false,
        error:
          latest.status === "SUBMITTED" || latest.status === "UNDER_REVIEW"
            ? "Votre soumission est en cours d'évaluation et ne peut pas être modifiée."
            : "Cette soumission a déjà été évaluée.",
      };
    }

    const data = {
      links: cleanLinks(input.links) as never,
      files: cleanFiles(input.files) as never,
      comment: input.comment ? String(input.comment).slice(0, 5000) : null,
      aiDeclaration: input.aiDeclaration ? String(input.aiDeclaration).slice(0, 2000) : null,
      status: "IN_PROGRESS" as const,
    };

    if (latest) {
      await prisma.projectSubmission.update({ where: { id: latest.id }, data });
    } else {
      await prisma.projectSubmission.create({ data: { ...data, learnerId: user.id, projectId, version: 1 } });
    }
    revalidatePath("/dashboard/projets");
    return { ok: true };
  } catch (e) {
    console.error("[academy] saveSubmissionDraft:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

export async function submitProject(projectId: string): Promise<ProjectResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  try {
    const project = await loadEnrolledProject(user.id, projectId);
    if (!project) return { ok: false, error: "Inscrivez-vous au parcours pour soumettre ce projet." };

    const latest = await prisma.projectSubmission.findFirst({
      where: { learnerId: user.id, projectId },
      orderBy: { version: "desc" },
      select: { id: true, status: true, version: true, links: true, files: true, aiDeclaration: true, submittedAt: true },
    });
    if (!latest) return { ok: false, error: "Enregistrez d'abord votre travail avant de le soumettre." };
    if (latest.status === "VALIDATED" || latest.status === "REJECTED") {
      return { ok: false, error: "Cette soumission a déjà été évaluée." };
    }
    if (latest.status === "SUBMITTED" || latest.status === "UNDER_REVIEW") {
      return { ok: false, error: "Votre soumission est déjà en cours d'évaluation." };
    }
    const hasDeliverable = cleanLinks(latest.links).length > 0 || cleanFiles(latest.files).length > 0;
    if (!hasDeliverable) return { ok: false, error: "Ajoutez au moins un livrable (lien ou fichier)." };
    if (!latest.aiDeclaration?.trim()) return { ok: false, error: "Renseignez la déclaration d'utilisation de l'IA." };

    // Une nouvelle soumission après une première (submittedAt déjà posé) incrémente la version.
    const version = latest.submittedAt ? latest.version + 1 : latest.version;
    await prisma.projectSubmission.update({
      where: { id: latest.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), version },
    });
    await createNotification({
      userId: user.id,
      type: "PROJECT_SUBMITTED",
      title: "Projet soumis",
      message: `Votre projet « ${project.title} » a été soumis. Un relecteur l'évaluera bientôt.`,
      link: "/dashboard/projets",
    });
    revalidatePath("/dashboard/projets");
    return { ok: true };
  } catch (e) {
    console.error("[academy] submitProject:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ─── Relecteur : évaluation ────────────────────────────────────────────────── */

async function awardProjectBadges(userId: string, projectId: string, submissionId: string) {
  const badges = await prisma.badge.findMany({
    where: { projectId, status: "PUBLISHED" },
    select: { id: true, name: true },
  });
  for (const b of badges) {
    const owned = await prisma.learnerBadge.findUnique({
      where: { learnerId_badgeId: { learnerId: userId, badgeId: b.id } },
      select: { id: true },
    });
    if (owned) continue;
    await prisma.learnerBadge.create({
      data: { learnerId: userId, badgeId: b.id, evidenceType: "PROJECT_SUBMISSION", evidenceId: submissionId, status: "ACTIVE" },
    });
    await createNotification({
      userId,
      type: "BADGE_EARNED",
      title: "Nouveau badge 🏅",
      message: `Vous avez obtenu le badge « ${b.name} » par la preuve de votre projet.`,
      link: "/dashboard/badges",
    });
  }
}

async function createPortfolioFromSubmission(
  userId: string,
  project: { id: string; title: string; mission?: string | null; problem?: string | null },
  submissionId: string,
) {
  const existing = await prisma.portfolioItem.findFirst({
    where: { learnerId: userId, projectId: project.id },
    select: { id: true },
  });
  if (existing) return;
  const sub = await prisma.projectSubmission.findUnique({
    where: { id: submissionId },
    select: { links: true, files: true },
  });
  const links = cleanLinks(sub?.links);
  const files = cleanFiles(sub?.files);
  const demoUrl = links.find((l) => /d[eé]mo|live|figma|canva|behance|drive/i.test(l.label + l.url))?.url ?? links[0]?.url ?? null;
  const sourceUrl = links.find((l) => /code|git|repo|source/i.test(l.label + l.url))?.url ?? null;
  const images = files.filter((f) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(f.url)).map((f) => f.url).slice(0, 6);

  await prisma.portfolioItem.create({
    data: {
      learnerId: userId,
      projectId: project.id,
      title: project.title,
      description: project.mission ?? null,
      problemSolved: project.problem ?? null,
      demoUrl,
      sourceUrl,
      images,
      visibility: "PRIVATE",
    },
  });
}

export async function reviewSubmission(
  submissionId: string,
  input: { decision: "validate" | "revise" | "reject"; score?: number; feedback?: string },
): Promise<ProjectResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  if (!hasRole(user, ...REVIEWER_ROLES)) return { ok: false, error: "Accès réservé aux relecteurs." };

  const { decision } = input;
  if (!["validate", "revise", "reject"].includes(decision)) return { ok: false, error: "Décision invalide." };

  try {
    const sub = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true, learnerId: true, status: true,
        project: {
          select: { id: true, title: true, mission: true, problem: true, isPortfolioEligible: true, careerPathId: true },
        },
      },
    });
    if (!sub) return { ok: false, error: "Soumission introuvable." };
    // Un relecteur ne peut pas évaluer son propre projet (koffi = INSTRUCTOR + LEARNER).
    if (sub.learnerId === user.id) return { ok: false, error: "Vous ne pouvez pas évaluer votre propre projet." };
    // On n'évalue qu'une soumission réellement en attente.
    if (sub.status !== "SUBMITTED" && sub.status !== "UNDER_REVIEW") {
      return { ok: false, error: "Cette soumission n'est pas en attente d'évaluation." };
    }

    const status = decision === "validate" ? "VALIDATED" : decision === "revise" ? "REVISION_REQUESTED" : "REJECTED";
    const score =
      decision === "reject" ? null : Math.max(0, Math.min(100, Math.round(Number(input.score ?? 0)) || 0));
    const feedback = input.feedback ? String(input.feedback).slice(0, 5000) : null;

    await prisma.projectSubmission.update({
      where: { id: sub.id },
      data: { status, score, feedback, reviewerId: user.id, reviewedAt: new Date() },
    });

    if (status === "VALIDATED") {
      // Effets idempotents et best-effort : un échec ne doit pas laisser la
      // soumission « validée mais non récompensée » ni bloquer la réponse.
      try {
        await awardProjectBadges(sub.learnerId, sub.project.id, sub.id);
        if (sub.project.isPortfolioEligible) await createPortfolioFromSubmission(sub.learnerId, sub.project, sub.id);
        if (sub.project.careerPathId) await issueCertificateIfEligible(sub.learnerId, sub.project.careerPathId);
      } catch (e) {
        console.error("[academy] reviewSubmission side-effects:", e);
      }
    }

    const msg =
      status === "VALIDATED"
        ? `Votre projet « ${sub.project.title} » a été validé. Bravo !`
        : status === "REVISION_REQUESTED"
          ? `Votre projet « ${sub.project.title} » nécessite quelques révisions. Consultez le retour du relecteur.`
          : `Votre projet « ${sub.project.title} » n'a pas été retenu. Consultez le retour pour progresser.`;
    await createNotification({
      userId: sub.learnerId,
      type: "PROJECT_FEEDBACK",
      title: status === "VALIDATED" ? "Projet validé ✅" : "Retour sur votre projet",
      message: msg,
      link: "/dashboard/projets",
    });

    revalidatePath("/reviews");
    revalidatePath("/dashboard/projets");
    return { ok: true, status };
  } catch (e) {
    console.error("[academy] reviewSubmission:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

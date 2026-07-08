import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@da/db/client";
import { createNotification } from "./notifications";

/* ══════════════════════════════════════════════════════════════════════════
   Délivrance de certificats vérifiables. Règle CDC : « pas de certification sans
   projet ». Un certificat de parcours n'est émis que si l'inscription est
   TERMINÉE (toutes les leçons) ET tous les projets requis du parcours sont
   VALIDÉS. Idempotent (un seul certificat par apprenant/parcours).
   ══════════════════════════════════════════════════════════════════════════ */

/** Base URL réelle de la requête (→ liens de vérification corrects), repli env/localhost. */
export async function academyBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* hors contexte requête */
  }
  return process.env.NEXT_PUBLIC_ACADEMY_URL || "http://localhost:3001";
}

function mentionFor(score: number): "EXCELLENCE" | "VERY_GOOD" | "GOOD" | "VALIDATED" {
  if (score >= 90) return "EXCELLENCE";
  if (score >= 80) return "VERY_GOOD";
  if (score >= 70) return "GOOD";
  return "VALIDATED";
}

async function uniqueCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 6; i++) {
    const code = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const number = `DA-${year}-${code}`;
    const clash = await prisma.certificate.findUnique({ where: { certificateNumber: number }, select: { id: true } });
    if (!clash) return number;
  }
  return `DA-${year}-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

/**
 * Délivre le certificat d'un parcours si l'apprenant y est éligible. Renvoie le
 * certificat (créé ou existant) ou null si non éligible. Ne lève jamais.
 */
export async function issueCertificateIfEligible(
  userId: string,
  careerPathId: string,
): Promise<{ id: string; certificateNumber: string; created: boolean } | null> {
  try {
    // Déjà délivré ?
    const existing = await prisma.certificate.findFirst({
      where: { learnerId: userId, careerPathId },
      select: { id: true, certificateNumber: true },
    });
    if (existing) return { ...existing, created: false };

    // Parcours terminé (toutes les leçons) ?
    const enrollment = await prisma.enrollment.findFirst({
      where: { learnerId: userId, careerPathId, status: "COMPLETED" },
      select: { id: true },
    });
    if (!enrollment) return null;

    const path = await prisma.careerPath.findUnique({
      where: { id: careerPathId },
      select: {
        title: true,
        certificateTitle: true,
        skills: { select: { skill: { select: { name: true } } } },
        projects: { where: { status: "PUBLISHED", requiresSubmission: true }, select: { id: true } },
      },
    });
    if (!path) return null;

    // Tous les projets requis validés ?
    const requiredIds = path.projects.map((p) => p.id);
    let finalScore = 85;
    if (requiredIds.length) {
      const validated = await prisma.projectSubmission.findMany({
        where: { learnerId: userId, projectId: { in: requiredIds }, status: "VALIDATED" },
        select: { projectId: true, score: true },
      });
      const validatedProjectIds = new Set(validated.map((v) => v.projectId));
      if (validatedProjectIds.size < requiredIds.length) return null; // preuve incomplète
      // Moyenne sur les scores réels (0 inclus ; on n'écarte que les scores absents).
      const scores = validated.map((v) => v.score).filter((s): s is number => s != null);
      if (scores.length) finalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    const number = await uniqueCertificateNumber();
    const verifyUrl = `${await academyBaseUrl()}/verify/${number}`;
    let cert: { id: string; certificateNumber: string };
    try {
      cert = await prisma.certificate.create({
        data: {
          learnerId: userId,
          careerPathId,
          certificateType: "CAREER_PATH",
          title: path.certificateTitle ?? path.title,
          skillsValidated: path.skills.map((s) => s.skill.name).slice(0, 8),
          projectsValidated: requiredIds,
          finalScore,
          mention: mentionFor(finalScore),
          certificateNumber: number,
          verificationUrl: verifyUrl,
          status: "ACTIVE",
        },
        select: { id: true, certificateNumber: true },
      });
    } catch (err) {
      // Course concurrente : la contrainte @@unique(learnerId, careerPathId) a
      // rejeté le doublon — on renvoie le certificat déjà émis.
      const race = await prisma.certificate.findFirst({
        where: { learnerId: userId, careerPathId },
        select: { id: true, certificateNumber: true },
      });
      if (race) return { ...race, created: false };
      throw err;
    }

    await createNotification({
      userId,
      type: "CERTIFICATE_ISSUED",
      title: "Certificat délivré 🎓",
      message: `Félicitations ! Votre certificat « ${cert.certificateNumber} » pour « ${path.title} » est disponible.`,
      link: "/dashboard/certificats",
    });

    return { ...cert, created: true };
  } catch (e) {
    console.error("[academy] issueCertificateIfEligible:", e);
    return null;
  }
}

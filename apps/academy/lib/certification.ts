import "server-only";
import { randomBytes } from "node:crypto";
import { prisma, type Certificate } from "@da/academy-db/client";
import { sendCertificateEmail } from "@da/email";
import { createNotification } from "./notify";
import { requireAdminFresh } from "./guards";
import { siteConfig } from "./site";

/* ══════════════════════════════════════════════════════════════════════════
   Certification (cahier §20, statuts §41.6, règles 40.9 / 40.11 / 40.12).
   · Numéro : DA-AC-<année>-<6 hex>  · Code de vérification public court unique
   · Délivrance IDEMPOTENTE : un certificat ACTIF existant est simplement rendu
   · Toute révocation est tracée dans le journal d'audit (règle 40.12)
   ══════════════════════════════════════════════════════════════════════════ */

/** Alphabet sans caractères ambigus (0/O, 1/I/L) pour le code public. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

function certificateNumber(): string {
  return `DA-AC-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Génère numéro + code de vérification garantis uniques en base. */
async function uniqueIdentifiers(): Promise<{ number: string; verifyCode: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = certificateNumber();
    const verifyCode = randomCode(10);
    const clash = await prisma.certificate.findFirst({
      where: { OR: [{ number }, { verifyCode }] },
      select: { id: true },
    });
    if (!clash) return { number, verifyCode };
  }
  // Improbable — on élargit l'entropie en dernier recours.
  return {
    number: `DA-AC-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    verifyCode: randomCode(14),
  };
}

function mentionForScore(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Très bien";
  if (score >= 70) return "Bien";
  return "Passable";
}

/** Moyenne des meilleurs scores réussis sur les évaluations obligatoires d'une formation. */
async function averageCourseScore(userId: string, courseId: string): Promise<number | null> {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      passed: true,
      score: { not: null },
      assessment: { courseId, isRequired: true, status: "PUBLISHED" },
    },
    select: { assessmentId: true, score: true },
  });
  if (attempts.length === 0) return null;
  const bestByAssessment = new Map<string, number>();
  for (const a of attempts) {
    const prev = bestByAssessment.get(a.assessmentId) ?? 0;
    if ((a.score ?? 0) > prev) bestByAssessment.set(a.assessmentId, a.score ?? 0);
  }
  const scores = [...bestByAssessment.values()];
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

async function notifyCertificate(userId: string, cert: { title: string; verifyCode: string }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (user) {
      await sendCertificateEmail(user.email, {
        name: user.name,
        courseTitle: cert.title,
        certificatesUrl: `${siteConfig.url}/espace/certificats`,
        verifyUrl: `${siteConfig.url}/certificats/verifier?code=${cert.verifyCode}`,
        code: cert.verifyCode,
      });
    }
  } catch {
    // L'email ne doit jamais bloquer la délivrance.
  }
  await createNotification({
    userId,
    type: "CERTIFICATE",
    title: "Certificat délivré 🎓",
    message: `Félicitations ! Votre certificat « ${cert.title} » est disponible.`,
    link: "/espace/certificats",
  });
}

/**
 * Délivre le certificat de FORMATION (type COURSE). Idempotent : si un
 * certificat actif existe déjà pour (userId, courseId), il est retourné tel quel.
 */
export async function issueCourseCertificate(userId: string, courseId: string): Promise<Certificate | null> {
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId, type: "COURSE", status: "ACTIVE" },
  });
  if (existing) return existing;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      certificateTitle: true,
      skills: { select: { skill: { select: { name: true } } } },
    },
  });
  if (!course) return null;

  const score = await averageCourseScore(userId, courseId);
  const ids = await uniqueIdentifiers();

  const cert = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      type: "COURSE",
      title: course.certificateTitle ?? course.title,
      number: ids.number,
      verifyCode: ids.verifyCode,
      status: "ACTIVE",
      score,
      mention: mentionForScore(score),
      skills: course.skills.map((s) => s.skill.name),
    },
  });

  await notifyCertificate(userId, cert);
  return cert;
}

/**
 * Délivre le certificat de PARCOURS (type CAREER_PATH). Idempotent.
 * Compétences = union des compétences de toutes les formations du parcours.
 */
export async function issueCareerPathCertificate(userId: string, careerPathId: string): Promise<Certificate | null> {
  const existing = await prisma.certificate.findFirst({
    where: { userId, careerPathId, type: "CAREER_PATH", status: "ACTIVE" },
  });
  if (existing) return existing;

  const path = await prisma.careerPath.findUnique({
    where: { id: careerPathId },
    select: {
      title: true,
      certificationTitle: true,
      courses: {
        select: { course: { select: { skills: { select: { skill: { select: { name: true } } } } } } },
      },
    },
  });
  if (!path) return null;

  const skills = [...new Set(path.courses.flatMap((c) => c.course.skills.map((s) => s.skill.name)))];
  const ids = await uniqueIdentifiers();

  const cert = await prisma.certificate.create({
    data: {
      userId,
      careerPathId,
      type: "CAREER_PATH",
      title: path.certificationTitle ?? `Certification métier — ${path.title}`,
      number: ids.number,
      verifyCode: ids.verifyCode,
      status: "ACTIVE",
      skills,
    },
  });

  await notifyCertificate(userId, cert);
  return cert;
}

/* ─── Vérification publique (cahier §20.4, page /certificats/verifier) ────── */

export type CertificateVerification =
  | {
      valid: true;
      status: "ACTIVE";
      holderName: string;
      title: string;
      type: string;
      number: string;
      mention: string | null;
      skills: string[];
      issuedAt: Date;
    }
  | { valid: false; reason: "NOT_FOUND" | "REVOKED" | "SUSPENDED" | "EXPIRED" | "REPLACED"; title?: string; revokedAt?: Date | null };

export async function verifyCertificate(code: string): Promise<CertificateVerification> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { valid: false, reason: "NOT_FOUND" };

  const cert = await prisma.certificate.findUnique({
    where: { verifyCode: clean },
    select: {
      title: true,
      type: true,
      number: true,
      status: true,
      mention: true,
      skills: true,
      issuedAt: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { name: true } },
    },
  });
  if (!cert) return { valid: false, reason: "NOT_FOUND" };

  if (cert.status === "REVOKED") return { valid: false, reason: "REVOKED", title: cert.title, revokedAt: cert.revokedAt };
  if (cert.status === "SUSPENDED") return { valid: false, reason: "SUSPENDED", title: cert.title };
  if (cert.status === "REPLACED") return { valid: false, reason: "REPLACED", title: cert.title };
  if (cert.status === "EXPIRED" || (cert.expiresAt && cert.expiresAt < new Date()))
    return { valid: false, reason: "EXPIRED", title: cert.title };

  return {
    valid: true,
    status: "ACTIVE",
    holderName: cert.user.name,
    title: cert.title,
    type: cert.type,
    number: cert.number,
    mention: cert.mention,
    skills: cert.skills,
    issuedAt: cert.issuedAt,
  };
}

/* ─── Révocation / restauration (admin, règle 40.12 : toujours auditée) ───── */

export async function revokeCertificate(
  certificateId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };
  if (!reason.trim()) return { ok: false, error: "La raison de la révocation est obligatoire." };

  const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { id: true, userId: true, title: true } });
  if (!cert) return { ok: false, error: "Certificat introuvable." };

  await prisma.$transaction([
    prisma.certificate.update({
      where: { id: certificateId },
      data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason.trim() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "certificate.revoke",
        entity: "Certificate",
        entityId: certificateId,
        meta: { reason: reason.trim(), holderId: cert.userId, title: cert.title },
      },
    }),
  ]);

  await createNotification({
    userId: cert.userId,
    type: "CERTIFICATE",
    title: "Certificat révoqué",
    message: `Votre certificat « ${cert.title} » a été révoqué. Motif : ${reason.trim()}`,
    link: "/espace/certificats",
  });
  return { ok: true };
}

export async function restoreCertificate(certificateId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, select: { id: true, userId: true, title: true } });
  if (!cert) return { ok: false, error: "Certificat introuvable." };

  await prisma.$transaction([
    prisma.certificate.update({
      where: { id: certificateId },
      data: { status: "ACTIVE", revokedAt: null, revokedReason: null },
    }),
    prisma.auditLog.create({
      data: { actorId: admin.id, action: "certificate.restore", entity: "Certificate", entityId: certificateId },
    }),
  ]);
  return { ok: true };
}

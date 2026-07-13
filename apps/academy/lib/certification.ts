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
  return `DA-AC-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Violation de contrainte d'unicité Prisma (index partiel un-certificat-actif). */
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
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
    number: `DA-AC-${new Date().getFullYear()}-${randomBytes(6).toString("hex").toUpperCase()}`,
    verifyCode: randomCode(14),
  };
}

type CertificateCreateData = Parameters<typeof prisma.certificate.create>[0]["data"];

/**
 * Crée un certificat de façon RÉSILIENTE et IDEMPOTENTE. La contrainte P2002
 * peut provenir de DEUX sources distinctes que la génération pré-contrôlée ne
 * ferme pas totalement (TOCTOU) : (a) l'index partiel « un seul certificat
 * ACTIF par cible/type » → le doublon existe déjà, on le renvoie ; (b) une
 * collision improbable sur `number`/`verifyCode` @unique → on régénère les
 * identifiants et on réessaie. On NE lève JAMAIS un P2002 hors de la fonction
 * (l'émission est awaited sans garde depuis les Server Actions).
 * `created` distingue une vraie création (→ notifier) d'un renvoi d'existant.
 */
async function createCertificateResilient(
  buildData: (ids: { number: string; verifyCode: string }) => CertificateCreateData,
  findExisting: () => Promise<Certificate | null>,
): Promise<{ cert: Certificate; created: boolean } | null> {
  const pre = await findExisting();
  if (pre) return { cert: pre, created: false };

  for (let attempt = 0; attempt < 3; attempt++) {
    const ids = await uniqueIdentifiers();
    try {
      const cert = await prisma.certificate.create({ data: buildData(ids) });
      return { cert, created: true };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e; // erreur DB réelle : laisser remonter
      // Doublon de cible (index partiel) → renvoyer l'existant ; sinon collision
      // d'identifiants → nouvelle tentative avec de nouveaux number/verifyCode.
      const existing = await findExisting();
      if (existing) return { cert: existing, created: false };
    }
  }
  return null; // 3 collisions d'identifiants d'affilée (quasi impossible)
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
 * Une formation est « validée » (certificat de RÉUSSITE) si elle comporte au
 * moins une évaluation obligatoire OU un projet obligatoire publié à réussir.
 * À défaut (formation de contenu seul), on délivre une ATTESTATION de
 * participation (§20.1). Comme la formation n'est marquée COMPLETED qu'après
 * avoir passé toutes ses évaluations/projets obligatoires, l'existence d'au
 * moins un requis suffit à distinguer réussite validée et simple suivi.
 */
async function courseRequiresValidation(courseId: string): Promise<boolean> {
  const [assessments, projects] = await Promise.all([
    prisma.assessment.count({ where: { courseId, isRequired: true, status: "PUBLISHED" } }),
    prisma.project.count({ where: { courseId, isRequired: true, status: "PUBLISHED" } }),
  ]);
  return assessments + projects > 0;
}

/**
 * Délivre le certificat de FORMATION. Idempotent : si un crédential actif de
 * formation (COURSE ou PARTICIPATION) existe déjà pour (userId, courseId), il
 * est retourné tel quel. Le type dépend de la présence d'évaluations/projets
 * obligatoires : COURSE (réussite validée) sinon PARTICIPATION (attestation).
 * Pour une formation validée, un badge de compétence est aussi émis (§20.1).
 */
export async function issueCourseCertificate(userId: string, courseId: string): Promise<Certificate | null> {
  const findExisting = () =>
    prisma.certificate.findFirst({
      where: { userId, courseId, type: { in: ["COURSE", "PARTICIPATION"] }, status: "ACTIVE" },
    });

  const existing = await findExisting();
  if (existing) {
    // Filet idempotent : si le crédential existant est un certificat de FORMATION
    // validée, s'assurer que son badge de compétence existe aussi (utile dans la
    // course de deux complétions concurrentes ; sans effet si le badge existe déjà).
    if (existing.type === "COURSE") await issueSkillBadge(userId, courseId).catch(() => null);
    return existing;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      certificateTitle: true,
      skills: { select: { skill: { select: { name: true } } } },
    },
  });
  if (!course) return null;

  const validated = await courseRequiresValidation(courseId);
  const type = validated ? "COURSE" : "PARTICIPATION";
  const score = validated ? await averageCourseScore(userId, courseId) : null;

  const res = await createCertificateResilient(
    (ids) => ({
      userId,
      courseId,
      type,
      title: course.certificateTitle ?? course.title,
      number: ids.number,
      verifyCode: ids.verifyCode,
      status: "ACTIVE",
      score,
      mention: validated ? mentionForScore(score) : null,
      skills: course.skills.map((s) => s.skill.name),
    }),
    findExisting,
  );
  if (!res) return null;

  if (res.created) await notifyCertificate(userId, res.cert);
  if (validated) await issueSkillBadge(userId, courseId).catch(() => null);
  return res.cert;
}

/**
 * Délivre le BADGE DE COMPÉTENCE (§20.1) d'une formation validée. Un badge par
 * formation (contrainte de l'index partiel un-actif-par (userId, courseId, type)),
 * portant les compétences PRIMAIRES rattachées (à défaut, toutes les compétences).
 * Idempotent ; silencieux (pas d'email/notif — surfacé dans « Mes certificats »).
 */
async function issueSkillBadge(userId: string, courseId: string): Promise<Certificate | null> {
  const findExisting = () =>
    prisma.certificate.findFirst({ where: { userId, courseId, type: "SKILL_BADGE", status: "ACTIVE" } });

  const existing = await findExisting();
  if (existing) return existing;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      skills: { select: { isPrimary: true, skill: { select: { name: true } } } },
    },
  });
  if (!course) return null;

  const primary = course.skills.filter((s) => s.isPrimary).map((s) => s.skill.name);
  const names = primary.length > 0 ? primary : course.skills.map((s) => s.skill.name);
  if (names.length === 0) return null; // pas de compétence rattachée → pas de badge

  const title = names.length === 1 ? `Badge de compétence — ${names[0]}` : `Badge de compétences — ${course.title}`;

  const res = await createCertificateResilient(
    (ids) => ({
      userId,
      courseId,
      type: "SKILL_BADGE",
      title,
      number: ids.number,
      verifyCode: ids.verifyCode,
      status: "ACTIVE",
      skills: names,
    }),
    findExisting,
  );
  return res?.cert ?? null;
}

/**
 * Délivre le certificat de PARCOURS (type CAREER_PATH). Idempotent.
 * Compétences = union des compétences de toutes les formations du parcours.
 */
export async function issueCareerPathCertificate(userId: string, careerPathId: string): Promise<Certificate | null> {
  const findExisting = () =>
    prisma.certificate.findFirst({ where: { userId, careerPathId, type: "CAREER_PATH", status: "ACTIVE" } });

  const existing = await findExisting();
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

  const res = await createCertificateResilient(
    (ids) => ({
      userId,
      careerPathId,
      type: "CAREER_PATH",
      title: path.certificationTitle ?? `Certification métier — ${path.title}`,
      number: ids.number,
      verifyCode: ids.verifyCode,
      status: "ACTIVE",
      skills,
    }),
    findExisting,
  );
  if (!res) return null;

  if (res.created) await notifyCertificate(userId, res.cert);
  return res.cert;
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

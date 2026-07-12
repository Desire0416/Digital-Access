"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type EnrollmentStatus } from "@da/academy-db/client";
import { currentUser, requireAdminFresh } from "./guards";
import { ACQUIRED_STATUSES, computeCareerPathPricing, type CareerPathPricing } from "./pricing";
import { createNotification } from "./notify";
import { siteConfig, paymentConfig, formatFCFA } from "./site";
import { sendPaymentSubmittedEmail, sendPaymentApprovedEmail, sendPaymentRejectedEmail } from "@da/email";

/* ══════════════════════════════════════════════════════════════════════════
   Paiement Mobile Money MANUEL (cahier §27, statuts §41.5).
   INVARIANT ABSOLU : déposer une preuve crée un Payment PENDING et RIEN
   d'autre. Seule l'approbation d'un administrateur (relu en base) crée les
   inscriptions. FK directes Payment.courseId / Payment.careerPathId.
   Montants TOUJOURS recalculés côté serveur (reconnaissance des acquis §27.4).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export type PaymentActionResult = { ok: true; message?: string } | { ok: false; error: string };

export interface CheckoutInfo {
  kind: "formation" | "parcours";
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  /** Niveau (CourseLevel) pour l'en-tête récapitulatif. */
  level: string | null;
  /** Nom de l'école de rattachement (si présente). */
  schoolName: string | null;
  /** Montant à payer, calculé côté serveur (FCFA). */
  amount: number;
  /** Détail parcours : prix plein / déduction acquis (§27.4). */
  pricing: CareerPathPricing | null;
  alreadyAcquired: boolean;
  pendingPayment: boolean;
}

/**
 * Informations de paiement pour /paiement/formation/[slug] ou
 * /paiement/parcours/[slug]. L'utilisateur est TOUJOURS celui de la session.
 */
export async function getCheckoutInfo(
  type: "formation" | "parcours",
  slug: string,
): Promise<{ ok: true; data: CheckoutInfo } | { ok: false; error: string }> {
  const parsed = z.object({ type: z.enum(["formation", "parcours"]), slug: z.string().min(1) }).safeParse({ type, slug });
  if (!parsed.success) return { ok: false, error: "Demande invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter pour payer." };

  if (parsed.data.type === "formation") {
    const course = await prisma.course.findUnique({
      where: { slug: parsed.data.slug },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        coverImage: true,
        status: true,
        level: true,
        schools: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: { school: { select: { name: true } } },
        },
      },
    });
    if (!course || course.status !== "PUBLISHED") return { ok: false, error: "Cette formation n'est pas disponible." };

    const [enrollment, pending] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        select: { status: true },
      }),
      prisma.payment.findFirst({
        where: { userId: user.id, courseId: course.id, status: "PENDING" },
        select: { id: true },
      }),
    ]);

    return {
      ok: true,
      data: {
        kind: "formation",
        id: course.id,
        slug: course.slug,
        title: course.title,
        coverImage: course.coverImage,
        level: course.level,
        schoolName: course.schools[0]?.school.name ?? null,
        amount: course.price,
        pricing: null,
        alreadyAcquired: !!enrollment && ACQUIRED.includes(enrollment.status),
        pendingPayment: !!pending,
      },
    };
  }

  const path = await prisma.careerPath.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      status: true,
      entryLevel: true,
      schools: {
        orderBy: { isPrimary: "desc" },
        take: 1,
        select: { school: { select: { name: true } } },
      },
    },
  });
  if (!path || path.status !== "PUBLISHED") return { ok: false, error: "Ce parcours n'est pas disponible." };

  const [pathEnrollment, pending, pricing] = await Promise.all([
    prisma.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId: user.id, careerPathId: path.id } },
      select: { status: true },
    }),
    prisma.payment.findFirst({
      where: { userId: user.id, careerPathId: path.id, status: "PENDING" },
      select: { id: true },
    }),
    computeCareerPathPricing(path.id, user.id),
  ]);

  return {
    ok: true,
    data: {
      kind: "parcours",
      id: path.id,
      slug: path.slug,
      title: path.title,
      coverImage: path.coverImage,
      level: path.entryLevel,
      schoolName: path.schools[0]?.school.name ?? null,
      amount: pricing.finalPrice,
      pricing,
      alreadyAcquired: !!pathEnrollment && ACQUIRED.includes(pathEnrollment.status),
      pendingPayment: !!pending,
    },
  };
}

/* ─── Dépôt de preuve → Payment PENDING (et RIEN d'autre) ──────────────────── */

const submitPaymentSchema = z.object({
  type: z.enum(["formation", "parcours"]),
  slug: z.string().min(1),
  operator: z.enum(["ORANGE", "MTN", "WAVE"]),
  reference: z
    .string()
    .trim()
    .min(6, "L'identifiant de transaction doit contenir au moins 6 caractères.")
    .max(64),
  payerPhone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(30),
  proofUrl: z.string().url("La capture de preuve est obligatoire."),
});

export type SubmitPaymentInput = z.input<typeof submitPaymentSchema>;

export async function submitManualPayment(input: SubmitPaymentInput): Promise<PaymentActionResult> {
  const parsed = submitPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre adresse email avant tout paiement." };

  // Montant + cible recalculés côté serveur — jamais depuis le client.
  const info = await getCheckoutInfo(data.type, data.slug);
  if (!info.ok) return info;
  const target = info.data;

  if (target.alreadyAcquired) {
    return { ok: false, error: data.type === "formation" ? "Vous avez déjà accès à cette formation." : "Vous êtes déjà inscrit(e) à ce parcours." };
  }
  if (target.pendingPayment) {
    return { ok: false, error: `Un paiement est déjà en attente de validation pour cet achat. Notre équipe le vérifie ${paymentConfig.reviewDelay}.` };
  }
  if (target.amount <= 0) {
    return { ok: false, error: "Cet achat est gratuit pour vous : utilisez le bouton d'inscription directe." };
  }

  try {
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: target.amount,
        currency: "XOF",
        provider: "MOBILE_MONEY",
        status: "PENDING", // ⚠️ INVARIANT : aucune inscription ici.
        purpose: data.type === "formation" ? "COURSE" : "CAREER_PATH",
        courseId: data.type === "formation" ? target.id : null,
        careerPathId: data.type === "parcours" ? target.id : null,
        reference: data.reference,
        operator: data.operator,
        payerPhone: data.payerPhone,
        proofUrl: data.proofUrl,
        ...(target.pricing
          ? { metadata: { fullPrice: target.pricing.fullPrice, deduction: target.pricing.deduction, acquiredCourseIds: target.pricing.acquiredCourses.map((c) => c.id) } }
          : {}),
      },
    });
  } catch (err) {
    // reference @unique : anti-doublon d'ID de transaction.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Cet identifiant de transaction a déjà été utilisé. Vérifiez votre reçu Mobile Money." };
    }
    throw err;
  }

  await createNotification({
    userId: user.id,
    type: "PAYMENT",
    title: "Preuve de paiement reçue",
    message: `Votre paiement pour « ${target.title} » est en cours de vérification (${formatFCFA(target.amount)}).`,
    link: "/espace/formations",
  });

  try {
    await sendPaymentSubmittedEmail(siteConfig.contactEmail, {
      learnerName: user.name,
      learnerEmail: user.email,
      courseTitle: target.title,
      amountLabel: formatFCFA(target.amount),
      operator: data.operator,
      payerPhone: data.payerPhone,
      transactionId: data.reference,
      reference: data.reference,
      adminUrl: `${siteConfig.url}/admin/paiements`,
    });
  } catch {
    /* l'email admin ne bloque jamais le dépôt */
  }

  return {
    ok: true,
    message: `Preuve envoyée ! Notre équipe valide votre paiement ${paymentConfig.reviewDelay}. Vous serez notifié(e) dès l'ouverture de l'accès.`,
  };
}

/* ─── Approbation admin → SEULE source de création des inscriptions ────────── */

export async function approvePayment(paymentId: string): Promise<PaymentActionResult> {
  const parsed = z.string().min(1).safeParse(paymentId);
  if (!parsed.success) return { ok: false, error: "Paiement invalide." };

  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      status: true,
      purpose: true,
      amount: true,
      reference: true,
      userId: true,
      user: { select: { name: true, email: true } },
      courseId: true,
      course: { select: { id: true, slug: true, title: true } },
      careerPathId: true,
      careerPath: {
        select: { id: true, slug: true, title: true, courses: { select: { courseId: true, isRequired: true } } },
      },
    },
  });
  if (!payment) return { ok: false, error: "Paiement introuvable." };
  if (payment.status !== "PENDING") return { ok: false, error: "Ce paiement a déjà été traité." };

  const targetTitle = payment.course?.title ?? payment.careerPath?.title ?? "votre achat";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", processedById: admin.id, processedAt: new Date() },
    });

    if (payment.purpose === "COURSE" && payment.courseId) {
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        select: { id: true, status: true },
      });
      if (existing && ACQUIRED.includes(existing.status)) {
        // Déjà acquis (règle 40.5) : rien à créer.
      } else if (existing) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", origin: "DIRECT", accessType: "PAID", enrolledAt: new Date() },
        });
      } else {
        await tx.enrollment.create({
          data: { userId: payment.userId, courseId: payment.courseId, status: "ACTIVE", origin: "DIRECT", accessType: "PAID" },
        });
      }
    }

    if (payment.purpose === "CAREER_PATH" && payment.careerPathId && payment.careerPath) {
      const existingPE = await tx.careerPathEnrollment.findUnique({
        where: { userId_careerPathId: { userId: payment.userId, careerPathId: payment.careerPathId } },
        select: { id: true, status: true },
      });
      if (existingPE && ACQUIRED.includes(existingPE.status)) {
        // Déjà inscrit au parcours.
      } else if (existingPE) {
        await tx.careerPathEnrollment.update({
          where: { id: existingPE.id },
          data: { status: "ACTIVE", enrolledAt: new Date() },
        });
      } else {
        await tx.careerPathEnrollment.create({
          data: { userId: payment.userId, careerPathId: payment.careerPathId, status: "ACTIVE" },
        });
      }

      // Formations obligatoires du parcours : inscrites SAUF celles déjà acquises
      // (reconnaissance des acquis — jamais dupliquées, règle 40.6).
      const requiredIds = payment.careerPath.courses.filter((c) => c.isRequired).map((c) => c.courseId);
      if (requiredIds.length > 0) {
        const existingEnrollments = await tx.enrollment.findMany({
          where: { userId: payment.userId, courseId: { in: requiredIds } },
          select: { id: true, courseId: true, status: true },
        });
        const byCourse = new Map(existingEnrollments.map((e) => [e.courseId, e]));
        for (const courseId of requiredIds) {
          const existing = byCourse.get(courseId);
          if (existing && ACQUIRED.includes(existing.status)) continue;
          if (existing) {
            await tx.enrollment.update({
              where: { id: existing.id },
              data: { status: "ACTIVE", origin: "CAREER_PATH", accessType: "PAID", enrolledAt: new Date() },
            });
          } else {
            await tx.enrollment.create({
              data: { userId: payment.userId, courseId, status: "ACTIVE", origin: "CAREER_PATH", accessType: "PAID" },
            });
          }
        }
      }
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT",
        title: "Paiement confirmé ✅",
        message: `Votre paiement pour « ${targetTitle} » est validé. Votre accès est ouvert !`,
        link: payment.course ? `/apprendre/${payment.course.slug}` : "/espace/parcours",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "payment.approve",
        entity: "Payment",
        entityId: payment.id,
        meta: { amount: payment.amount, purpose: payment.purpose, reference: payment.reference, learnerId: payment.userId },
      },
    });
  });

  try {
    await sendPaymentApprovedEmail(payment.user.email, {
      name: payment.user.name,
      courseTitle: targetTitle,
      courseUrl: payment.course ? `${siteConfig.url}/apprendre/${payment.course.slug}` : `${siteConfig.url}/espace/parcours`,
      amountLabel: formatFCFA(payment.amount),
      reference: payment.reference ?? payment.id,
    });
  } catch {
    /* non bloquant */
  }

  revalidatePath("/admin/paiements");
  return { ok: true, message: "Paiement approuvé — accès ouvert pour l'apprenant." };
}

export async function rejectPayment(paymentId: string, reason: string): Promise<PaymentActionResult> {
  const parsed = z
    .object({ paymentId: z.string().min(1), reason: z.string().trim().min(3, "Indiquez le motif du rejet.").max(500) })
    .safeParse({ paymentId, reason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
    select: {
      id: true,
      status: true,
      reference: true,
      userId: true,
      user: { select: { name: true, email: true } },
      course: { select: { slug: true, title: true } },
      careerPath: { select: { slug: true, title: true } },
    },
  });
  if (!payment) return { ok: false, error: "Paiement introuvable." };
  if (payment.status !== "PENDING") return { ok: false, error: "Ce paiement a déjà été traité." };

  const targetTitle = payment.course?.title ?? payment.careerPath?.title ?? "votre achat";
  const checkoutUrl = payment.course
    ? `${siteConfig.url}/paiement/formation/${payment.course.slug}`
    : payment.careerPath
      ? `${siteConfig.url}/paiement/parcours/${payment.careerPath.slug}`
      : siteConfig.url;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rejectReason: parsed.data.reason, processedById: admin.id, processedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT",
        title: "Paiement non validé",
        message: `Votre paiement pour « ${targetTitle} » n'a pas pu être validé. Motif : ${parsed.data.reason}`,
        link: checkoutUrl.replace(siteConfig.url, ""),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "payment.reject",
        entity: "Payment",
        entityId: payment.id,
        meta: { reason: parsed.data.reason, reference: payment.reference, learnerId: payment.userId },
      },
    }),
  ]);

  try {
    await sendPaymentRejectedEmail(payment.user.email, {
      name: payment.user.name,
      courseTitle: targetTitle,
      reference: payment.reference ?? payment.id,
      reason: parsed.data.reason,
      checkoutUrl,
    });
  } catch {
    /* non bloquant */
  }

  revalidatePath("/admin/paiements");
  return { ok: true, message: "Paiement rejeté — l'apprenant a été notifié." };
}

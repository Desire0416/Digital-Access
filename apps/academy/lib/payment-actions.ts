"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@da/db/client";
import { currentUser, realUser } from "@da/auth/guards";
import { createNotification } from "./notifications";
import { paymentConfig } from "./site";
import type { PaymentMeta } from "./payment-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Paiement Mobile Money MANUEL — mutations.

   INVARIANT DE SÉCURITÉ (ne jamais violer) :
   ─ Déposer une preuve NE DONNE JAMAIS accès à la formation.
   ─ Seule l'approbation par un admin (approvePayment) crée l'Enrollment.

   submitManualPayment (apprenant)  → crée un Payment PENDING. Aucune inscription.
   approvePayment      (admin réel) → transaction : Enrollment ACTIVE + Payment PAID + notif.
   rejectPayment       (admin réel) → Payment FAILED + motif + notif. Aucune inscription.
   ══════════════════════════════════════════════════════════════════════════ */

export type PayResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];
const OPERATORS = ["ORANGE", "MTN", "WAVE"] as const;
type Operator = (typeof OPERATORS)[number];

/** Ré-vérifie le VRAI utilisateur admin (jamais l'identité impersonée). */
async function requireAdminUser() {
  const me = await realUser();
  if (!me) return null;
  return me.roles.some((r) => ADMIN_ROLES.includes(r)) ? me : null;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/* ─── Apprenant : dépôt de la preuve de paiement ───────────────────────────── */

export type SubmitPaymentInput = {
  slug: string;
  operator: string;
  reference: string;
  phone: string;
  proofUrl: string;
};

/**
 * Enregistre la preuve de paiement d'un apprenant pour un parcours payant.
 * Crée un Payment PENDING — n'inscrit JAMAIS l'apprenant. L'accès est ouvert
 * par un admin après vérification (approvePayment).
 */
export async function submitManualPayment(input: SubmitPaymentInput): Promise<PayResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté pour payer une formation." };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre email avant de payer." };

  const operator = OPERATORS.includes(input.operator as Operator) ? (input.operator as Operator) : null;
  if (!operator) return { ok: false, error: "Choisissez un opérateur de paiement (Orange, MTN ou Wave)." };

  const reference = String(input.reference ?? "").trim().slice(0, 60);
  if (reference.length < 4) return { ok: false, error: "Renseignez l'identifiant (ID) de la transaction Mobile Money." };

  const proofUrl = String(input.proofUrl ?? "").trim();
  if (!/^https?:\/\//.test(proofUrl)) return { ok: false, error: "Joignez la capture d'écran de votre paiement." };

  const phone = String(input.phone ?? "").trim().slice(0, 30);

  try {
    const path = await prisma.careerPath.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
      select: { id: true, title: true, price: true },
    });
    if (!path) return { ok: false, error: "Formation introuvable." };
    if (path.price <= 0) return { ok: false, error: "Cette formation est gratuite : inscrivez-vous directement." };

    // Déjà inscrit ? Inutile de payer à nouveau.
    const enrolled = await prisma.enrollment.findFirst({
      where: { learnerId: user.id, careerPathId: path.id },
      select: { id: true },
    });
    if (enrolled) return { ok: false, error: "Vous avez déjà accès à cette formation." };

    // Un paiement déjà en attente ? On évite les doublons.
    const pending = await prisma.payment.findFirst({
      where: {
        learnerId: user.id,
        provider: "MANUAL",
        status: "PENDING",
        metadata: { path: ["targetSlug"], equals: input.slug },
      },
      select: { id: true },
    });
    if (pending) {
      return { ok: false, error: "Un paiement est déjà en attente de validation pour cette formation. Nous revenons vers vous très vite." };
    }

    const metadata: PaymentMeta = {
      operator,
      phone,
      targetType: "career-path",
      targetSlug: input.slug,
      targetTitle: path.title,
    };

    await prisma.payment.create({
      data: {
        learnerId: user.id,
        amount: path.price,
        currency: "XOF",
        provider: "MANUAL",
        status: "PENDING",
        purpose: "CAREER_PATH",
        reference,
        proofUrl,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });

    await createNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Preuve de paiement reçue",
      message: `Votre preuve pour « ${path.title} » a bien été reçue. Notre équipe la vérifie ${paymentConfig.reviewDelay} et active votre accès dès validation.`,
      link: "/dashboard/mes-cours",
    });

    revalidatePath(`/career-paths/${input.slug}`);
    revalidatePath(`/checkout/${input.slug}`);
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "Cet identifiant de transaction a déjà été soumis. Vérifiez votre ID." };
    }
    console.error("[academy] submitManualPayment:", e);
    return { ok: false, error: "Une erreur est survenue lors de l'enregistrement. Réessayez." };
  }
}

/* ─── Admin : validation / rejet d'un paiement ─────────────────────────────── */

/**
 * Approuve un paiement en attente : ouvre l'accès (Enrollment ACTIVE) de façon
 * atomique et marque le Payment PAID. C'est le SEUL point qui crée une inscription
 * suite à un paiement manuel.
 */
export async function approvePayment(paymentId: string): Promise<PayResult> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, error: "Action réservée à l'administration." };

  try {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, learnerId: true, status: true, provider: true, metadata: true },
    });
    if (!pay || pay.provider !== "MANUAL") return { ok: false, error: "Paiement introuvable." };
    if (pay.status !== "PENDING" && pay.status !== "MANUAL_REVIEW") {
      return { ok: false, error: "Ce paiement a déjà été traité." };
    }

    const meta = (pay.metadata as PaymentMeta | null) ?? null;
    const slug = meta?.targetSlug;
    if (!slug) return { ok: false, error: "Formation liée introuvable (métadonnées manquantes)." };

    const path = await prisma.careerPath.findUnique({
      where: { slug },
      select: { id: true, title: true },
    });
    if (!path) return { ok: false, error: "La formation liée à ce paiement n'existe plus." };

    // Transaction : inscription (upsert idempotent) + paiement PAID + lien.
    await prisma.$transaction(async (tx) => {
      const enr = await tx.enrollment.upsert({
        where: { learnerId_careerPathId: { learnerId: pay.learnerId, careerPathId: path.id } },
        update: { status: "ACTIVE", accessType: "PAID" },
        create: { learnerId: pay.learnerId, careerPathId: path.id, status: "ACTIVE", accessType: "PAID", progress: 0 },
        select: { id: true },
      });
      await tx.payment.update({
        where: { id: pay.id },
        data: { status: "PAID", relatedEnrollmentId: enr.id },
      });
    });

    await createNotification({
      userId: pay.learnerId,
      type: "PAYMENT_CONFIRMED",
      title: "Paiement validé — accès activé ✅",
      message: `Votre paiement pour « ${path.title} » est confirmé. Vous pouvez commencer la formation dès maintenant. Bon apprentissage !`,
      link: `/apprendre/${slug}`,
    });

    revalidatePath("/admin/paiements");
    revalidatePath(`/career-paths/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("[academy] approvePayment:", e);
    return { ok: false, error: "Une erreur est survenue lors de la validation. Réessayez." };
  }
}

/**
 * Rejette un paiement en attente avec un motif. Ne crée aucune inscription.
 * L'apprenant est notifié et peut re-soumettre une nouvelle preuve.
 */
export async function rejectPayment(paymentId: string, reason: string): Promise<PayResult> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, error: "Action réservée à l'administration." };

  const motif = String(reason ?? "").trim().slice(0, 300);

  try {
    const pay = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, learnerId: true, status: true, provider: true, metadata: true },
    });
    if (!pay || pay.provider !== "MANUAL") return { ok: false, error: "Paiement introuvable." };
    if (pay.status !== "PENDING" && pay.status !== "MANUAL_REVIEW") {
      return { ok: false, error: "Ce paiement a déjà été traité." };
    }

    const meta = (pay.metadata as PaymentMeta | null) ?? ({} as PaymentMeta);
    const updatedMeta: PaymentMeta = { ...meta, rejectionReason: motif || "Preuve non valide." };

    await prisma.payment.update({
      where: { id: pay.id },
      data: { status: "FAILED", metadata: updatedMeta as unknown as Prisma.InputJsonValue },
    });

    await createNotification({
      userId: pay.learnerId,
      type: "SYSTEM",
      title: "Paiement non validé",
      message: `Votre preuve pour « ${meta.targetTitle ?? "la formation"} » n'a pas pu être validée.${motif ? ` Motif : ${motif}.` : ""} Vous pouvez soumettre une nouvelle preuve.`,
      link: meta.targetSlug ? `/career-paths/${meta.targetSlug}` : "/dashboard",
    });

    revalidatePath("/admin/paiements");
    return { ok: true };
  } catch (e) {
    console.error("[academy] rejectPayment:", e);
    return { ok: false, error: "Une erreur est survenue lors du rejet. Réessayez." };
  }
}

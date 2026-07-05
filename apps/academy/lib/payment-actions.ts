"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { currentUser, hasRole } from "@da/auth/guards";
import {
  sendPaymentSubmittedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
} from "@da/email";
import { formatFCFA } from "@da/ui";

const ACADEMY_URL = process.env.NEXT_PUBLIC_ACADEMY_URL || "http://localhost:3001";

/** Référence humaine dérivée de l'id du paiement (déterministe, sans stockage). */
export async function paymentReference(paymentId: string): Promise<string> {
  return `PAY-${paymentId.slice(-6).toUpperCase()}`;
}
function refOf(paymentId: string): string {
  return `PAY-${paymentId.slice(-6).toUpperCase()}`;
}

/* ─────────────────── Soumission d'une preuve de paiement ─────────────────── */

const submitSchema = z.object({
  courseSlug: z.string().min(1),
  operator: z.enum(["ORANGE", "MTN", "WAVE"]),
  payerName: z.string().trim().min(2, "Le nom du payeur est requis.").max(120),
  payerPhone: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone invalide.")
    .max(25)
    .regex(/^[+0-9 ]+$/, "Numéro de téléphone invalide."),
  transactionId: z
    .string()
    .trim()
    .min(6, "L'ID de transaction figure dans le SMS de confirmation (6 caractères minimum).")
    .max(64),
  /** Capture d'écran optionnelle — dataURL JPEG/PNG compressée côté client. */
  proofImage: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Format d'image invalide.")
    .max(1_400_000, "L'image est trop lourde (1 Mo max après compression).")
    .optional(),
});

export type SubmitPaymentInput = z.input<typeof submitSchema>;
export type SubmitPaymentResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createManualPayment(
  input: SubmitPaymentInput,
): Promise<SubmitPaymentResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors };
  }
  const d = parsed.data;

  const user = await currentUser();
  if (!user) return { ok: false, error: "Connectez-vous pour finaliser votre achat." };
  if (!user.emailVerified) {
    return {
      ok: false,
      error: "Confirmez d'abord votre adresse email pour pouvoir acheter un cours.",
    };
  }

  try {
    // Le montant vient de la BASE — jamais du client.
    const course = await prisma.course.findFirst({
      where: { slug: d.courseSlug, status: "PUBLISHED", deletedAt: null },
      select: { id: true, slug: true, title: true, price: true, isFree: true },
    });
    if (!course) return { ok: false, error: "Cours introuvable." };
    if (course.isFree || course.price <= 0) {
      return { ok: false, error: "Ce cours est gratuit — inscrivez-vous directement." };
    }

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true },
    });
    if (enrolled) return { ok: false, error: "Vous avez déjà accès à ce cours." };

    // Un seul paiement en attente par utilisateur et par cours.
    const pending = await prisma.payment.findFirst({
      where: { userId: user.id, courseId: course.id, status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      return {
        ok: false,
        error: `Une vérification est déjà en cours pour ce cours (réf. ${refOf(pending.id)}). Notre équipe la traite au plus vite.`,
      };
    }

    // Anti-rejeu : un même ID de transaction Mobile Money ne sert qu'une fois.
    const usedTx = await prisma.payment.findUnique({
      where: { transactionId: d.transactionId },
      select: { id: true },
    });
    if (usedTx) {
      return {
        ok: false,
        error: "Cet ID de transaction a déjà été utilisé.",
        fieldErrors: { transactionId: "ID de transaction déjà enregistré." },
      };
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        type: "COURSE",
        amount: course.price,
        currency: "XOF",
        provider: "MANUAL",
        transactionId: d.transactionId,
        status: "PENDING",
        courseId: course.id,
        metadata: {
          courseSlug: course.slug,
          courseTitle: course.title,
          operator: d.operator,
          payerName: d.payerName,
          payerPhone: d.payerPhone,
          ...(d.proofImage ? { proofImage: d.proofImage } : {}),
        },
      },
      select: { id: true },
    });
    const reference = refOf(payment.id);

    // Notifications admin : in-app + email (best-effort).
    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] }, deletedAt: null },
      select: { id: true, email: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "SYSTEM" as const,
          title: "Paiement Mobile Money à valider",
          message: `${user.name ?? user.email} — ${course.title} (${formatFCFA(course.price)}), réf. ${reference}`,
          link: "/admin/payments",
        })),
      });
      const adminTo = process.env.ADMIN_NOTIFY_EMAIL || admins[0]!.email;
      sendPaymentSubmittedEmail(adminTo, {
        learnerName: user.name ?? "Apprenant",
        learnerEmail: user.email ?? "",
        courseTitle: course.title,
        amountLabel: formatFCFA(course.price),
        operator: d.operator,
        payerPhone: d.payerPhone,
        transactionId: d.transactionId,
        reference,
        adminUrl: `${ACADEMY_URL}/admin/payments`,
      }).catch((e) => console.error("[payment] email admin:", e));
    }

    revalidatePath(`/courses/${course.slug}`);
    revalidatePath(`/checkout/${course.slug}`);
    return { ok: true, reference };
  } catch (err) {
    console.error("[payment] createManualPayment:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
  }
}

/* ────────────────────────── Validation par un admin ────────────────────────── */

async function requireAdmin() {
  const user = await currentUser();
  if (!user || !hasRole(user, "ADMIN", "SUPER_ADMIN")) return null;
  return user;
}

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function approvePayment(paymentId: string): Promise<ReviewResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Action réservée aux administrateurs." };

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amount: true,
        courseId: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!payment || payment.status !== "PENDING") {
      return { ok: false, error: "Paiement introuvable ou déjà traité." };
    }
    if (!payment.courseId) return { ok: false, error: "Paiement sans cours associé." };

    const course = await prisma.course.findUnique({
      where: { id: payment.courseId },
      select: { id: true, slug: true, title: true },
    });
    if (!course) return { ok: false, error: "Cours introuvable." };

    const alreadyEnrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: payment.userId, courseId: course.id } },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED" },
      }),
      ...(alreadyEnrolled
        ? []
        : [
            prisma.enrollment.create({
              data: { userId: payment.userId, courseId: course.id },
            }),
            prisma.course.update({
              where: { id: course.id },
              data: { enrollmentCount: { increment: 1 } },
            }),
          ]),
      prisma.notification.create({
        data: {
          userId: payment.userId,
          type: "PAYMENT_CONFIRMED",
          title: "Paiement confirmé 🎉",
          message: `Votre accès au cours « ${course.title} » est ouvert.`,
          link: `/courses/${course.slug}`,
        },
      }),
    ]);

    sendPaymentApprovedEmail(payment.user.email, {
      name: payment.user.name ?? "Apprenant",
      courseTitle: course.title,
      courseUrl: `${ACADEMY_URL}/courses/${course.slug}`,
      amountLabel: formatFCFA(payment.amount),
      reference: refOf(payment.id),
    }).catch((e) => console.error("[payment] email approbation:", e));

    revalidatePath("/admin/payments");
    revalidatePath(`/courses/${course.slug}`);
    return { ok: true };
  } catch (err) {
    console.error("[payment] approvePayment:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

const rejectSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().trim().max(300).optional(),
});

export async function rejectPayment(input: {
  paymentId: string;
  reason?: string;
}): Promise<ReviewResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Action réservée aux administrateurs." };

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: parsed.data.paymentId },
      select: {
        id: true,
        status: true,
        courseId: true,
        userId: true,
        metadata: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!payment || payment.status !== "PENDING") {
      return { ok: false, error: "Paiement introuvable ou déjà traité." };
    }

    const meta = (payment.metadata as Record<string, unknown> | null) ?? {};
    const courseSlug = String(meta.courseSlug ?? "");
    const courseTitle = String(meta.courseTitle ?? "votre cours");

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: { ...meta, rejectReason: parsed.data.reason ?? null, rejectedBy: admin.id },
        },
      }),
      prisma.notification.create({
        data: {
          userId: payment.userId,
          type: "SYSTEM",
          title: "Paiement non validé",
          message: `Votre preuve de paiement pour « ${courseTitle} » n'a pas pu être validée.${parsed.data.reason ? ` Motif : ${parsed.data.reason}` : ""}`,
          link: courseSlug ? `/checkout/${courseSlug}` : null,
        },
      }),
    ]);

    sendPaymentRejectedEmail(payment.user.email, {
      name: payment.user.name ?? "Apprenant",
      courseTitle,
      reference: refOf(payment.id),
      reason: parsed.data.reason,
      checkoutUrl: `${ACADEMY_URL}/checkout/${courseSlug}`,
    }).catch((e) => console.error("[payment] email rejet:", e));

    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (err) {
    console.error("[payment] rejectPayment:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

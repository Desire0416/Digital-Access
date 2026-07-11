import { prisma } from "@da/db/client";
import { currentUser, realUser } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Lectures liées au paiement Mobile Money manuel.

   Modèle : l'apprenant paie par Mobile Money (Orange / MTN / Wave) puis dépose
   une PREUVE (capture + ID de transaction). On enregistre un Payment PENDING.
   L'accès (Enrollment) n'est JAMAIS créé ici — seule l'approbation admin le crée
   (voir payment-actions.ts). Une preuve ne donne jamais accès.

   La formation ciblée est stockée dans Payment.metadata (targetSlug/targetTitle)
   car le modèle Payment n'a pas de clé étrangère directe vers CareerPath.
   ══════════════════════════════════════════════════════════════════════════ */

export type CheckoutInfo = {
  slug: string;
  title: string;
  price: number;
  level: string;
  school: string;
  duration: string | null;
  targetJob: string;
  coverImage: string | null;
};

/** Métadonnées structurées d'un paiement manuel (ce qu'on stocke dans Payment.metadata). */
export type PaymentMeta = {
  operator: "ORANGE" | "MTN" | "WAVE";
  phone: string;
  targetType: "career-path";
  targetSlug: string;
  targetTitle: string;
  rejectionReason?: string;
};

/**
 * Infos nécessaires à la page de paiement d'un parcours certifiant payant.
 * Retourne null si le parcours n'existe pas, n'est pas publié, ou est gratuit
 * (un parcours gratuit ne passe pas par le paiement).
 */
export async function getCheckoutInfo(slug: string): Promise<CheckoutInfo | null> {
  const path = await prisma.careerPath.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      price: true,
      level: true,
      duration: true,
      targetJob: true,
      coverImage: true,
      school: { select: { name: true } },
    },
  });
  if (!path || path.price <= 0) return null;
  return {
    slug: path.slug,
    title: path.title,
    price: path.price,
    level: path.level,
    school: path.school.name,
    duration: path.duration,
    targetJob: path.targetJob,
    coverImage: path.coverImage,
  };
}

export type FormationPaymentState = {
  /** L'apprenant est déjà inscrit (accès actif). */
  enrolled: boolean;
  /** Un paiement est en attente de validation admin pour cette formation. */
  pending: boolean;
  /** Le dernier paiement a été rejeté (et pas d'accès ni d'attente en cours). */
  rejected: boolean;
  rejectionReason: string | null;
};

/**
 * État de paiement d'un apprenant vis-à-vis d'un parcours donné.
 * Sert à adapter le CTA (S'inscrire / Payer / En attente / Continuer).
 */
export async function getFormationPaymentState(
  slug: string,
  userId?: string | null,
): Promise<FormationPaymentState> {
  const empty: FormationPaymentState = { enrolled: false, pending: false, rejected: false, rejectionReason: null };
  if (!userId) return empty;

  const path = await prisma.careerPath.findFirst({ where: { slug }, select: { id: true } });
  if (!path) return empty;

  const [enr, pending, lastRejected] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { learnerId: userId, careerPathId: path.id },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: {
        learnerId: userId,
        provider: "MANUAL",
        status: "PENDING",
        metadata: { path: ["targetSlug"], equals: slug },
      },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: {
        learnerId: userId,
        provider: "MANUAL",
        status: "FAILED",
        metadata: { path: ["targetSlug"], equals: slug },
      },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    }),
  ]);

  const enrolled = !!enr;
  const isPending = !!pending;
  const rejected = !enrolled && !isPending && !!lastRejected;
  const rejectionReason = rejected
    ? ((lastRejected!.metadata as PaymentMeta | null)?.rejectionReason ?? null)
    : null;

  return { enrolled, pending: isPending, rejected, rejectionReason };
}

export type AdminPaymentRow = {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "MANUAL_REVIEW" | "REFUNDED";
  reference: string | null;
  proofUrl: string | null;
  operator: string;
  phone: string;
  targetSlug: string;
  targetTitle: string;
  rejectionReason: string | null;
  createdAt: Date;
  learnerName: string;
  learnerEmail: string;
};

/**
 * Liste des paiements manuels pour la file de validation admin.
 * Ré-vérifie le VRAI utilisateur admin (jamais l'identité impersonée).
 * Les PENDING remontent en tête.
 */
export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  const me = await realUser();
  const ADMIN = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];
  if (!me || !me.roles.some((r) => ADMIN.includes(r))) return [];

  const rows = await prisma.payment.findMany({
    where: { provider: "MANUAL" },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      amount: true,
      status: true,
      reference: true,
      proofUrl: true,
      metadata: true,
      createdAt: true,
      learner: { select: { name: true, email: true } },
    },
  });

  const mapped = rows.map((p): AdminPaymentRow => {
    const m = (p.metadata as PaymentMeta | null) ?? ({} as PaymentMeta);
    return {
      id: p.id,
      amount: p.amount,
      status: p.status,
      reference: p.reference,
      proofUrl: p.proofUrl,
      operator: m.operator ?? "—",
      phone: m.phone ?? "",
      targetSlug: m.targetSlug ?? "",
      targetTitle: m.targetTitle ?? "Formation",
      rejectionReason: m.rejectionReason ?? null,
      createdAt: p.createdAt,
      learnerName: p.learner.name,
      learnerEmail: p.learner.email,
    };
  });

  // PENDING d'abord, puis le reste (déjà trié par date décroissante).
  const rank = (s: string) => (s === "PENDING" ? 0 : s === "MANUAL_REVIEW" ? 1 : 2);
  return mapped.sort((a, b) => rank(a.status) - rank(b.status));
}

/** Compteur de paiements en attente (badge de nav admin). */
export async function getPendingPaymentsCount(): Promise<number> {
  const me = await currentUser();
  const ADMIN = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];
  if (!me || !me.roles.some((r) => ADMIN.includes(r))) return 0;
  return prisma.payment.count({ where: { provider: "MANUAL", status: "PENDING" } });
}

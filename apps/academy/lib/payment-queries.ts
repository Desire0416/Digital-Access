import { prisma } from "@da/db/client";

/* ─────────────────────────── Checkout (apprenant) ─────────────────────────── */

export interface CheckoutData {
  course: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    price: number;
    category: string;
    instructor: string;
    chapterCount: number;
    durationMinutes: number;
  };
  /** true si l'utilisateur a déjà accès au cours */
  enrolled: boolean;
  /** paiement en attente de vérification, le cas échéant */
  pendingReference: string | null;
  /** dernier paiement rejeté (pour affichage du motif) */
  lastRejection: { reference: string; reason: string | null } | null;
}

export async function getCheckoutData(
  userId: string,
  slug: string,
): Promise<CheckoutData | null> {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, isFree: false, price: { gt: 0 } },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      price: true,
      durationMinutes: true,
      category: { select: { name: true } },
      instructor: { select: { name: true } },
      modules: { select: { _count: { select: { chapters: true } } } },
    },
  });
  if (!course) return null;

  const [enrollment, pending, rejected] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: { userId, courseId: course.id, status: "PENDING" },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: { userId, courseId: course.id, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, metadata: true },
    }),
  ]);

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      price: course.price,
      category: course.category.name,
      instructor: course.instructor.name,
      chapterCount: course.modules.reduce((n, m) => n + m._count.chapters, 0),
      durationMinutes: course.durationMinutes,
    },
    enrolled: Boolean(enrollment),
    pendingReference: pending ? `PAY-${pending.id.slice(-6).toUpperCase()}` : null,
    lastRejection: rejected
      ? {
          reference: `PAY-${rejected.id.slice(-6).toUpperCase()}`,
          reason:
            ((rejected.metadata as Record<string, unknown> | null)?.rejectReason as
              | string
              | null) ?? null,
        }
      : null,
  };
}

/** Statut de paiement d'un utilisateur pour un cours (page détail). */
export async function getPaymentStatusForCourse(
  userId: string,
  courseId: string,
): Promise<"pending" | null> {
  const pending = await prisma.payment.findFirst({
    where: { userId, courseId, status: "PENDING" },
    select: { id: true },
  });
  return pending ? "pending" : null;
}

/* ─────────────────────────── Validation (admin) ────────────────────────────── */

export type PaymentStatusValue = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentTypeValue = "COURSE" | "SUBSCRIPTION" | "INVOICE";
export type PaymentProviderValue =
  | "CINETPAY"
  | "FEDAPAY"
  | "MANUAL"
  | "FREE";

/** Élément de liste (carte) — vue synthétique. */
export interface AdminPaymentItem {
  id: string;
  reference: string;
  status: PaymentStatusValue;
  type: PaymentTypeValue;
  provider: PaymentProviderValue;
  amount: number;
  createdAt: string; // ISO
  learner: { name: string; email: string; avatar: string | null };
  /** Intitulé de l'article payé (cours / abonnement / facture). */
  itemLabel: string;
  courseSlug: string;
  operator: string;
  payerName: string;
  payerPhone: string;
  transactionId: string | null;
  hasProof: boolean;
  rejectReason: string | null;
}

type RawPayment = {
  id: string;
  status: string;
  type: string;
  provider: string;
  amount: number;
  createdAt: Date;
  transactionId: string | null;
  metadata: unknown;
  user: { name: string; email: string; avatar: string | null };
  subscription: { plan: string } | null;
  invoice: { number: string } | null;
};

const LIST_SELECT = {
  id: true,
  status: true,
  type: true,
  provider: true,
  amount: true,
  createdAt: true,
  transactionId: true,
  metadata: true,
  user: { select: { name: true, email: true, avatar: true } },
  subscription: { select: { plan: true } },
  invoice: { select: { number: true } },
} as const;

/** Intitulé lisible de l'article payé selon le type de paiement. */
function itemLabelOf(p: RawPayment, meta: Record<string, unknown>): string {
  if (p.type === "SUBSCRIPTION") {
    const plan = p.subscription?.plan;
    return plan === "YEARLY"
      ? "Abonnement annuel"
      : plan === "MONTHLY"
        ? "Abonnement mensuel"
        : "Abonnement";
  }
  if (p.type === "INVOICE") {
    return p.invoice?.number
      ? `Facture ${p.invoice.number}`
      : "Facture";
  }
  return String(meta.courseTitle ?? "Cours");
}

function toAdminItem(p: RawPayment): AdminPaymentItem {
  const meta = (p.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: p.id,
    reference: `PAY-${p.id.slice(-6).toUpperCase()}`,
    status: p.status as PaymentStatusValue,
    type: p.type as PaymentTypeValue,
    provider: p.provider as PaymentProviderValue,
    amount: p.amount,
    createdAt: p.createdAt.toISOString(),
    learner: { name: p.user.name, email: p.user.email, avatar: p.user.avatar },
    itemLabel: itemLabelOf(p, meta),
    courseSlug: String(meta.courseSlug ?? ""),
    operator: String(meta.operator ?? "—"),
    payerName: String(meta.payerName ?? "—"),
    payerPhone: String(meta.payerPhone ?? "—"),
    transactionId: p.transactionId,
    hasProof: typeof meta.proofImage === "string" && meta.proofImage.length > 0,
    rejectReason: (meta.rejectReason as string | undefined) ?? null,
  };
}

export interface AdminPaymentFilters {
  status?: string;
  type?: string;
  provider?: string;
  q?: string;
}

export interface AdminPaymentsResult {
  items: AdminPaymentItem[];
  stats: {
    /** Somme des paiements confirmés (COMPLETED), en FCFA. */
    collected: number;
    pending: number;
    completed: number;
    /** Échoués + remboursés. */
    failedOrRefunded: number;
    total: number;
  };
}

const STATUSES: PaymentStatusValue[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
];
const TYPES: PaymentTypeValue[] = ["COURSE", "SUBSCRIPTION", "INVOICE"];
const PROVIDERS: PaymentProviderValue[] = [
  "CINETPAY",
  "FEDAPAY",
  "MANUAL",
  "FREE",
];

/**
 * Liste des paiements pour l'admin, filtrée par statut / type / fournisseur et
 * recherche texte (nom, email, référence). Les KPI (encaissé, en attente,
 * confirmés, échoués/remboursés) sont calculés sur l'ensemble NON filtré par
 * statut afin que les compteurs restent stables quand on clique un KPI-filtre.
 */
export async function getAdminPayments(
  filters: AdminPaymentFilters = {},
): Promise<AdminPaymentsResult> {
  const status =
    filters.status && STATUSES.includes(filters.status as PaymentStatusValue)
      ? (filters.status as PaymentStatusValue)
      : undefined;
  const type =
    filters.type && TYPES.includes(filters.type as PaymentTypeValue)
      ? (filters.type as PaymentTypeValue)
      : undefined;
  const provider =
    filters.provider &&
    PROVIDERS.includes(filters.provider as PaymentProviderValue)
      ? (filters.provider as PaymentProviderValue)
      : undefined;
  const q = filters.q?.trim();

  // La recherche par référence (PAY-XXXXXX) cible les 6 derniers caractères de
  // l'id (insensible à la casse) ; nom et email sont recherchés en base. Comme
  // la référence est dérivée de l'id (non stockée), on la matche en mémoire.
  const refFragment =
    q && /^pay-?[a-z0-9]/i.test(q)
      ? q.toUpperCase().replace(/^PAY-?/, "")
      : null;
  const userSearch = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // Une recherche de type « PAY-XXXX » ne doit pas être bridée par le filtre
  // nom/email en base — on relâche alors le where et on affine en mémoire.
  const applyUserSearchInDb = Boolean(userSearch) && !refFragment;

  // KPI : agrégats sur type/fournisseur/recherche, tous statuts confondus.
  const statsWhere = {
    ...(type ? { type } : {}),
    ...(provider ? { provider } : {}),
    ...(applyUserSearchInDb && userSearch ? { user: userSearch } : {}),
  };

  const [rows, grouped, collectedAgg] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ...statsWhere,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: LIST_SELECT,
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: statsWhere,
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { ...statsWhere, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const countBy = (s: PaymentStatusValue) =>
    grouped.find((g) => g.status === s)?._count._all ?? 0;

  // Les paiements EN ATTENTE remontent en tête (priorité de validation), puis
  // les plus récents (les lignes arrivent déjà triées par date décroissante).
  const rank: Record<string, number> = {
    PENDING: 0,
    COMPLETED: 1,
    REFUNDED: 1,
    FAILED: 2,
  };
  let items = rows
    .map(toAdminItem)
    .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3));

  // Recherche par référence appliquée en mémoire (référence dérivée de l'id).
  // Les KPI sont alors recalculés sur le sous-ensemble filtré pour rester exacts.
  if (refFragment) {
    items = items.filter((it) =>
      it.reference.toUpperCase().includes(refFragment),
    );
    return {
      items,
      stats: {
        collected: items
          .filter((i) => i.status === "COMPLETED")
          .reduce((n, i) => n + i.amount, 0),
        pending: items.filter((i) => i.status === "PENDING").length,
        completed: items.filter((i) => i.status === "COMPLETED").length,
        failedOrRefunded: items.filter(
          (i) => i.status === "FAILED" || i.status === "REFUNDED",
        ).length,
        total: items.length,
      },
    };
  }

  return {
    items,
    stats: {
      collected: collectedAgg._sum.amount ?? 0,
      pending: countBy("PENDING"),
      completed: countBy("COMPLETED"),
      failedOrRefunded: countBy("FAILED") + countBy("REFUNDED"),
      total: grouped.reduce((n, g) => n + g._count._all, 0),
    },
  };
}

/* ─────────────────────────── Détail d'un paiement ──────────────────────────── */

export interface AdminPaymentDetail {
  id: string;
  reference: string;
  status: PaymentStatusValue;
  type: PaymentTypeValue;
  provider: PaymentProviderValue;
  amount: number;
  currency: string;
  createdAt: string; // ISO
  transactionId: string | null;
  learner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  /** Article payé (cours / abonnement / facture). */
  item: {
    kind: "COURSE" | "SUBSCRIPTION" | "INVOICE" | "OTHER";
    label: string;
    /** Lien interne pertinent (ex. page du cours) si disponible. */
    href: string | null;
    meta: string | null;
  };
  /** Détails Mobile Money (paiement manuel). */
  operator: string | null;
  payerName: string | null;
  payerPhone: string | null;
  proofImage: string | null;
  rejectReason: string | null;
  rejectedBy: string | null;
}

export async function getAdminPaymentDetail(
  paymentId: string,
): Promise<AdminPaymentDetail | null> {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      type: true,
      provider: true,
      amount: true,
      currency: true,
      createdAt: true,
      transactionId: true,
      courseId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
        },
      },
      subscription: {
        select: { plan: true, status: true, startDate: true, endDate: true },
      },
      invoice: { select: { number: true, status: true } },
      metadata: true,
    },
  });
  if (!p) return null;

  const meta = (p.metadata as Record<string, unknown> | null) ?? {};

  // Résolution de l'article payé.
  let item: AdminPaymentDetail["item"];
  if (p.type === "COURSE") {
    const slug = String(meta.courseSlug ?? "");
    item = {
      kind: "COURSE",
      label: String(meta.courseTitle ?? "Cours"),
      href: slug ? `/courses/${slug}` : null,
      meta: "Achat de cours",
    };
  } else if (p.type === "SUBSCRIPTION") {
    const plan = p.subscription?.plan;
    const label =
      plan === "YEARLY"
        ? "Abonnement annuel"
        : plan === "MONTHLY"
          ? "Abonnement mensuel"
          : "Abonnement";
    item = {
      kind: "SUBSCRIPTION",
      label,
      href: "/admin/subscriptions",
      meta: p.subscription
        ? `${p.subscription.status} · jusqu'au ${p.subscription.endDate.toISOString().slice(0, 10)}`
        : null,
    };
  } else if (p.type === "INVOICE") {
    item = {
      kind: "INVOICE",
      label: p.invoice?.number ? `Facture ${p.invoice.number}` : "Facture",
      href: null,
      meta: p.invoice?.status ?? null,
    };
  } else {
    item = { kind: "OTHER", label: "Paiement", href: null, meta: null };
  }

  return {
    id: p.id,
    reference: `PAY-${p.id.slice(-6).toUpperCase()}`,
    status: p.status as PaymentStatusValue,
    type: p.type as PaymentTypeValue,
    provider: p.provider as PaymentProviderValue,
    amount: p.amount,
    currency: p.currency,
    createdAt: p.createdAt.toISOString(),
    transactionId: p.transactionId,
    learner: {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      avatar: p.user.avatar,
      createdAt: p.user.createdAt.toISOString(),
    },
    item,
    operator: (meta.operator as string | undefined) ?? null,
    payerName: (meta.payerName as string | undefined) ?? null,
    payerPhone: (meta.payerPhone as string | undefined) ?? null,
    proofImage: (meta.proofImage as string | undefined) ?? null,
    rejectReason: (meta.rejectReason as string | undefined) ?? null,
    rejectedBy: (meta.rejectedBy as string | undefined) ?? null,
  };
}

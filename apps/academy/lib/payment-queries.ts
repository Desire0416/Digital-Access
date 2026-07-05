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

export interface AdminPaymentItem {
  id: string;
  reference: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: number;
  createdAt: string; // ISO
  learner: { name: string; email: string };
  courseTitle: string;
  courseSlug: string;
  operator: string;
  payerName: string;
  payerPhone: string;
  transactionId: string | null;
  proofImage: string | null;
  rejectReason: string | null;
}

function toAdminItem(p: {
  id: string;
  status: string;
  amount: number;
  createdAt: Date;
  transactionId: string | null;
  metadata: unknown;
  user: { name: string; email: string };
}): AdminPaymentItem {
  const meta = (p.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: p.id,
    reference: `PAY-${p.id.slice(-6).toUpperCase()}`,
    status: p.status as AdminPaymentItem["status"],
    amount: p.amount,
    createdAt: p.createdAt.toISOString(),
    learner: { name: p.user.name, email: p.user.email },
    courseTitle: String(meta.courseTitle ?? "—"),
    courseSlug: String(meta.courseSlug ?? ""),
    operator: String(meta.operator ?? "—"),
    payerName: String(meta.payerName ?? "—"),
    payerPhone: String(meta.payerPhone ?? "—"),
    transactionId: p.transactionId,
    proofImage: (meta.proofImage as string | undefined) ?? null,
    rejectReason: (meta.rejectReason as string | undefined) ?? null,
  };
}

export async function getAdminPayments(): Promise<{
  pending: AdminPaymentItem[];
  processed: AdminPaymentItem[];
}> {
  const select = {
    id: true,
    status: true,
    amount: true,
    createdAt: true,
    transactionId: true,
    metadata: true,
    user: { select: { name: true, email: true } },
  } as const;

  const [pending, processed] = await Promise.all([
    prisma.payment.findMany({
      where: { provider: "MANUAL", status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select,
    }),
    prisma.payment.findMany({
      where: { provider: "MANUAL", status: { in: ["COMPLETED", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select,
    }),
  ]);

  return {
    pending: pending.map(toAdminItem),
    processed: processed.map(toAdminItem),
  };
}

import "server-only";
import { prisma } from "@da/db/client";
import { currentUser, hasRole } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer — Administration Academy (S12).
   requireAdmin() sur chaque fonction : défense en profondeur (la route est déjà
   protégée par (admin)/layout.tsx, mais ces fonctions restent verrouillées si
   importées ailleurs).
   ══════════════════════════════════════════════════════════════════════════ */

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || !hasRole(user, "ADMIN", "SUPER_ADMIN")) {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return user;
}

/* ─────────────────────────── Helpers temporels ─────────────────────────── */

function lastNMonths(n: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
  }
  return months;
}

/* ══════════════════════════════ Dashboard ═══════════════════════════════ */

export type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

export async function getAdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonths = lastNMonths(6);
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    usersTotal,
    learners,
    instructors,
    coursesPublished,
    coursesReview,
    enrollmentsTotal,
    activeSubs,
    pendingPayments,
    revenueAll,
    revenueMonth,
    completedInRange,
    enrollmentsInRange,
    paymentsByStatus,
    topCoursesRaw,
    categoriesRaw,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { roles: { has: "LEARNER" } } }),
    prisma.user.count({ where: { roles: { has: "INSTRUCTOR" } } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.course.count({ where: { status: "REVIEW" } }),
    prisma.enrollment.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: rangeStart } },
      select: { amount: true, createdAt: true },
    }),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    prisma.category.findMany({
      select: { id: true, name: true, color: true, _count: { select: { courses: true } } },
      orderBy: { courses: { _count: "desc" } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        provider: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
  ]);

  // Revenus par mois (6 derniers) → BarChart
  const revenueByMonth = sixMonths.map((m) => {
    const value = completedInRange
      .filter(
        (p) =>
          p.createdAt.getFullYear() === m.year && p.createdAt.getMonth() === m.month,
      )
      .reduce((s, p) => s + p.amount, 0);
    return { label: m.label, value };
  });

  // Inscriptions par mois (6 derniers) → BarChart
  const enrollmentsByMonth = sixMonths.map((m) => {
    const value = enrollmentsInRange.filter(
      (e) => e.createdAt.getFullYear() === m.year && e.createdAt.getMonth() === m.month,
    ).length;
    return { label: m.label, value };
  });

  const statusColors: Record<string, string> = {
    COMPLETED: "#059669",
    PENDING: "#f59e0b",
    FAILED: "#dc2626",
    REFUNDED: "#9ca3af",
  };
  const statusLabels: Record<string, string> = {
    COMPLETED: "Confirmés",
    PENDING: "En attente",
    FAILED: "Échoués",
    REFUNDED: "Remboursés",
  };
  const paymentDonut = paymentsByStatus
    .map((r) => ({
      label: statusLabels[r.status] ?? r.status,
      value: r._count._all,
      color: statusColors[r.status] ?? "#9ca3af",
    }))
    .filter((d) => d.value > 0);

  const topCourses = topCoursesRaw.map((c) => ({
    label: c.title,
    value: c._count.enrollments,
  }));

  const categoryDist = categoriesRaw.map((c) => ({
    label: c.name,
    value: c._count.courses,
    tint: c.color ?? undefined,
  }));

  return {
    kpis: {
      revenueTotal: revenueAll._sum.amount ?? 0,
      revenueMonth: revenueMonth._sum.amount ?? 0,
      usersTotal,
      learners,
      instructors,
      coursesPublished,
      enrollmentsTotal,
      activeSubs,
      pendingReview: coursesReview,
      pendingPayments,
    },
    revenueByMonth,
    enrollmentsByMonth,
    paymentDonut,
    topCourses,
    categoryDist,
    recentPayments,
    recentUsers,
  };
}

/* ══════════════════════════════ Catégories ══════════════════════════════ */

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  courseCount: number;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      color: true,
      _count: { select: { courses: true } },
    },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    color: c.color,
    courseCount: c._count.courses,
  }));
}

/* ══════════════════════════════ Utilisateurs ════════════════════════════ */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  emailVerified: boolean;
  isActive: boolean;
  xp: number;
  streak: number;
  enrollmentCount: number;
  createdAt: Date;
};

export async function getAdminUsers(search?: string): Promise<AdminUser[]> {
  await requireAdmin();
  const q = search?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      emailVerified: true,
      isActive: true,
      xp: true,
      streak: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.roles,
    emailVerified: u.emailVerified !== null,
    isActive: u.isActive,
    xp: u.xp,
    streak: u.streak,
    enrollmentCount: u._count.enrollments,
    createdAt: u.createdAt,
  }));
}

/* ══════════════════════════════ Abonnements ═════════════════════════════ */

export type AdminSubscription = {
  id: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  user: { name: string; email: string };
};

export async function getAdminSubscriptions() {
  await requireAdmin();
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      user: { select: { name: true, email: true } },
    },
  });
  const active = subs.filter((s) => s.status === "ACTIVE").length;
  const mrr = subs
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (s.plan === "YEARLY" ? Math.round(15000 / 12) : 5000), 0);
  return { subs, active, total: subs.length, mrr };
}

/* ══════════════════════════════ Codes promo ═════════════════════════════ */

export type AdminPromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

export async function getAdminPromoCodes(): Promise<AdminPromoCode[]> {
  await requireAdmin();
  return prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      discountType: true,
      discountValue: true,
      maxUses: true,
      currentUses: true,
      active: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

/* ══════════════════════════════ Paramètres ══════════════════════════════ */

/** État de configuration de la plateforme (aucun secret exposé — booléens uniquement). */
export async function getSystemStatus() {
  await requireAdmin();

  const [users, courses, published, payments, categories] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.payment.count(),
    prisma.category.count(),
  ]);

  const has = (v?: string) => Boolean(v && v.length > 0);

  return {
    stats: { users, courses, published, payments, categories },
    integrations: {
      database: has(process.env.DATABASE_URL),
      email: has(process.env.RESEND_API_KEY),
      emailFrom: process.env.EMAIL_FROM ?? "noreply@digitalaccess.ci",
      googleOAuth: has(process.env.GOOGLE_CLIENT_ID),
      githubOAuth: has(process.env.GITHUB_CLIENT_ID),
      cinetpay: has(process.env.CINETPAY_API_KEY),
      fedapay: has(process.env.FEDAPAY_API_KEY),
      blob: has(process.env.BLOB_READ_WRITE_TOKEN),
      ably: has(process.env.ABLY_API_KEY),
      sentry: has(process.env.SENTRY_DSN),
    },
    urls: {
      academy: process.env.NEXT_PUBLIC_ACADEMY_URL ?? "https://academy.digitalaccess.ci",
      web: process.env.NEXT_PUBLIC_WEB_URL ?? "https://digitalaccess.ci",
    },
  };
}

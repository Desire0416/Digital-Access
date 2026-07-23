import "server-only";
import { redirect } from "next/navigation";
import { prisma, type ContentStatus, type PaymentStatus, type Role, type Prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Back-office — LECTURES (cahier §30). Défense en profondeur : chaque requête
   revérifie le rôle admin EN BASE (requireAdminFresh) même si le layout
   /admin est déjà gardé.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/* ─── Tableau de bord ──────────────────────────────────────────────────────── */

export async function getAdminStats() {
  await guard();
  const [users, enrollments, pathEnrollments, certificates, pendingPayments, revenue, publishedCourses, publishedPaths, recentPayments, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.enrollment.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
      prisma.careerPathEnrollment.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
      prisma.certificate.count({ where: { status: "ACTIVE" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.careerPath.count({ where: { status: "PUBLISHED" } }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          amount: true,
          status: true,
          purpose: true,
          operator: true,
          reference: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
          careerPath: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, country: true, emailVerified: true, createdAt: true },
      }),
    ]);

  return {
    usersCount: users,
    enrollmentsCount: enrollments,
    pathEnrollmentsCount: pathEnrollments,
    certificatesCount: certificates,
    pendingPaymentsCount: pendingPayments,
    revenueFCFA: revenue._sum.amount ?? 0,
    publishedCoursesCount: publishedCourses,
    publishedPathsCount: publishedPaths,
    recentPayments,
    recentUsers,
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

/** Compteur léger pour la pastille « paiements en attente » de la barre latérale. */
export async function countPendingPayments(): Promise<number> {
  await guard();
  return prisma.payment.count({ where: { status: "PENDING" } });
}

/** Répartition des formations par statut de publication (barres du tableau de bord). */
export async function getCourseStatusBreakdown(): Promise<{ status: ContentStatus; count: number }[]> {
  await guard();
  const grouped = await prisma.course.groupBy({ by: ["status"], _count: { _all: true } });
  const order: ContentStatus[] = ["PUBLISHED", "APPROVED", "SCHEDULED", "REVIEW", "DRAFT", "SUSPENDED", "ARCHIVED"];
  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  return order.filter((s) => byStatus.has(s)).map((status) => ({ status, count: byStatus.get(status) ?? 0 }));
}

/* ─── Listes filtrées ──────────────────────────────────────────────────────── */

export async function listCoursesAdmin(filters: { q?: string; status?: ContentStatus } = {}) {
  await guard();
  const where: Prisma.CourseWhereInput = {};
  if (filters.q?.trim()) where.title = { contains: filters.q.trim(), mode: "insensitive" };
  if (filters.status) where.status = filters.status;
  return prisma.course.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      price: true,
      status: true,
      featured: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
      schools: { where: { isPrimary: true }, select: { school: { select: { name: true } } }, take: 1 },
      _count: { select: { modules: true, enrollments: true, careerPaths: true } },
    },
  });
}

export async function listCareerPathsAdmin(filters: { q?: string; status?: ContentStatus } = {}) {
  await guard();
  const where: Prisma.CareerPathWhereInput = {};
  if (filters.q?.trim()) where.title = { contains: filters.q.trim(), mode: "insensitive" };
  if (filters.status) where.status = filters.status;
  return prisma.careerPath.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      targetJob: true,
      price: true,
      status: true,
      featured: true,
      updatedAt: true,
      schools: { where: { isPrimary: true }, select: { school: { select: { name: true } } }, take: 1 },
      _count: { select: { courses: true, phases: true, enrollments: true } },
    },
  });
}

export async function listSchoolsAdmin() {
  await guard();
  return prisma.school.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      color: true,
      icon: true,
      order: true,
      status: true,
      _count: { select: { courses: true, careerPaths: true } },
    },
  });
}

export async function listUsersAdmin(filters: { q?: string; role?: Role } = {}) {
  await guard();
  const where: Prisma.UserWhereInput = {};
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  }
  if (filters.role) where.roles = { has: filters.role };
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      country: true,
      roles: true,
      emailVerified: true,
      isActive: true,
      deletedAt: true,
      lastActiveAt: true,
      createdAt: true,
      _count: { select: { enrollments: true, certificates: true, payments: true } },
    },
  });
}

export async function listPaymentsAdmin(filters: { status?: PaymentStatus } = {}) {
  await guard();
  return prisma.payment.findMany({
    where: filters.status ? { status: filters.status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      amount: true,
      currency: true,
      provider: true,
      status: true,
      purpose: true,
      reference: true,
      operator: true,
      payerPhone: true,
      proofUrl: true,
      rejectReason: true,
      createdAt: true,
      processedAt: true,
      user: { select: { id: true, name: true, email: true } },
      course: { select: { title: true, slug: true } },
      careerPath: { select: { title: true, slug: true } },
      processedBy: { select: { name: true } },
    },
  });
}

export async function listCertificatesAdmin(filters: { q?: string; status?: string } = {}) {
  await guard();
  const where: Prisma.CertificateWhereInput = {};
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { verifyCode: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (filters.status) where.status = filters.status as Prisma.CertificateWhereInput["status"];
  return prisma.certificate.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      type: true,
      number: true,
      verifyCode: true,
      status: true,
      score: true,
      mention: true,
      issuedAt: true,
      revokedAt: true,
      revokedReason: true,
      user: { select: { id: true, name: true, email: true } },
      course: { select: { title: true } },
      careerPath: { select: { title: true } },
    },
  });
}

/* ─── Fiches d'édition ─────────────────────────────────────────────────────── */

/**
 * Requête de formation complète pour l'éditeur — SANS garde. L'APPELANT doit
 * avoir autorisé l'accès en amont (admin via getCourseAdmin, ou formateur
 * propriétaire via requireCourseEditor sur la route /formateur).
 */
export async function getCourseForEditor(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          assessments: {
            orderBy: { order: "asc" },
            include: { questions: { orderBy: { order: "asc" } }, _count: { select: { questions: true } } },
          },
        },
      },
      assessments: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } },
      projects: { orderBy: { order: "asc" } },
      resources: { orderBy: { order: "asc" } },
      skills: { include: { skill: true } },
      instructors: { orderBy: { order: "asc" }, include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      schools: { include: { school: { select: { id: true, name: true, slug: true } } } },
      careerPaths: { include: { careerPath: { select: { id: true, title: true, slug: true } } } },
      requires: { include: { requiresCourse: { select: { id: true, title: true, slug: true } } } },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
}

/** Formation complète pour l'éditeur ADMIN (garde admin en profondeur). */
export async function getCourseAdmin(courseId: string) {
  await guard();
  return getCourseForEditor(courseId);
}

/** Parcours complet pour le constructeur admin (§30.3). */
export async function getCareerPathAdmin(careerPathId: string) {
  await guard();
  return prisma.careerPath.findUnique({
    where: { id: careerPathId },
    include: {
      phases: { orderBy: { order: "asc" } },
      courses: {
        orderBy: { position: "asc" },
        include: {
          course: { select: { id: true, title: true, slug: true, level: true, price: true, status: true, durationHours: true } },
          phase: { select: { id: true, title: true } },
        },
      },
      schools: { include: { school: { select: { id: true, name: true, slug: true } } } },
      projects: { orderBy: { order: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });
}

/** École complète pour l'éditeur admin (identité + rattachements §14). */
export async function getSchoolAdmin(schoolId: string) {
  await guard();
  return prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      courses: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        include: { course: { select: { id: true, title: true, slug: true, level: true, status: true, coverImage: true } } },
      },
      careerPaths: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        include: { careerPath: { select: { id: true, title: true, slug: true, targetJob: true, status: true } } },
      },
    },
  });
}

/** Inscrits à une formation (onglet « Inscrits » du constructeur, §30.2). */
export async function getCourseEnrollmentsAdmin(courseId: string) {
  await guard();
  const rows = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }],
    take: 500,
    select: {
      id: true,
      status: true,
      origin: true,
      accessType: true,
      progress: true,
      enrolledAt: true,
      completedAt: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });
  return rows.map((e) => ({
    id: e.id,
    status: e.status,
    origin: e.origin,
    accessType: e.accessType,
    progress: e.progress,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
    userId: e.user.id,
    name: e.user.name,
    email: e.user.email,
    avatar: e.user.avatar,
  }));
}
export type CourseEnrollmentRow = Awaited<ReturnType<typeof getCourseEnrollmentsAdmin>>[number];

/** Recherche d'utilisateurs à inscrire à une formation (marque ceux déjà inscrits). */
export async function searchUsersForCourse(courseId: string, q: string) {
  await guard();
  const query = q.trim();
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (query) where.OR = [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }];
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      enrollments: { where: { courseId, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { id: true } },
    },
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, enrolled: u.enrollments.length > 0 }));
}

/** Formations du catalogue pour un sélecteur (composition de parcours, rattachement école). */
export async function listCoursesForPicker(q?: string) {
  await guard();
  const where: Prisma.CourseWhereInput = {};
  if (q?.trim()) where.title = { contains: q.trim(), mode: "insensitive" };
  return prisma.course.findMany({
    where,
    orderBy: { title: "asc" },
    take: 300,
    select: { id: true, title: true, slug: true, level: true, price: true, status: true },
  });
}

/** Parcours du catalogue pour un sélecteur (rattachement école). */
export async function listCareerPathsForPicker(q?: string) {
  await guard();
  const where: Prisma.CareerPathWhereInput = {};
  if (q?.trim()) where.title = { contains: q.trim(), mode: "insensitive" };
  return prisma.careerPath.findMany({
    where,
    orderBy: { title: "asc" },
    take: 300,
    select: { id: true, title: true, slug: true, targetJob: true, status: true },
  });
}

/** Journal d'audit (§30.1, §46). */
export async function listAuditLogs(filters: { entity?: string; take?: number } = {}) {
  await guard();
  return prisma.auditLog.findMany({
    where: filters.entity ? { entity: filters.entity } : {},
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 100,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      meta: true,
      createdAt: true,
      actor: { select: { name: true, email: true } },
    },
  });
}

import { prisma } from "@da/db/client";
import type {
  AdminStats,
  AdminSchoolRow,
  AdminSchoolEdit,
  AdminPathRow,
  AdminPathEdit,
  AdminShortCourseRow,
  AdminShortCourseEdit,
  AdminUserRow,
  AdminSubmissionRow,
  AdminCertificateRow,
  AdminCouponRow,
  SchoolOption,
} from "./admin-types";

/* ══════════════════════════════════════════════════════════════════════════
   Lectures du back-office admin. Toujours appelées derrière la garde du layout
   /admin (requireRole). Résilientes (try/catch → valeur vide).
   ══════════════════════════════════════════════════════════════════════════ */

const SUBMISSION_ORDER = ["IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED", "VALIDATED", "REJECTED"];

export async function getAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    users: 0, learners: 0, instructors: 0, admins: 0, schools: 0, careerPaths: 0, publishedPaths: 0,
    shortCourses: 0, enrollments: 0, completions: 0, submissionsPending: 0, submissionsValidated: 0,
    certificates: 0, badgesAwarded: 0, enrollmentsBySchool: [], submissionFunnel: [],
  };
  try {
    const [
      users, learners, instructors, admins, schools, careerPaths, publishedPaths,
      shortCourses, enrollments, completions, submissionsPending, submissionsValidated, certificates,
      badgesAwarded, pathsForChart, coursesForChart, funnelGroups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { roles: { has: "LEARNER" } } }),
      prisma.user.count({ where: { roles: { has: "INSTRUCTOR" } } }),
      prisma.user.count({ where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } } }),
      prisma.school.count(),
      prisma.careerPath.count(),
      prisma.careerPath.count({ where: { status: "PUBLISHED" } }),
      prisma.shortCourse.count(),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: "COMPLETED" } }),
      prisma.projectSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.projectSubmission.count({ where: { status: "VALIDATED" } }),
      prisma.certificate.count(),
      prisma.learnerBadge.count(),
      prisma.careerPath.findMany({ select: { school: { select: { name: true } }, _count: { select: { enrollments: true } } } }),
      prisma.shortCourse.findMany({ select: { school: { select: { name: true } }, _count: { select: { enrollments: true } } } }),
      prisma.projectSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    // Inscriptions par école : parcours ET formations courtes réunis.
    const bySchool = new Map<string, number>();
    for (const p of [...pathsForChart, ...coursesForChart]) {
      bySchool.set(p.school.name, (bySchool.get(p.school.name) ?? 0) + p._count.enrollments);
    }
    const enrollmentsBySchool = [...bySchool.entries()]
      .map(([label, value]) => ({ label: label.replace(/^École (d'|de l'|de la |des |du |de )/i, ""), value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const funnelMap = new Map<string, number>(funnelGroups.map((g) => [g.status, g._count._all]));
    const submissionFunnel = SUBMISSION_ORDER.filter((s) => (funnelMap.get(s) ?? 0) > 0).map((s) => ({
      label: { IN_PROGRESS: "Brouillon", SUBMITTED: "Soumis", UNDER_REVIEW: "En revue", REVISION_REQUESTED: "À réviser", VALIDATED: "Validé", REJECTED: "Rejeté" }[s] ?? s,
      value: funnelMap.get(s) ?? 0,
    }));

    return {
      users, learners, instructors, admins, schools, careerPaths, publishedPaths,
      shortCourses, enrollments, completions, submissionsPending, submissionsValidated, certificates,
      badgesAwarded, enrollmentsBySchool, submissionFunnel,
    };
  } catch (e) {
    console.error("[admin] getAdminStats:", e);
    return empty;
  }
}

/* ─── Écoles ────────────────────────────────────────────────────────────────── */

export async function getAdminSchools(): Promise<AdminSchoolRow[]> {
  try {
    const rows = await prisma.school.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, status: true, order: true, _count: { select: { careerPaths: true, shortCourses: true } } },
    });
    return rows.map((s) => ({
      id: s.id, name: s.name, slug: s.slug, status: s.status, order: s.order,
      careerPathCount: s._count.careerPaths, shortCourseCount: s._count.shortCourses,
    }));
  } catch {
    return [];
  }
}

export async function getSchoolForEdit(id: string): Promise<AdminSchoolEdit | null> {
  try {
    const s = await prisma.school.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, shortDescription: true, longDescription: true, icon: true, color: true, image: true, order: true, status: true },
    });
    return s ?? null;
  } catch {
    return null;
  }
}

export async function getSchoolOptions(): Promise<SchoolOption[]> {
  try {
    const rows = await prisma.school.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
    return rows;
  } catch {
    return [];
  }
}

/* ─── Parcours métiers ───────────────────────────────────────────────────────── */

export async function getAdminCareerPaths(): Promise<AdminPathRow[]> {
  try {
    const rows = await prisma.careerPath.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      select: {
        id: true, title: true, slug: true, level: true, status: true, price: true, featured: true,
        school: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, projects: true } },
      },
    });
    return rows.map((p) => ({
      id: p.id, title: p.title, slug: p.slug, schoolName: p.school.name, schoolId: p.school.id,
      level: p.level, status: p.status, price: p.price, featured: p.featured,
      enrollmentCount: p._count.enrollments, projectCount: p._count.projects,
    }));
  } catch {
    return [];
  }
}

export async function getCareerPathForEdit(id: string): Promise<AdminPathEdit | null> {
  try {
    const p = await prisma.careerPath.findUnique({
      where: { id },
      select: { id: true, title: true, targetJob: true, shortDescription: true, schoolId: true, level: true, price: true, duration: true, featured: true, status: true },
    });
    return p ?? null;
  } catch {
    return null;
  }
}

/* ─── Formations courtes ─────────────────────────────────────────────────────── */

export async function getAdminShortCourses(): Promise<AdminShortCourseRow[]> {
  try {
    const rows = await prisma.shortCourse.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      select: { id: true, title: true, slug: true, level: true, status: true, price: true, featured: true, school: { select: { id: true, name: true } } },
    });
    return rows.map((c) => ({
      id: c.id, title: c.title, slug: c.slug, schoolName: c.school.name, schoolId: c.school.id,
      level: c.level, status: c.status, price: c.price, featured: c.featured,
    }));
  } catch {
    return [];
  }
}

export async function getShortCourseForEdit(id: string): Promise<AdminShortCourseEdit | null> {
  try {
    const c = await prisma.shortCourse.findUnique({
      where: { id },
      select: { id: true, title: true, shortDescription: true, schoolId: true, level: true, price: true, duration: true, courseType: true, coverImage: true, featured: true, status: true },
    });
    return c ?? null;
  } catch {
    return null;
  }
}

/* ─── Utilisateurs ───────────────────────────────────────────────────────────── */

export async function getAdminUsers(search?: string): Promise<AdminUserRow[]> {
  try {
    const q = search?.trim();
    const rows = await prisma.user.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, name: true, email: true, roles: true, isActive: true, emailVerified: true, createdAt: true,
        _count: { select: { enrollments: true } },
      },
    });
    return rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, roles: u.roles, isActive: u.isActive,
      emailVerified: Boolean(u.emailVerified), createdAt: u.createdAt.toISOString(), enrollmentCount: u._count.enrollments,
    }));
  } catch {
    return [];
  }
}

/* ─── Soumissions (oversight) ────────────────────────────────────────────────── */

export async function getAdminSubmissions(status?: string): Promise<AdminSubmissionRow[]> {
  try {
    const rows = await prisma.projectSubmission.findMany({
      where: status && status !== "ALL" ? { status: status as never } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true, status: true, score: true, submittedAt: true,
        learner: { select: { name: true } },
        reviewer: { select: { name: true } },
        project: { select: { title: true, careerPath: { select: { title: true } } } },
      },
    });
    return rows.map((s) => ({
      id: s.id, learnerName: s.learner.name, projectTitle: s.project.title,
      careerPathTitle: s.project.careerPath?.title ?? "—", status: s.status, score: s.score,
      reviewerName: s.reviewer?.name ?? null, submittedAt: s.submittedAt?.toISOString() ?? null,
    }));
  } catch {
    return [];
  }
}

/* ─── Certificats ────────────────────────────────────────────────────────────── */

export async function getAdminCertificates(): Promise<AdminCertificateRow[]> {
  try {
    const rows = await prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: 200,
      select: {
        id: true, title: true, certificateNumber: true, certificateType: true, mention: true, finalScore: true, status: true, issuedAt: true,
        learner: { select: { name: true } },
      },
    });
    return rows.map((c) => ({
      id: c.id, learnerName: c.learner.name, courseTitle: c.title, certificateNumber: c.certificateNumber,
      certificateType: c.certificateType, mention: c.mention, finalScore: c.finalScore, status: c.status, issuedAt: c.issuedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/* ─── Coupons ────────────────────────────────────────────────────────────────── */

export async function getAdminCoupons(): Promise<AdminCouponRow[]> {
  try {
    const rows = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, discountType: true, discountValue: true, maxUses: true, currentUses: true, active: true, expiresAt: true, createdAt: true },
    });
    return rows.map((c) => ({
      id: c.id, code: c.code, discountType: c.discountType, discountValue: c.discountValue, maxUses: c.maxUses,
      currentUses: c.currentUses, active: c.active, expiresAt: c.expiresAt?.toISOString() ?? null, createdAt: c.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

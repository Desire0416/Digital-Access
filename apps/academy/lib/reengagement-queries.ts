import "server-only";
import { redirect } from "next/navigation";
import { prisma, type Prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";
import { formatFCFA } from "./site";
import type { CandidateCourse, ReengagementUserContext } from "./reengagement/ai";

/* ══════════════════════════════════════════════════════════════════════════
   Relance des inscrits inactifs — LECTURES. Cible les comptes qui ne se sont
   jamais connectés OU qui ne sont plus revenus depuis un moment. Réservé admin.
   ══════════════════════════════════════════════════════════════════════════ */

const DORMANT_DAYS = 14;
const DAY_MS = 86_400_000;

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

const NON_TARGET_ROLES = ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN", "INSTRUCTOR"] as const;

export type ReengagementSegment = "all" | "never" | "dormant";

/** Utilisateurs à relancer : jamais connectés ou dormants (> 14 j sans activité). */
export async function listInactiveUsers(filters: { q?: string; segment?: ReengagementSegment } = {}) {
  await guard();
  const dormantBefore = new Date(Date.now() - DORMANT_DAYS * DAY_MS);

  const segment = filters.segment ?? "all";
  const activityFilter: Prisma.UserWhereInput =
    segment === "never"
      ? { lastActiveAt: null }
      : segment === "dormant"
        ? { lastActiveAt: { lt: dormantBefore } }
        : { OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: dormantBefore } }] };

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    NOT: { roles: { hasSome: [...NON_TARGET_ROLES] } },
    ...activityFilter,
  };
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.AND = [{ OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      firstName: true,
      email: true,
      avatar: true,
      country: true,
      objective: true,
      emailVerified: true,
      lastActiveAt: true,
      createdAt: true,
      _count: { select: { enrollments: true, favorites: true } },
      reengagementReceived: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, channel: true, emailSent: true },
      },
    },
  });

  return users.map((u) => ({
    ...u,
    lastReengagement: u.reengagementReceived[0] ?? null,
    neverConnected: !u.lastActiveAt,
  }));
}

export type InactiveUser = Awaited<ReturnType<typeof listInactiveUsers>>[number];

/** Contexte complet d'un utilisateur + formations candidates, pour la génération IA. */
export async function getReengagementContext(userId: string): Promise<{
  user: ReengagementUserContext & { id: string; email: string; emailVerified: Date | null };
  candidates: CandidateCourse[];
} | null> {
  await guard();

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      email: true,
      emailVerified: true,
      objective: true,
      experienceLevel: true,
      country: true,
      lastActiveAt: true,
      createdAt: true,
      enrollments: { take: 10, orderBy: { enrolledAt: "desc" }, select: { course: { select: { title: true } } } },
      favorites: { take: 10, select: { course: { select: { title: true } } } },
    },
  });
  if (!u) return null;

  // Formations candidates : publiées, en avant d'abord, avec l'école principale.
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 14,
    select: {
      slug: true,
      title: true,
      subtitle: true,
      level: true,
      price: true,
      schools: { where: { isPrimary: true }, take: 1, select: { school: { select: { name: true } } } },
    },
  });

  const now = Date.now();
  const daysSinceSignup = Math.max(0, Math.floor((now - u.createdAt.getTime()) / DAY_MS));
  const daysSinceActive = u.lastActiveAt ? Math.max(0, Math.floor((now - u.lastActiveAt.getTime()) / DAY_MS)) : null;

  return {
    user: {
      id: u.id,
      email: u.email,
      emailVerified: u.emailVerified,
      name: u.name,
      firstName: u.firstName,
      objective: u.objective,
      experienceLevel: u.experienceLevel,
      country: u.country,
      neverConnected: !u.lastActiveAt,
      daysSinceSignup,
      daysSinceActive,
      enrolledCourseTitles: u.enrollments.map((e) => e.course.title),
      favoriteCourseTitles: u.favorites.map((f) => f.course?.title).filter((t): t is string => !!t),
    },
    candidates: courses.map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      school: c.schools[0]?.school.name ?? null,
      level: c.level,
      priceLabel: c.price > 0 ? formatFCFA(c.price) : "Gratuit",
    })),
  };
}

export async function countInactiveUsers(): Promise<{ never: number; dormant: number }> {
  await guard();
  const dormantBefore = new Date(Date.now() - DORMANT_DAYS * DAY_MS);
  const base: Prisma.UserWhereInput = { deletedAt: null, NOT: { roles: { hasSome: [...NON_TARGET_ROLES] } } };
  const [never, dormant] = await Promise.all([
    prisma.user.count({ where: { ...base, lastActiveAt: null } }),
    prisma.user.count({ where: { ...base, lastActiveAt: { lt: dormantBefore } } }),
  ]);
  return { never, dormant };
}

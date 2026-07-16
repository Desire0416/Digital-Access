import "server-only";
import { redirect } from "next/navigation";
import { prisma, type CohortStatus, type Role, type Prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Cohortes — LECTURES back-office (cahier §23). Défense en profondeur : chaque
   requête revérifie le rôle admin EN BASE (requireAdminFresh) même si le layout
   /admin est déjà gardé. Fichier volontairement découplé de admin-queries.ts.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/* ─── Liste filtrée ────────────────────────────────────────────────────────── */

export async function listCohortsAdmin(filters: { q?: string; status?: CohortStatus } = {}) {
  await guard();
  const where: Prisma.CohortWhereInput = {};
  if (filters.q?.trim()) where.name = { contains: filters.q.trim(), mode: "insensitive" };
  if (filters.status) where.status = filters.status;
  return prisma.cohort.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      capacity: true,
      course: { select: { title: true } },
      careerPath: { select: { title: true } },
      _count: { select: { members: true, events: true } },
    },
  });
}

/* ─── Fiche complète (éditeur admin) ───────────────────────────────────────── */

export async function getCohortAdmin(id: string) {
  await guard();
  return prisma.cohort.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      rules: true,
      rhythm: true,
      coverImage: true,
      status: true,
      startDate: true,
      endDate: true,
      enrollmentDeadline: true,
      capacity: true,
      price: true,
      courseId: true,
      careerPathId: true,
      schoolId: true,
      createdAt: true,
      updatedAt: true,
      course: { select: { id: true, title: true, slug: true } },
      careerPath: { select: { id: true, title: true, slug: true } },
      school: { select: { id: true, name: true } },
      instructors: {
        orderBy: { roleLabel: "asc" },
        select: {
          id: true,
          roleLabel: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      members: {
        take: 200,
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          status: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      events: {
        orderBy: { startAt: "asc" },
        select: { id: true, title: true, startAt: true, status: true, type: true },
      },
      announcements: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, pinned: true, createdAt: true },
      },
      _count: { select: { members: true, events: true, instructors: true, announcements: true } },
    },
  });
}

/* ─── Sélecteurs de cible (formation / parcours / école) ───────────────────── */

export async function listCohortTargetsForPicker(): Promise<{
  courses: { id: string; title: string; slug: string }[];
  paths: { id: string; title: string; slug: string }[];
  schools: { id: string; name: string }[];
}> {
  await guard();
  const [courses, paths, schools] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true, slug: true },
    }),
    prisma.careerPath.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true, slug: true },
    }),
    prisma.school.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  return { courses, paths, schools };
}

/* ─── Recherche d'utilisateurs (ajout intervenant / membre) ────────────────── */

export async function searchCohortUsers(q: string): Promise<{ id: string; name: string; email: string; roles: Role[] }[]> {
  await guard();
  const term = q.trim();
  if (!term) return [];
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: { id: true, name: true, email: true, roles: true },
  });
}

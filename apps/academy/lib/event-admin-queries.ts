import "server-only";
import { redirect } from "next/navigation";
import { prisma, type EventStatus, type EventType, type Prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Back-office — ÉVÉNEMENTS / classes virtuelles (cahier §24). LECTURES.
   Défense en profondeur : chaque requête revérifie le rôle admin EN BASE
   (requireAdminFresh) même si le layout /admin est déjà gardé.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/* ─── Liste filtrée ────────────────────────────────────────────────────────── */

export async function listEventsAdmin(filters: { q?: string; status?: EventStatus; type?: EventType } = {}) {
  await guard();
  const where: Prisma.EventWhereInput = {};
  if (filters.q?.trim()) where.title = { contains: filters.q.trim(), mode: "insensitive" };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  return prisma.event.findMany({
    where,
    orderBy: { startAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      audience: true,
      status: true,
      startAt: true,
      endAt: true,
      provider: true,
      cohort: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
  });
}

export type EventAdminListItem = Awaited<ReturnType<typeof listEventsAdmin>>[number];

/* ─── Fiche complète (éditeur admin) ───────────────────────────────────────── */

export async function getEventAdmin(id: string) {
  await guard();
  return prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      audience: true,
      startAt: true,
      endAt: true,
      timezone: true,
      provider: true,
      meetingUrl: true,
      location: true,
      capacity: true,
      coverImage: true,
      speakerName: true,
      replayUrl: true,
      summary: true,
      resources: true,
      status: true,
      hostId: true,
      cohortId: true,
      courseId: true,
      careerPathId: true,
      schoolId: true,
      createdAt: true,
      updatedAt: true,
      cohort: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
      careerPath: { select: { id: true, title: true } },
      school: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      registrations: {
        orderBy: { registeredAt: "asc" },
        select: {
          id: true,
          attended: true,
          attendedAt: true,
          registeredAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { registrations: true } },
    },
  });
}

export type EventAdminDetail = Awaited<ReturnType<typeof getEventAdmin>>;

/* ─── Contexte pour les sélecteurs (rattachements de l'éditeur) ────────────── */

/**
 * Options des menus déroulants de l'éditeur d'événement : cohortes, cibles
 * pédagogiques PUBLISHED, écoles et animateurs possibles (formateurs, mentors
 * ou administrateurs).
 */
export async function listEventContextForPicker(): Promise<{
  cohorts: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  paths: { id: string; title: string }[];
  schools: { id: string; name: string }[];
  hosts: { id: string; name: string }[];
}> {
  await guard();
  const [cohorts, courses, paths, schools, hosts] = await Promise.all([
    prisma.cohort.findMany({ orderBy: { name: "asc" }, take: 300, select: { id: true, name: true } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true },
    }),
    prisma.careerPath.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true },
    }),
    prisma.school.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { roles: { hasSome: ["INSTRUCTOR", "MENTOR", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"] } },
      orderBy: { name: "asc" },
      take: 300,
      select: { id: true, name: true },
    }),
  ]);
  return { cohorts, courses, paths, schools, hosts };
}

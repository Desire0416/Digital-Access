import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Mentorat — LECTURES back-office (§7.5 / §30). Gardées admin (défense en
   profondeur). L'admin assigne des apprenants à des mentors.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/** Mentors (rôle MENTOR) + nombre de mentorés. */
export async function listMentorsAdmin() {
  await guard();
  return prisma.user.findMany({
    where: { roles: { has: "MENTOR" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: { select: { mentorAssignments: true } },
    },
  });
}

/** Toutes les assignations (mentor → apprenant), triées par mentor. */
export async function listMentorAssignmentsAdmin() {
  await guard();
  return prisma.mentorAssignment.findMany({
    orderBy: [{ mentor: { name: "asc" } }, { createdAt: "desc" }],
    take: 500,
    select: {
      id: true,
      createdAt: true,
      mentor: { select: { id: true, name: true } },
      learner: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Sélecteur de mentor (rôle MENTOR). */
export async function listMentorsForPicker(): Promise<{ id: string; name: string }[]> {
  await guard();
  return prisma.user.findMany({
    where: { roles: { has: "MENTOR" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Recherche d'apprenants à assigner (par nom / email). */
export async function searchLearnersForMentor(q: string): Promise<{ id: string; name: string; email: string }[]> {
  await guard();
  const term = q.trim();
  if (term.length < 2) return [];
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: { id: true, name: true, email: true },
  });
}

export async function countMentorAssignments(): Promise<number> {
  await guard();
  return prisma.mentorAssignment.count();
}

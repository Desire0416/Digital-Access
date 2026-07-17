import "server-only";
import { redirect } from "next/navigation";
import { prisma, type Prisma, type TicketCategory, type TicketPriority, type TicketStatus } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Support & centre d'aide — LECTURES back-office (cahier §35). Défense en
   profondeur : chaque requête revérifie le rôle admin EN BASE
   (requireAdminFresh) même si le layout /admin est déjà gardé. Le staff voit
   TOUS les tickets (contrairement à l'apprenant, restreint à ses propres
   tickets dans support-queries.ts). Fichier découplé d'admin-queries.ts.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/* ─── File des tickets (liste filtrée) ─────────────────────────────────────── */

export async function listTicketsAdmin(
  filters: { status?: TicketStatus; category?: TicketCategory; priority?: TicketPriority; q?: string } = {}
) {
  await guard();
  const where: Prisma.SupportTicketWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  const q = filters.q?.trim();
  if (q) {
    // Recherche sur le sujet, OU sur le numéro lisible (#1024) si q est numérique.
    where.OR = /^\d+$/.test(q)
      ? [{ subject: { contains: q, mode: "insensitive" } }, { number: Number(q) }]
      : [{ subject: { contains: q, mode: "insensitive" } }];
  }
  return prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      number: true,
      subject: true,
      category: true,
      priority: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { messages: true } },
    },
  });
}

/* ─── Fiche complète d'un ticket (fil de discussion) ───────────────────────── */

export async function getTicketAdmin(id: string) {
  await guard();
  return prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      userId: true,
      subject: true,
      category: true,
      priority: true,
      status: true,
      assignedToId: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          body: true,
          fromStaff: true,
          isSystem: true,
          attachments: true,
          author: { select: { name: true } },
          createdAt: true,
        },
      },
    },
  });
}

/* ─── Pastille de navigation (tickets à traiter) ───────────────────────────── */

export async function countOpenTickets(): Promise<number> {
  await guard();
  return prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } });
}

/* ─── FAQ administrable (§35.1) ────────────────────────────────────────────── */

export async function listFaqAdmin() {
  await guard();
  return prisma.faqItem.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      category: true,
      question: true,
      answer: true,
      order: true,
      published: true,
      updatedAt: true,
    },
  });
}

/* ─── Sélecteur d'assignation (membres du staff) ───────────────────────────── */

export async function listSupportStaffForPicker(): Promise<{ id: string; name: string }[]> {
  await guard();
  return prisma.user.findMany({
    where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

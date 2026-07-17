import "server-only";

import {
  prisma,
  type Prisma,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Support apprenant & centre d'aide (cahier §35) — LECTURES.
   SÉCURITÉ NIVEAU LIGNE : un apprenant ne voit QUE ses propres tickets
   (`where userId` dans chaque requête). PAS d'exception admin ici — le
   back-office a sa propre file (support-admin). La FAQ publiée est publique.
   L'historique des statuts vit dans le fil : TicketMessage `isSystem: true`.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Pièces jointes (Json défensif) ───────────────────────────────────────── */

export interface TicketAttachment {
  url: string;
  name: string;
}

/** N'accepte QUE les URLs Vercel Blob (anti-injection de lien tiers). */
function isBlobUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Parse défensivement le JSON `attachments` : Blob only, ≤ 4, nom borné à 160c.
 * Les URLs sont re-filtrées en LECTURE (défense en profondeur : une ligne
 * corrompue en base ne doit jamais injecter un <img> tiers dans le fil).
 */
function parseAttachments(value: Prisma.JsonValue | null | undefined): TicketAttachment[] {
  if (!Array.isArray(value)) return [];
  const out: TicketAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url : null;
    const name = typeof rec.name === "string" ? rec.name : null;
    if (!url || !name || !isBlobUrl(url)) continue;
    out.push({ url, name: name.slice(0, 160) });
    if (out.length >= 4) break;
  }
  return out;
}

/* ─── Mes tickets (§35.2) ──────────────────────────────────────────────────── */

export interface MyTicket {
  id: string;
  number: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  /** Nombre de vrais messages (les événements système ne comptent pas). */
  messageCount: number;
  /** Date du dernier vrai message (null si aucun — cas théorique). */
  lastMessageAt: Date | null;
  /** Le dernier message non-système vient du support → « réponse à lire ». */
  hasUnreadStaffReply: boolean;
}

/** Tickets de l'apprenant, activité la plus récente d'abord. */
export async function getMyTickets(userId: string): Promise<MyTicket[]> {
  const rows = await prisma.supportTicket.findMany({
    where: { userId },
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
      // Dernier VRAI message (non-système) : date + provenance staff.
      messages: {
        where: { isSystem: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, fromStaff: true },
      },
      _count: { select: { messages: { where: { isSystem: false } } } },
    },
  });

  return rows.map((t) => {
    const last = t.messages[0];
    return {
      id: t.id,
      number: t.number,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t._count.messages,
      lastMessageAt: last?.createdAt ?? null,
      hasUnreadStaffReply: last?.fromStaff ?? false,
    };
  });
}

/* ─── Détail d'un ticket (fil complet) ─────────────────────────────────────── */

export interface TicketMessageView {
  id: string;
  body: string;
  fromStaff: boolean;
  /** Événement d'historique (changement de statut…) — rendu comme un séparateur. */
  isSystem: boolean;
  attachments: TicketAttachment[];
  authorName: string | null;
  createdAt: Date;
}

export interface TicketView {
  id: string;
  number: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  closedAt: Date | null;
  /** Un ticket clôturé n'accepte plus de réponse apprenant. */
  canReply: boolean;
  messages: TicketMessageView[];
}

/**
 * Fil complet d'un ticket. CLOISONNEMENT STRICT : renvoie null si le ticket
 * n'appartient pas à `userId` (le filtre est DANS le where — pas d'exception
 * admin ici, le back-office a sa propre query).
 */
export async function getMyTicket(ticketId: string, userId: string): Promise<TicketView | null> {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
    select: {
      id: true,
      number: true,
      subject: true,
      category: true,
      priority: true,
      status: true,
      createdAt: true,
      closedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 500,
        select: {
          id: true,
          body: true,
          fromStaff: true,
          isSystem: true,
          attachments: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
    },
  });
  if (!ticket) return null;

  return {
    id: ticket.id,
    number: ticket.number,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt,
    closedAt: ticket.closedAt,
    canReply: ticket.status !== "CLOSED",
    messages: ticket.messages.map((m) => ({
      id: m.id,
      body: m.body,
      fromStaff: m.fromStaff,
      isSystem: m.isSystem,
      attachments: parseAttachments(m.attachments),
      authorName: m.author?.name ?? null,
      createdAt: m.createdAt,
    })),
  };
}

/* ─── Centre d'aide — FAQ publique (§35.1) ─────────────────────────────────── */

export interface FaqEntry {
  id: string;
  question: string;
  /** Markdown (rendu côté page). */
  answer: string;
}

export interface FaqGroup {
  category: string;
  items: FaqEntry[];
}

/** FAQ publiée, regroupée par catégorie (tri : catégorie, puis `order`). PUBLIC. */
export async function getPublishedFaq(): Promise<FaqGroup[]> {
  const rows = await prisma.faqItem.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    take: 300,
    select: { id: true, category: true, question: true, answer: true },
  });

  const groups: FaqGroup[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    const entry: FaqEntry = { id: row.id, question: row.question, answer: row.answer };
    if (last && last.category === row.category) last.items.push(entry);
    else groups.push({ category: row.category, items: [entry] });
  }
  return groups;
}

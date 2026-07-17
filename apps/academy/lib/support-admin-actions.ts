"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type TicketStatus, type TicketPriority } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";
import { createNotification } from "./notify";
import { TICKET_STATUS_LABEL } from "./support-labels";

/* ══════════════════════════════════════════════════════════════════════════
   Support & centre d'aide — ACTIONS back-office (cahier §35). Chaque mutation
   revérifie le rôle admin EN BASE (requireAdminFresh) et trace un AuditLog.
   L'HISTORIQUE des statuts vit dans le fil (TicketMessage isSystem:true), créé
   dans la MÊME transaction que le changement. L'apprenant est notifié à chaque
   réponse du staff / changement de statut. Fichier découplé d'admin-actions.ts.
   ══════════════════════════════════════════════════════════════════════════ */

export type AdminActionResult = { ok: true; message?: string } | { ok: false; error: string };
const DENIED: AdminActionResult = { ok: false, error: "Accès réservé aux administrateurs." };

async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

/* ─── Pièces jointes (Blob only) ───────────────────────────────────────────── */

const blobUrl = z
  .string()
  .url()
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "Pièce jointe invalide.");
const attachmentsSchema = z
  .array(z.object({ url: blobUrl, name: z.string().trim().min(1).max(160) }))
  .max(4, "4 pièces jointes maximum.")
  .optional();

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_LEARNER", "RESOLVED", "CLOSED"] as const satisfies readonly TicketStatus[];
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const satisfies readonly TicketPriority[];

function revalidateTicket(id: string) {
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/espace/support");
  revalidatePath(`/espace/support/${id}`);
}

/* ─── Réponse du support (avec changement de statut optionnel) ──────────────── */

const staffReplySchema = z.object({
  body: z.string().trim().min(1, "Message vide.").max(6000, "Message trop long."),
  attachments: attachmentsSchema,
  newStatus: z.enum(TICKET_STATUSES).optional(),
});

export async function staffReplyToTicket(
  ticketId: string,
  input: { body: string; attachments?: { url: string; name: string }[]; newStatus?: TicketStatus },
): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(ticketId);
  const parsed = staffReplySchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { ok: false, error: parsed.success ? "Ticket invalide." : parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: idParsed.data },
    select: { id: true, userId: true, number: true, status: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };

  const { body, attachments, newStatus } = parsed.data;
  // Défaut : après une réponse du staff, le ticket attend l'apprenant — sauf si
  // l'agent choisit explicitement un autre statut, ou si le ticket est clôturé.
  const finalStatus: TicketStatus = newStatus ?? (ticket.status === "CLOSED" ? "CLOSED" : "WAITING_LEARNER");
  const statusChanged = finalStatus !== ticket.status;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: admin.id,
        body,
        fromStaff: true,
        attachments: attachments && attachments.length ? (attachments as Prisma.InputJsonValue) : undefined,
        createdAt: now,
      },
    });
    if (statusChanged) {
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: { status: finalStatus, closedAt: finalStatus === "CLOSED" ? now : null },
      });
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: `Statut passé à « ${TICKET_STATUS_LABEL[finalStatus]} »`,
          isSystem: true,
          fromStaff: true,
          createdAt: new Date(now.getTime() + 1),
        },
      });
    } else {
      await tx.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: now } });
    }
  });

  await createNotification({
    userId: ticket.userId,
    type: "TICKET",
    title: `Réponse du support — ticket #${ticket.number}`,
    message: "Notre équipe a répondu à votre demande.",
    link: `/espace/support/${ticket.id}`,
  });
  await audit(admin.id, "ticket.reply", "SupportTicket", ticket.id, { statusChanged, finalStatus });
  revalidateTicket(ticket.id);
  return { ok: true, message: "Réponse envoyée." };
}

/* ─── Changement de statut seul ────────────────────────────────────────────── */

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<AdminActionResult> {
  const parsed = z.object({ ticketId: z.string().min(1), status: z.enum(TICKET_STATUSES) }).safeParse({ ticketId, status });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, userId: true, number: true, status: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };
  if (ticket.status === parsed.data.status) return { ok: true, message: "Statut inchangé." };

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: parsed.data.status, closedAt: parsed.data.status === "CLOSED" ? now : null },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: `Statut passé à « ${TICKET_STATUS_LABEL[parsed.data.status]} »`,
        isSystem: true,
        fromStaff: true,
        createdAt: now,
      },
    }),
  ]);

  await createNotification({
    userId: ticket.userId,
    type: "TICKET",
    title: `Ticket #${ticket.number} mis à jour`,
    message: `Votre demande est désormais « ${TICKET_STATUS_LABEL[parsed.data.status]} ».`,
    link: `/espace/support/${ticket.id}`,
  });
  await audit(admin.id, "ticket.status", "SupportTicket", ticket.id, { status: parsed.data.status });
  revalidateTicket(ticket.id);
  return { ok: true, message: "Statut mis à jour." };
}

/* ─── Priorité ─────────────────────────────────────────────────────────────── */

export async function setTicketPriority(ticketId: string, priority: TicketPriority): Promise<AdminActionResult> {
  const parsed = z.object({ ticketId: z.string().min(1), priority: z.enum(TICKET_PRIORITIES) }).safeParse({ ticketId, priority });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: parsed.data.ticketId }, select: { id: true } });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };

  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { priority: parsed.data.priority } });
  await audit(admin.id, "ticket.priority", "SupportTicket", ticket.id, { priority: parsed.data.priority });
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticket.id}`);
  return { ok: true, message: "Priorité mise à jour." };
}

/* ─── Assignation ──────────────────────────────────────────────────────────── */

export async function assignTicket(ticketId: string, assigneeId: string | null): Promise<AdminActionResult> {
  const parsed = z.object({ ticketId: z.string().min(1), assigneeId: z.string().min(1).nullable() }).safeParse({ ticketId, assigneeId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: parsed.data.ticketId }, select: { id: true } });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };

  if (parsed.data.assigneeId) {
    const staff = await prisma.user.findFirst({
      where: { id: parsed.data.assigneeId, roles: { hasSome: ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (!staff) return { ok: false, error: "Cet utilisateur ne fait pas partie du support." };
  }

  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { assignedToId: parsed.data.assigneeId } });
  await audit(admin.id, "ticket.assign", "SupportTicket", ticket.id, { assigneeId: parsed.data.assigneeId });
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticket.id}`);
  return { ok: true, message: parsed.data.assigneeId ? "Ticket assigné." : "Assignation retirée." };
}

/* ─── Centre d'aide (FAQ) — CRUD (§35.1) ───────────────────────────────────── */

const faqSchema = z.object({
  category: z.string().trim().min(2, "Catégorie trop courte.").max(80),
  question: z.string().trim().min(5, "Question trop courte.").max(300),
  answer: z.string().trim().min(10, "Réponse trop courte.").max(8000),
  order: z.coerce.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export type FaqInput = z.input<typeof faqSchema>;

export async function createFaqItem(input: FaqInput): Promise<AdminActionResult> {
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const d = parsed.data;
  const item = await prisma.faqItem.create({
    data: { category: d.category, question: d.question, answer: d.answer, order: d.order ?? 0, published: d.published ?? true },
    select: { id: true },
  });
  await audit(admin.id, "faq.create", "FaqItem", item.id, { category: d.category });
  revalidatePath("/aide");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Question ajoutée." };
}

export async function updateFaqItem(faqId: string, input: Partial<FaqInput>): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(faqId);
  const parsed = faqSchema.partial().safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { ok: false, error: parsed.success ? "Élément invalide." : parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const existing = await prisma.faqItem.findUnique({ where: { id: idParsed.data }, select: { id: true } });
  if (!existing) return { ok: false, error: "Question introuvable." };

  const d = parsed.data;
  await prisma.faqItem.update({
    where: { id: existing.id },
    data: {
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.question !== undefined ? { question: d.question } : {}),
      ...(d.answer !== undefined ? { answer: d.answer } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
      ...(d.published !== undefined ? { published: d.published } : {}),
    },
  });
  await audit(admin.id, "faq.update", "FaqItem", existing.id, { fields: Object.keys(d) });
  revalidatePath("/aide");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Question mise à jour." };
}

export async function setFaqPublished(faqId: string, published: boolean): Promise<AdminActionResult> {
  const parsed = z.object({ faqId: z.string().min(1), published: z.boolean() }).safeParse({ faqId, published });
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const existing = await prisma.faqItem.findUnique({ where: { id: parsed.data.faqId }, select: { id: true } });
  if (!existing) return { ok: false, error: "Question introuvable." };

  await prisma.faqItem.update({ where: { id: existing.id }, data: { published: parsed.data.published } });
  await audit(admin.id, "faq.publish", "FaqItem", existing.id, { published: parsed.data.published });
  revalidatePath("/aide");
  revalidatePath("/admin/faq");
  return { ok: true, message: parsed.data.published ? "Question publiée." : "Question masquée." };
}

export async function deleteFaqItem(faqId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(faqId);
  if (!parsed.success) return { ok: false, error: "Élément invalide." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  try {
    await prisma.faqItem.delete({ where: { id: parsed.data } });
  } catch {
    return { ok: false, error: "Suppression impossible (élément introuvable ?)." };
  }
  await audit(admin.id, "faq.delete", "FaqItem", parsed.data, {});
  revalidatePath("/aide");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Question supprimée." };
}

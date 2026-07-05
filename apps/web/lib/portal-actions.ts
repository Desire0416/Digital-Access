"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";

export type Result<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function ownedProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, clientId: userId, deletedAt: null },
    select: { id: true, clientId: true },
  });
}

async function notifyAdmins(title: string, message: string, link: string) {
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] }, deletedAt: null },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type: "TICKET_NEW" as const, title, message, link })),
  });
}

/* ───────────────────────── Messagerie de projet (CL05) ─────────────────────── */

const messageSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().trim().min(1, "Votre message est vide.").max(2000),
});

export async function postProjectMessage(input: z.input<typeof messageSchema>): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Message invalide." };

  const project = await ownedProject(user.id, parsed.data.projectId);
  if (!project) return { ok: false, error: "Projet introuvable." };

  try {
    await prisma.projectMessage.create({
      data: { projectId: project.id, userId: user.id, content: parsed.data.content },
    });
    await notifyAdmins(
      "Nouveau message client",
      `${user.name ?? user.email} a répondu sur un projet.`,
      `/projets/${project.id}`,
    ).catch(() => {});
    revalidatePath(`/mes-projets/${project.id}`);
    return { ok: true };
  } catch (err) {
    console.error("[portal] postProjectMessage:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────── Validation de livrable (CL06) ─────────────────────────── */

const deliverableSchema = z.object({
  projectId: z.string().min(1),
  stageName: z.string().trim().min(1).max(160),
  approve: z.boolean(),
  note: z.string().trim().max(1000).optional().default(""),
});

export async function respondToDeliverable(input: z.input<typeof deliverableSchema>): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const parsed = deliverableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const project = await ownedProject(user.id, d.projectId);
  if (!project) return { ok: false, error: "Projet introuvable." };

  try {
    const content = d.approve
      ? `✅ Livrable approuvé — étape « ${d.stageName} ».${d.note ? ` ${d.note}` : ""}`
      : `🔁 Corrections demandées — étape « ${d.stageName} » : ${d.note || "voir mes commentaires."}`;
    await prisma.projectMessage.create({
      data: { projectId: project.id, userId: user.id, content },
    });
    await notifyAdmins(
      d.approve ? "Livrable approuvé" : "Corrections demandées",
      `${user.name ?? user.email} — étape « ${d.stageName} ».`,
      `/projets/${project.id}`,
    ).catch(() => {});
    revalidatePath(`/mes-projets/${project.id}`);
    return { ok: true };
  } catch (err) {
    console.error("[portal] respondToDeliverable:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ───────────────────────── Tickets de support (CL20-22) ────────────────────── */

const createTicketSchema = z.object({
  title: z.string().trim().min(4, "Le titre est trop court.").max(160),
  description: z.string().trim().min(10, "Décrivez votre demande (10 caractères min.).").max(3000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  projectId: z.string().optional().nullable(),
});

export async function createTicket(input: z.input<typeof createTicketSchema>): Promise<Result<{ ticketId: string }>> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors };
  }
  const d = parsed.data;

  try {
    // Si un projet est rattaché, il doit appartenir au client.
    let projectId: string | null = null;
    if (d.projectId) {
      const project = await ownedProject(user.id, d.projectId);
      if (!project) return { ok: false, error: "Projet invalide." };
      projectId = project.id;
    }

    const ticket = await prisma.ticket.create({
      data: {
        clientId: user.id,
        projectId,
        title: d.title,
        description: d.description,
        priority: d.priority,
        status: "OPEN",
      },
      select: { id: true },
    });
    await notifyAdmins(
      "Nouveau ticket de support",
      `${user.name ?? user.email} : « ${d.title} » (${d.priority}).`,
      `/support/${ticket.id}`,
    ).catch(() => {});
    revalidatePath("/support");
    return { ok: true, ticketId: ticket.id };
  } catch (err) {
    console.error("[portal] createTicket:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

const ticketMessageSchema = z.object({
  ticketId: z.string().min(1),
  content: z.string().trim().min(1, "Votre message est vide.").max(2000),
});

export async function postTicketMessage(input: z.input<typeof ticketMessageSchema>): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const parsed = ticketMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Message invalide." };

  const ticket = await prisma.ticket.findFirst({
    where: { id: parsed.data.ticketId, clientId: user.id },
    select: { id: true, status: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };

  try {
    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: { ticketId: ticket.id, userId: user.id, content: parsed.data.content },
      }),
      // Une réponse du client rouvre un ticket résolu/fermé.
      ...(ticket.status === "RESOLVED" || ticket.status === "CLOSED"
        ? [prisma.ticket.update({ where: { id: ticket.id }, data: { status: "OPEN" } })]
        : [prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } })]),
    ]);
    revalidatePath(`/support/${ticket.id}`);
    return { ok: true };
  } catch (err) {
    console.error("[portal] postTicketMessage:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function closeTicket(ticketId: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, clientId: user.id },
    select: { id: true },
  });
  if (!ticket) return { ok: false, error: "Ticket introuvable." };
  try {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "RESOLVED" } });
    revalidatePath(`/support/${ticket.id}`);
    revalidatePath("/support");
    return { ok: true };
  } catch (err) {
    console.error("[portal] closeTicket:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

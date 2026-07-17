"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type TicketCategory } from "@da/academy-db/client";
import { currentUser } from "./guards";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Support apprenant — ACTIONS (cahier §35.2). INVARIANTS :
   · SÉCURITÉ NIVEAU LIGNE : chaque mutation revérifie la PROPRIÉTÉ du ticket
     (ticket.userId === user.id) et répond « Ticket introuvable. » sinon —
     erreur générique, aucune fuite d'existence.
   · L'HISTORIQUE des statuts = messages système (isSystem: true) dans le fil,
     créés dans la MÊME transaction que le changement de statut.
   · Réponse apprenant sur RESOLVED / WAITING_LEARNER → réouverture (OPEN).
   · Un ticket CLOSED n'accepte plus de réponse apprenant (le staff rouvre).
   · Pièces jointes : uniquement des URLs Vercel Blob (≤ 4, nom ≤ 160c) —
     elles sont affichées en <img>/liens dans le fil (staff inclus), jamais
     d'hôte tiers (anti pixel-traceur).
   ══════════════════════════════════════════════════════════════════════════ */

export type SupportActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error?: string; redirect?: string };

const CONNEXION = "/connexion?callbackUrl=/espace/support";

/** Tickets « en cours » comptés pour l'anti-spam (max 5 simultanés). */
const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_LEARNER"] as const;
const MAX_ACTIVE_TICKETS = 5;

/* ─── Schémas partagés ─────────────────────────────────────────────────────── */

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

const attachmentSchema = z.object({
  url: blobUrl,
  name: z.string().trim().min(1).max(160),
});
const attachmentsSchema = z.array(attachmentSchema).max(4, "4 pièces jointes maximum.").optional();

const TICKET_CATEGORIES = [
  "TECHNICAL",
  "PAYMENT",
  "COURSE_CONTENT",
  "CERTIFICATE",
  "ACCOUNT",
  "OTHER",
] as const satisfies readonly TicketCategory[];

/** Notifie tous les administrateurs du support (silencieux, jamais bloquant). */
async function notifyAdmins(title: string, message: string, link: string): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) => createNotification({ userId: a.id, type: "TICKET", title, message, link })),
  );
}

/* ─── Ouvrir un ticket ─────────────────────────────────────────────────────── */

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Sujet trop court.").max(160, "Sujet trop long."),
  category: z.enum(TICKET_CATEGORIES),
  body: z
    .string()
    .trim()
    .min(10, "Décrivez votre demande (10 caractères minimum).")
    .max(6000, "Message trop long."),
  attachments: attachmentsSchema,
});

export async function createTicket(input: {
  subject: string;
  category: TicketCategory;
  body: string;
  attachments?: { url: string; name: string }[];
}): Promise<SupportActionResult> {
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };
  if (!user.emailVerified) {
    return { ok: false, error: "Confirmez votre adresse email pour contacter le support." };
  }

  // Anti-spam : au plus 5 demandes « en cours » simultanées par apprenant.
  const activeCount = await prisma.supportTicket.count({
    where: { userId: user.id, status: { in: [...ACTIVE_STATUSES] } },
  });
  if (activeCount >= MAX_ACTIVE_TICKETS) {
    return {
      ok: false,
      error:
        "Vous avez déjà plusieurs demandes en cours. Attendez une réponse ou clôturez une demande avant d'en ouvrir une nouvelle.",
    };
  }

  const { subject, category, body, attachments } = parsed.data;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject,
      category,
      messages: {
        create: {
          authorId: user.id,
          body,
          fromStaff: false,
          attachments:
            attachments && attachments.length ? (attachments as Prisma.InputJsonValue) : undefined,
        },
      },
    },
    select: { id: true, number: true },
  });

  await notifyAdmins(
    "Nouvelle demande de support",
    `#${ticket.number} — ${subject}`,
    "/admin/support",
  );
  revalidatePath("/espace/support");
  return { ok: true, id: ticket.id, message: "Votre demande a bien été envoyée." };
}

/* ─── Répondre à un ticket ─────────────────────────────────────────────────── */

const replySchema = z.object({
  body: z.string().trim().min(1, "Message vide.").max(6000, "Message trop long."),
  attachments: attachmentsSchema,
});

export async function replyToTicket(
  ticketId: string,
  input: { body: string; attachments?: { url: string; name: string }[] },
): Promise<SupportActionResult> {
  const idParsed = z.string().min(1).safeParse(ticketId);
  if (!idParsed.success) return { ok: false, error: "Ticket introuvable." };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: idParsed.data },
    select: { id: true, userId: true, status: true, number: true, subject: true },
  });
  // PROPRIÉTÉ : erreur générique identique au ticket inexistant (aucune fuite).
  if (!ticket || ticket.userId !== user.id) return { ok: false, error: "Ticket introuvable." };
  if (ticket.status === "CLOSED") {
    return { ok: false, error: "Ce ticket est clôturé — ouvrez une nouvelle demande." };
  }

  const { body, attachments } = parsed.data;
  const reopens = ticket.status === "RESOLVED" || ticket.status === "WAITING_LEARNER";
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: user.id,
        body,
        fromStaff: false,
        attachments:
          attachments && attachments.length ? (attachments as Prisma.InputJsonValue) : undefined,
        createdAt: now,
      },
    });
    if (reopens) {
      // Réouverture + trace d'historique (createdAt décalé de 1 ms : le message
      // système suit TOUJOURS la réponse dans le fil trié par createdAt asc).
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: { status: "OPEN" },
      });
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: "Ticket rouvert par l'apprenant",
          isSystem: true,
          createdAt: new Date(now.getTime() + 1),
        },
      });
    } else {
      // Pas de changement de statut → on rafraîchit quand même updatedAt
      // (tri « activité récente » de la liste des tickets).
      await tx.supportTicket.update({ where: { id: ticket.id }, data: { updatedAt: now } });
    }
  });

  await notifyAdmins(
    reopens ? "Ticket rouvert par l'apprenant" : "Réponse de l'apprenant",
    `#${ticket.number} — ${ticket.subject}`,
    `/admin/support/${ticket.id}`,
  );
  revalidatePath("/espace/support");
  revalidatePath(`/espace/support/${ticket.id}`);
  return { ok: true };
}

/* ─── Clôturer mon ticket ──────────────────────────────────────────────────── */

export async function closeMyTicket(ticketId: string): Promise<SupportActionResult> {
  const idParsed = z.string().min(1).safeParse(ticketId);
  if (!idParsed.success) return { ok: false, error: "Ticket introuvable." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: idParsed.data },
    select: { id: true, userId: true, status: true },
  });
  // PROPRIÉTÉ : erreur générique identique au ticket inexistant (aucune fuite).
  if (!ticket || ticket.userId !== user.id) return { ok: false, error: "Ticket introuvable." };
  if (ticket.status === "CLOSED") return { ok: false, error: "Ce ticket est déjà clôturé." };

  await prisma.$transaction([
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
    prisma.ticketMessage.create({
      data: { ticketId: ticket.id, body: "Ticket clôturé par l'apprenant", isSystem: true },
    }),
  ]);

  revalidatePath("/espace/support");
  revalidatePath(`/espace/support/${ticket.id}`);
  return { ok: true, message: "Merci ! Votre demande est clôturée." };
}

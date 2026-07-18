"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, type MentorMessageKind } from "@da/academy-db/client";
import { currentUser } from "./guards";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Mentorat — ACTIONS (cahier §7.5). INVARIANT : un mentor n'agit QUE sur un
   apprenant qui lui est ASSIGNÉ. `requireAssignment` charge (et donc vérifie)
   l'assignation avant toute écriture ; sans elle, erreur générique.
   « Proposer un RDV » = un message structuré (date + lien) + notification
   (pas d'entité calendrier dédiée en v1 — l'apprenant est notifié).
   ══════════════════════════════════════════════════════════════════════════ */

export type MentorActionResult =
  | { ok: true; message?: string }
  | { ok: false; error?: string; redirect?: string };

const CONNEXION = "/connexion?callbackUrl=/mentorat";

/** Charge l'assignation mentor(courant)↔apprenant. Autorise aussi l'appelant. */
async function requireAssignment(
  learnerId: string,
): Promise<
  | { ok: true; mentorId: string; assignmentId: string; learnerId: string }
  | { ok: false; error?: string; redirect?: string }
> {
  const idParsed = z.string().min(1).safeParse(learnerId);
  if (!idParsed.success) return { ok: false, error: "Apprenant introuvable." };
  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };
  const assignment = await prisma.mentorAssignment.findUnique({
    where: { mentorId_learnerId: { mentorId: user.id, learnerId: idParsed.data } },
    select: { id: true },
  });
  // Erreur générique : ne révèle pas l'existence de l'apprenant.
  if (!assignment) return { ok: false, error: "Cet apprenant ne fait pas partie de vos mentorés." };
  return { ok: true, mentorId: user.id, assignmentId: assignment.id, learnerId: idParsed.data };
}

/* ─── Message / recommandation ─────────────────────────────────────────────── */

const messageSchema = z.object({
  body: z.string().trim().min(1, "Message vide.").max(4000, "Message trop long."),
  kind: z.enum(["MESSAGE", "RECOMMENDATION"]).optional(),
});

export async function sendMentorMessage(
  learnerId: string,
  input: { body: string; kind?: MentorMessageKind },
): Promise<MentorActionResult> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const auth = await requireAssignment(learnerId);
  if (!auth.ok) return auth;

  const kind: MentorMessageKind = parsed.data.kind ?? "MESSAGE";
  await prisma.mentorMessage.create({
    data: { assignmentId: auth.assignmentId, body: parsed.data.body, kind },
  });

  await createNotification({
    userId: auth.learnerId,
    type: "MENTOR",
    title: kind === "RECOMMENDATION" ? "Recommandation de votre mentor" : "Message de votre mentor",
    message: parsed.data.body.slice(0, 140),
    link: "/espace",
  });
  revalidatePath(`/mentorat/${auth.learnerId}`);
  return { ok: true, message: kind === "RECOMMENDATION" ? "Recommandation envoyée." : "Message envoyé." };
}

/* ─── Proposer un rendez-vous (message structuré) ──────────────────────────── */

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), "Lien invalide.");

const meetingSchema = z.object({
  when: z.coerce.date({ invalid_type_error: "Date invalide." }),
  meetingUrl: httpUrl.optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional(),
});

export async function proposeMeeting(
  learnerId: string,
  input: { when: string | Date; meetingUrl?: string; note?: string },
): Promise<MentorActionResult> {
  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  if (parsed.data.when.getTime() < Date.now()) return { ok: false, error: "Choisissez une date à venir." };

  const auth = await requireAssignment(learnerId);
  if (!auth.ok) return auth;

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(parsed.data.when);
  const link = parsed.data.meetingUrl && parsed.data.meetingUrl.length ? parsed.data.meetingUrl : null;
  const body =
    `📅 **Proposition de rendez-vous** — ${dateLabel}` +
    (link ? `\n\nLien de connexion : ${link}` : "") +
    (parsed.data.note ? `\n\n${parsed.data.note}` : "");

  await prisma.mentorMessage.create({ data: { assignmentId: auth.assignmentId, body, kind: "MESSAGE" } });
  await createNotification({
    userId: auth.learnerId,
    type: "MENTOR",
    title: "Votre mentor propose un rendez-vous",
    message: `Le ${dateLabel}.`,
    link: "/espace",
  });
  revalidatePath(`/mentorat/${auth.learnerId}`);
  return { ok: true, message: "Rendez-vous proposé." };
}

/* ─── Note privée sur le mentoré ───────────────────────────────────────────── */

export async function updateMenteeNote(learnerId: string, note: string): Promise<MentorActionResult> {
  const parsed = z.string().trim().max(4000, "Note trop longue.").safeParse(note);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Note invalide." };

  const auth = await requireAssignment(learnerId);
  if (!auth.ok) return auth;

  await prisma.mentorAssignment.update({
    where: { id: auth.assignmentId },
    data: { note: parsed.data.length ? parsed.data : null },
  });
  revalidatePath(`/mentorat/${auth.learnerId}`);
  return { ok: true, message: "Note enregistrée." };
}

/* ─── Signaler un apprenant en difficulté (→ admins) ───────────────────────── */

export async function flagMentee(learnerId: string, reason: string): Promise<MentorActionResult> {
  const parsed = z.string().trim().min(3, "Précisez le motif.").max(1000, "Motif trop long.").safeParse(reason);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Motif invalide." };

  const auth = await requireAssignment(learnerId);
  if (!auth.ok) return auth;

  const [mentor, learner, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.mentorId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: auth.learnerId }, select: { name: true } }),
    prisma.user.findMany({ where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] } }, select: { id: true } }),
  ]);

  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "MENTOR",
        title: "Apprenant signalé en difficulté",
        message: `${mentor?.name ?? "Un mentor"} signale ${learner?.name ?? "un apprenant"} : ${parsed.data.slice(0, 120)}`,
        link: "/admin/utilisateurs",
      }),
    ),
  );
  return { ok: true, message: "Signalement transmis à l'équipe pédagogique." };
}

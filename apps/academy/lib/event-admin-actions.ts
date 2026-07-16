"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type EventStatus } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Back-office — ÉVÉNEMENTS / classes virtuelles (cahier §24). MUTATIONS.
   Chaque mutation passe par requireAdminFresh() : les rôles sont RELUS EN
   BASE, jamais le seul JWT. Toute opération est tracée dans AuditLog.
   Sécurité : meetingUrl / replayUrl / resources[].url sont affichés et
   cliquables publiquement → validés en http(s) uniquement (bloque
   javascript:/data:).
   ══════════════════════════════════════════════════════════════════════════ */

export type AdminActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string; slug: string; message?: string } | { ok: false; error: string };

const ACCESS_DENIED = "Accès réservé aux administrateurs.";
const DENIED: AdminActionResult = { ok: false, error: ACCESS_DENIED };

async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "evenement"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ─── Validation des liens : http(s) uniquement (§ sécurité) ───────────────── */

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), "Lien invalide");

const resourceSchema = z
  .array(
    z.object({
      title: z.string().trim().min(1).max(160),
      url: httpUrl,
      kind: z.string().trim().max(30).optional(),
    }),
  )
  .max(30);

/* ─── Création rapide (titre → DRAFT) ──────────────────────────────────────── */

export async function createEvent(title: string): Promise<CreateResult> {
  const parsed = z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères.").max(160).safeParse(title);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Titre invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: ACCESS_DENIED };

  const slug = await uniqueSlug(slugify(parsed.data));
  const event = await prisma.event.create({
    data: {
      title: parsed.data,
      slug,
      status: "DRAFT",
      type: "WEBINAR",
      audience: "PUBLIC",
      provider: "GOOGLE_MEET",
      startAt: new Date(),
    },
    select: { id: true, slug: true },
  });
  await audit(admin.id, "event.create", "Event", event.id, { title: parsed.data });

  revalidatePath("/admin/evenements");
  return { ok: true, id: event.id, slug: event.slug, message: "Événement créé (brouillon)." };
}

/* ─── Mise à jour de la fiche (champs éditables §24.1-24.3) ────────────────── */

const updateEventSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(20000).nullable().optional().or(z.literal("")),
  summary: z.string().trim().max(20000).nullable().optional().or(z.literal("")),
  type: z.enum(["WEBINAR", "VIRTUAL_CLASS", "WORKSHOP", "DEFENSE", "MENTORING", "CONFERENCE", "QA_SESSION"]).optional(),
  audience: z.enum(["PUBLIC", "ENROLLED", "COHORT"]).optional(),
  provider: z.enum(["GOOGLE_MEET", "ZOOM", "TEAMS", "JITSI", "IN_PERSON", "OTHER"]).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().nullable().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  meetingUrl: httpUrl.nullable().optional().or(z.literal("")),
  location: z.string().trim().max(240).nullable().optional().or(z.literal("")),
  capacity: z.number().int().min(0).max(1_000_000).nullable().optional(),
  coverImage: z.string().trim().url().nullable().optional().or(z.literal("")),
  speakerName: z.string().trim().max(160).nullable().optional().or(z.literal("")),
  replayUrl: httpUrl.nullable().optional().or(z.literal("")),
  resources: resourceSchema.nullable().optional(),
  cohortId: z.string().min(1).nullable().optional(),
  courseId: z.string().min(1).nullable().optional(),
  careerPathId: z.string().min(1).nullable().optional(),
  schoolId: z.string().min(1).nullable().optional(),
  hostId: z.string().min(1).nullable().optional(),
});

export type UpdateEventInput = z.input<typeof updateEventSchema>;

export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<AdminActionResult> {
  const idParsed = z.string().min(1).safeParse(eventId);
  const parsed = updateEventSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { ok: false, error: parsed.success ? "Événement invalide." : parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const event = await prisma.event.findUnique({ where: { id: idParsed.data }, select: { id: true, slug: true } });
  if (!event) return { ok: false, error: "Événement introuvable." };

  const d = parsed.data;
  await prisma.event.update({
    where: { id: event.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.summary !== undefined ? { summary: d.summary || null } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.audience !== undefined ? { audience: d.audience } : {}),
      ...(d.provider !== undefined ? { provider: d.provider } : {}),
      ...(d.startAt !== undefined ? { startAt: d.startAt } : {}),
      ...(d.endAt !== undefined ? { endAt: d.endAt } : {}),
      ...(d.timezone !== undefined ? { timezone: d.timezone } : {}),
      ...(d.meetingUrl !== undefined ? { meetingUrl: d.meetingUrl || null } : {}),
      ...(d.location !== undefined ? { location: d.location || null } : {}),
      ...(d.capacity !== undefined ? { capacity: d.capacity } : {}),
      ...(d.coverImage !== undefined ? { coverImage: d.coverImage || null } : {}),
      ...(d.speakerName !== undefined ? { speakerName: d.speakerName || null } : {}),
      ...(d.replayUrl !== undefined ? { replayUrl: d.replayUrl || null } : {}),
      ...(d.resources !== undefined
        ? { resources: (d.resources ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull }
        : {}),
      ...(d.cohortId !== undefined ? { cohortId: d.cohortId } : {}),
      ...(d.courseId !== undefined ? { courseId: d.courseId } : {}),
      ...(d.careerPathId !== undefined ? { careerPathId: d.careerPathId } : {}),
      ...(d.schoolId !== undefined ? { schoolId: d.schoolId } : {}),
      ...(d.hostId !== undefined ? { hostId: d.hostId } : {}),
    },
  });
  await audit(admin.id, "event.update", "Event", event.id, { fields: Object.keys(d) });

  revalidatePath("/admin/evenements");
  revalidatePath(`/admin/evenements/${event.id}`);
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${event.slug}`);
  revalidatePath("/espace/agenda");
  return { ok: true, message: "Événement mis à jour." };
}

/* ─── Publication / annulation ─────────────────────────────────────────────── */

export async function setEventStatus(eventId: string, status: EventStatus): Promise<AdminActionResult> {
  const parsed = z
    .object({ eventId: z.string().min(1), status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]) })
    .safeParse({ eventId, status });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: { id: true, title: true, slug: true, status: true },
  });
  if (!event) return { ok: false, error: "Événement introuvable." };

  await prisma.event.update({ where: { id: event.id }, data: { status: parsed.data.status } });
  await audit(admin.id, "event.status", "Event", event.id, { from: event.status, to: parsed.data.status });

  revalidatePath("/admin/evenements");
  revalidatePath(`/admin/evenements/${event.id}`);
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${event.slug}`);
  revalidatePath("/espace/agenda");
  return { ok: true, message: `Statut de « ${event.title} » : ${parsed.data.status}.` };
}

/* ─── Suppression ──────────────────────────────────────────────────────────── */

export async function deleteEvent(eventId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(eventId);
  if (!parsed.success) return { ok: false, error: "Événement invalide." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const event = await prisma.event.findUnique({ where: { id: parsed.data }, select: { id: true, title: true, slug: true } });
  if (!event) return { ok: false, error: "Événement introuvable." };

  await prisma.event.delete({ where: { id: event.id } }).catch(() => null);
  await audit(admin.id, "event.delete", "Event", event.id, { title: event.title });

  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${event.slug}`);
  revalidatePath("/espace/agenda");
  return { ok: true, message: "Événement supprimé." };
}

/* ─── Émargement (présence à un événement §24.3) ───────────────────────────── */

export async function markAttendance(registrationId: string, attended: boolean): Promise<AdminActionResult> {
  const parsed = z
    .object({ registrationId: z.string().min(1), attended: z.boolean() })
    .safeParse({ registrationId, attended });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: parsed.data.registrationId },
    select: { id: true, eventId: true },
  });
  if (!reg) return { ok: false, error: "Inscription introuvable." };

  await prisma.eventRegistration.update({
    where: { id: reg.id },
    data: { attended: parsed.data.attended, attendedAt: parsed.data.attended ? new Date() : null },
  });
  await audit(admin.id, "event.attendance", "EventRegistration", reg.id, {
    eventId: reg.eventId,
    attended: parsed.data.attended,
  });

  revalidatePath(`/admin/evenements/${reg.eventId}`);
  return { ok: true, message: parsed.data.attended ? "Présence confirmée." : "Présence retirée." };
}

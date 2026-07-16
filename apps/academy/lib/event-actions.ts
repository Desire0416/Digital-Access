"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type EnrollmentStatus } from "@da/academy-db/client";
import { currentUser } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Actions événements (cahier §24) — inscription / désinscription apprenant.
   INVARIANTS :
   · La visibilité de l'événement (audience) est revérifiée côté serveur AVANT
     toute inscription : PUBLIC (libre) / ENROLLED (inscrit à la formation ou au
     parcours) / COHORT (membre ACTIVE). Une preuve côté client ne suffit jamais.
   · La capacité est re-vérifiée DANS la transaction (anti-surréservation), et
     l'unicité (event, user) est garantie par la contrainte @@unique (P2002).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export type EventActionResult =
  | { ok: true; message?: string }
  | { ok: false; error?: string; redirect?: string };

/* ─── Inscription à un événement ───────────────────────────────────────────── */

export async function registerForEvent(eventId: string): Promise<EventActionResult> {
  const parsed = z.string().min(1).safeParse(eventId);
  if (!parsed.success) return { ok: false, error: "Événement invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: `/connexion?callbackUrl=${encodeURIComponent("/evenements")}` };
  if (!user.emailVerified) {
    return { ok: false, error: "Confirmez votre adresse email pour vous inscrire à un événement." };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      audience: true,
      capacity: true,
      startAt: true,
      courseId: true,
      careerPathId: true,
      cohortId: true,
    },
  });
  if (!event || event.status !== "PUBLISHED") return { ok: false, error: "Événement introuvable." };
  if (event.startAt.getTime() < Date.now()) return { ok: false, error: "Cet événement est terminé." };

  // ─── Verrou de visibilité (audience) ────────────────────────────────────
  if (event.audience === "ENROLLED") {
    let allowed = false;
    if (event.courseId) {
      const e = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: event.courseId } },
        select: { status: true },
      });
      allowed = !!e && ACQUIRED.includes(e.status);
    }
    if (!allowed && event.careerPathId) {
      const pe = await prisma.careerPathEnrollment.findUnique({
        where: { userId_careerPathId: { userId: user.id, careerPathId: event.careerPathId } },
        select: { status: true },
      });
      allowed = !!pe && ACQUIRED.includes(pe.status);
    }
    if (!allowed) return { ok: false, error: "Cet événement est réservé." };
  } else if (event.audience === "COHORT") {
    if (!event.cohortId) return { ok: false, error: "Cet événement est réservé." };
    const member = await prisma.cohortMember.findUnique({
      where: { cohortId_userId: { cohortId: event.cohortId, userId: user.id } },
      select: { status: true },
    });
    if (!member || member.status !== "ACTIVE") return { ok: false, error: "Cet événement est réservé." };
  }

  // ─── Réservation atomique : re-check capacité + création ─────────────────
  try {
    await prisma.$transaction(async (tx) => {
      if (event.capacity != null) {
        // Verrou consultatif transactionnel par événement → sérialise les
        // inscriptions concurrentes (anti-course sur la dernière place).
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.id}))`;
        const taken = await tx.eventRegistration.count({ where: { eventId: event.id } });
        if (taken >= event.capacity) throw new Error("EVENT_FULL");
      }
      await tx.eventRegistration.create({ data: { eventId: event.id, userId: user.id } });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EVENT_FULL") return { ok: false, error: "Événement complet." };
    // Déjà inscrit : la contrainte @@unique(event,user) protège des doublons.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: true, message: "Vous êtes déjà inscrit(e)." };
    }
    return { ok: false, error: "L'inscription a échoué. Réessayez." };
  }

  await createNotification({
    userId: user.id,
    type: "EVENT",
    title: "Inscription confirmée",
    message: `Vous êtes inscrit(e) à « ${event.title} ». Vous recevrez un rappel avant le début.`,
    link: `/evenements/${event.slug}`,
  });

  revalidatePath("/evenements");
  revalidatePath(`/evenements/${event.slug}`);
  revalidatePath("/espace/agenda");
  return { ok: true, message: "Inscription confirmée." };
}

/* ─── Désinscription ───────────────────────────────────────────────────────── */

export async function unregisterFromEvent(eventId: string): Promise<EventActionResult> {
  const parsed = z.string().min(1).safeParse(eventId);
  if (!parsed.success) return { ok: false, error: "Événement invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const event = await prisma.event.findUnique({ where: { id: parsed.data }, select: { slug: true } });
  await prisma.eventRegistration.deleteMany({ where: { eventId: parsed.data, userId: user.id } });

  revalidatePath("/evenements");
  if (event) revalidatePath(`/evenements/${event.slug}`);
  revalidatePath("/espace/agenda");
  return { ok: true, message: "Désinscription enregistrée." };
}

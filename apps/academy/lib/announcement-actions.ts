"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/academy-db/client";
import { currentUserFresh, isAdmin, type SessionUser } from "./guards";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Annonces de cohorte (cahier §23-§26) — MUTATIONS.
   Publier / supprimer est réservé au formateur de la cohorte ou à un
   administrateur. Le corps (markdown) est rendu par le composant <Markdown>
   côté affichage : pas de HTML brut à échapper ici — mais on borne la longueur.
   ══════════════════════════════════════════════════════════════════════════ */

export type AnnouncementActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Gestion d'une cohorte : administrateur OU formateur assigné (CohortInstructor). */
async function canManageCohort(cohortId: string, user: SessionUser): Promise<boolean> {
  if (isAdmin(user)) return true;
  const link = await prisma.cohortInstructor.findUnique({
    where: { cohortId_userId: { cohortId, userId: user.id } },
    select: { id: true },
  });
  return !!link;
}

const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères.")
    .max(140, "Titre trop long (140 caractères maximum)."),
  body: z
    .string()
    .trim()
    .min(1, "Le message ne peut pas être vide.")
    .max(4000, "Message trop long (4000 caractères maximum)."),
  pinned: z.boolean().optional(),
});

/**
 * Publie une annonce sur une cohorte, puis notifie tous ses membres ACTIVE (sauf l'auteur).
 * Autorisation vérifiée AVANT toute écriture (formateur de la cohorte ou admin).
 */
export async function postCohortAnnouncement(
  cohortId: string,
  input: { title: string; body: string; pinned?: boolean },
): Promise<AnnouncementActionResult> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  const user = await currentUserFresh();
  if (!user) return { ok: false, error: "Non autorisé." };

  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    select: { id: true, name: true },
  });
  if (!cohort) return { ok: false, error: "Cohorte introuvable." };

  if (!(await canManageCohort(cohort.id, user))) {
    return { ok: false, error: "Réservé au formateur de la cohorte ou à un administrateur." };
  }

  await prisma.announcement.create({
    data: {
      cohortId: cohort.id,
      authorId: user.id,
      title: data.title,
      body: data.body,
      pinned: data.pinned ?? false,
    },
  });

  // Fan-out : notifier chaque membre ACTIVE, hormis l'auteur. Silencieux, jamais bloquant.
  const members = await prisma.cohortMember.findMany({
    where: { cohortId: cohort.id, status: "ACTIVE", userId: { not: user.id } },
    select: { userId: true },
  });
  await Promise.all(
    members.map((m) =>
      createNotification({
        userId: m.userId,
        type: "ANNOUNCEMENT",
        title: `Nouvelle annonce — ${cohort.name}`,
        message: data.title,
        link: `/espace/cohortes/${cohort.id}`,
      }),
    ),
  );

  revalidatePath(`/espace/cohortes/${cohort.id}`);
  revalidatePath(`/admin/cohortes/${cohort.id}`);
  return { ok: true, message: "Annonce publiée." };
}

/**
 * Supprime une annonce. Autorisé pour un administrateur, l'auteur de l'annonce,
 * ou un formateur de sa cohorte de rattachement.
 */
export async function deleteAnnouncement(announcementId: string): Promise<AnnouncementActionResult> {
  const user = await currentUserFresh();
  if (!user) return { ok: false, error: "Non autorisé." };

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { id: true, cohortId: true, authorId: true },
  });
  if (!announcement) return { ok: false, error: "Annonce introuvable." };

  const isAuthor = announcement.authorId === user.id;
  const canManage = announcement.cohortId ? await canManageCohort(announcement.cohortId, user) : false;
  if (!isAdmin(user) && !isAuthor && !canManage) {
    return { ok: false, error: "Vous n'êtes pas autorisé à supprimer cette annonce." };
  }

  await prisma.announcement.delete({ where: { id: announcement.id } });

  if (announcement.cohortId) {
    revalidatePath(`/espace/cohortes/${announcement.cohortId}`);
    revalidatePath(`/admin/cohortes/${announcement.cohortId}`);
  }
  return { ok: true, message: "Annonce supprimée." };
}

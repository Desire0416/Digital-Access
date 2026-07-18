"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Mentorat — ACTIONS back-office (§7.5). L'admin assigne / retire des mentorés.
   Chaque mutation : Zod → requireAdminFresh → existence/rôle → écrire → audit →
   revalidate. Le mentor cible DOIT porter le rôle MENTOR.
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

export async function assignMentee(mentorId: string, learnerId: string): Promise<AdminActionResult> {
  const parsed = z.object({ mentorId: z.string().min(1), learnerId: z.string().min(1) }).safeParse({ mentorId, learnerId });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  if (parsed.data.mentorId === parsed.data.learnerId) return { ok: false, error: "Un mentor ne peut pas se mentorer lui-même." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const [mentor, learner] = await Promise.all([
    prisma.user.findFirst({ where: { id: parsed.data.mentorId, roles: { has: "MENTOR" } }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: parsed.data.learnerId }, select: { id: true, name: true } }),
  ]);
  if (!mentor) return { ok: false, error: "Le mentor est introuvable ou n'a pas le rôle mentor." };
  if (!learner) return { ok: false, error: "Apprenant introuvable." };

  try {
    await prisma.mentorAssignment.create({ data: { mentorId: mentor.id, learnerId: learner.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Cet apprenant est déjà assigné à ce mentor." };
    }
    throw err;
  }

  await audit(admin.id, "mentor.assign", "MentorAssignment", null, { mentorId: mentor.id, learnerId: learner.id });
  await createNotification({
    userId: learner.id,
    type: "MENTOR",
    title: "Un mentor vous accompagne",
    message: "Un mentor a été assigné à votre suivi. Il pourra vous envoyer des conseils et proposer des rendez-vous.",
    link: "/espace",
  });
  revalidatePath("/admin/mentorat");
  return { ok: true, message: "Apprenant assigné au mentor." };
}

export async function removeMentorAssignment(assignmentId: string): Promise<AdminActionResult> {
  const parsed = z.string().min(1).safeParse(assignmentId);
  if (!parsed.success) return { ok: false, error: "Assignation invalide." };

  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const existing = await prisma.mentorAssignment.findUnique({
    where: { id: parsed.data },
    select: { id: true, mentorId: true, learnerId: true },
  });
  if (!existing) return { ok: false, error: "Assignation introuvable." };

  await prisma.mentorAssignment.delete({ where: { id: existing.id } });
  await audit(admin.id, "mentor.unassign", "MentorAssignment", existing.id, { mentorId: existing.mentorId, learnerId: existing.learnerId });
  revalidatePath("/admin/mentorat");
  return { ok: true, message: "Assignation retirée." };
}

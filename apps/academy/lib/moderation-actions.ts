"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type ReportTarget } from "@da/academy-db/client";
import { requireAdminFresh, currentUserFresh, isAdmin, type SessionUser } from "./guards";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Modération communautaire — MUTATIONS (cahier §25.3). Deux niveaux d'autorité :
   • Signalements → réservés aux administrateurs (requireAdminFresh, rôles RELUS
     EN BASE, jamais le seul JWT).
   • Épinglage / verrouillage / suppression d'une discussion → « modérateur » =
     admin OU l'instructeur du CONTEXTE (formation → CourseInstructor, cohorte →
     CohortInstructor) ; la suppression est aussi ouverte à l'AUTEUR.
   Chaque action : Zod → garde → écriture → audit → revalidation → retour. Fichier
   découplé d'admin-actions.ts (helpers réécrits localement).
   ══════════════════════════════════════════════════════════════════════════ */

export type ModerationActionResult = { ok: true; message?: string } | { ok: false; error: string };

const ACCESS_DENIED = "Action réservée aux administrateurs.";
const NOT_MODERATOR = "Action réservée aux modérateurs de cet espace.";
const DENIED: ModerationActionResult = { ok: false, error: ACCESS_DENIED };

async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

/** Supprime une cible en ignorant l'absence (P2025 : déjà supprimée). */
async function deleteIfExists(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return;
    throw err;
  }
}

/** Contexte minimal d'une discussion pour statuer sur la modération. */
interface DiscussionContext {
  courseId: string | null;
  careerPathId: string | null;
  schoolId: string | null;
  cohortId: string | null;
}

/**
 * « Modérateur » d'une discussion = admin (partout) OU instructeur du contexte :
 * formation → CourseInstructor, cohorte → CohortInstructor. Parcours et école →
 * admin uniquement. Charge la jonction adéquate depuis la base.
 */
async function canModerateDiscussion(ctx: DiscussionContext, user: SessionUser): Promise<boolean> {
  if (isAdmin(user)) return true;
  if (ctx.courseId) {
    const link = await prisma.courseInstructor.findFirst({
      where: { courseId: ctx.courseId, userId: user.id },
      select: { id: true },
    });
    return !!link;
  }
  if (ctx.cohortId) {
    const link = await prisma.cohortInstructor.findFirst({
      where: { cohortId: ctx.cohortId, userId: user.id },
      select: { id: true },
    });
    return !!link;
  }
  // Parcours / école → seul un administrateur modère (déjà écarté ci-dessus).
  return false;
}

function revalidateDiscussion(discussionId: string) {
  revalidatePath("/admin/moderation");
  revalidatePath("/espace/communaute");
  revalidatePath(`/espace/communaute/sujet/${discussionId}`);
}

/* ─── Traitement d'un signalement (§25.3) ──────────────────────────────────── */

const resolveSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["dismiss", "remove"]),
});

/**
 * Traite un signalement : « dismiss » le classe sans suite (DISMISSED) ;
 * « remove » SUPPRIME la cible (discussion / réponse / commentaire) puis marque
 * le signalement ACTIONED. Réservé aux administrateurs. Notifie l'auteur du
 * signalement s'il existe encore.
 */
export async function resolveReport(reportId: string, action: "dismiss" | "remove"): Promise<ModerationActionResult> {
  const parsed = resolveSchema.safeParse({ reportId, action });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: { id: true, targetType: true, targetId: true, reporterId: true },
  });
  if (!report) return { ok: false, error: "Signalement introuvable." };

  if (parsed.data.action === "remove") {
    const targetType = report.targetType as ReportTarget;
    if (targetType === "DISCUSSION") {
      await deleteIfExists(() => prisma.discussion.delete({ where: { id: report.targetId } }));
    } else if (targetType === "REPLY") {
      await deleteIfExists(() => prisma.discussionReply.delete({ where: { id: report.targetId } }));
    } else if (targetType === "LESSON_COMMENT") {
      await deleteIfExists(() => prisma.lessonComment.delete({ where: { id: report.targetId } }));
    }
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "ACTIONED", reviewedById: admin.id, reviewedAt: new Date() },
    });
  } else {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "DISMISSED", reviewedById: admin.id, reviewedAt: new Date() },
    });
  }

  await audit(admin.id, `report.${parsed.data.action}`, "Report", report.id, {
    targetType: report.targetType,
    targetId: report.targetId,
  });

  if (report.reporterId) {
    await createNotification({
      userId: report.reporterId,
      type: "MODERATION",
      title: "Signalement traité",
      message:
        parsed.data.action === "remove"
          ? "Votre signalement a été traité : le contenu concerné a été retiré."
          : "Votre signalement a été traité par l'équipe de modération.",
    });
  }

  revalidatePath("/admin/moderation");
  return {
    ok: true,
    message: parsed.data.action === "remove" ? "Contenu supprimé et signalement traité." : "Signalement classé sans suite.",
  };
}

/* ─── Épingler / verrouiller une discussion (§25.3) ────────────────────────── */

async function loadDiscussionForModeration(discussionId: string) {
  return prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { id: true, authorId: true, courseId: true, careerPathId: true, schoolId: true, cohortId: true },
  });
}

export async function setDiscussionPinned(discussionId: string, pinned: boolean): Promise<ModerationActionResult> {
  const parsed = z.object({ discussionId: z.string().min(1), pinned: z.boolean() }).safeParse({ discussionId, pinned });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const user = await currentUserFresh();
  if (!user) return DENIED;

  const discussion = await loadDiscussionForModeration(parsed.data.discussionId);
  if (!discussion) return { ok: false, error: "Discussion introuvable." };
  if (!(await canModerateDiscussion(discussion, user))) return { ok: false, error: NOT_MODERATOR };

  await prisma.discussion.update({ where: { id: discussion.id }, data: { pinned: parsed.data.pinned } });
  await audit(user.id, "discussion.pin", "Discussion", discussion.id, { pinned: parsed.data.pinned });

  revalidateDiscussion(discussion.id);
  return { ok: true, message: parsed.data.pinned ? "Discussion épinglée." : "Discussion désépinglée." };
}

export async function setDiscussionLocked(discussionId: string, locked: boolean): Promise<ModerationActionResult> {
  const parsed = z.object({ discussionId: z.string().min(1), locked: z.boolean() }).safeParse({ discussionId, locked });
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const user = await currentUserFresh();
  if (!user) return DENIED;

  const discussion = await loadDiscussionForModeration(parsed.data.discussionId);
  if (!discussion) return { ok: false, error: "Discussion introuvable." };
  if (!(await canModerateDiscussion(discussion, user))) return { ok: false, error: NOT_MODERATOR };

  await prisma.discussion.update({ where: { id: discussion.id }, data: { locked: parsed.data.locked } });
  await audit(user.id, "discussion.lock", "Discussion", discussion.id, { locked: parsed.data.locked });

  revalidateDiscussion(discussion.id);
  return { ok: true, message: parsed.data.locked ? "Discussion verrouillée." : "Discussion déverrouillée." };
}

/* ─── Suppression d'une discussion (auteur OU modérateur, §25.3) ───────────── */

export async function deleteDiscussion(discussionId: string): Promise<ModerationActionResult> {
  const parsed = z.string().min(1).safeParse(discussionId);
  if (!parsed.success) return { ok: false, error: "Discussion invalide." };
  const user = await currentUserFresh();
  if (!user) return DENIED;

  const discussion = await loadDiscussionForModeration(parsed.data);
  if (!discussion) return { ok: false, error: "Discussion introuvable." };

  const isAuthor = discussion.authorId != null && discussion.authorId === user.id;
  if (!isAuthor && !(await canModerateDiscussion(discussion, user))) return { ok: false, error: NOT_MODERATOR };

  // Cascade schéma : réponses et suivis sont supprimés avec la discussion.
  await deleteIfExists(() => prisma.discussion.delete({ where: { id: discussion.id } }));
  await audit(user.id, "discussion.delete", "Discussion", discussion.id, { asAuthor: isAuthor });

  revalidateDiscussion(discussion.id);
  return { ok: true, message: "Discussion supprimée." };
}

/* ─── Suppression d'une réponse (auteur OU modérateur du contexte, §25.3) ──── */

export async function deleteReply(replyId: string): Promise<ModerationActionResult> {
  const parsed = z.string().min(1).safeParse(replyId);
  if (!parsed.success) return { ok: false, error: "Réponse invalide." };
  const user = await currentUserFresh();
  if (!user) return DENIED;

  const reply = await prisma.discussionReply.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      authorId: true,
      discussionId: true,
      discussion: {
        select: { id: true, courseId: true, careerPathId: true, schoolId: true, cohortId: true },
      },
    },
  });
  if (!reply) return { ok: false, error: "Réponse introuvable." };

  const isAuthor = reply.authorId != null && reply.authorId === user.id;
  if (!isAuthor && !(await canModerateDiscussion(reply.discussion, user))) return { ok: false, error: NOT_MODERATOR };

  await deleteIfExists(() => prisma.discussionReply.delete({ where: { id: reply.id } }));
  await audit(user.id, "reply.delete", "DiscussionReply", reply.id, { discussionId: reply.discussionId, asAuthor: isAuthor });

  revalidateDiscussion(reply.discussionId);
  return { ok: true, message: "Réponse supprimée." };
}

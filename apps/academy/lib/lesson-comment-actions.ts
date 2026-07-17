"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type EnrollmentStatus } from "@da/academy-db/client";
import { currentUser, isAdmin, type SessionUser } from "./guards";
import { createNotification } from "./notify";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Commentaires de leçon — ACTIONS (cahier §25 / §5.1). INVARIANTS :
   · Chaque action REVÉRIFIE l'autorisation AVANT toute écriture (jamais le seul
     JWT pour les rôles admin/formateur : on relit la jonction CourseInstructor
     et l'inscription en base).
   · canView = inscrit (ACTIVE/COMPLETED) OU CourseInstructor OU admin ;
     canPost = canView && emailVerified ; modérateur = admin OU CourseInstructor.
   · La suppression laisse les réponses devenir racines (parentId onDelete:SetNull).
   ══════════════════════════════════════════════════════════════════════════ */

export type CommentActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error?: string; redirect?: string };

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

const postSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide.")
    .max(4000, "Commentaire trop long (4000 caractères maximum)."),
  parentId: z.string().min(1).optional(),
});

const reasonSchema = z.string().trim().min(1, "Motif requis.").max(1000, "Motif trop long.");

/* ─── Résolution de contexte + accès (réutilisés par toutes les actions) ─────── */

/** Leçon → formation (id + slug) pour l'accès et les chemins de revalidation. */
async function loadLessonCourse(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { course: { select: { id: true, slug: true } } } } },
  });
}

/** Contexte d'un commentaire existant (formation dénormalisée + slug + leçon). */
async function loadCommentContext(commentId: string) {
  return prisma.lessonComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      courseId: true,
      lessonId: true,
      course: { select: { slug: true } },
    },
  });
}

/**
 * Accès d'un utilisateur à une formation, revérifié en base : admin (rôles),
 * CourseInstructor (jonction), sinon inscription acquise. Un modérateur voit et
 * peut poster sans inscription (sous réserve d'email vérifié pour canPost).
 */
async function courseAccess(courseId: string, user: SessionUser) {
  const admin = isAdmin(user);
  let instructor = false;
  if (!admin) {
    const link = await prisma.courseInstructor.findFirst({
      where: { courseId, userId: user.id },
      select: { id: true },
    });
    instructor = !!link;
  }
  const moderator = admin || instructor;

  let enrolled = false;
  if (!moderator) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true },
    });
    enrolled = !!enrollment && ACQUIRED.includes(enrollment.status);
  }

  const canView = moderator || enrolled;
  const canPost = canView && !!user.emailVerified;
  return { canView, canPost, moderator };
}

/* ─── Publier un commentaire (ou une réponse) ──────────────────────────────── */

export async function postLessonComment(
  lessonId: string,
  input: { body: string; parentId?: string },
): Promise<CommentActionResult> {
  const idParsed = z.string().min(1).safeParse(lessonId);
  if (!idParsed.success) return { ok: false, error: "Leçon invalide." };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Commentaire invalide." };

  const lesson = await loadLessonCourse(idParsed.data);
  if (!lesson) return { ok: false, error: "Leçon introuvable." };
  const courseId = lesson.module.course.id;
  const lessonPath = `/apprendre/${lesson.module.course.slug}/${lesson.id}`;

  const user = await currentUser();
  if (!user) return { ok: false, redirect: `/connexion?callbackUrl=${encodeURIComponent(lessonPath)}` };

  const access = await courseAccess(courseId, user);
  if (!access.canView) return { ok: false, error: "Vous n'avez pas accès à cette leçon." };
  if (!access.canPost) return { ok: false, error: "Confirmez votre adresse email pour participer aux discussions." };

  // Réponse à un commentaire : le parent doit exister ET appartenir à cette leçon.
  let parentAuthorId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.lessonComment.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, lessonId: true, authorId: true },
    });
    if (!parent || parent.lessonId !== lesson.id) {
      return { ok: false, error: "Commentaire parent introuvable." };
    }
    parentAuthorId = parent.authorId;
  }

  const created = await prisma.lessonComment.create({
    data: {
      lessonId: lesson.id,
      courseId, // dénormalisé pour le cloisonnement d'accès (inscription)
      authorId: user.id,
      parentId: parsed.data.parentId ?? null,
      body: parsed.data.body,
    },
    select: { id: true },
  });

  // Notifie l'auteur du commentaire parent (jamais soi-même).
  if (parentAuthorId && parentAuthorId !== user.id) {
    await createNotification({
      userId: parentAuthorId,
      type: "COMMENT",
      title: "Nouvelle réponse à votre commentaire",
      message: `${user.name} a répondu à votre commentaire.`,
      link: lessonPath,
    });
  }

  revalidatePath(lessonPath);
  return { ok: true, id: created.id, message: "Commentaire publié." };
}

/* ─── Supprimer un commentaire (auteur OU modérateur) ──────────────────────── */

export async function deleteLessonComment(commentId: string): Promise<CommentActionResult> {
  const idParsed = z.string().min(1).safeParse(commentId);
  if (!idParsed.success) return { ok: false, error: "Commentaire invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: "/connexion" };

  const comment = await loadCommentContext(idParsed.data);
  if (!comment) return { ok: false, error: "Commentaire introuvable." };

  const isAuthor = !!comment.authorId && comment.authorId === user.id;
  const moderator = isAuthor ? false : (await courseAccess(comment.courseId, user)).moderator;
  if (!isAuthor && !moderator) {
    return { ok: false, error: "Vous n'êtes pas autorisé à supprimer ce commentaire." };
  }

  // Les réponses passent en racine via parentId onDelete:SetNull — acceptable.
  await prisma.lessonComment.delete({ where: { id: comment.id } });

  revalidatePath(`/apprendre/${comment.course.slug}/${comment.lessonId}`);
  return { ok: true, message: "Commentaire supprimé." };
}

/* ─── Épingler / désépingler (modérateur uniquement) ───────────────────────── */

export async function setLessonCommentPinned(commentId: string, pinned: boolean): Promise<CommentActionResult> {
  const idParsed = z.string().min(1).safeParse(commentId);
  if (!idParsed.success) return { ok: false, error: "Commentaire invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: "/connexion" };

  const comment = await loadCommentContext(idParsed.data);
  if (!comment) return { ok: false, error: "Commentaire introuvable." };

  const { moderator } = await courseAccess(comment.courseId, user);
  if (!moderator) return { ok: false, error: "Action réservée aux modérateurs." };

  await prisma.lessonComment.update({ where: { id: comment.id }, data: { pinned: !!pinned } });

  revalidatePath(`/apprendre/${comment.course.slug}/${comment.lessonId}`);
  return { ok: true, message: pinned ? "Commentaire épinglé." : "Commentaire désépinglé." };
}

/* ─── Signaler un commentaire (tout utilisateur ayant accès) ────────────────── */

export async function reportLessonComment(commentId: string, reason: string): Promise<CommentActionResult> {
  const idParsed = z.string().min(1).safeParse(commentId);
  if (!idParsed.success) return { ok: false, error: "Commentaire invalide." };
  const reasonParsed = reasonSchema.safeParse(reason);
  if (!reasonParsed.success) return { ok: false, error: reasonParsed.error.issues[0]?.message ?? "Motif invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: "/connexion" };

  const comment = await loadCommentContext(idParsed.data);
  if (!comment) return { ok: false, error: "Commentaire introuvable." };

  const { canView } = await courseAccess(comment.courseId, user);
  if (!canView) return { ok: false, error: "Vous n'avez pas accès à cette leçon." };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: "LESSON_COMMENT",
      targetId: comment.id,
      reason: reasonParsed.data,
    },
  });

  // Alerte les administrateurs pédagogiques (file de modération).
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "MODERATION",
        title: "Commentaire signalé",
        message: "Un commentaire de leçon a été signalé et attend une modération.",
        link: "/admin/moderation",
      }),
    ),
  );

  return { ok: true, message: "Signalement transmis. Merci." };
}

/* ─── Réaction « j'aime » (bascule unique par utilisateur) ──────────────────── */

export async function toggleLessonCommentReaction(
  commentId: string,
): Promise<{ ok: true; reacted: boolean; count: number } | { ok: false; error: string }> {
  const idParsed = z.string().min(1).safeParse(commentId);
  if (!idParsed.success) return { ok: false, error: "Commentaire invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Connectez-vous pour réagir." };

  const comment = await loadCommentContext(idParsed.data);
  if (!comment) return { ok: false, error: "Commentaire introuvable." };

  const { canView } = await courseAccess(comment.courseId, user);
  if (!canView) return { ok: false, error: "Vous n'avez pas accès à cette leçon." };

  const existing = await prisma.reaction.findFirst({
    where: { userId: user.id, targetType: "LESSON_COMMENT", targetId: comment.id },
    select: { id: true },
  });

  let reacted: boolean;
  if (existing) {
    try {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } catch (err) {
      // Retrait concurrent : la ligne a déjà disparu → idempotent (P2025).
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) throw err;
    }
    reacted = false;
  } else {
    try {
      await prisma.reaction.create({
        data: { userId: user.id, targetType: "LESSON_COMMENT", targetId: comment.id },
      });
      reacted = true;
    } catch (err) {
      // Réaction concurrente (contrainte @@unique) : déjà « aimé » — idempotent.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") reacted = true;
      else throw err;
    }
  }

  const count = await prisma.reaction.count({
    where: { targetType: "LESSON_COMMENT", targetId: comment.id },
  });

  revalidatePath(`/apprendre/${comment.course.slug}/${comment.lessonId}`);
  return { ok: true, reacted, count };
}

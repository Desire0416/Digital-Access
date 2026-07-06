"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { getCommunityAccess } from "./community-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions — Communauté Academy.
   Invariants : « voir » (upvote) exige d'être inscrit/privilégié ; « poster »
   (topic, réponse, commentaire, message) exige EN PLUS un email vérifié.
   Modération (épingler, marquer solution, supprimer) : auteur ou instructeur/
   admin selon le cas.
   ══════════════════════════════════════════════════════════════════════════ */

type Result = { ok: true } | { ok: false; error: string };

async function resolve(slug: string) {
  const user = await currentUser();
  const access = await getCommunityAccess(user?.id ?? null, slug);
  return { user, access };
}

/* ─────────────────────────────────── Forum ─────────────────────────────── */

const topicSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(160),
  content: z.string().min(10, "Décrivez un peu plus votre sujet").max(8000),
  category: z.string().max(40).optional().nullable(),
  tags: z.array(z.string().max(30)).max(6).optional(),
});

export async function createForumTopic(
  slug: string,
  input: z.input<typeof topicSchema>,
): Promise<{ ok: true; topicId: string } | { ok: false; error: string }> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Inscrivez-vous au cours pour participer." };
  if (!access.canPost) return { ok: false, error: "Confirmez votre email pour publier." };
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Sujet invalide." };
  try {
    const topic = await prisma.forumTopic.create({
      data: {
        courseId: access.courseId,
        userId: user!.id,
        title: parsed.data.title.trim(),
        content: parsed.data.content.trim(),
        category: parsed.data.category || null,
        tags: parsed.data.tags ?? [],
      },
    });
    revalidatePath(`/courses/${slug}/forum`);
    return { ok: true, topicId: topic.id };
  } catch {
    return { ok: false, error: "Impossible de publier le sujet." };
  }
}

export async function createForumReply(
  slug: string,
  topicId: string,
  input: { content: string; parentId?: string | null },
): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Inscrivez-vous au cours pour participer." };
  if (!access.canPost) return { ok: false, error: "Confirmez votre email pour répondre." };
  const parsed = z
    .object({ content: z.string().min(1).max(8000), parentId: z.string().nullish() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Réponse invalide." };
  try {
    // Le topic doit appartenir au cours.
    const topic = await prisma.forumTopic.findFirst({
      where: { id: topicId, courseId: access.courseId },
      select: { id: true },
    });
    if (!topic) return { ok: false, error: "Sujet introuvable." };
    await prisma.$transaction([
      prisma.forumReply.create({
        data: {
          topicId,
          userId: user!.id,
          content: parsed.data.content.trim(),
          parentId: parsed.data.parentId || null,
        },
      }),
      prisma.forumTopic.update({ where: { id: topicId }, data: { updatedAt: new Date() } }),
    ]);
    revalidatePath(`/courses/${slug}/forum/${topicId}`);
    revalidatePath(`/courses/${slug}/forum`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'envoyer la réponse." };
  }
}

export async function upvoteTopic(slug: string, topicId: string, up: boolean): Promise<Result> {
  const { access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès réservé aux inscrits." };
  try {
    const t = await prisma.forumTopic.findFirst({
      where: { id: topicId, courseId: access.courseId },
      select: { upvotes: true },
    });
    if (!t) return { ok: false, error: "Sujet introuvable." };
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: { upvotes: Math.max(0, t.upvotes + (up ? 1 : -1)) },
    });
    revalidatePath(`/courses/${slug}/forum`);
    revalidatePath(`/courses/${slug}/forum/${topicId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Vote impossible." };
  }
}

export async function upvoteReply(slug: string, replyId: string, up: boolean): Promise<Result> {
  const { access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès réservé aux inscrits." };
  try {
    const r = await prisma.forumReply.findFirst({
      where: { id: replyId, topic: { courseId: access.courseId } },
      select: { upvotes: true, topicId: true },
    });
    if (!r) return { ok: false, error: "Réponse introuvable." };
    await prisma.forumReply.update({
      where: { id: replyId },
      data: { upvotes: Math.max(0, r.upvotes + (up ? 1 : -1)) },
    });
    revalidatePath(`/courses/${slug}/forum/${r.topicId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Vote impossible." };
  }
}

export async function markReplySolution(
  slug: string,
  topicId: string,
  replyId: string,
): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès refusé." };
  try {
    const topic = await prisma.forumTopic.findFirst({
      where: { id: topicId, courseId: access.courseId },
      select: { userId: true },
    });
    if (!topic) return { ok: false, error: "Sujet introuvable." };
    // Seul l'auteur du sujet ou un privilégié peut désigner la solution.
    if (topic.userId !== user!.id && !access.isPrivileged) {
      return { ok: false, error: "Seul l'auteur du sujet peut valider une réponse." };
    }
    await prisma.$transaction([
      // Réinitialise l'ancienne solution éventuelle.
      prisma.forumReply.updateMany({ where: { topicId }, data: { isSolution: false } }),
      prisma.forumReply.update({ where: { id: replyId }, data: { isSolution: true } }),
      prisma.forumTopic.update({ where: { id: topicId }, data: { solved: true } }),
    ]);
    revalidatePath(`/courses/${slug}/forum/${topicId}`);
    revalidatePath(`/courses/${slug}/forum`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Action impossible." };
  }
}

export async function deleteForumTopic(slug: string, topicId: string): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès refusé." };
  try {
    const topic = await prisma.forumTopic.findFirst({
      where: { id: topicId, courseId: access.courseId },
      select: { userId: true },
    });
    if (!topic) return { ok: false, error: "Sujet introuvable." };
    if (topic.userId !== user!.id && !access.isPrivileged) {
      return { ok: false, error: "Suppression réservée à l'auteur ou à l'équipe." };
    }
    await prisma.forumTopic.delete({ where: { id: topicId } });
    revalidatePath(`/courses/${slug}/forum`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

export async function deleteForumReply(slug: string, replyId: string): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès refusé." };
  try {
    const reply = await prisma.forumReply.findFirst({
      where: { id: replyId, topic: { courseId: access.courseId } },
      select: { userId: true, topicId: true },
    });
    if (!reply) return { ok: false, error: "Réponse introuvable." };
    if (reply.userId !== user!.id && !access.isPrivileged) {
      return { ok: false, error: "Suppression réservée à l'auteur ou à l'équipe." };
    }
    await prisma.forumReply.delete({ where: { id: replyId } });
    revalidatePath(`/courses/${slug}/forum/${reply.topicId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

/* ─────────────────────── Commentaires de chapitre ──────────────────────── */

export async function postChapterComment(
  slug: string,
  chapterId: string,
  input: { content: string; parentId?: string | null },
): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Inscrivez-vous au cours pour commenter." };
  if (!access.canPost) return { ok: false, error: "Confirmez votre email pour commenter." };
  const parsed = z
    .object({ content: z.string().min(1).max(4000), parentId: z.string().nullish() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Commentaire invalide." };
  try {
    // Le chapitre doit appartenir au cours.
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, module: { course: { id: access.courseId } } },
      select: { id: true },
    });
    if (!chapter) return { ok: false, error: "Chapitre introuvable." };
    await prisma.comment.create({
      data: {
        chapterId,
        userId: user!.id,
        content: parsed.data.content.trim(),
        parentId: parsed.data.parentId || null,
      },
    });
    revalidatePath(`/courses/${slug}/learn/${chapterId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de publier le commentaire." };
  }
}

export async function pinComment(
  slug: string,
  chapterId: string,
  commentId: string,
  pinned: boolean,
): Promise<Result> {
  const { access } = await resolve(slug);
  if (!access?.isPrivileged) return { ok: false, error: "Épinglage réservé à l'instructeur." };
  try {
    await prisma.comment.update({ where: { id: commentId }, data: { pinned } });
    revalidatePath(`/courses/${slug}/learn/${chapterId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Action impossible." };
  }
}

export async function deleteComment(
  slug: string,
  chapterId: string,
  commentId: string,
): Promise<Result> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Accès refusé." };
  try {
    const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!c) return { ok: false, error: "Commentaire introuvable." };
    if (c.userId !== user!.id && !access.isPrivileged) {
      return { ok: false, error: "Suppression réservée à l'auteur ou à l'équipe." };
    }
    await prisma.comment.delete({ where: { id: commentId } });
    revalidatePath(`/courses/${slug}/learn/${chapterId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

/* ─────────────────────────────────── Chat ──────────────────────────────── */

export async function sendChatMessage(
  slug: string,
  input: { content: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { user, access } = await resolve(slug);
  if (!access?.canView) return { ok: false, error: "Inscrivez-vous au cours pour discuter." };
  if (!access.canPost) return { ok: false, error: "Confirmez votre email pour envoyer un message." };
  const parsed = z.object({ content: z.string().min(1).max(2000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Message invalide." };
  try {
    const room = await prisma.chatRoom.upsert({
      where: { courseId: access.courseId },
      update: {},
      create: { courseId: access.courseId },
      select: { id: true },
    });
    const [msg] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { chatRoomId: room.id, userId: user!.id, content: parsed.data.content.trim() },
        select: { id: true },
      }),
      prisma.user.update({ where: { id: user!.id }, data: { lastActiveAt: new Date() } }),
    ]);
    return { ok: true, id: msg.id };
  } catch {
    return { ok: false, error: "Envoi impossible." };
  }
}

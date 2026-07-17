import "server-only";
import { prisma, type EnrollmentStatus } from "@da/academy-db/client";
import { isAdmin } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Commentaires de leçon — LECTURES (cahier §25 / §5.1).
   Cloisonnement : un commentaire n'est visible/postable QUE par un inscrit à la
   formation de la leçon (Enrollment ACTIVE/COMPLETED), un CourseInstructor de
   cette formation, ou un administrateur.
     · canView    = inscrit OU CourseInstructor OU admin
     · canPost    = canView && emailVerified
     · isModerator = admin OU CourseInstructor
   La leçon peut exister sans que l'utilisateur y ait accès : dans ce cas on
   renvoie une enveloppe vide (canView:false) plutôt que null (null = leçon
   inexistante). Le contenu des commentaires ne quitte JAMAIS le serveur sans
   accès.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export interface CommentAuthor {
  name: string | null;
  avatar: string | null;
}

export interface CommentNode {
  id: string;
  body: string;
  author: CommentAuthor | null;
  parentId: string | null;
  pinned: boolean;
  createdAt: Date;
  reactionCount: number;
  reacted: boolean;
  /** L'utilisateur courant peut supprimer ce commentaire (auteur OU modérateur). */
  canDelete: boolean;
}

export interface LessonCommentsResult {
  canView: boolean;
  canPost: boolean;
  isModerator: boolean;
  comments: CommentNode[];
}

interface LessonAccess {
  canView: boolean;
  canPost: boolean;
  isModerator: boolean;
}

/**
 * Résout l'accès d'un utilisateur aux commentaires d'une formation. Relit les
 * rôles/emailVerified en base (jamais le seul JWT) et l'appartenance à la
 * jonction CourseInstructor. Un modérateur (admin/formateur) voit toujours,
 * même sans inscription.
 */
async function resolveLessonAccess(courseId: string, userId: string | null): Promise<LessonAccess> {
  if (!userId) return { canView: false, canPost: false, isModerator: false };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true, emailVerified: true },
  });
  if (!user) return { canView: false, canPost: false, isModerator: false };

  const admin = isAdmin(user);
  let instructor = false;
  if (!admin) {
    const link = await prisma.courseInstructor.findFirst({
      where: { courseId, userId },
      select: { id: true },
    });
    instructor = !!link;
  }
  const isModerator = admin || instructor;

  let enrolled = false;
  if (!isModerator) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    enrolled = !!enrollment && ACQUIRED.includes(enrollment.status);
  }

  const canView = isModerator || enrolled;
  const canPost = canView && !!user.emailVerified;
  return { canView, canPost, isModerator };
}

/**
 * Fil de commentaires d'une leçon. Renvoie `null` si la leçon n'existe pas.
 * Si la leçon existe mais que l'utilisateur n'y a pas accès, renvoie une
 * enveloppe vide (`canView:false`) — jamais le contenu. Tri : épinglés d'abord,
 * puis chronologique (les plus anciens en tête, style discussion).
 */
export async function getLessonComments(
  lessonId: string,
  userId: string | null,
): Promise<LessonCommentsResult | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return null;

  const access = await resolveLessonAccess(lesson.module.courseId, userId);
  if (!access.canView) {
    return { canView: false, canPost: false, isModerator: false, comments: [] };
  }

  const rows = await prisma.lessonComment.findMany({
    where: { lessonId },
    orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      body: true,
      parentId: true,
      pinned: true,
      createdAt: true,
      authorId: true,
      author: { select: { name: true, avatar: true } },
    },
  });

  const ids = rows.map((r) => r.id);
  // Une seule requête pour le nombre de réactions ET le « j'aime » de l'utilisateur.
  const reactions = ids.length
    ? await prisma.reaction.findMany({
        where: { targetType: "LESSON_COMMENT", targetId: { in: ids } },
        select: { targetId: true, userId: true },
      })
    : [];
  const countByTarget = new Map<string, number>();
  for (const r of reactions) countByTarget.set(r.targetId, (countByTarget.get(r.targetId) ?? 0) + 1);
  const reactedByMe = new Set(
    userId ? reactions.filter((r) => r.userId === userId).map((r) => r.targetId) : [],
  );

  const comments: CommentNode[] = rows.map((r) => ({
    id: r.id,
    body: r.body,
    author: r.author,
    parentId: r.parentId,
    pinned: r.pinned,
    createdAt: r.createdAt,
    reactionCount: countByTarget.get(r.id) ?? 0,
    reacted: reactedByMe.has(r.id),
    canDelete: access.isModerator || (!!r.authorId && r.authorId === userId),
  }));

  return {
    canView: true,
    canPost: access.canPost,
    isModerator: access.isModerator,
    comments,
  };
}

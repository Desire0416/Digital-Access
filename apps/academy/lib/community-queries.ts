import { prisma } from "@da/db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Data layer — Communauté Academy (forum, commentaires de chapitre, chat).
   Accès à l'espace communautaire d'un cours : réservé aux INSCRITS et à
   l'instructeur/admin. Poster exige en plus un email vérifié (cahier AC).
   Dates sérialisées en ISO pour la frontière RSC.
   ══════════════════════════════════════════════════════════════════════════ */

export interface CommunityUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface CommunityAccess {
  courseId: string;
  slug: string;
  courseTitle: string;
  instructorId: string; // prof du cours (pour badger les auteurs)
  isEnrolled: boolean;
  isPrivileged: boolean; // instructeur du cours ou admin
  verified: boolean; // email vérifié
  canView: boolean; // inscrit OU privilégié
  canPost: boolean; // canView ET vérifié
  currentUser: CommunityUser | null;
}

/**
 * Résout l'accès communautaire d'un utilisateur à un cours. Retourne `null`
 * seulement si le cours n'existe pas (ou brouillon non privilégié). Sinon
 * renvoie l'objet d'accès même quand `canView` est faux (la page affiche alors
 * un état « inscrivez-vous pour accéder »).
 */
export async function getCommunityAccess(
  userId: string | null,
  slug: string,
): Promise<CommunityAccess | null> {
  const course = await prisma.course.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, slug: true, status: true, instructorId: true },
  });
  if (!course) return null;

  let isPrivileged = false;
  let isEnrolled = false;
  let verified = false;
  let currentUser: CommunityUser | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, roles: true, emailVerified: true },
    });
    if (user) {
      currentUser = { id: user.id, name: user.name, avatar: user.avatar };
      verified = Boolean(user.emailVerified);
      isPrivileged =
        course.instructorId === userId ||
        user.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN");
      if (!isPrivileged) {
        const e = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
          select: { id: true },
        });
        isEnrolled = Boolean(e);
      }
    }
  }

  // Un cours non publié n'est accessible qu'aux privilégiés.
  if (course.status !== "PUBLISHED" && !isPrivileged) return null;

  const canView = isPrivileged || isEnrolled;
  return {
    courseId: course.id,
    slug: course.slug,
    courseTitle: course.title,
    instructorId: course.instructorId,
    isEnrolled,
    isPrivileged,
    verified,
    canView,
    canPost: canView && verified,
    currentUser,
  };
}

/* ─────────────────────────────────── Forum ─────────────────────────────── */

export interface ForumTopicCard {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  tags: string[];
  solved: boolean;
  upvotes: number;
  replyCount: number;
  author: CommunityUser & { isInstructor: boolean };
  createdAt: string;
  lastActivityAt: string;
}

export async function getForumTopics(
  slug: string,
  userId: string | null,
): Promise<{ access: CommunityAccess; topics: ForumTopicCard[] } | null> {
  const access = await getCommunityAccess(userId, slug);
  if (!access) return null;
  if (!access.canView) return { access, topics: [] };

  const topics = await prisma.forumTopic.findMany({
    where: { courseId: access.courseId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, content: true, category: true, tags: true,
      solved: true, upvotes: true, createdAt: true, updatedAt: true,
      user: { select: { id: true, name: true, avatar: true } },
      _count: { select: { replies: true } },
    },
  });

  // Marque l'auteur comme instructeur si c'est le prof du cours.
  const instructorId = (
    await prisma.course.findUnique({ where: { id: access.courseId }, select: { instructorId: true } })
  )?.instructorId;

  return {
    access,
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      excerpt: t.content.slice(0, 160),
      category: t.category,
      tags: t.tags,
      solved: t.solved,
      upvotes: t.upvotes,
      replyCount: t._count.replies,
      author: { ...t.user, isInstructor: t.user.id === instructorId },
      createdAt: t.createdAt.toISOString(),
      lastActivityAt: t.updatedAt.toISOString(),
    })),
  };
}

export interface ForumReplyNode {
  id: string;
  content: string;
  isSolution: boolean;
  upvotes: number;
  parentId: string | null;
  author: CommunityUser & { isInstructor: boolean };
  createdAt: string;
}

export interface ForumTopicDetail {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  solved: boolean;
  upvotes: number;
  author: CommunityUser & { isInstructor: boolean };
  createdAt: string;
  isOwner: boolean; // l'utilisateur courant est l'auteur du topic
  replies: ForumReplyNode[];
}

export async function getForumTopic(
  slug: string,
  topicId: string,
  userId: string | null,
): Promise<{ access: CommunityAccess; topic: ForumTopicDetail } | null> {
  const access = await getCommunityAccess(userId, slug);
  if (!access || !access.canView) return null;

  const t = await prisma.forumTopic.findFirst({
    where: { id: topicId, courseId: access.courseId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      course: { select: { instructorId: true } },
    },
  });
  if (!t) return null;

  const instr = t.course.instructorId;
  return {
    access,
    topic: {
      id: t.id, title: t.title, content: t.content, category: t.category, tags: t.tags,
      solved: t.solved, upvotes: t.upvotes,
      author: { ...t.user, isInstructor: t.user.id === instr },
      createdAt: t.createdAt.toISOString(),
      isOwner: userId != null && t.userId === userId,
      replies: t.replies.map((r) => ({
        id: r.id, content: r.content, isSolution: r.isSolution, upvotes: r.upvotes,
        parentId: r.parentId,
        author: { ...r.user, isInstructor: r.user.id === instr },
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

/* ─────────────────────── Commentaires de chapitre ──────────────────────── */

export interface ChapterComment {
  id: string;
  content: string;
  pinned: boolean;
  parentId: string | null;
  author: CommunityUser & { isInstructor: boolean };
  createdAt: string;
}

/**
 * Commentaires d'un chapitre (l'accès est déjà contrôlé par la page player).
 * `instructorId` permet de badger l'auteur instructeur.
 */
export async function getChapterComments(
  chapterId: string,
  instructorId: string | null,
): Promise<ChapterComment[]> {
  const comments = await prisma.comment.findMany({
    where: { chapterId },
    orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  return comments.map((c) => ({
    id: c.id, content: c.content, pinned: c.pinned, parentId: c.parentId,
    author: { ...c.user, isInstructor: c.user.id === instructorId },
    createdAt: c.createdAt.toISOString(),
  }));
}

/* ─────────────────────────────────── Chat ──────────────────────────────── */

export interface ChatMessageItem {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityUser & { isInstructor: boolean };
}

export interface PresenceUser {
  id: string;
  name: string;
  avatar: string | null;
  isInstructor: boolean;
}

/** Fenêtre de présence : actif dans les 2 dernières minutes. */
export const PRESENCE_WINDOW_MS = 2 * 60 * 1000;

async function mapMessages(
  rows: { id: string; content: string; createdAt: Date; user: CommunityUser }[],
  instructorId: string | null,
): Promise<ChatMessageItem[]> {
  return rows.map((m) => ({
    id: m.id, content: m.content, createdAt: m.createdAt.toISOString(),
    author: { ...m.user, isInstructor: m.user.id === instructorId },
  }));
}

/** Charge l'état initial du chat : 50 derniers messages + présence. */
export async function getChatInitial(
  slug: string,
  userId: string | null,
): Promise<{
  access: CommunityAccess;
  messages: ChatMessageItem[];
  presence: PresenceUser[];
  instructorId: string | null;
} | null> {
  const access = await getCommunityAccess(userId, slug);
  if (!access) return null;
  if (!access.canView) {
    return { access, messages: [], presence: [], instructorId: null };
  }

  const course = await prisma.course.findUnique({
    where: { id: access.courseId },
    select: { instructorId: true },
  });
  const instructorId = course?.instructorId ?? null;

  const room = await prisma.chatRoom.findUnique({ where: { courseId: access.courseId } });
  let messages: ChatMessageItem[] = [];
  if (room) {
    const rows = await prisma.chatMessage.findMany({
      where: { chatRoomId: room.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    messages = (await mapMessages(rows.reverse(), instructorId));
  }

  const presence = await getPresence(access.courseId, instructorId);
  return { access, messages, presence, instructorId };
}

/** Utilisateurs présents : inscrits (ou instructeur) actifs récemment. */
export async function getPresence(
  courseId: string,
  instructorId: string | null,
): Promise<PresenceUser[]> {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const users = await prisma.user.findMany({
    where: {
      lastActiveAt: { gte: since },
      OR: [
        { enrollments: { some: { courseId } } },
        instructorId ? { id: instructorId } : { id: "__none__" },
      ],
    },
    select: { id: true, name: true, avatar: true },
    take: 30,
  });
  return users.map((u) => ({ ...u, isInstructor: u.id === instructorId }));
}

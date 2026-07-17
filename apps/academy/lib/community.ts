import "server-only";
import {
  prisma,
  type Prisma,
  type ReactionTarget,
  type EnrollmentStatus,
} from "@da/academy-db/client";
import { currentUserFresh, isAdmin } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Communauté — forum contextualisé (cahier §25, §5.1). LECTURES + CONTRÔLE
   D'ACCÈS. Une DISCUSSION vit dans UN espace (formation, parcours, école OU
   cohorte). Le cœur de la sécurité est `getCommunityAccess`, appelé par toutes
   les lectures ET revérifié par chaque action avant écriture :

     · FORMATION (courseId)   → voir = inscrit (ACTIVE/COMPLETED) OU formateur
                                de la formation OU admin ; publier = voir + email
                                vérifié ; modérateur = admin OU formateur.
     · PARCOURS (careerPathId)→ voir = inscrit au parcours OU admin ; publier =
                                voir + vérifié ; modérateur = admin.
     · COHORTE (cohortId)     → voir = membre ACTIVE OU formateur de la cohorte
                                OU admin ; modérateur = admin OU formateur.
     · ÉCOLE (schoolId)       → espace OUVERT : voir = tout utilisateur
                                authentifié ; publier = vérifié ; modérateur = admin.

   Les liens de connexion / contenus privés ne transitent jamais ici : seuls des
   fils de discussion. `select` explicite partout ; réactions et signalements
   sont POLYMORPHES (targetType + targetId), donc comptés à part (pas de _count).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

/* ─── Types exposés ────────────────────────────────────────────────────────── */

export type CommunityContextType = "course" | "careerPath" | "school" | "cohort";

/** Contexte d'un espace : au plus UN identifiant renseigné. */
export interface CommunityContext {
  courseId?: string;
  careerPathId?: string;
  schoolId?: string;
  cohortId?: string;
}

export interface CommunityAccess {
  canView: boolean;
  canPost: boolean;
  isModerator: boolean;
  contextType: CommunityContextType | null;
  contextTitle: string;
  /** Lien vers le contenu sous-jacent (ex. formation → /formations/[slug]). */
  contextHref: string;
}

export interface CommunityAuthor {
  name: string | null;
  avatar: string | null;
}

export interface CommunityAttachment {
  url: string;
  name: string;
}

export interface CommunitySpace {
  type: CommunityContextType;
  id: string;
  title: string;
  slug: string;
  discussionCount: number;
  /** Page de l'espace communautaire : /espace/communaute/[type]/[id]. */
  href: string;
}

export interface DiscussionListItem {
  id: string;
  title: string;
  excerpt: string;
  author: CommunityAuthor;
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  replyCount: number;
  reactionCount: number;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface ReplyNode {
  id: string;
  body: string;
  author: CommunityAuthor;
  parentId: string | null;
  isSolution: boolean;
  attachments: CommunityAttachment[];
  createdAt: Date;
  reactionCount: number;
  reacted: boolean;
  /** L'utilisateur courant est l'auteur de cette réponse (peut la supprimer). */
  isOwn: boolean;
}

export interface DiscussionView {
  id: string;
  title: string;
  body: string;
  author: CommunityAuthor;
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  attachments: CommunityAttachment[];
  createdAt: Date;
  context: { type: CommunityContextType | null; title: string; href: string };
  canPost: boolean;
  isModerator: boolean;
  /** L'utilisateur courant est l'auteur de la discussion (peut marquer une solution / supprimer). */
  isAuthor: boolean;
  following: boolean;
  reactionCount: number;
  reacted: boolean;
  replies: ReplyNode[];
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/** Lien de la page d'un espace communautaire. */
export function communitySpaceHref(type: CommunityContextType, id: string): string {
  return `/espace/communaute/${type}/${id}`;
}

function noAccess(contextType: CommunityContextType | null): CommunityAccess {
  return {
    canView: false,
    canPost: false,
    isModerator: false,
    contextType,
    contextTitle: "",
    contextHref: "",
  };
}

/** N'accepte QUE les URLs Vercel Blob (anti-injection de lien tiers). */
function isBlobUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Parse défensivement le JSON `attachments` : Blob only, ≤ 4, nom borné à 160c. */
function parseAttachments(value: Prisma.JsonValue | null | undefined): CommunityAttachment[] {
  if (!Array.isArray(value)) return [];
  const out: CommunityAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url : null;
    const name = typeof rec.name === "string" ? rec.name : null;
    if (!url || !name || !isBlobUrl(url)) continue;
    out.push({ url, name: name.slice(0, 160) });
    if (out.length >= 4) break;
  }
  return out;
}

function excerpt(body: string, max = 160): string {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/* ─── Contrôle d'accès (cœur sécurité) ─────────────────────────────────────── */

/**
 * Autorisation d'un espace communautaire. Charge le contexte fourni (au plus un,
 * pris dans l'ordre formation → parcours → école → cohorte) et applique les
 * règles §25. L'admin (rôles frais en base) et l'email vérifié sont dérivés de
 * `currentUserFresh`. Renvoie toujours un objet (jamais null) : `canView=false`
 * suffit à cloisonner.
 */
export async function getCommunityAccess(
  userId: string | null,
  ctx: CommunityContext,
): Promise<CommunityAccess> {
  const fresh = userId ? await currentUserFresh() : null;
  const admin = isAdmin(fresh);
  const verified = !!fresh?.emailVerified;

  // ── Formation ──────────────────────────────────────────────────────────────
  if (ctx.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: ctx.courseId },
      select: { id: true, title: true, slug: true },
    });
    if (!course) return noAccess("course");

    let enrolled = false;
    let instructor = false;
    if (userId) {
      const [e, ci] = await Promise.all([
        prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
          select: { status: true },
        }),
        prisma.courseInstructor.findFirst({
          where: { courseId: course.id, userId },
          select: { id: true },
        }),
      ]);
      enrolled = !!e && ACQUIRED.includes(e.status);
      instructor = !!ci;
    }
    const canView = admin || enrolled || instructor;
    const isModerator = admin || instructor;
    return {
      canView,
      canPost: canView && verified,
      isModerator,
      contextType: "course",
      contextTitle: course.title,
      contextHref: `/formations/${course.slug}`,
    };
  }

  // ── Parcours métier ─────────────────────────────────────────────────────────
  if (ctx.careerPathId) {
    const path = await prisma.careerPath.findUnique({
      where: { id: ctx.careerPathId },
      select: { id: true, title: true, slug: true },
    });
    if (!path) return noAccess("careerPath");

    let enrolled = false;
    if (userId) {
      const pe = await prisma.careerPathEnrollment.findUnique({
        where: { userId_careerPathId: { userId, careerPathId: path.id } },
        select: { status: true },
      });
      enrolled = !!pe && ACQUIRED.includes(pe.status);
    }
    const canView = admin || enrolled;
    return {
      canView,
      canPost: canView && verified,
      isModerator: admin,
      contextType: "careerPath",
      contextTitle: path.title,
      contextHref: `/parcours-metiers/${path.slug}`,
    };
  }

  // ── École (espace ouvert à tout utilisateur authentifié) ─────────────────────
  if (ctx.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: ctx.schoolId },
      select: { id: true, name: true, slug: true },
    });
    if (!school) return noAccess("school");

    const canView = !!userId;
    return {
      canView,
      canPost: canView && verified,
      isModerator: admin,
      contextType: "school",
      contextTitle: school.name,
      contextHref: `/ecoles/${school.slug}`,
    };
  }

  // ── Cohorte ──────────────────────────────────────────────────────────────────
  if (ctx.cohortId) {
    const cohort = await prisma.cohort.findUnique({
      where: { id: ctx.cohortId },
      select: { id: true, name: true, slug: true },
    });
    if (!cohort) return noAccess("cohort");

    let member = false;
    let instructor = false;
    if (userId) {
      const [m, ci] = await Promise.all([
        prisma.cohortMember.findUnique({
          where: { cohortId_userId: { cohortId: cohort.id, userId } },
          select: { status: true },
        }),
        prisma.cohortInstructor.findUnique({
          where: { cohortId_userId: { cohortId: cohort.id, userId } },
          select: { id: true },
        }),
      ]);
      member = !!m && m.status === "ACTIVE";
      instructor = !!ci;
    }
    const canView = admin || member || instructor;
    const isModerator = admin || instructor;
    return {
      canView,
      canPost: canView && verified,
      isModerator,
      contextType: "cohort",
      contextTitle: cohort.name,
      contextHref: `/espace/cohortes/${cohort.id}`,
    };
  }

  return noAccess(null);
}

/* ─── Hub : les espaces de l'apprenant (§25 page communauté) ────────────────── */

/**
 * Espaces communautaires de l'apprenant : ses formations acquises, ses parcours
 * acquis et ses cohortes ACTIVE. Le compte de discussions est agrégé en SQL
 * (groupBy) pour éviter le N+1.
 */
export async function getCommunityHub(userId: string): Promise<CommunitySpace[]> {
  const [enrollments, pathEnrollments, memberships] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: ACQUIRED } },
      orderBy: { enrolledAt: "desc" },
      take: 100,
      select: { course: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.careerPathEnrollment.findMany({
      where: { userId, status: { in: ACQUIRED } },
      orderBy: { enrolledAt: "desc" },
      take: 100,
      select: { careerPath: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.cohortMember.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { joinedAt: "desc" },
      take: 100,
      select: { cohort: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  const courseIds = enrollments.map((e) => e.course.id);
  const pathIds = pathEnrollments.map((e) => e.careerPath.id);
  const cohortIds = memberships.map((m) => m.cohort.id);

  const [courseCounts, pathCounts, cohortCounts] = await Promise.all([
    courseIds.length
      ? prisma.discussion.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
        })
      : Promise.resolve<Array<{ courseId: string | null; _count: { _all: number } }>>([]),
    pathIds.length
      ? prisma.discussion.groupBy({
          by: ["careerPathId"],
          where: { careerPathId: { in: pathIds } },
          _count: { _all: true },
        })
      : Promise.resolve<Array<{ careerPathId: string | null; _count: { _all: number } }>>([]),
    cohortIds.length
      ? prisma.discussion.groupBy({
          by: ["cohortId"],
          where: { cohortId: { in: cohortIds } },
          _count: { _all: true },
        })
      : Promise.resolve<Array<{ cohortId: string | null; _count: { _all: number } }>>([]),
  ]);

  const courseCountMap = new Map(courseCounts.map((g) => [g.courseId, g._count._all]));
  const pathCountMap = new Map(pathCounts.map((g) => [g.careerPathId, g._count._all]));
  const cohortCountMap = new Map(cohortCounts.map((g) => [g.cohortId, g._count._all]));

  const spaces: CommunitySpace[] = [];
  for (const e of enrollments) {
    spaces.push({
      type: "course",
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      discussionCount: courseCountMap.get(e.course.id) ?? 0,
      href: communitySpaceHref("course", e.course.id),
    });
  }
  for (const e of pathEnrollments) {
    spaces.push({
      type: "careerPath",
      id: e.careerPath.id,
      title: e.careerPath.title,
      slug: e.careerPath.slug,
      discussionCount: pathCountMap.get(e.careerPath.id) ?? 0,
      href: communitySpaceHref("careerPath", e.careerPath.id),
    });
  }
  for (const m of memberships) {
    spaces.push({
      type: "cohort",
      id: m.cohort.id,
      title: m.cohort.name,
      slug: m.cohort.slug,
      discussionCount: cohortCountMap.get(m.cohort.id) ?? 0,
      href: communitySpaceHref("cohort", m.cohort.id),
    });
  }
  return spaces;
}

/* ─── Liste des discussions d'un espace (§25.1) ─────────────────────────────── */

/**
 * Discussions d'un espace, triées épinglées d'abord puis récentes. Renvoie null
 * si l'utilisateur ne peut pas voir l'espace (cloisonnement). Le filtre `q`
 * s'applique au titre (insensible à la casse).
 */
export async function getDiscussions(
  ctx: CommunityContext,
  userId: string,
  opts?: { q?: string },
): Promise<{ access: CommunityAccess; discussions: DiscussionListItem[] } | null> {
  const access = await getCommunityAccess(userId, ctx);
  if (!access.canView) return null;

  const where: Prisma.DiscussionWhereInput = {};
  if (ctx.courseId) where.courseId = ctx.courseId;
  else if (ctx.careerPathId) where.careerPathId = ctx.careerPathId;
  else if (ctx.schoolId) where.schoolId = ctx.schoolId;
  else if (ctx.cohortId) where.cohortId = ctx.cohortId;
  else return null;

  const q = opts?.q?.trim();
  if (q) where.title = { contains: q, mode: "insensitive" };

  const rows = await prisma.discussion.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      pinned: true,
      locked: true,
      solved: true,
      createdAt: true,
      author: { select: { name: true, avatar: true } },
      _count: { select: { replies: true } },
      replies: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  // Réactions POLYMORPHES : comptées en un seul groupBy sur les discussions listées.
  const ids = rows.map((r) => r.id);
  const reactionGroups = ids.length
    ? await prisma.reaction.groupBy({
        by: ["targetId"],
        where: { targetType: "DISCUSSION", targetId: { in: ids } },
        _count: { _all: true },
      })
    : [];
  const reactionMap = new Map(reactionGroups.map((g) => [g.targetId, g._count._all]));

  const discussions: DiscussionListItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: excerpt(r.body),
    author: { name: r.author?.name ?? null, avatar: r.author?.avatar ?? null },
    pinned: r.pinned,
    locked: r.locked,
    solved: r.solved,
    replyCount: r._count.replies,
    reactionCount: reactionMap.get(r.id) ?? 0,
    lastActivityAt: r.replies[0]?.createdAt ?? r.createdAt,
    createdAt: r.createdAt,
  }));

  return { access, discussions };
}

/* ─── Fiche d'une discussion + fil (§25.2) ──────────────────────────────────── */

/**
 * Discussion complète (contexte, autorisations, réactions, suivi et fil aplati).
 * Renvoie null si introuvable OU si l'utilisateur ne peut pas voir l'espace. Le
 * fil est aplati, trié par ancienneté ; `parentId` permet l'indentation en UI.
 */
export async function getDiscussion(id: string, userId: string): Promise<DiscussionView | null> {
  const d = await prisma.discussion.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      body: true,
      pinned: true,
      locked: true,
      solved: true,
      attachments: true,
      createdAt: true,
      courseId: true,
      careerPathId: true,
      schoolId: true,
      cohortId: true,
      authorId: true,
      author: { select: { name: true, avatar: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        take: 500,
        select: {
          id: true,
          body: true,
          parentId: true,
          isSolution: true,
          attachments: true,
          createdAt: true,
          authorId: true,
          author: { select: { name: true, avatar: true } },
        },
      },
    },
  });
  if (!d) return null;

  const ctx: CommunityContext = {
    courseId: d.courseId ?? undefined,
    careerPathId: d.careerPathId ?? undefined,
    schoolId: d.schoolId ?? undefined,
    cohortId: d.cohortId ?? undefined,
  };
  const access = await getCommunityAccess(userId, ctx);
  if (!access.canView) return null;

  const replyIds = d.replies.map((r) => r.id);

  const orReactions: Prisma.ReactionWhereInput[] = [{ targetType: "DISCUSSION", targetId: d.id }];
  if (replyIds.length) orReactions.push({ targetType: "REPLY", targetId: { in: replyIds } });

  const [discReactionCount, replyReactionGroups, myReactions, follow] = await Promise.all([
    prisma.reaction.count({ where: { targetType: "DISCUSSION", targetId: d.id } }),
    replyIds.length
      ? prisma.reaction.groupBy({
          by: ["targetId"],
          where: { targetType: "REPLY", targetId: { in: replyIds } },
          _count: { _all: true },
        })
      : Promise.resolve<Array<{ targetId: string; _count: { _all: number } }>>([]),
    userId
      ? prisma.reaction.findMany({
          where: { userId, OR: orReactions },
          select: { targetType: true, targetId: true },
        })
      : Promise.resolve<Array<{ targetType: ReactionTarget; targetId: string }>>([]),
    userId
      ? prisma.discussionFollow.findUnique({
          where: { discussionId_userId: { discussionId: d.id, userId } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const replyReactionMap = new Map(replyReactionGroups.map((g) => [g.targetId, g._count._all]));
  const myReactionSet = new Set(myReactions.map((r) => `${r.targetType}:${r.targetId}`));

  const contextEntityId = d.courseId ?? d.careerPathId ?? d.schoolId ?? d.cohortId ?? "";
  const contextHref = access.contextType
    ? communitySpaceHref(access.contextType, contextEntityId)
    : access.contextHref;

  const replies: ReplyNode[] = d.replies.map((r) => ({
    id: r.id,
    body: r.body,
    author: { name: r.author?.name ?? null, avatar: r.author?.avatar ?? null },
    parentId: r.parentId,
    isSolution: r.isSolution,
    attachments: parseAttachments(r.attachments),
    createdAt: r.createdAt,
    reactionCount: replyReactionMap.get(r.id) ?? 0,
    reacted: myReactionSet.has(`REPLY:${r.id}`),
    isOwn: !!userId && r.authorId === userId,
  }));

  return {
    id: d.id,
    title: d.title,
    body: d.body,
    author: { name: d.author?.name ?? null, avatar: d.author?.avatar ?? null },
    pinned: d.pinned,
    locked: d.locked,
    solved: d.solved,
    attachments: parseAttachments(d.attachments),
    createdAt: d.createdAt,
    context: { type: access.contextType, title: access.contextTitle, href: contextHref },
    canPost: access.canPost,
    isModerator: access.isModerator,
    isAuthor: !!userId && d.authorId === userId,
    following: !!follow,
    reactionCount: discReactionCount,
    reacted: myReactionSet.has(`DISCUSSION:${d.id}`),
    replies,
  };
}

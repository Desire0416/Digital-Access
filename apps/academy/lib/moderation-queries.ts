import "server-only";
import { redirect } from "next/navigation";
import { prisma, type Prisma, type ReportStatus, type ReportTarget } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Modération communautaire — LECTURES back-office (cahier §25.3). Défense en
   profondeur : chaque requête revérifie le rôle admin EN BASE
   (requireAdminFresh) même si le layout /admin est déjà gardé. Fichier
   volontairement découplé d'admin-queries.ts (helpers réécrits localement).
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin%2Fmoderation");
  return admin;
}

/** Réduit un texte (markdown brut) à un aperçu d'une ligne borné. */
function excerptOf(input: string, max = 160): string {
  const clean = input.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/* ─── Aperçu résolu d'une cible signalée ───────────────────────────────────── */

export interface ReportTargetPreview {
  /** false si la cible a déjà été supprimée (par un autre modérateur / l'auteur). */
  exists: boolean;
  excerpt: string;
  authorName: string | null;
  /** Lien profond vers le contenu (discussion communauté / réponse / lecteur). */
  href: string;
}

export interface ReportItem {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  status: ReportStatus;
  reporter: { name: string } | null;
  createdAt: Date;
  target: ReportTargetPreview;
}

const MISSING: ReportTargetPreview = { exists: false, excerpt: "", authorName: null, href: "" };

/* ─── File de modération (§25.3) ───────────────────────────────────────────── */

/**
 * Signalements triés PENDING d'abord puis createdAt desc (l'enum Report est
 * déclaré PENDING → ACTIONED → DISMISSED : l'ordre natif Postgres place donc
 * PENDING en tête). Pour CHAQUE signalement, on résout un aperçu de la cible
 * selon son type. Résolution groupée (pas de N+1) : les cibles sont chargées en
 * une requête par type puis appariées.
 */
export async function listReportsAdmin(filters: { status?: ReportStatus } = {}): Promise<ReportItem[]> {
  await guard();

  const where: Prisma.ReportWhereInput = {};
  if (filters.status) where.status = filters.status;

  const reports = await prisma.report.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      status: true,
      createdAt: true,
      reporter: { select: { name: true } },
    },
  });

  // Regroupe les identifiants de cible par type pour une résolution groupée.
  const discIds: string[] = [];
  const replyIds: string[] = [];
  const commentIds: string[] = [];
  for (const r of reports) {
    if (r.targetType === "DISCUSSION") discIds.push(r.targetId);
    else if (r.targetType === "REPLY") replyIds.push(r.targetId);
    else if (r.targetType === "LESSON_COMMENT") commentIds.push(r.targetId);
  }

  const [discussions, replies, comments] = await Promise.all([
    discIds.length
      ? prisma.discussion.findMany({
          where: { id: { in: discIds } },
          select: { id: true, title: true, body: true, author: { select: { name: true } } },
        })
      : Promise.resolve([]),
    replyIds.length
      ? prisma.discussionReply.findMany({
          where: { id: { in: replyIds } },
          select: { id: true, body: true, discussionId: true, author: { select: { name: true } } },
        })
      : Promise.resolve([]),
    commentIds.length
      ? prisma.lessonComment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            body: true,
            lessonId: true,
            author: { select: { name: true } },
            course: { select: { slug: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const discById = new Map(discussions.map((d) => [d.id, d]));
  const replyById = new Map(replies.map((r) => [r.id, r]));
  const commentById = new Map(comments.map((c) => [c.id, c]));

  return reports.map((r) => {
    let target: ReportTargetPreview = MISSING;

    if (r.targetType === "DISCUSSION") {
      const d = discById.get(r.targetId);
      if (d) {
        target = {
          exists: true,
          excerpt: excerptOf(d.body ? `${d.title} — ${d.body}` : d.title),
          authorName: d.author?.name ?? null,
          href: `/espace/communaute/sujet/${d.id}`,
        };
      }
    } else if (r.targetType === "REPLY") {
      const rep = replyById.get(r.targetId);
      if (rep) {
        target = {
          exists: true,
          excerpt: excerptOf(rep.body),
          authorName: rep.author?.name ?? null,
          href: `/espace/communaute/sujet/${rep.discussionId}#reponse-${rep.id}`,
        };
      }
    } else if (r.targetType === "LESSON_COMMENT") {
      const c = commentById.get(r.targetId);
      if (c) {
        target = {
          exists: true,
          excerpt: excerptOf(c.body),
          authorName: c.author?.name ?? null,
          href: `/apprendre/${c.course.slug}/${c.lessonId}#commentaire-${c.id}`,
        };
      }
    }

    return {
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      reporter: r.reporter,
      createdAt: r.createdAt,
      target,
    };
  });
}

/* ─── Pastille de navigation (§25.3) ───────────────────────────────────────── */

/** Nombre de signalements en attente — pour la pastille de la nav admin. */
export async function countPendingReports(): Promise<number> {
  await guard();
  return prisma.report.count({ where: { status: "PENDING" } });
}

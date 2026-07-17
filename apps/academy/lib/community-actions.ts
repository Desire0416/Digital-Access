"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  prisma,
  Prisma,
  type ReactionTarget,
  type ReportTarget,
} from "@da/academy-db/client";
import { currentUser } from "./guards";
import { createNotification } from "./notify";
import { getCommunityAccess, communitySpaceHref } from "./community";

/* ══════════════════════════════════════════════════════════════════════════
   Communauté — ACTIONS (cahier §25). INVARIANTS DE SÉCURITÉ :
   · Chaque action RE-VÉRIFIE l'autorisation (`getCommunityAccess`) AVANT toute
     écriture — jamais de confiance dans le contexte reçu du client.
   · Publier exige `canPost` (voir l'espace + email vérifié) ; une discussion
     `locked` refuse toute nouvelle réponse.
   · Pièces jointes : uniquement des URLs Vercel Blob (bornées à 4, nom ≤ 160c).
   · Marquer une solution : réservé à l'auteur de la discussion OU à un modérateur.
   · Réactions / suivi / signalement revérifient la visibilité de la cible.
   ══════════════════════════════════════════════════════════════════════════ */

export type CommunityActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error?: string; redirect?: string };

/* ─── Schémas partagés ─────────────────────────────────────────────────────── */

const blobUrl = z
  .string()
  .url()
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "Pièce jointe invalide.");

const attachmentSchema = z.object({
  url: blobUrl,
  name: z.string().trim().min(1).max(160),
});
const attachmentsSchema = z.array(attachmentSchema).max(4).optional();

const REACTION_TARGETS: ReactionTarget[] = ["DISCUSSION", "REPLY", "LESSON_COMMENT"];
const REPORT_TARGETS: ReportTarget[] = ["DISCUSSION", "REPLY", "LESSON_COMMENT"];

const CONNEXION = "/connexion?callbackUrl=/espace/communaute";

/* ─── Helpers internes ─────────────────────────────────────────────────────── */

type CtxRecord = {
  courseId: string | null;
  careerPathId: string | null;
  schoolId: string | null;
  cohortId: string | null;
};

function toCtx(d: CtxRecord) {
  return {
    courseId: d.courseId ?? undefined,
    careerPathId: d.careerPathId ?? undefined,
    schoolId: d.schoolId ?? undefined,
    cohortId: d.cohortId ?? undefined,
  };
}

function ctxEntityId(d: CtxRecord): string {
  return d.courseId ?? d.careerPathId ?? d.schoolId ?? d.cohortId ?? "";
}

/* ─── Créer une discussion (§25.1) ──────────────────────────────────────────── */

const createDiscussionSchema = z
  .object({
    courseId: z.string().min(1).optional(),
    careerPathId: z.string().min(1).optional(),
    schoolId: z.string().min(1).optional(),
    cohortId: z.string().min(1).optional(),
    title: z.string().trim().min(3, "Titre trop court.").max(160, "Titre trop long."),
    body: z.string().trim().min(1, "Message vide.").max(8000, "Message trop long."),
    attachments: attachmentsSchema,
  })
  .refine(
    (v) => [v.courseId, v.careerPathId, v.schoolId, v.cohortId].filter(Boolean).length === 1,
    "Contexte invalide : exactement un espace est requis.",
  );

export async function createDiscussion(input: {
  courseId?: string;
  careerPathId?: string;
  schoolId?: string;
  cohortId?: string;
  title: string;
  body: string;
  attachments?: { url: string; name: string }[];
}): Promise<CommunityActionResult> {
  const parsed = createDiscussionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  const { courseId, careerPathId, schoolId, cohortId, title, body, attachments } = parsed.data;
  const ctx = { courseId, careerPathId, schoolId, cohortId };
  const access = await getCommunityAccess(user.id, ctx);
  if (!access.canView) return { ok: false, error: "Espace introuvable ou inaccessible." };
  if (!access.canPost) {
    return { ok: false, error: "Confirmez votre adresse email pour publier dans la communauté." };
  }

  const discussion = await prisma.discussion.create({
    data: {
      title,
      body,
      courseId: courseId ?? null,
      careerPathId: careerPathId ?? null,
      schoolId: schoolId ?? null,
      cohortId: cohortId ?? null,
      authorId: user.id,
      attachments: attachments && attachments.length ? (attachments as Prisma.InputJsonValue) : undefined,
      // L'auteur suit automatiquement sa propre discussion (notifié des réponses).
      follows: { create: { userId: user.id } },
    },
    select: { id: true },
  });

  const contextId = ctxEntityId({ courseId: courseId ?? null, careerPathId: careerPathId ?? null, schoolId: schoolId ?? null, cohortId: cohortId ?? null });
  if (access.contextType) revalidatePath(communitySpaceHref(access.contextType, contextId));
  revalidatePath("/espace/communaute");
  return { ok: true, id: discussion.id, message: "Discussion publiée." };
}

/* ─── Répondre à une discussion (§25.2) ─────────────────────────────────────── */

const createReplySchema = z.object({
  body: z.string().trim().min(1, "Réponse vide.").max(8000, "Réponse trop longue."),
  parentId: z.string().min(1).optional(),
  attachments: attachmentsSchema,
});

export async function createReply(
  discussionId: string,
  input: { body: string; parentId?: string; attachments?: { url: string; name: string }[] },
): Promise<CommunityActionResult> {
  const dId = z.string().min(1).safeParse(discussionId);
  if (!dId.success) return { ok: false, error: "Discussion invalide." };
  const parsed = createReplySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  const discussion = await prisma.discussion.findUnique({
    where: { id: dId.data },
    select: {
      id: true,
      title: true,
      locked: true,
      authorId: true,
      courseId: true,
      careerPathId: true,
      schoolId: true,
      cohortId: true,
      follows: { select: { userId: true } },
    },
  });
  if (!discussion) return { ok: false, error: "Discussion introuvable." };

  const access = await getCommunityAccess(user.id, toCtx(discussion));
  if (!access.canView) return { ok: false, error: "Espace inaccessible." };
  if (!access.canPost) {
    return { ok: false, error: "Confirmez votre adresse email pour répondre." };
  }
  if (discussion.locked) return { ok: false, error: "Cette discussion est verrouillée." };

  // Une réponse parente doit appartenir à CETTE discussion (fil cohérent).
  if (parsed.data.parentId) {
    const parent = await prisma.discussionReply.findUnique({
      where: { id: parsed.data.parentId },
      select: { discussionId: true },
    });
    if (!parent || parent.discussionId !== discussion.id) {
      return { ok: false, error: "Réponse parente invalide." };
    }
  }

  const reply = await prisma.discussionReply.create({
    data: {
      discussionId: discussion.id,
      authorId: user.id,
      parentId: parsed.data.parentId ?? null,
      body: parsed.data.body,
      attachments:
        parsed.data.attachments && parsed.data.attachments.length
          ? (parsed.data.attachments as Prisma.InputJsonValue)
          : undefined,
    },
    select: { id: true },
  });

  const contextId = ctxEntityId(discussion);
  const spaceHref = access.contextType
    ? communitySpaceHref(access.contextType, contextId)
    : "/espace/communaute";
  const discussionHref = `${spaceHref}/${discussion.id}`;

  // Notifier l'auteur de la discussion + tous les followers (sauf le répondeur).
  const recipients = new Set<string>();
  if (discussion.authorId) recipients.add(discussion.authorId);
  for (const f of discussion.follows) recipients.add(f.userId);
  recipients.delete(user.id);
  await Promise.all(
    [...recipients].map((uid) =>
      createNotification({
        userId: uid,
        type: "FORUM",
        title: "Nouvelle réponse",
        message: `${user.name} a répondu à « ${discussion.title} ».`,
        link: discussionHref,
      }),
    ),
  );

  revalidatePath(discussionHref);
  revalidatePath(spaceHref);
  return { ok: true, id: reply.id, message: "Réponse publiée." };
}

/* ─── Réaction « j'aime » (like/upvote unique) ──────────────────────────────── */

/** Visibilité de la cible d'une réaction (discussion, réponse ou commentaire). */
async function canSeeReactionTarget(
  userId: string,
  targetType: ReactionTarget,
  targetId: string,
): Promise<boolean> {
  if (targetType === "DISCUSSION") {
    const d = await prisma.discussion.findUnique({
      where: { id: targetId },
      select: { courseId: true, careerPathId: true, schoolId: true, cohortId: true },
    });
    if (!d) return false;
    return (await getCommunityAccess(userId, toCtx(d))).canView;
  }
  if (targetType === "REPLY") {
    const r = await prisma.discussionReply.findUnique({
      where: { id: targetId },
      select: {
        discussion: {
          select: { courseId: true, careerPathId: true, schoolId: true, cohortId: true },
        },
      },
    });
    if (!r) return false;
    return (await getCommunityAccess(userId, toCtx(r.discussion))).canView;
  }
  // LESSON_COMMENT : visibilité = accès à la formation dénormalisée.
  const c = await prisma.lessonComment.findUnique({
    where: { id: targetId },
    select: { courseId: true },
  });
  if (!c) return false;
  return (await getCommunityAccess(userId, { courseId: c.courseId })).canView;
}

export async function toggleReaction(
  targetType: ReactionTarget,
  targetId: string,
): Promise<{ ok: true; reacted: boolean; count: number } | { ok: false; error: string }> {
  if (!REACTION_TARGETS.includes(targetType)) return { ok: false, error: "Cible invalide." };
  const tId = z.string().min(1).safeParse(targetId);
  if (!tId.success) return { ok: false, error: "Cible invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Connectez-vous pour réagir." };

  if (!(await canSeeReactionTarget(user.id, targetType, tId.data))) {
    return { ok: false, error: "Contenu inaccessible." };
  }

  const existing = await prisma.reaction.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId: tId.data } },
    select: { id: true },
  });

  if (existing) {
    try {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } catch (err) {
      // Retrait concurrent : la ligne a déjà disparu → idempotent (P2025).
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) throw err;
    }
  } else {
    try {
      await prisma.reaction.create({
        data: { userId: user.id, targetType, targetId: tId.data },
      });
    } catch (err) {
      // Réaction concurrente identique : idempotent (déjà « aimé »).
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }

  const count = await prisma.reaction.count({ where: { targetType, targetId: tId.data } });
  return { ok: true, reacted: !existing, count };
}

/* ─── Suivre / ne plus suivre une discussion ───────────────────────────────── */

export async function toggleFollow(
  discussionId: string,
): Promise<{ ok: true; following: boolean } | { ok: false; error: string }> {
  const dId = z.string().min(1).safeParse(discussionId);
  if (!dId.success) return { ok: false, error: "Discussion invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Connectez-vous pour suivre la discussion." };

  const discussion = await prisma.discussion.findUnique({
    where: { id: dId.data },
    select: { id: true, courseId: true, careerPathId: true, schoolId: true, cohortId: true },
  });
  if (!discussion) return { ok: false, error: "Discussion introuvable." };

  const access = await getCommunityAccess(user.id, toCtx(discussion));
  if (!access.canView) return { ok: false, error: "Espace inaccessible." };

  const existing = await prisma.discussionFollow.findUnique({
    where: { discussionId_userId: { discussionId: discussion.id, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    try {
      await prisma.discussionFollow.delete({ where: { id: existing.id } });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) throw err;
    }
    return { ok: true, following: false };
  }
  try {
    await prisma.discussionFollow.create({
      data: { discussionId: discussion.id, userId: user.id },
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
  }
  return { ok: true, following: true };
}

/* ─── Marquer une réponse comme solution (§25.2) ────────────────────────────── */

export async function markSolution(replyId: string): Promise<CommunityActionResult> {
  const rId = z.string().min(1).safeParse(replyId);
  if (!rId.success) return { ok: false, error: "Réponse invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  const reply = await prisma.discussionReply.findUnique({
    where: { id: rId.data },
    select: {
      id: true,
      discussionId: true,
      discussion: {
        select: {
          id: true,
          authorId: true,
          courseId: true,
          careerPathId: true,
          schoolId: true,
          cohortId: true,
        },
      },
    },
  });
  if (!reply) return { ok: false, error: "Réponse introuvable." };

  const access = await getCommunityAccess(user.id, toCtx(reply.discussion));
  const isDiscussionAuthor = reply.discussion.authorId === user.id;
  if (!isDiscussionAuthor && !access.isModerator) {
    return { ok: false, error: "Action non autorisée." };
  }

  // Une seule solution par discussion : on repasse les autres à false.
  await prisma.$transaction([
    prisma.discussionReply.updateMany({
      where: { discussionId: reply.discussionId, isSolution: true },
      data: { isSolution: false },
    }),
    prisma.discussionReply.update({ where: { id: reply.id }, data: { isSolution: true } }),
    prisma.discussion.update({ where: { id: reply.discussionId }, data: { solved: true } }),
  ]);

  const contextId = ctxEntityId(reply.discussion);
  const spaceHref = access.contextType
    ? communitySpaceHref(access.contextType, contextId)
    : "/espace/communaute";
  revalidatePath(`${spaceHref}/${reply.discussionId}`);
  return { ok: true, id: reply.id, message: "Réponse marquée comme solution." };
}

/* ─── Signaler un contenu (générique : discussion / réponse / commentaire) ──── */

export async function submitReport(
  targetType: ReportTarget,
  targetId: string,
  reason: string,
): Promise<CommunityActionResult> {
  if (!REPORT_TARGETS.includes(targetType)) return { ok: false, error: "Cible invalide." };
  const tId = z.string().min(1).safeParse(targetId);
  if (!tId.success) return { ok: false, error: "Cible invalide." };
  const parsedReason = z
    .string()
    .trim()
    .min(3, "Motif trop court.")
    .max(500, "Motif trop long.")
    .safeParse(reason);
  if (!parsedReason.success) {
    return { ok: false, error: parsedReason.error.issues[0]?.message ?? "Motif invalide." };
  }

  const user = await currentUser();
  if (!user) return { ok: false, redirect: CONNEXION };

  // Le signaleur doit pouvoir VOIR la cible (même cloisonnement que les
  // réactions) : bloque le signalement trans-espaces et les ID inexistants
  // (canSeeReactionTarget renvoie false si la cible est introuvable/invisible).
  if (!(await canSeeReactionTarget(user.id, targetType as unknown as ReactionTarget, tId.data))) {
    return { ok: false, error: "Contenu inaccessible." };
  }

  // Anti-doublon / anti-inondation : un seul signalement PENDING par
  // (utilisateur, cible) — un re-signalement renvoie un succès idempotent.
  const already = await prisma.report.findFirst({
    where: { reporterId: user.id, targetType, targetId: tId.data, status: "PENDING" },
    select: { id: true },
  });
  if (already) return { ok: true, message: "Signalement déjà transmis" };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId: tId.data,
      reason: parsedReason.data,
      status: "PENDING",
    },
  });

  // Notifier les administrateurs pédagogiques (file de modération).
  const admins = await prisma.user.findMany({
    where: { roles: { hasSome: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "MODERATION",
        title: "Nouveau signalement",
        message: "Un contenu de la communauté a été signalé et attend une revue.",
        link: "/admin/moderation",
      }),
    ),
  );

  return { ok: true, message: "Signalement transmis" };
}

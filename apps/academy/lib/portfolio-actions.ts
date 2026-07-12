"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@da/academy-db/client";
import { currentUser } from "./guards";
import { createNotification } from "./notify";

/** URL restreinte à http(s) — bloque `javascript:`/`data:` (contenu public §46). */
function httpUrl(message: string) {
  return z
    .string()
    .trim()
    .url(message)
    .refine((v) => /^https?:\/\//i.test(v), message);
}

/* ══════════════════════════════════════════════════════════════════════════
   Portfolio & employabilité — MUTATIONS (cahier §16.7 / §19.5).
   INVARIANTS :
   · Chaque action revérifie l'utilisateur courant et n'agit QUE sur SON
     portfolio / SES soumissions (sécurité au niveau ligne).
   · Un item de type PROJECT provient TOUJOURS d'une soumission APPROVED et se
     gère par publish/unpublish — jamais par updatePortfolioItem/delete manuels.
   · La publication est IDEMPOTENTE : un item est lié à la soumission par
     `submissionId @unique` → un upsert ne crée jamais de doublon.
   ══════════════════════════════════════════════════════════════════════════ */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Violation de contrainte d'unicité Prisma (slug déjà pris, item déjà lié…). */
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

/** kebab-case sans diacritiques, tronqué. */
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "portfolio"
  );
}

/** Nettoie un tableau de compétences/outils (trim, non vides, dé-dupliqué, borné). */
function cleanStringList(list: string[] | undefined, max = 40): string[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, max);
}

/** Premier lien exploitable d'un champ Json `links` de soumission. */
function firstLink(links: unknown): string | null {
  if (!Array.isArray(links)) return null;
  const found = links.find((v) => typeof v === "string" && v.trim());
  return typeof found === "string" ? found.trim() : null;
}

/** Première image exploitable d'un champ Json `files` de soumission. */
function firstImage(files: unknown): string | null {
  if (!Array.isArray(files)) return null;
  for (const f of files) {
    const url = typeof f === "string" ? f : f && typeof f === "object" && "url" in f ? (f as { url?: unknown }).url : null;
    if (typeof url === "string" && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url)) return url;
  }
  return null;
}

/* ─── ensurePortfolio : récupère OU crée le portfolio de l'utilisateur ──────── */

/**
 * Garantit l'existence du portfolio de l'utilisateur courant et renvoie son slug
 * public. Le slug est dérivé du nom (kebab-case + suffixe hex court garant
 * d'unicité) ; sur collision P2002, on réessaie avec un nouveau suffixe.
 */
export async function ensurePortfolio(): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const existing = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { slug: true } });
  if (existing) return { ok: true, slug: existing.slug };

  const base = slugify(user.name || user.email.split("@")[0] || "portfolio");
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = `${base}-${randomBytes(2).toString("hex")}`;
    try {
      const created = await prisma.portfolio.create({
        data: { userId: user.id, slug },
        select: { slug: true },
      });
      return { ok: true, slug: created.slug };
    } catch (e) {
      // Collision de slug (P2002 sur `slug`) : on réessaie avec un nouveau suffixe.
      // Collision sur `userId` (portfolio créé en parallèle) : on renvoie l'existant.
      if (isUniqueViolation(e)) {
        const again = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { slug: true } });
        if (again) return { ok: true, slug: again.slug };
        continue;
      }
      throw e;
    }
  }
  return { ok: false, error: "Impossible de générer une adresse de portfolio. Réessayez." };
}

/* ─── Présentation (headline / about / outils / liens) ─────────────────────── */

const presentationSchema = z.object({
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  about: z.string().trim().max(5000).optional().or(z.literal("")),
  tools: z.array(z.string().trim().max(60)).max(40).optional(),
  github: httpUrl("Lien GitHub invalide (http(s) uniquement).").optional().or(z.literal("")),
  linkedin: httpUrl("Lien LinkedIn invalide (http(s) uniquement).").optional().or(z.literal("")),
  website: httpUrl("Lien de site invalide (http(s) uniquement).").optional().or(z.literal("")),
});

export async function updatePortfolioPresentation(input: z.infer<typeof presentationSchema>): Promise<ActionResult> {
  const parsed = presentationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const ensured = await ensurePortfolio();
  if (!ensured.ok) return { ok: false, error: ensured.error };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const d = parsed.data;
  // Liens : on ne conserve QUE les entrées non vides (Json propre).
  const links: Record<string, string> = {};
  if (d.github) links.github = d.github;
  if (d.linkedin) links.linkedin = d.linkedin;
  if (d.website) links.website = d.website;

  await prisma.portfolio.update({
    where: { userId: user.id },
    data: {
      headline: d.headline ? d.headline : null,
      about: d.about ? d.about : null,
      tools: cleanStringList(d.tools),
      // JsonNull (et non undefined) pour réellement EFFACER quand tous les liens
      // sont vidés — undefined serait un no-op Prisma (anciens liens conservés).
      links: Object.keys(links).length ? links : Prisma.JsonNull,
    },
  });

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${ensured.slug}`);
  return { ok: true, message: "Présentation mise à jour." };
}

/* ─── Visibilité publique du portfolio ─────────────────────────────────────── */

export async function setPortfolioVisibility(
  isPublic: boolean,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const parsed = z.boolean().safeParse(isPublic);
  if (!parsed.success) return { ok: false, error: "Valeur invalide." };

  const ensured = await ensurePortfolio();
  if (!ensured.ok) return ensured;

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  await prisma.portfolio.update({ where: { userId: user.id }, data: { isPublic: parsed.data } });

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${ensured.slug}`);
  return { ok: true, slug: ensured.slug };
}

/* ─── Publication d'un projet validé (ACTION CLÉ §19.5) ────────────────────── */

/**
 * Publie une soumission VALIDÉE au portfolio. REFUSE si la soumission n'appartient
 * pas à l'utilisateur courant ou si son statut n'est pas APPROVED. L'item est
 * UPSERTé sur `submissionId` (unique → idempotent) : re-publier ne duplique pas.
 * Compétences = noms DISTINCTS des compétences de la FORMATION liée au projet.
 */
export async function publishProjectToPortfolio(submissionId: string): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(submissionId);
  if (!idParsed.success) return { ok: false, error: "Soumission invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const submission = await prisma.submission.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      userId: true,
      status: true,
      isPublic: true,
      content: true,
      links: true,
      files: true,
      project: {
        select: {
          title: true,
          course: { select: { skills: { select: { skill: { select: { name: true } } } } } },
          // Projet transversal de parcours (sans formation) : compétences dérivées
          // des formations qui composent le parcours (§13.8).
          careerPath: {
            select: {
              courses: { select: { course: { select: { skills: { select: { skill: { select: { name: true } } } } } } } },
            },
          },
        },
      },
    },
  });
  if (!submission) return { ok: false, error: "Soumission introuvable." };
  // Sécurité niveau ligne : on ne publie QUE ses propres projets.
  if (submission.userId !== user.id) return { ok: false, error: "Vous ne pouvez publier que vos propres projets." };
  if (submission.status !== "APPROVED") {
    return { ok: false, error: "Seul un projet validé peut être publié à votre portfolio." };
  }

  const ensured = await ensurePortfolio();
  if (!ensured.ok) return { ok: false, error: ensured.error };
  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!portfolio) return { ok: false, error: "Portfolio introuvable." };

  const skills = [
    ...new Set(
      submission.project.course
        ? submission.project.course.skills.map((s) => s.skill.name)
        : (submission.project.careerPath?.courses ?? []).flatMap((c) => c.course.skills.map((s) => s.skill.name)),
    ),
  ];
  const maxOrder = await prisma.portfolioItem.aggregate({
    where: { portfolioId: portfolio.id },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  await prisma.$transaction([
    prisma.portfolioItem.upsert({
      where: { submissionId: submission.id },
      create: {
        portfolioId: portfolio.id,
        type: "PROJECT",
        title: submission.project.title,
        description: submission.content,
        url: firstLink(submission.links),
        image: firstImage(submission.files),
        skills,
        order: nextOrder,
        submissionId: submission.id,
      },
      update: {
        // Re-synchronise l'item avec la dernière version approuvée (idempotent).
        title: submission.project.title,
        description: submission.content,
        url: firstLink(submission.links),
        image: firstImage(submission.files),
        skills,
      },
    }),
    prisma.submission.update({
      where: { id: submission.id },
      data: { isPublic: true, publishedAt: new Date() },
    }),
  ]);

  // Notifier UNE seule fois — pas à chaque re-publication (évite le spam).
  if (!submission.isPublic) {
    await createNotification({
      userId: user.id,
      type: "PROJECT",
      title: "Projet publié à votre portfolio 🎯",
      message: `« ${submission.project.title} » est désormais visible dans votre portfolio public.`,
      link: "/espace/portfolio",
    });
  }

  revalidatePath("/espace/portfolio");
  revalidatePath("/espace/projets");
  revalidatePath(`/portfolio/${ensured.slug}`);
  return { ok: true, message: "Projet publié à votre portfolio." };
}

/** Retire un projet publié : supprime l'item lié + repasse la soumission en privé. */
export async function unpublishProjectFromPortfolio(submissionId: string): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(submissionId);
  if (!idParsed.success) return { ok: false, error: "Soumission invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const submission = await prisma.submission.findUnique({
    where: { id: idParsed.data },
    select: { id: true, userId: true },
  });
  if (!submission) return { ok: false, error: "Soumission introuvable." };
  if (submission.userId !== user.id) return { ok: false, error: "Action non autorisée." };

  await prisma.$transaction([
    prisma.portfolioItem.deleteMany({ where: { submissionId: submission.id } }),
    prisma.submission.update({ where: { id: submission.id }, data: { isPublic: false, publishedAt: null } }),
  ]);

  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { slug: true } });
  revalidatePath("/espace/portfolio");
  revalidatePath("/espace/projets");
  if (portfolio) revalidatePath(`/portfolio/${portfolio.slug}`);
  return { ok: true, message: "Projet retiré de votre portfolio." };
}

/* ─── Items manuels (expériences & liens externes) ─────────────────────────── */

const manualItemSchema = z.object({
  type: z.enum(["EXPERIENCE", "LINK"]),
  title: z.string().trim().min(2, "Le titre est requis.").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  url: httpUrl("Lien invalide (http(s) uniquement).").optional().or(z.literal("")),
  image: httpUrl("Image invalide.").optional().or(z.literal("")),
  skills: z.array(z.string().trim().max(60)).max(40).optional(),
});

export async function addPortfolioItem(input: z.infer<typeof manualItemSchema>): Promise<ActionResult> {
  const parsed = manualItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const ensured = await ensurePortfolio();
  if (!ensured.ok) return { ok: false, error: ensured.error };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };
  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!portfolio) return { ok: false, error: "Portfolio introuvable." };

  const d = parsed.data;
  const maxOrder = await prisma.portfolioItem.aggregate({ where: { portfolioId: portfolio.id }, _max: { order: true } });

  await prisma.portfolioItem.create({
    data: {
      portfolioId: portfolio.id,
      type: d.type,
      title: d.title,
      description: d.description ? d.description : null,
      url: d.url ? d.url : null,
      image: d.image ? d.image : null,
      skills: cleanStringList(d.skills),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${ensured.slug}`);
  return { ok: true, message: "Élément ajouté." };
}

const updateItemSchema = z.object({
  title: z.string().trim().min(2, "Le titre est requis.").max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  url: httpUrl("Lien invalide (http(s) uniquement).").optional().or(z.literal("")),
  image: httpUrl("Image invalide.").optional().or(z.literal("")),
  skills: z.array(z.string().trim().max(60)).max(40).optional(),
});

/**
 * Met à jour un item MANUEL (EXPERIENCE|LINK) du portfolio de l'utilisateur.
 * REFUSE un item de type PROJECT (géré par publish/unpublish) et tout item qui
 * n'appartient pas au portfolio de l'utilisateur courant.
 */
export async function updatePortfolioItem(
  itemId: string,
  input: z.infer<typeof updateItemSchema>,
): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(itemId);
  const parsed = updateItemSchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "Élément invalide." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const item = await prisma.portfolioItem.findUnique({
    where: { id: idParsed.data },
    select: { id: true, type: true, portfolio: { select: { userId: true, slug: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) return { ok: false, error: "Élément introuvable." };
  if (item.type === "PROJECT") {
    return { ok: false, error: "Un projet publié se gère depuis vos projets (retrait/publication)." };
  }

  const d = parsed.data;
  await prisma.portfolioItem.update({
    where: { id: item.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.url !== undefined ? { url: d.url || null } : {}),
      ...(d.image !== undefined ? { image: d.image || null } : {}),
      ...(d.skills !== undefined ? { skills: cleanStringList(d.skills) } : {}),
    },
  });

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${item.portfolio.slug}`);
  return { ok: true, message: "Élément mis à jour." };
}

/** Supprime un item MANUEL (jamais un PROJECT) du portfolio de l'utilisateur. */
export async function deletePortfolioItem(itemId: string): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(itemId);
  if (!idParsed.success) return { ok: false, error: "Élément invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const item = await prisma.portfolioItem.findUnique({
    where: { id: idParsed.data },
    select: { id: true, type: true, submissionId: true, portfolio: { select: { userId: true, slug: true } } },
  });
  if (!item || item.portfolio.userId !== user.id) return { ok: false, error: "Élément introuvable." };
  // Un projet ENCORE lié à sa soumission se retire via « dépublier ». Un item
  // PROJECT orphelin (soumission supprimée → submissionId null) reste supprimable.
  if (item.type === "PROJECT" && item.submissionId) {
    return { ok: false, error: "Un projet publié se retire depuis vos projets." };
  }

  await prisma.portfolioItem.delete({ where: { id: item.id } });

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${item.portfolio.slug}`);
  return { ok: true, message: "Élément supprimé." };
}

/** Réordonne les items du portfolio (uniquement ceux appartenant à l'utilisateur). */
export async function reorderPortfolioItems(ids: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().min(1)).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Ordre invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };
  const portfolio = await prisma.portfolio.findUnique({ where: { userId: user.id }, select: { id: true, slug: true } });
  if (!portfolio) return { ok: false, error: "Portfolio introuvable." };

  // On ne réordonne QUE les items du portfolio de l'utilisateur (filtre par portfolioId).
  const owned = await prisma.portfolioItem.findMany({
    where: { portfolioId: portfolio.id, id: { in: parsed.data } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((i) => i.id));

  await prisma.$transaction(
    parsed.data
      .filter((id) => ownedIds.has(id))
      .map((id, index) =>
        prisma.portfolioItem.update({ where: { id }, data: { order: index } }),
      ),
  );

  revalidatePath("/espace/portfolio");
  revalidatePath(`/portfolio/${portfolio.slug}`);
  return { ok: true, message: "Ordre mis à jour." };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser, hasRole } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions — Administration Academy (S12).
   Directement appelables → requireAdmin() + validation Zod sur CHAQUE action.
   ══════════════════════════════════════════════════════════════════════════ */

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const user = await currentUser();
  if (!user || !hasRole(user, "ADMIN", "SUPER_ADMIN")) {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return user;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "categorie";
  let slug = root;
  let i = 2;
  // Boucle bornée : au pire on suffixe jusqu'à trouver un libre.
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i++}`;
  }
}

/* ══════════════════════════════ Catégories ══════════════════════════════ */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  // `icon` peut être un emoji/texte court OU une URL Vercel Blob (longue).
  icon: z.string().trim().max(600).optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale invalide (#RRGGBB)")
    .optional()
    .or(z.literal("")),
});

export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { name, description, icon, color } = parsed.data;

  const slug = await uniqueCategorySlug(name);
  await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
      icon: icon || null,
      color: color || null,
    },
  });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { name, description, icon, color } = parsed.data;

  const current = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  if (!current) return { ok: false, error: "Catégorie introuvable" };

  const slug = await uniqueCategorySlug(name, id);
  await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      icon: icon || null,
      color: color || null,
    },
  });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const cat = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { courses: true } } },
  });
  if (!cat) return { ok: false, error: "Catégorie introuvable" };
  if (cat._count.courses > 0) {
    return {
      ok: false,
      error: `Impossible de supprimer : ${cat._count.courses} cours rattaché(s). Déplacez-les d'abord.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { ok: true };
}

/* ══════════════════════════════ Utilisateurs ════════════════════════════ */

const ROLES = ["LEARNER", "CLIENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const;

const rolesSchema = z.object({
  roles: z.array(z.enum(ROLES)).min(1, "Au moins un rôle requis"),
});

export async function updateUserRoles(userId: string, input: unknown): Promise<ActionResult> {
  const actor = await requireAdmin();
  const parsed = rolesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Rôles invalides" };
  const roles = parsed.data.roles;

  const actorIsSuper = hasRole(actor, "SUPER_ADMIN");

  // Seul un SUPER_ADMIN peut accorder/retirer le rôle SUPER_ADMIN.
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!target) return { ok: false, error: "Utilisateur introuvable" };

  const grantsSuper = roles.includes("SUPER_ADMIN");
  const targetWasSuper = target.roles.includes("SUPER_ADMIN");
  if ((grantsSuper !== targetWasSuper) && !actorIsSuper) {
    return { ok: false, error: "Seul un Super Admin peut modifier le rôle Super Admin." };
  }

  // Garde-fou anti-verrouillage : on ne peut pas retirer son propre accès admin.
  if (userId === actor.id && !roles.includes("ADMIN") && !roles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "Vous ne pouvez pas retirer votre propre accès administrateur." };
  }

  await prisma.user.update({ where: { id: userId }, data: { roles } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const actor = await requireAdmin();
  if (userId === actor.id && !active) {
    return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { ok: false, error: "Utilisateur introuvable" };
  await prisma.user.update({ where: { id: userId }, data: { isActive: active } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Suppression d'un compte — soft delete (deletedAt, rétention 30 j). Garde-fous :
 * pas soi-même, seul un SUPER_ADMIN peut supprimer un admin, jamais le dernier
 * Super Admin. Le compte disparaît des listes et ne peut plus se connecter
 * (authorize filtre deletedAt ; Google refuse un compte supprimé).
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  if (userId === actor.id) {
    return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true, deletedAt: true },
  });
  if (!target || target.deletedAt) return { ok: false, error: "Utilisateur introuvable." };

  const targetIsAdmin = target.roles.includes("ADMIN") || target.roles.includes("SUPER_ADMIN");
  if (targetIsAdmin && !hasRole(actor, "SUPER_ADMIN")) {
    return { ok: false, error: "Seul un Super Admin peut supprimer un compte administrateur." };
  }
  if (target.roles.includes("SUPER_ADMIN")) {
    const supers = await prisma.user.count({
      where: { roles: { has: "SUPER_ADMIN" }, deletedAt: null },
    });
    if (supers <= 1) return { ok: false, error: "Impossible de supprimer le dernier Super Admin." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ══════════════════════════════ Abonnements ═════════════════════════════ */

export async function setSubscriptionStatus(
  id: string,
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE",
): Promise<ActionResult> {
  await requireAdmin();
  const sub = await prisma.subscription.findUnique({ where: { id }, select: { id: true } });
  if (!sub) return { ok: false, error: "Abonnement introuvable" };
  await prisma.subscription.update({
    where: { id },
    data: { status, autoRenew: status === "CANCELLED" ? false : undefined },
  });
  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

/* ══════════════════════════════ Codes promo ═════════════════════════════ */

const promoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code trop court")
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().int().min(1, "Valeur invalide"),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  expiresAt: z.string().trim().optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

export async function createPromoCode(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { code, discountType, discountValue, maxUses, expiresAt, active } = parsed.data;

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    return { ok: false, error: "Un pourcentage ne peut pas dépasser 100." };
  }

  const normalized = code.toUpperCase();
  const existing = await prisma.promoCode.findUnique({ where: { code: normalized }, select: { id: true } });
  if (existing) return { ok: false, error: "Ce code existe déjà." };

  await prisma.promoCode.create({
    data: {
      code: normalized,
      discountType,
      discountValue,
      maxUses: maxUses ?? null,
      active: active ?? true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

export async function updatePromoCode(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { code, discountType, discountValue, maxUses, expiresAt, active } = parsed.data;

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    return { ok: false, error: "Un pourcentage ne peut pas dépasser 100." };
  }

  const current = await prisma.promoCode.findUnique({ where: { id }, select: { id: true } });
  if (!current) return { ok: false, error: "Code introuvable" };

  const normalized = code.toUpperCase();
  const clash = await prisma.promoCode.findUnique({ where: { code: normalized }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: "Ce code existe déjà." };

  await prisma.promoCode.update({
    where: { id },
    data: {
      code: normalized,
      discountType,
      discountValue,
      maxUses: maxUses ?? null,
      active: active ?? true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

export async function togglePromoCode(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  const current = await prisma.promoCode.findUnique({ where: { id }, select: { id: true } });
  if (!current) return { ok: false, error: "Code introuvable" };
  await prisma.promoCode.update({ where: { id }, data: { active } });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

export async function deletePromoCode(id: string): Promise<ActionResult> {
  await requireAdmin();
  const promo = await prisma.promoCode.findUnique({
    where: { id },
    select: { _count: { select: { payments: true } } },
  });
  if (!promo) return { ok: false, error: "Code introuvable" };
  if (promo._count.payments > 0) {
    return {
      ok: false,
      error: "Ce code a déjà servi à des paiements — désactivez-le plutôt que de le supprimer.",
    };
  }
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

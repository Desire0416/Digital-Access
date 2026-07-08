"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { realUser } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Mutations du back-office admin. CHAQUE action revérifie que le VRAI utilisateur
   (realUser — jamais l'identité impersonée) possède un rôle d'administration.
   Aucune élévation de privilège possible depuis le client.
   ══════════════════════════════════════════════════════════════════════════ */

export type AdminResult = { ok: true; [k: string]: unknown } | { ok: false; error: string };

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];
const STRICT_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const CONTENT_STATUS = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const ALL_ROLES = ["LEARNER", "CLIENT", "INSTRUCTOR", "MENTOR", "REVIEWER", "COMPANY", "ACADEMIC_MANAGER", "ADMIN", "SUPER_ADMIN"];

/** Gestion de contenu : admins ET responsables pédagogiques. */
async function requireAdminUser() {
  const me = await realUser();
  if (!me) return null;
  return me.roles.some((r) => ADMIN_ROLES.includes(r)) ? me : null;
}

/** Gestion des comptes/rôles : ADMIN ou SUPER_ADMIN uniquement (jamais ACADEMIC_MANAGER). */
async function requireStrictAdmin() {
  const me = await realUser();
  if (!me) return null;
  return me.roles.some((r) => STRICT_ADMIN_ROLES.includes(r)) ? me : null;
}

function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

function str(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/* ─── Écoles ────────────────────────────────────────────────────────────────── */

export async function createSchool(input: { name?: unknown; shortDescription?: unknown; icon?: unknown; color?: unknown }): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  const name = str(input.name, 120);
  const shortDescription = str(input.shortDescription, 300);
  if (name.length < 2) return { ok: false, error: "Le nom de l'école est requis." };
  if (!shortDescription) return { ok: false, error: "Une description courte est requise." };
  try {
    let slug = slugify(name) || "ecole";
    if (await prisma.school.findUnique({ where: { slug }, select: { id: true } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const last = await prisma.school.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const school = await prisma.school.create({
      data: {
        name, slug, shortDescription,
        icon: str(input.icon, 40) || "graduation-cap",
        color: str(input.color, 20) || "#5B3FA8",
        order: (last?.order ?? 0) + 1, status: "PUBLISHED",
      },
      select: { id: true },
    });
    revalidatePath("/admin/ecoles");
    return { ok: true, id: school.id };
  } catch (e) {
    console.error("[admin] createSchool:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function updateSchool(id: string, input: { name?: unknown; shortDescription?: unknown; longDescription?: unknown; icon?: unknown; color?: unknown; image?: unknown; order?: unknown }): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  const name = str(input.name, 120);
  if (name.length < 2) return { ok: false, error: "Le nom de l'école est requis." };
  try {
    await prisma.school.update({
      where: { id },
      data: {
        name,
        shortDescription: str(input.shortDescription, 300),
        longDescription: input.longDescription ? str(input.longDescription, 4000) : null,
        icon: str(input.icon, 40) || null,
        color: str(input.color, 20) || null,
        image: input.image ? str(input.image, 500) : null,
        order: Number.isFinite(Number(input.order)) ? Math.max(0, Math.round(Number(input.order))) : undefined,
      },
    });
    revalidatePath("/admin/ecoles");
    revalidatePath("/schools");
    return { ok: true };
  } catch (e) {
    console.error("[admin] updateSchool:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function setSchoolStatus(id: string, status: string): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  if (!CONTENT_STATUS.includes(status)) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.school.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/admin/ecoles");
    revalidatePath("/schools");
    return { ok: true };
  } catch (e) {
    console.error("[admin] setSchoolStatus:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─── Parcours & formations ──────────────────────────────────────────────────── */

export async function updateCareerPath(id: string, input: { title?: unknown; targetJob?: unknown; shortDescription?: unknown; schoolId?: unknown; level?: unknown; price?: unknown; duration?: unknown; featured?: unknown }): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  const title = str(input.title, 160);
  if (title.length < 3) return { ok: false, error: "Le titre est requis." };
  const level = str(input.level, 20);
  try {
    await prisma.careerPath.update({
      where: { id },
      data: {
        title,
        targetJob: str(input.targetJob, 200),
        shortDescription: str(input.shortDescription, 300),
        ...(input.schoolId ? { schoolId: str(input.schoolId, 40) } : {}),
        ...(LEVELS.includes(level) ? { level: level as never } : {}),
        price: Math.max(0, Math.round(Number(input.price) || 0)),
        duration: input.duration ? str(input.duration, 60) : null,
        featured: Boolean(input.featured),
      },
    });
    revalidatePath("/admin/parcours");
    revalidatePath("/career-paths");
    return { ok: true };
  } catch (e) {
    console.error("[admin] updateCareerPath:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function setCareerPathStatus(id: string, status: string): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  if (!CONTENT_STATUS.includes(status)) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.careerPath.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/admin/parcours");
    revalidatePath("/career-paths");
    return { ok: true };
  } catch (e) {
    console.error("[admin] setCareerPathStatus:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function updateShortCourse(id: string, input: { title?: unknown; shortDescription?: unknown; schoolId?: unknown; level?: unknown; price?: unknown; duration?: unknown; courseType?: unknown; featured?: unknown }): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  const title = str(input.title, 160);
  if (title.length < 3) return { ok: false, error: "Le titre est requis." };
  const level = str(input.level, 20);
  try {
    await prisma.shortCourse.update({
      where: { id },
      data: {
        title,
        shortDescription: str(input.shortDescription, 300),
        ...(input.schoolId ? { schoolId: str(input.schoolId, 40) } : {}),
        ...(LEVELS.includes(level) ? { level: level as never } : {}),
        price: Math.max(0, Math.round(Number(input.price) || 0)),
        duration: input.duration ? str(input.duration, 60) : null,
        courseType: input.courseType ? str(input.courseType, 60) : null,
        featured: Boolean(input.featured),
      },
    });
    revalidatePath("/admin/formations");
    revalidatePath("/short-courses");
    return { ok: true };
  } catch (e) {
    console.error("[admin] updateShortCourse:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function setShortCourseStatus(id: string, status: string): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  if (!CONTENT_STATUS.includes(status)) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.shortCourse.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/admin/formations");
    revalidatePath("/short-courses");
    return { ok: true };
  } catch (e) {
    console.error("[admin] setShortCourseStatus:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─── Utilisateurs & rôles ───────────────────────────────────────────────────── */

export async function setUserRoles(userId: string, roles: string[]): Promise<AdminResult> {
  const me = await requireStrictAdmin();
  if (!me) return { ok: false, error: "Réservé aux administrateurs (rôle admin requis)." };
  // On ne modifie jamais ses propres rôles (anti-verrouillage / anti-abus).
  if (userId === me.id) return { ok: false, error: "Vous ne pouvez pas modifier vos propres rôles." };
  const clean = [...new Set((roles ?? []).filter((r) => ALL_ROLES.includes(r)))];
  if (clean.length === 0) clean.push("LEARNER");
  // Hiérarchie stricte : seul un SUPER_ADMIN gère les rôles d'administration
  // (ADMIN/SUPER_ADMIN) — un simple ADMIN ne peut ni les accorder ni toucher un
  // compte qui en possède (anti-élévation & anti-rétrogradation entre admins).
  const isSuper = me.roles.includes("SUPER_ADMIN");
  const grantsAdminTier = clean.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r));
  if (!isSuper && grantsAdminTier) {
    return { ok: false, error: "Seul un super administrateur peut accorder un rôle d'administration." };
  }
  try {
    if (!isSuper) {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
      if (target?.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r))) {
        return { ok: false, error: "Seul un super administrateur peut modifier un compte d'administration." };
      }
    }
    await prisma.user.update({ where: { id: userId }, data: { roles: clean as never } });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch (e) {
    console.error("[admin] setUserRoles:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function toggleUserActive(userId: string, active: boolean): Promise<AdminResult> {
  const me = await requireStrictAdmin();
  if (!me) return { ok: false, error: "Réservé aux administrateurs (rôle admin requis)." };
  if (userId === me.id) return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
  try {
    // Un compte d'administration (ADMIN/SUPER_ADMIN) ne peut être (dés)activé que par un super-admin.
    if (!me.roles.includes("SUPER_ADMIN")) {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
      if (target?.roles.some((r) => ["ADMIN", "SUPER_ADMIN"].includes(r))) {
        return { ok: false, error: "Seul un super administrateur peut modifier un compte d'administration." };
      }
    }
    await prisma.user.update({ where: { id: userId }, data: { isActive: Boolean(active) } });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch (e) {
    console.error("[admin] toggleUserActive:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─── Certificats ────────────────────────────────────────────────────────────── */

export async function setCertificateStatus(id: string, status: string): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  if (!["ACTIVE", "REVOKED", "SUSPENDED"].includes(status)) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.certificate.update({ where: { id }, data: { status: status as never } });
    revalidatePath("/admin/certificats");
    return { ok: true };
  } catch (e) {
    console.error("[admin] setCertificateStatus:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─── Coupons ────────────────────────────────────────────────────────────────── */

export async function createCoupon(input: { code?: unknown; discountType?: unknown; discountValue?: unknown; maxUses?: unknown; expiresAt?: unknown }): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  const code = str(input.code, 40).toUpperCase().replace(/\s+/g, "");
  if (code.length < 3) return { ok: false, error: "Le code doit contenir au moins 3 caractères." };
  const discountType = str(input.discountType, 20) === "FIXED" ? "FIXED" : "PERCENTAGE";
  let discountValue = Math.max(1, Math.round(Number(input.discountValue) || 0));
  if (discountType === "PERCENTAGE") discountValue = Math.min(100, discountValue);
  try {
    if (await prisma.coupon.findUnique({ where: { code }, select: { id: true } })) return { ok: false, error: "Ce code existe déjà." };
    const maxUses = Number.isFinite(Number(input.maxUses)) && Number(input.maxUses) > 0 ? Math.round(Number(input.maxUses)) : null;
    const expiresAt = input.expiresAt ? new Date(String(input.expiresAt)) : null;
    await prisma.coupon.create({
      data: { code, discountType: discountType as never, discountValue, maxUses, expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null, active: true },
    });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    console.error("[admin] createCoupon:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function toggleCoupon(id: string, active: boolean): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  try {
    await prisma.coupon.update({ where: { id }, data: { active: Boolean(active) } });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    console.error("[admin] toggleCoupon:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function deleteCoupon(id: string): Promise<AdminResult> {
  const me = await requireAdminUser();
  if (!me) return { ok: false, error: "Accès réservé aux administrateurs." };
  try {
    // Un coupon déjà utilisé est conservé (traçabilité des paiements) — on le désactive plutôt.
    const coupon = await prisma.coupon.findUnique({ where: { id }, select: { currentUses: true } });
    if (coupon && coupon.currentUses > 0) {
      return { ok: false, error: "Ce coupon a déjà été utilisé — désactivez-le plutôt que de le supprimer." };
    }
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    console.error("[admin] deleteCoupon:", e);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

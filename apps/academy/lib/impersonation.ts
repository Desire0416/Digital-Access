"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@da/db/client";
import { realUser, IMPERSONATION_COOKIE } from "@da/auth/guards";
import { landingForUser } from "./roles";

/* ══════════════════════════════════════════════════════════════════════════
   Impersonation admin — deux modes :
   · « Se connecter en tant que » un utilisateur précis (userId).
   · « Voir la plateforme en tant que » un rôle donné (role:<ROLE>).
   Le cookie n'est honoré côté serveur que si le VRAI utilisateur est admin
   (voir currentUser dans @da/auth/guards) — un cookie forgé reste inerte.
   ══════════════════════════════════════════════════════════════════════════ */

const PREVIEW_ROLES = ["LEARNER", "INSTRUCTOR", "REVIEWER"] as const;
type PreviewRole = (typeof PREVIEW_ROLES)[number];

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 2, // 2 h
};

async function requireAdmin() {
  const me = await realUser();
  if (!me) return null;
  if (!(me.roles.includes("ADMIN") || me.roles.includes("SUPER_ADMIN"))) return null;
  return me;
}

/** Prend l'identité d'un utilisateur précis puis ouvre son espace. */
export async function startImpersonation(userId: string) {
  const me = await requireAdmin();
  if (!me) return;
  if (!userId || userId === me.id) return;
  // Anti-élévation : on ne prend jamais l'identité d'un compte de rang admin
  // (sauf un SUPER_ADMIN pour un ADMIN/ACADEMIC_MANAGER) ; jamais un SUPER_ADMIN.
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!target) return;
  if (target.roles.includes("SUPER_ADMIN")) return;
  const targetIsAdminTier = target.roles.some((r) => ["ADMIN", "ACADEMIC_MANAGER"].includes(r));
  if (targetIsAdminTier && !me.roles.includes("SUPER_ADMIN")) return;
  (await cookies()).set(IMPERSONATION_COOKIE, userId, COOKIE_OPTS);
  redirect("/dashboard");
}

/** Prévisualise la plateforme avec un rôle donné (même identité). */
export async function viewAsRole(role: string) {
  const me = await requireAdmin();
  if (!me) return;
  if (!PREVIEW_ROLES.includes(role as PreviewRole)) return;
  (await cookies()).set(IMPERSONATION_COOKIE, `role:${role}`, COOKIE_OPTS);
  redirect(landingForUser({ roles: [role] }));
}

/** Revient au compte administrateur réel. */
export async function stopImpersonation() {
  (await cookies()).delete(IMPERSONATION_COOKIE);
  redirect("/admin");
}

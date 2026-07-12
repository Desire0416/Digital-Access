import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma, type Role } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Gardes serveur — contrôle d'accès par rôle (cahier §7 / §46).
   `currentUser` lit la session JWT ; les gardes redirigent proprement.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  roles: Role[];
  emailVerified: Date | null;
}

/** Utilisateur courant (ou null). Ne touche la base que pour rafraîchir les rôles. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const su = session?.user as unknown as
    | { id?: string; name?: string; email?: string; roles?: Role[]; emailVerified?: string | Date | null }
    | undefined;
  if (!su?.id || !su.email) return null;
  return {
    id: su.id,
    name: su.name ?? su.email,
    email: su.email,
    avatar: (session?.user?.image as string | undefined) ?? null,
    roles: (su.roles ?? ["LEARNER"]) as Role[],
    emailVerified: su.emailVerified ? new Date(su.emailVerified) : null,
  };
}

/** Version « fraîche » depuis la base (pour les mutations sensibles). */
export async function currentUserFresh(): Promise<SessionUser | null> {
  const s = await currentUser();
  if (!s) return null;
  const db = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, email: true, avatar: true, roles: true, emailVerified: true, isActive: true },
  });
  if (!db) return null;
  if (db.emailVerified && !db.isActive) return null; // désactivé
  return { id: db.id, name: db.name, email: db.email, avatar: db.avatar, roles: db.roles, emailVerified: db.emailVerified };
}

export async function requireUser(callbackUrl?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/connexion${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  return user;
}

const ADMIN_ROLES: Role[] = ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];

export function isAdmin(user: { roles: Role[] } | null): boolean {
  return !!user && user.roles.some((r) => ADMIN_ROLES.includes(r));
}

export function hasRole(user: { roles: Role[] } | null, roles: Role[]): boolean {
  return !!user && user.roles.some((r) => roles.includes(r));
}

/** Garde de layout : exige l'un des rôles, sinon redirection. */
export async function requireRole(roles: Role[], callbackUrl?: string): Promise<SessionUser> {
  const user = await requireUser(callbackUrl);
  if (!hasRole(user, roles) && !user.roles.includes("SUPER_ADMIN")) redirect("/espace");
  return user;
}

/** Pour les MUTATIONS admin : revérifie les rôles EN BASE (jamais le seul JWT). */
export async function requireAdminFresh(): Promise<SessionUser | null> {
  const user = await currentUserFresh();
  if (!user || !isAdmin(user)) return null;
  return user;
}

/**
 * Éditeur d'une formation : administrateur OU formateur ASSIGNÉ à cette formation
 * (jonction CourseInstructor). Relit la base (rôles frais). Utilisé par les
 * mutations de contenu pour autoriser l'édition scopée à la propriété (§29.2).
 */
export async function requireCourseEditor(courseId: string): Promise<SessionUser | null> {
  const user = await currentUserFresh();
  if (!user) return null;
  if (isAdmin(user)) return user;
  const link = await prisma.courseInstructor.findFirst({
    where: { courseId, userId: user.id },
    select: { id: true },
  });
  return link ? user : null;
}

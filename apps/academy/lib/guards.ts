import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma, type Role } from "@da/academy-db/client";
import { readActAs } from "./impersonation";

/* ══════════════════════════════════════════════════════════════════════════
   Gardes serveur — contrôle d'accès par rôle (cahier §7 / §46).
   `currentUser` lit la session JWT ; les gardes redirigent proprement.
   « Agir en tant que » (§12) : un SUPER_ADMIN peut, via un cookie SIGNÉ,
   soit agir en tant qu'un utilisateur, soit prévisualiser un rôle. L'override
   n'est appliqué QUE dans currentUser() et QUE si la vraie session est
   SUPER_ADMIN — les actions de mutation utilisent realUser()/currentUserFresh()
   et restent donc protégées.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  roles: Role[];
  emailVerified: Date | null;
}

/** VRAI utilisateur de la session JWT (jamais impersonné). Base de toute la sécurité. */
export async function realUser(): Promise<SessionUser | null> {
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

/** Utilisateur AGISSANT (peut être un compte impersonné / un rôle prévisualisé). */
export async function currentUser(): Promise<SessionUser | null> {
  const real = await realUser();
  if (!real) return null;
  // « Agir en tant que » : réservé au SUPER_ADMIN, cookie émis pour LUI (by===id).
  if (real.roles.includes("SUPER_ADMIN")) {
    const actAs = await readActAs();
    if (actAs && actAs.by === real.id) {
      if (actAs.k === "role") {
        return { ...real, roles: [actAs.role] };
      }
      if (actAs.k === "user" && actAs.sub !== real.id) {
        const t = await prisma.user.findUnique({
          where: { id: actAs.sub },
          select: { id: true, name: true, email: true, avatar: true, roles: true, emailVerified: true, deletedAt: true },
        });
        if (t && !t.deletedAt) {
          return { id: t.id, name: t.name, email: t.email, avatar: t.avatar, roles: t.roles, emailVerified: t.emailVerified };
        }
      }
    }
  }
  return real;
}

export interface ImpersonationState {
  real: { id: string; name: string; email: string };
  mode: "user" | "role";
  targetName?: string;
  targetEmail?: string;
  role?: Role;
}

/** État « agir en tant que » pour le bandeau (null si inactif). */
export async function getImpersonation(): Promise<ImpersonationState | null> {
  const real = await realUser();
  if (!real || !real.roles.includes("SUPER_ADMIN")) return null;
  const actAs = await readActAs();
  if (!actAs || actAs.by !== real.id) return null;
  const base = { real: { id: real.id, name: real.name, email: real.email } };
  if (actAs.k === "role") return { ...base, mode: "role", role: actAs.role };
  if (actAs.sub === real.id) return null;
  const t = await prisma.user.findUnique({ where: { id: actAs.sub }, select: { name: true, email: true, deletedAt: true } });
  if (!t || t.deletedAt) return null;
  return { ...base, mode: "user", targetName: t.name, targetEmail: t.email };
}

/** Version « fraîche » depuis la base (pour les mutations sensibles). */
export async function currentUserFresh(): Promise<SessionUser | null> {
  const s = await currentUser();
  if (!s) return null;
  const db = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, email: true, avatar: true, roles: true, emailVerified: true, isActive: true, deletedAt: true },
  });
  if (!db) return null;
  if (db.deletedAt) return null; // compte supprimé
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

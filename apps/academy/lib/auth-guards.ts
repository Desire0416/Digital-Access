import "server-only";
import { redirect } from "next/navigation";
import { currentUser, hasRole, type SessionUser } from "@da/auth/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Gardes de route de l'Academy (server-only). Redirections propres à l'app
   (/auth/login), pour ne rien coupler à @da/auth ni au web. À utiliser en tête
   des pages/segments protégés :  const user = await requireUser();
   ══════════════════════════════════════════════════════════════════════════ */

/** Exige une session. Sinon → login (avec retour vers la page demandée). */
export async function requireUser(callbackUrl?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) {
    redirect(callbackUrl ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/login");
  }
  return user;
}

/** Exige l'email confirmé (achats, dépôts de projets, forums…). Sinon → /auth/verify-email. */
export async function requireVerified(callbackUrl?: string): Promise<SessionUser> {
  const user = await requireUser(callbackUrl);
  if (!user.emailVerified) redirect("/auth/verify-email");
  return user;
}

/** Exige au moins un des rôles. Session absente → login ; rôle insuffisant → accueil. */
export async function requireRole(roles: string[], callbackUrl?: string): Promise<SessionUser> {
  const user = await requireUser(callbackUrl);
  if (!hasRole(user, ...roles)) redirect("/");
  return user;
}

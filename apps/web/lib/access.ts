import { currentUser, realUser, hasRole, type SessionUser } from "@da/auth/guards";
import { can, isStaff, isAdmin, type Permission } from "./permissions";

/**
 * Gardes serveur du back-office. Deux invariants hérités de l'existant :
 *
 *  1. LECTURES / affichage → `currentUser()` (tient compte de l'impersonation
 *     « voir en tant que », pour que l'admin puisse prévisualiser une vue).
 *  2. MUTATIONS → `realUser()` (le VRAI utilisateur) : une écriture ne doit
 *     JAMAIS être élevée ni restreinte par l'impersonation.
 *
 * Toutes ces gardes LÈVENT (throw) en cas de refus : à utiliser en tête de
 * query/action comme défense en profondeur (le layout /admin garde déjà la
 * route, mais chaque accès aux données re-vérifie). Les messages sont en FR.
 */

const DENIED = "Accès refusé — réservé à l'équipe interne.";
const NO_PERM = "Permission insuffisante pour cette action.";

/** Équipe interne (lecture). Renvoie l'utilisateur effectif. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await currentUser();
  if (!isStaff(user)) throw new Error(DENIED);
  return user!;
}

/** Équipe interne (mutation) — sur le VRAI utilisateur. */
export async function requireStaffMutation(): Promise<SessionUser> {
  const user = await realUser();
  if (!isStaff(user)) throw new Error(DENIED);
  return user!;
}

/** Administrateur (lecture). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!isAdmin(user)) throw new Error("Accès refusé — réservé à l'administration.");
  return user!;
}

/** Administrateur (mutation) — sur le VRAI utilisateur. */
export async function requireAdminMutation(): Promise<SessionUser> {
  const user = await realUser();
  if (!isAdmin(user)) throw new Error("Accès refusé — réservé à l'administration.");
  return user!;
}

/** Exige une permission précise (lecture). */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await currentUser();
  if (!can(user, permission)) throw new Error(NO_PERM);
  return user!;
}

/** Exige une permission précise (mutation) — sur le VRAI utilisateur. */
export async function requirePermissionMutation(permission: Permission): Promise<SessionUser> {
  const user = await realUser();
  if (!can(user, permission)) throw new Error(NO_PERM);
  return user!;
}

/**
 * Contexte d'accès CRM prêt pour le filtrage au niveau ligne :
 * `scopeAll` = l'utilisateur voit tout (admin) ; sinon on filtre par `userId`.
 */
export interface AccessScope {
  user: SessionUser;
  isAdmin: boolean;
  /** true = accès global (aucun filtre owner) ; false = limité à ses dossiers. */
  scopeAll: boolean;
}

/** Construit le scope de lecture pour un utilisateur staff. */
export async function staffScope(): Promise<AccessScope> {
  const user = await requireStaff();
  const admin = isAdmin(user);
  return { user, isAdmin: admin, scopeAll: admin };
}

export { can, isStaff, isAdmin, hasRole };
export type { SessionUser, Permission };

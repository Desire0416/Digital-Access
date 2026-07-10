/**
 * Système de permissions explicites du back-office Digital Access.
 *
 * Module PUR (aucun import serveur) : utilisable côté serveur (gardes) ET côté
 * client (filtrage de la sidebar). La sécurité réelle est TOUJOURS appliquée
 * côté serveur via lib/access.ts — ce catalogue ne fait que dériver les
 * permissions effectives à partir des rôles cumulés de l'utilisateur.
 *
 * Les permissions sont dérivées des rôles À LA REQUÊTE (pas stockées dans le
 * JWT) : retirer un droit d'un rôle prend effet immédiatement, sans re-login.
 */

/** Toutes les permissions du CRM commercial + administration. */
export type Permission =
  // Organisations & contacts
  | "org:create"
  | "org:read_all"
  | "org:read_assigned"
  | "org:update_all"
  | "org:update_assigned"
  | "org:archive"
  | "contact:manage"
  // Prospects sortants
  | "prospect:create"
  | "prospect:read_all"
  | "prospect:read_assigned"
  | "prospect:update_all"
  | "prospect:update_assigned"
  | "prospect:archive"
  | "prospect:assign"
  // Leads entrants
  | "lead:read_all"
  | "lead:read_assigned"
  | "lead:update"
  | "lead:assign"
  | "lead:convert"
  // Audits
  | "audit:create"
  | "audit:read_all"
  | "audit:read_assigned"
  | "audit:update_draft"
  | "audit:upload_document"
  | "audit:submit"
  | "audit:validate"
  | "audit:send"
  // Activités & tâches
  | "activity:create"
  | "activity:read"
  | "task:create"
  | "task:update"
  | "task:read_all"
  // Opportunités commerciales (Deal)
  | "deal:create"
  | "deal:read_all"
  | "deal:read_assigned"
  | "deal:update_all"
  | "deal:update_assigned"
  // Devis
  | "quote:prepare"
  | "quote:send"
  | "quote:validate"
  // Projets
  | "project:read_all"
  | "project:read_assigned"
  | "project:manage"
  // Conversion opportunité → projet
  | "conversion:request"
  | "conversion:validate"
  // Facturation
  | "invoice:manage"
  // Administration
  | "user:manage"
  | "role:manage"
  | "settings:manage"
  | "data:delete"
  | "content:manage" // blog, portfolio
  // Statistiques
  | "stats:read_global"
  | "stats:read_own";

/** Rôles considérés comme « équipe interne » (accès au back-office). */
export const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "COMMERCIAL", "CHEF_PROJET"] as const;

/** Rôles d'administration (accès total au CRM). */
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

/**
 * Permissions accordées par rôle (hors ADMIN/SUPER_ADMIN qui ont TOUT).
 * Un utilisateur cumule l'union des permissions de ses rôles.
 * Les permissions « *_assigned » impliquent un filtrage au niveau ligne
 * (le commercial n'agit que sur ses propres dossiers) — appliqué dans le
 * data layer, jamais garanti par la seule permission.
 */
const COMMERCIAL_PERMISSIONS: Permission[] = [
  "org:create",
  "org:read_assigned",
  "org:update_assigned",
  "org:archive",
  "contact:manage",
  "prospect:create",
  "prospect:read_assigned",
  "prospect:update_assigned",
  "prospect:archive",
  "lead:read_assigned",
  "lead:update",
  "audit:create",
  "audit:read_assigned",
  "audit:update_draft",
  "audit:upload_document",
  "audit:submit",
  "activity:create",
  "activity:read",
  "task:create",
  "task:update",
  "task:read_all",
  "deal:create",
  "deal:read_assigned",
  "deal:update_assigned",
  "quote:prepare",
  "project:read_assigned",
  "conversion:request",
  "stats:read_own",
];

const CHEF_PROJET_PERMISSIONS: Permission[] = [
  "org:read_assigned",
  "contact:manage",
  "project:read_assigned",
  "project:manage",
  "audit:read_assigned",
  "activity:create",
  "activity:read",
  "task:create",
  "task:update",
  "task:read_all",
  "stats:read_own",
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  COMMERCIAL: COMMERCIAL_PERMISSIONS,
  CHEF_PROJET: CHEF_PROJET_PERMISSIONS,
  // ADMIN / SUPER_ADMIN : gérés par ALL_PERMISSIONS (accès total).
};

/** L'ensemble complet des permissions (dérivé du type via ce catalogue). */
export const ALL_PERMISSIONS: Permission[] = [
  "org:create", "org:read_all", "org:read_assigned", "org:update_all", "org:update_assigned", "org:archive",
  "contact:manage",
  "prospect:create", "prospect:read_all", "prospect:read_assigned", "prospect:update_all", "prospect:update_assigned", "prospect:archive", "prospect:assign",
  "lead:read_all", "lead:read_assigned", "lead:update", "lead:assign", "lead:convert",
  "audit:create", "audit:read_all", "audit:read_assigned", "audit:update_draft", "audit:upload_document", "audit:submit", "audit:validate", "audit:send",
  "activity:create", "activity:read", "task:create", "task:update", "task:read_all",
  "deal:create", "deal:read_all", "deal:read_assigned", "deal:update_all", "deal:update_assigned",
  "quote:prepare", "quote:send", "quote:validate",
  "project:read_all", "project:read_assigned", "project:manage",
  "conversion:request", "conversion:validate",
  "invoice:manage",
  "user:manage", "role:manage", "settings:manage", "data:delete", "content:manage",
  "stats:read_global", "stats:read_own",
];

type UserLike = { roles: string[] } | null | undefined;

/** True si l'utilisateur possède au moins un des rôles. */
export function hasAnyRole(user: UserLike, ...roles: readonly string[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

/** True si l'utilisateur appartient à l'équipe interne (peut voir le back-office). */
export function isStaff(user: UserLike): boolean {
  return hasAnyRole(user, ...STAFF_ROLES);
}

/** True si l'utilisateur est administrateur (accès total). */
export function isAdmin(user: UserLike): boolean {
  return hasAnyRole(user, ...ADMIN_ROLES);
}

/** Ensemble des permissions effectives d'un utilisateur (union de ses rôles). */
export function permissionsFor(roles: string[] | undefined): Set<Permission> {
  const set = new Set<Permission>();
  if (!roles) return set;
  for (const role of roles) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      for (const p of ALL_PERMISSIONS) set.add(p);
      continue;
    }
    const list = ROLE_PERMISSIONS[role];
    if (list) for (const p of list) set.add(p);
  }
  return set;
}

/** True si l'utilisateur détient la permission demandée. */
export function can(user: UserLike, permission: Permission): boolean {
  if (!user) return false;
  return permissionsFor(user.roles).has(permission);
}

/** True s'il détient AU MOINS UNE des permissions listées. */
export function canAny(user: UserLike, ...permissions: Permission[]): boolean {
  if (!user) return false;
  const set = permissionsFor(user.roles);
  return permissions.some((p) => set.has(p));
}

/* ─── Libellés & aiguillage des rôles ───────────────────────────────────────── */

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  COMMERCIAL: "Commercial",
  CHEF_PROJET: "Chef de projet",
  CLIENT: "Client",
  ACADEMIC_MANAGER: "Responsable pédagogique",
  INSTRUCTOR: "Formateur",
  MENTOR: "Mentor",
  REVIEWER: "Évaluateur",
  COMPANY: "Entreprise",
  LEARNER: "Apprenant",
};

/** Priorité d'affichage (le rôle « principal » d'un compte multi-rôles). */
const ROLE_PRIORITY = [
  "SUPER_ADMIN",
  "ADMIN",
  "COMMERCIAL",
  "CHEF_PROJET",
  "ACADEMIC_MANAGER",
  "INSTRUCTOR",
  "MENTOR",
  "REVIEWER",
  "COMPANY",
  "CLIENT",
  "LEARNER",
];

export function primaryRole(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) return "LEARNER";
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return roles[0];
}

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

/**
 * Route d'atterrissage post-connexion selon le rôle principal.
 * ADMIN → dashboard admin ; COMMERCIAL → espace commercial ;
 * CHEF_PROJET → projets ; sinon → espace client.
 */
export function landingForUser(user: UserLike): string {
  if (!user) return "/auth/login";
  const r = user.roles;
  if (r.includes("SUPER_ADMIN") || r.includes("ADMIN")) return "/admin/dashboard";
  if (r.includes("COMMERCIAL")) return "/admin/commercial";
  if (r.includes("CHEF_PROJET")) return "/admin/commercial";
  return "/mon-espace";
}

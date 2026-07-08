/* ══════════════════════════════════════════════════════════════════════════
   Rôles & aiguillage — Digital Access Academy.
   Source unique de vérité pour : la priorité des rôles, les libellés FR, et la
   route d'atterrissage post-connexion. Les espaces par rôle (dashboard apprenant,
   studio formateur, back-office admin, espace entreprise…) arrivent aux phases
   suivantes ; tant qu'ils n'existent pas, on dirige vers le profil. L'ordre de
   priorité est explicite pour brancher chaque espace au fur et à mesure.
   ══════════════════════════════════════════════════════════════════════════ */

/** Les 9 rôles de la plateforme, du plus « puissant » au plus courant. */
export const ROLE_PRIORITY = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACADEMIC_MANAGER",
  "INSTRUCTOR",
  "REVIEWER",
  "MENTOR",
  "COMPANY",
  "CLIENT",
  "LEARNER",
] as const;

export type Role = (typeof ROLE_PRIORITY)[number];

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  ACADEMIC_MANAGER: "Responsable pédagogique",
  INSTRUCTOR: "Formateur",
  REVIEWER: "Correcteur",
  MENTOR: "Mentor",
  COMPANY: "Entreprise",
  CLIENT: "Client",
  LEARNER: "Apprenant",
};

/** Le rôle le plus prioritaire que possède l'utilisateur, sinon apprenant. */
export function primaryRole(roles: string[]): Role {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "LEARNER";
}

/**
 * Route d'atterrissage post-connexion selon le rôle effectif. À mesure que les
 * espaces par rôle sont livrés (phases 3+), il suffit de rendre leur `case`.
 */
export function landingForUser(user: { roles: string[] } | null): string {
  if (!user) return "/auth/login";
  switch (primaryRole(user.roles)) {
    // Branchements futurs (phases suivantes) :
    // case "SUPER_ADMIN":
    // case "ADMIN":
    // case "ACADEMIC_MANAGER":  return "/admin";
    // case "INSTRUCTOR":        return "/studio";
    // case "REVIEWER":          return "/reviews";
    // case "COMPANY":           return "/companies/espace";
    case "LEARNER":
      return "/dashboard";
    default:
      // Rôles internes (admin/formateur…) : leurs espaces arrivent plus tard ;
      // en attendant, l'espace apprenant leur sert de point d'entrée.
      return "/dashboard";
  }
}

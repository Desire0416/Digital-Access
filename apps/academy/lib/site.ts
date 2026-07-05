export const academyConfig = {
  name: "Access Academy",
  tagline: "Formations en ligne certifiantes & qualifiantes",
  description:
    "Access Academy est la plateforme e-learning de Digital Access : formations en ligne au développement web, au design, au marketing digital et à la bureautique — avec certificats vérifiables et paiement Mobile Money.",
  url: "https://academy.digitalaccess.ci",
  webUrl: "https://digitalaccess.ci",
  locale: "fr_CI",
  contact: {
    email: "contact@digitalaccess.ci",
    whatsapp: "2250700000000",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Navigation publique (VISITOR). */
export const visitorNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Catalogue", href: "/courses" },
  { label: "Tarifs", href: "/pricing" },
  { label: "À propos", href: "/about" },
];

/** Navigation apprenant (LEARNER connecté). */
export const learnerNav: NavItem[] = [
  { label: "Catalogue", href: "/courses" },
  { label: "Mes cours", href: "/dashboard" },
  { label: "Dashboard", href: "/dashboard" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Formations",
    items: [
      { label: "Catalogue complet", href: "/courses" },
      { label: "Développement Web", href: "/courses?category=developpement-web" },
      { label: "Design & UX/UI", href: "/courses?category=design-ux-ui" },
      { label: "Marketing Digital", href: "/courses?category=marketing-digital" },
      { label: "Bureautique", href: "/courses?category=bureautique" },
    ],
  },
  {
    title: "Academy",
    items: [
      { label: "Tarifs", href: "/pricing" },
      { label: "À propos", href: "/about" },
      { label: "Créer un compte", href: "/auth/register" },
      { label: "Se connecter", href: "/auth/login" },
    ],
  },
  {
    title: "Digital Access",
    items: [
      { label: "Site principal", href: "https://digitalaccess.ci" },
      { label: "Nos services", href: "https://digitalaccess.ci/services" },
      { label: "Contact", href: "https://digitalaccess.ci/contact" },
    ],
  },
];

const levelLabels: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export function levelLabel(level: string): string {
  return levelLabels[level] ?? level;
}

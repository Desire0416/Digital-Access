export const academyConfig = {
  name: "Digital Access Academy",
  tagline: "Apprenez un métier. Réalisez des projets. Construisez votre avenir.",
  description:
    "Digital Access Academy forme aux compétences pratiques du numérique, de l'IA, du marketing, du design, de la data et de l'entrepreneuriat à travers des parcours métiers, des projets concrets, des badges et des certificats vérifiables.",
  url: "https://academy.digitalaccess.ci",
  webUrl: "https://digitalaccess.ci",
  locale: "fr_CI",
  contact: {
    email: "contact@digitalaccess.ci",
    whatsapp: "2250564452692",
  },
} as const;

/**
 * Numéros Mobile Money de Digital Access pour le paiement manuel.
 * ⚠️ À remplacer par les vrais numéros marchands avant le lancement.
 */
export const paymentConfig = {
  operators: [
    {
      id: "ORANGE",
      name: "Orange Money",
      number: "+225 07 57 90 88 84",
      color: "#FF7900",
      instructions: "Composez #144# puis « Transfert d'argent »",
    },
    {
      id: "MTN",
      name: "MTN MoMo",
      number: "+225 05 64 45 26 92",
      color: "#FFCC00",
      instructions: "Composez *133# puis « Transfert d'argent »",
    },
    {
      id: "WAVE",
      name: "Wave",
      number: "+225 07 57 90 88 84",
      color: "#00C2F3",
      instructions: "Depuis l'application Wave, « Envoyer de l'argent »",
    },
  ],
  holderName: "DIGITAL ACCESS",
  /** délai annoncé de validation manuelle */
  reviewDelay: "sous 24 h ouvrées",
} as const;

export type OperatorId = (typeof paymentConfig.operators)[number]["id"];

export interface NavItem {
  label: string;
  href: string;
}

/** Méga-menu « Catalogue » : tout ce qui permet de choisir une formation. */
export interface CatalogueEntry extends NavItem {
  desc: string;
  icon: string;
}
export const catalogueMenu = {
  label: "Catalogue",
  intro: "Un métier complet, un domaine d'expertise ou un projet concret — trouvez votre voie.",
  items: [
    { label: "Parcours métiers", href: "/career-paths", desc: "Se former à un métier complet, preuve à l'appui", icon: "rocket" },
    { label: "Écoles", href: "/schools", desc: "Huit domaines de compétences numériques", icon: "school" },
    { label: "Projets", href: "/projets", desc: "Des missions concrètes pour prouver vos compétences", icon: "project" },
  ] as CatalogueEntry[],
  secondary: { label: "Formations courtes", href: "/short-courses" },
} as const;

/** Liens de navigation du header (hors méga-menu Catalogue). */
export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Formation certifiante", href: "/short-courses" },
];

/** Ancien alias conservé pour compat (plan du site / anciens imports). */
export const primaryNav: NavItem[] = [
  { label: "Entreprises", href: "/companies" },
];

/** Barre « publics » en haut du header (façon Coursera : par audience). */
export const audienceNav: NavItem[] = [
  { label: "Apprenants", href: "/" },
  { label: "Écoles", href: "/schools" },
  { label: "Entreprises", href: "/companies" },
];

/** Ancienne navigation à plat (conservée pour compat plan du site). */
export const visitorNav: NavItem[] = [
  { label: "Parcours métiers", href: "/career-paths" },
  { label: "Formations courtes", href: "/short-courses" },
  { label: "Écoles", href: "/schools" },
  { label: "Certifications", href: "/certifications" },
  { label: "Entreprises", href: "/companies" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Se former",
    items: [
      { label: "Les écoles", href: "/schools" },
      { label: "Parcours métiers", href: "/career-paths" },
      { label: "Formations courtes", href: "/short-courses" },
      { label: "Certifications & badges", href: "/certifications" },
    ],
  },
  {
    title: "Academy",
    items: [
      { label: "Espace entreprises", href: "/companies" },
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
  EXPERT: "Expert",
};

export function levelLabel(level: string): string {
  return levelLabels[level] ?? level;
}

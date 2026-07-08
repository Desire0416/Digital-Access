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

/** Navigation publique (VISITOR). */
export const visitorNav: NavItem[] = [
  { label: "Écoles", href: "/schools" },
  { label: "Parcours métiers", href: "/career-paths" },
  { label: "Formations courtes", href: "/short-courses" },
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

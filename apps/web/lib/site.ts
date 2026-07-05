export const siteConfig = {
  name: "Digital Access",
  tagline: "Le numérique accessible, utile et stratégique",
  description:
    "Digital Access conçoit des sites web, applications et plateformes e-learning sur-mesure en Côte d'Ivoire. Sites vitrines, e-commerce, institutionnels et formations en ligne.",
  url: "https://digitalaccess.ci",
  academyUrl: "https://academy.digitalaccess.ci",
  locale: "fr_CI",
  contact: {
    email: "contact@digitalaccess.ci",
    phone: "+225 07 00 00 00 00",
    whatsapp: "2250700000000",
    address: "Cocody, Abidjan — Côte d'Ivoire",
  },
  socials: {
    facebook: "https://facebook.com/digitalaccess.ci",
    instagram: "https://instagram.com/digitalaccess.ci",
    linkedin: "https://linkedin.com/company/digitalaccess-ci",
    x: "https://x.com/digitalaccessci",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

/** Navigation publique (rôle VISITOR). */
export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/portfolio" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Blog", href: "/blog" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

/** Navigation de l'espace client (rôle CLIENT connecté). */
export const clientNav: NavItem[] = [
  { label: "Tableau de bord", href: "/mon-espace" },
  { label: "Mes projets", href: "/mes-projets" },
  { label: "Factures", href: "/factures" },
  { label: "Maintenance", href: "/maintenance" },
  { label: "Support", href: "/support" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Services",
    items: [
      { label: "Sites vitrines", href: "/services#presence-web" },
      { label: "Sites institutionnels", href: "/services#institution" },
      { label: "Plateformes e-learning", href: "/services#elearning" },
      { label: "Maintenance", href: "/services#maintenance" },
      { label: "Demander un devis", href: "/devis" },
    ],
  },
  {
    title: "Entreprise",
    items: [
      { label: "À propos", href: "/a-propos" },
      { label: "Réalisations", href: "/portfolio" },
      { label: "Blog", href: "/blog" },
      { label: "Access Academy", href: "/academy" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Légal",
    items: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "CGU", href: "/cgu" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

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
    /** Numéro principal (affichage). */
    phone: "+225 07 57 90 88 84",
    /** Numéro secondaire (affichage). */
    phoneSecondary: "+225 05 64 45 26 92",
    /** Les deux numéros, pour les listes d'affichage et le JSON-LD. */
    phones: ["+225 07 57 90 88 84", "+225 05 64 45 26 92"],
    /** Numéro WhatsApp au format wa.me (chiffres uniquement, sans + ni espaces). */
    whatsapp: "2250757908884",
    address: "Cocody, Abidjan — Côte d'Ivoire",
    /** Champs d'adresse structurés (PostalAddress JSON-LD). */
    street: "Cocody",
    addressLocality: "Abidjan",
    addressRegion: "Abidjan",
    addressCountry: "CI",
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
      { label: "Création de site web", href: "/services/creation-site-web" },
      { label: "Sites établissements scolaires", href: "/services/site-etablissement-scolaire" },
      { label: "Plateformes e-learning", href: "/services/plateforme-e-learning" },
      { label: "Applications web", href: "/services/application-web" },
      { label: "Maintenance", href: "/services/maintenance-site-web" },
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

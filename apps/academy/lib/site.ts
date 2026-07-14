/* ══════════════════════════════════════════════════════════════════════════
   Configuration du site Access Academy — refonte conforme au cahier des
   charges fonctionnel (racine du repo). Navigation §8, URLs §44.
   ══════════════════════════════════════════════════════════════════════════ */

export const siteConfig = {
  name: "Access Academy",
  legalName: "Digital Access",
  url: process.env.NEXT_PUBLIC_ACADEMY_URL || "https://academy.digitalaccess.ci",
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || "https://digitalaccess.ci",
  description:
    "Académie numérique de formation, de certification et de préparation aux métiers. Apprenez une compétence, préparez-vous à un métier, explorez un domaine.",
  contactEmail: "contact@digitalaccess.ci",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+2250564452692",
} as const;

/** Menu principal (cahier §8.1). */
export const mainNav = [
  { label: "Accueil", href: "/" },
  { label: "Formations", href: "/formations" },
  { label: "Parcours métiers", href: "/parcours-metiers" },
  { label: "Écoles", href: "/ecoles" },
  { label: "Certifications", href: "/certifications" },
  { label: "Entreprises", href: "/entreprises" },
  { label: "À propos", href: "/a-propos" },
] as const;

/** Menu utilisateur connecté (cahier §8.3). */
export const userNav = [
  { label: "Tableau de bord", href: "/espace" },
  { label: "Mes formations", href: "/espace/formations" },
  { label: "Mes parcours", href: "/espace/parcours" },
  { label: "Mes projets", href: "/espace/projets" },
  { label: "Mes évaluations", href: "/espace/evaluations" },
  { label: "Mes certificats", href: "/espace/certificats" },
  { label: "Mes équivalences", href: "/espace/equivalences" },
  { label: "Compétences", href: "/espace/competences" },
  { label: "Portfolio", href: "/espace/portfolio" },
  { label: "Mes favoris", href: "/espace/favoris" },
  { label: "Recommandations", href: "/espace/recommandations" },
  { label: "Paramètres", href: "/espace/parametres" },
] as const;

/** Paiement Mobile Money manuel (numéros réels Digital Access). */
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
  reviewDelay: "sous 24 h ouvrées",
} as const;

export const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const LESSON_TYPE_LABEL: Record<string, string> = {
  VIDEO: "Vidéo",
  TEXT: "Cours",
  PDF: "Document",
  AUDIO: "Audio",
  PRESENTATION: "Présentation",
  INTERACTIVE: "Interactif",
  DEMO: "Démonstration",
  EXTERNAL_LINK: "Lien",
  VIRTUAL_CLASS: "Classe virtuelle",
  CASE_STUDY: "Étude de cas",
  WORKSHOP: "Atelier",
  LAB: "Laboratoire",
};

export const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "En cours",
  PAUSED: "En pause",
  COMPLETED: "Terminée",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
};

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

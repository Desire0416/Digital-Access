/** Contenu marketing éditorial d'apps/web (icônes référencées par nom, voir components/Icon). */

export interface ServicePack {
  id: string;
  slug: string;
  icon: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // FCFA, à partir de
  priceLabel: string;
  features: string[];
  featured?: boolean;
  cta: string;
}

export const servicePacks: ServicePack[] = [
  {
    id: "presence-web",
    slug: "presence-web",
    icon: "globe",
    name: "Présence Web",
    tagline: "Votre première vitrine en ligne",
    description:
      "Un site vitrine élégant pour exister sur internet et inspirer confiance dès le premier clic.",
    price: 150000,
    priceLabel: "À partir de",
    features: [
      "Site vitrine 3 à 5 pages",
      "Design responsive sur-mesure",
      "Formulaire de contact + WhatsApp",
      "Référencement de base (SEO)",
      "Nom de domaine + hébergement 1 an",
      "Mise en ligne sous 2 semaines",
    ],
    cta: "Démarrer",
  },
  {
    id: "etablissement-visible",
    slug: "etablissement-visible",
    icon: "store",
    name: "Établissement Visible",
    tagline: "Pour les commerces et PME ambitieux",
    description:
      "Un site complet avec catalogue, blog et paiement Mobile Money pour développer votre activité.",
    price: 350000,
    priceLabel: "À partir de",
    features: [
      "Site 6 à 12 pages + blog",
      "Catalogue produits / services",
      "Paiement Mobile Money (Orange, MTN, Wave)",
      "Espace d'administration",
      "SEO avancé + Google Business",
      "Formation à la prise en main",
    ],
    featured: true,
    cta: "Choisir ce pack",
  },
  {
    id: "institution-premium",
    slug: "institution-premium",
    icon: "building",
    name: "Institution Premium",
    tagline: "Pour les organisations et institutions",
    description:
      "Une plateforme institutionnelle robuste, multilingue et parfaitement à votre image.",
    price: 750000,
    priceLabel: "À partir de",
    features: [
      "Plateforme sur-mesure illimitée",
      "Espaces membres & tableaux de bord",
      "Multilingue (FR / EN)",
      "Intégrations métiers (API, CRM)",
      "Sécurité & performances renforcées",
      "Accompagnement dédié",
    ],
    cta: "Nous consulter",
  },
  {
    id: "elearning",
    slug: "elearning",
    icon: "graduation-cap",
    name: "E-Learning",
    tagline: "Votre plateforme de formation",
    description:
      "Une plateforme e-learning complète : cours vidéo, quiz, certificats et suivi des apprenants.",
    price: 1200000,
    priceLabel: "À partir de",
    features: [
      "Catalogue de cours & modules",
      "Lecteur vidéo + contenus interactifs",
      "Quiz, exercices & certificats PDF",
      "Paiement et abonnements",
      "Forum & espace communautaire",
      "Propulsé par Access Academy",
    ],
    cta: "Découvrir",
  },
  {
    id: "maintenance",
    slug: "maintenance",
    icon: "shield-check",
    name: "Maintenance",
    tagline: "Votre site toujours au top",
    description:
      "Mises à jour, sauvegardes, sécurité et support : nous veillons pendant que vous entreprenez.",
    price: 25000,
    priceLabel: "À partir de / mois",
    features: [
      "Mises à jour & sauvegardes",
      "Surveillance sécurité 24/7",
      "Support prioritaire",
      "Corrections & petites évolutions",
      "Rapport mensuel de performance",
    ],
    cta: "S'abonner",
  },
];

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

/** « Pourquoi Digital Access » — page d'accueil. */
export const whyChoose: Feature[] = [
  {
    icon: "sparkles",
    title: "Sur-mesure, jamais générique",
    description:
      "Chaque projet porte votre identité. Pas de template récupéré : un design pensé pour votre marque.",
  },
  {
    icon: "zap",
    title: "Rapide & optimisé mobile",
    description:
      "Des sites ultra-rapides, pensés pour les connexions 3G/4G et les usages mobiles en Côte d'Ivoire.",
  },
  {
    icon: "smartphone",
    title: "Paiement Mobile Money",
    description:
      "Orange Money, MTN, Wave — intégrés nativement pour encaisser vos clients en toute simplicité.",
  },
  {
    icon: "headphones",
    title: "Accompagnement humain",
    description:
      "Une équipe proche, réactive et pédagogue, du premier échange jusqu'après la mise en ligne.",
  },
];

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Écoute & devis",
    description:
      "Nous cernons votre besoin, vos objectifs et votre budget, puis vous remettons un devis clair.",
  },
  {
    number: "02",
    title: "Maquette & design",
    description:
      "Nous concevons une maquette à votre image, validée ensemble avant toute ligne de code.",
  },
  {
    number: "03",
    title: "Développement",
    description:
      "Nous construisons votre plateforme avec des technologies modernes, rapides et sécurisées.",
  },
  {
    number: "04",
    title: "Lancement & suivi",
    description:
      "Mise en ligne, formation à la prise en main, puis maintenance pour une tranquillité durable.",
  },
];

export interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

export const values: ValueItem[] = [
  {
    icon: "target",
    title: "Utilité avant tout",
    description:
      "Nous construisons des outils qui servent réellement votre activité, pas des gadgets.",
  },
  {
    icon: "heart",
    title: "Accessibilité",
    description:
      "Le numérique de qualité pour tous : entrepreneurs, PME, institutions et écoles.",
  },
  {
    icon: "gem",
    title: "Excellence",
    description:
      "Un souci du détail et une exigence de qualité sur chaque pixel et chaque ligne de code.",
  },
  {
    icon: "handshake",
    title: "Proximité",
    description:
      "Un partenaire de confiance, transparent et disponible, ancré dans le contexte ivoirien.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const faqItems: FaqItem[] = [
  {
    category: "Général",
    question: "Combien de temps pour créer mon site ?",
    answer:
      "Un site vitrine est livré en 2 à 3 semaines. Un projet plus complexe (e-commerce, plateforme e-learning) prend de 4 à 10 semaines selon les fonctionnalités.",
  },
  {
    category: "Général",
    question: "Travaillez-vous avec des clients hors d'Abidjan ?",
    answer:
      "Oui, nous accompagnons des clients dans toute la Côte d'Ivoire et à l'international. Nos échanges se font en visio, par WhatsApp et via votre espace client en ligne.",
  },
  {
    category: "Tarifs",
    question: "Quels sont vos moyens de paiement ?",
    answer:
      "Nous acceptons le Mobile Money (Orange Money, MTN, Wave), le virement bancaire et le paiement en plusieurs fois pour les projets importants.",
  },
  {
    category: "Tarifs",
    question: "Le nom de domaine et l'hébergement sont-ils inclus ?",
    answer:
      "Oui, la première année de nom de domaine et d'hébergement est incluse dans nos packs. Le renouvellement est ensuite couvert par votre contrat de maintenance.",
  },
  {
    category: "Technique",
    question: "Pourrai-je modifier mon site moi-même ?",
    answer:
      "Absolument. Nous livrons un espace d'administration simple et vous formons à sa prise en main. Vous restez autonome sur vos contenus.",
  },
  {
    category: "Technique",
    question: "Mon site sera-t-il visible sur Google ?",
    answer:
      "Oui, chaque site est optimisé pour le référencement (SEO) : structure, vitesse, métadonnées et bonnes pratiques pour être trouvé sur Google.",
  },
  {
    category: "Maintenance",
    question: "Que comprend la maintenance ?",
    answer:
      "Mises à jour, sauvegardes régulières, surveillance de la sécurité, corrections et support prioritaire. Vous recevez un rapport mensuel de performance.",
  },
];

/** Options du wizard de devis. */
export const devisProjectTypes = [
  { value: "SITE_VITRINE", label: "Site vitrine", icon: "globe" },
  { value: "SITE_INSTITUTIONNEL", label: "Site institutionnel", icon: "building" },
  { value: "ELEARNING", label: "Plateforme e-learning", icon: "graduation-cap" },
  { value: "REFONTE", label: "Refonte de site existant", icon: "refresh-cw" },
  { value: "MAINTENANCE", label: "Maintenance / support", icon: "shield-check" },
  { value: "OTHER", label: "Autre projet", icon: "sparkles" },
];

export const devisBudgets = [
  "Moins de 200 000 FCFA",
  "200 000 – 500 000 FCFA",
  "500 000 – 1 000 000 FCFA",
  "1 000 000 – 3 000 000 FCFA",
  "Plus de 3 000 000 FCFA",
  "À définir ensemble",
];

export const devisTimelines = [
  "Le plus tôt possible",
  "Sous 1 mois",
  "1 à 3 mois",
  "Plus de 3 mois",
  "Pas encore décidé",
];

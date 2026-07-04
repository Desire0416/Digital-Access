import type {
  Testimonial,
  PortfolioItem,
  BlogPostPreview,
  CategoryPreview,
  CoursePreview,
  Stat,
} from "./types";

// ─────────────────────────────── Chiffres clés ──────────────────────────────
export const stats: Stat[] = [
  { id: "s1", label: "Projets livrés", value: 48, suffix: "+" },
  { id: "s2", label: "Clients accompagnés", value: 35, suffix: "+" },
  { id: "s3", label: "Apprenants formés", value: 1200, suffix: "+" },
  { id: "s4", label: "Satisfaction client", value: 98, suffix: "%" },
];

// ─────────────────────────────── Témoignages ────────────────────────────────
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Aïcha Koné",
    role: "Directrice",
    company: "Boutique Élégance Abidjan",
    content:
      "Digital Access a transformé notre présence en ligne. Le site est magnifique, rapide, et nous recevons désormais des commandes chaque jour. Un accompagnement humain et professionnel du début à la fin.",
    rating: 5,
    featured: true,
  },
  {
    id: "t2",
    name: "Dr. Mamadou Traoré",
    role: "Fondateur",
    company: "Clinique La Providence",
    content:
      "Un travail sérieux et un vrai sens du détail. Notre plateforme de prise de rendez-vous fonctionne parfaitement et nos patients l'adorent. Je recommande sans hésiter.",
    rating: 5,
    featured: true,
  },
  {
    id: "t3",
    name: "Fatou Bamba",
    role: "Responsable formation",
    company: "Institut Supérieur ISTC",
    content:
      "La plateforme e-learning développée par Digital Access a révolutionné nos formations à distance. Interface intuitive, certificats automatiques, suivi des apprenants : tout y est.",
    rating: 5,
    featured: true,
  },
  {
    id: "t4",
    name: "Jean-Baptiste Yao",
    role: "Gérant",
    company: "Yao Import-Export",
    content:
      "Réactivité exemplaire et résultats au rendez-vous. Notre site institutionnel inspire confiance à nos partenaires internationaux. Merci à toute l'équipe.",
    rating: 5,
    featured: false,
  },
  {
    id: "t5",
    name: "Sandrine Adjoua",
    role: "CEO",
    company: "AfroStyle Cosmetics",
    content:
      "De la maquette au lancement, chaque étape a été soignée. Le dégradé de leur identité se retrouve partout, notre marque est enfin cohérente en ligne.",
    rating: 5,
    featured: false,
  },
];

// ─────────────────────────────── Portfolio ──────────────────────────────────
export const portfolio: PortfolioItem[] = [
  {
    id: "p1",
    title: "Boutique Élégance — E-commerce mode",
    slug: "boutique-elegance",
    description:
      "Refonte complète et boutique en ligne pour une marque de prêt-à-porter féminin à Abidjan. Catalogue dynamique, paiement Mobile Money, gestion des stocks.",
    client: "Boutique Élégance Abidjan",
    type: "Site E-commerce",
    category: "E-commerce",
    url: "https://exemple.digitalaccess.ci",
    images: [],
    technologies: ["Next.js", "Tailwind CSS", "CinetPay", "PostgreSQL"],
    featured: true,
    year: 2025,
    testimonial: "t1",
  },
  {
    id: "p2",
    title: "Clinique La Providence — Prise de RDV",
    slug: "clinique-la-providence",
    description:
      "Plateforme de prise de rendez-vous médicaux en ligne avec espace patient, rappels SMS et tableau de bord pour le personnel soignant.",
    client: "Clinique La Providence",
    type: "Application métier",
    category: "Institutionnel",
    images: [],
    technologies: ["Next.js", "Prisma", "Twilio", "Vercel"],
    featured: true,
    year: 2025,
    testimonial: "t2",
  },
  {
    id: "p3",
    title: "Institut ISTC — Plateforme e-learning",
    slug: "institut-istc-elearning",
    description:
      "Plateforme de formation à distance complète : catalogue de cours, lecteur vidéo, quiz interactifs, certificats PDF avec QR code et suivi de progression.",
    client: "Institut Supérieur ISTC",
    type: "Plateforme E-Learning",
    category: "E-Learning",
    images: [],
    technologies: ["Next.js", "Framer Motion", "@react-pdf/renderer", "Ably"],
    featured: true,
    year: 2024,
    testimonial: "t3",
  },
  {
    id: "p4",
    title: "Yao Import-Export — Site institutionnel",
    slug: "yao-import-export",
    description:
      "Site vitrine institutionnel multilingue présentant l'activité d'import-export, avec catalogue produits et formulaire de demande de cotation.",
    client: "Yao Import-Export",
    type: "Site institutionnel",
    category: "Institutionnel",
    images: [],
    technologies: ["Next.js", "i18n", "Tailwind CSS"],
    featured: false,
    year: 2024,
    testimonial: "t4",
  },
  {
    id: "p5",
    title: "AfroStyle Cosmetics — Vitrine de marque",
    slug: "afrostyle-cosmetics",
    description:
      "Site vitrine premium pour une marque de cosmétiques naturels, avec storytelling animé, galerie produits et intégration Instagram.",
    client: "AfroStyle Cosmetics",
    type: "Site vitrine",
    category: "Vitrine",
    images: [],
    technologies: ["Next.js", "Framer Motion", "Sanity"],
    featured: false,
    year: 2025,
    testimonial: "t5",
  },
  {
    id: "p6",
    title: "Coopérative Agri-Nord — Portail membres",
    slug: "cooperative-agri-nord",
    description:
      "Portail de gestion pour une coopérative agricole : espace membres, suivi des récoltes, distribution des paiements et actualités.",
    client: "Coopérative Agri-Nord",
    type: "Application métier",
    category: "Institutionnel",
    images: [],
    technologies: ["Next.js", "Prisma", "Recharts"],
    featured: false,
    year: 2024,
  },
];

// ─────────────────────────────── Blog ───────────────────────────────────────
export const blogPosts: BlogPostPreview[] = [
  {
    id: "b1",
    title: "Pourquoi votre entreprise a besoin d'un site web en 2026",
    slug: "pourquoi-site-web-2026",
    excerpt:
      "À l'ère du digital, une présence en ligne n'est plus un luxe mais une nécessité. Découvrez pourquoi un site professionnel change tout pour votre activité.",
    category: "Stratégie digitale",
    tags: ["site web", "visibilité", "business"],
    author: { name: "Équipe Digital Access", role: "Rédaction" },
    readMinutes: 5,
    publishedAt: "2026-06-15T09:00:00.000Z",
  },
  {
    id: "b2",
    title: "Mobile Money : intégrer Orange, MTN et Wave sur votre site",
    slug: "integrer-mobile-money",
    excerpt:
      "Le Mobile Money domine les paiements en Côte d'Ivoire. Guide pratique pour accepter les paiements en ligne via CinetPay et FedaPay.",
    category: "Technique",
    tags: ["paiement", "mobile money", "cinetpay"],
    author: { name: "Équipe Digital Access", role: "Rédaction" },
    readMinutes: 7,
    publishedAt: "2026-05-28T09:00:00.000Z",
  },
  {
    id: "b3",
    title: "5 erreurs qui font fuir vos visiteurs (et comment les éviter)",
    slug: "5-erreurs-site-web",
    excerpt:
      "Temps de chargement, design daté, navigation confuse… Passons en revue les erreurs les plus courantes qui coûtent des clients à votre site.",
    category: "UX/UI",
    tags: ["ux", "conversion", "design"],
    author: { name: "Équipe Digital Access", role: "Rédaction" },
    readMinutes: 6,
    publishedAt: "2026-05-10T09:00:00.000Z",
  },
  {
    id: "b4",
    title: "Se former au numérique en Côte d'Ivoire : par où commencer ?",
    slug: "se-former-numerique-ci",
    excerpt:
      "Le numérique offre d'immenses opportunités. Découvrez comment Access Academy vous accompagne vers les métiers du web, du design et du marketing.",
    category: "Formation",
    tags: ["formation", "academy", "carrière"],
    author: { name: "Équipe Digital Access", role: "Rédaction" },
    readMinutes: 4,
    publishedAt: "2026-04-22T09:00:00.000Z",
  },
];

// ─────────────────────────────── Academy — catégories ───────────────────────
export const categories: CategoryPreview[] = [
  { id: "c1", name: "Développement Web", slug: "developpement-web", icon: "code", color: "#2B5CC6", courseCount: 12 },
  { id: "c2", name: "Design & UX/UI", slug: "design-ux-ui", icon: "palette", color: "#7C3AED", courseCount: 8 },
  { id: "c3", name: "Marketing Digital", slug: "marketing-digital", icon: "megaphone", color: "#00BCD4", courseCount: 9 },
  { id: "c4", name: "Bureautique", slug: "bureautique", icon: "file-text", color: "#059669", courseCount: 6 },
  { id: "c5", name: "Entrepreneuriat", slug: "entrepreneuriat", icon: "rocket", color: "#F59E0B", courseCount: 5 },
  { id: "c6", name: "Data & IA", slug: "data-ia", icon: "brain", color: "#1E8FE1", courseCount: 4 },
];

// ─────────────────────────────── Academy — cours vedettes ───────────────────
export const featuredCourses: CoursePreview[] = [
  {
    id: "co1",
    title: "Créer un site web moderne avec Next.js",
    slug: "site-web-nextjs",
    subtitle: "De zéro à la mise en ligne, sans prérequis",
    price: 45000,
    isFree: false,
    level: "BEGINNER",
    rating: 4.9,
    ratingCount: 132,
    enrollmentCount: 540,
    durationMinutes: 720,
    category: "Développement Web",
    categorySlug: "developpement-web",
    instructor: { name: "Koffi N'Guessan" },
  },
  {
    id: "co2",
    title: "Design d'interfaces avec Figma",
    slug: "design-figma",
    subtitle: "Concevez des interfaces qui convertissent",
    price: 35000,
    isFree: false,
    level: "INTERMEDIATE",
    rating: 4.8,
    ratingCount: 98,
    enrollmentCount: 410,
    durationMinutes: 540,
    category: "Design & UX/UI",
    categorySlug: "design-ux-ui",
    instructor: { name: "Awa Diallo" },
  },
  {
    id: "co3",
    title: "Marketing sur les réseaux sociaux",
    slug: "marketing-reseaux-sociaux",
    subtitle: "Développez votre audience et vos ventes",
    price: 0,
    isFree: true,
    level: "BEGINNER",
    rating: 4.7,
    ratingCount: 210,
    enrollmentCount: 980,
    durationMinutes: 360,
    category: "Marketing Digital",
    categorySlug: "marketing-digital",
    instructor: { name: "Marc Apo" },
  },
  {
    id: "co4",
    title: "Excel avancé pour la gestion",
    slug: "excel-avance",
    subtitle: "Tableaux croisés, formules et automatisation",
    price: 25000,
    isFree: false,
    level: "ADVANCED",
    rating: 4.9,
    ratingCount: 76,
    enrollmentCount: 320,
    durationMinutes: 480,
    category: "Bureautique",
    categorySlug: "bureautique",
    instructor: { name: "Grace Kouassi" },
  },
];

export const mockData = {
  stats,
  testimonials,
  portfolio,
  blogPosts,
  categories,
  featuredCourses,
};

// ═══════════════════════════════════════════════════════════════════════════
// catalogue-seed.ts — Seeds 10 schools + 180 courses into the Academy DB.
// Run: npx tsx packages/academy-db/prisma/catalogue-seed.ts
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient, CourseLevel, ContentStatus } from "../generated/client";
const prisma = new PrismaClient();

// ─── Level mapping (French → enum) ──────────────────────────────────────────

const LEVEL: Record<string, CourseLevel> = {
  "Découverte": "BEGINNER",
  "Pratique": "INTERMEDIATE",
  "Autonomie": "ADVANCED",
  "Professionnalisation": "EXPERT",
};

// ─── Schools ────────────────────────────────────────────────────────────────

interface SchoolData {
  code: string;
  name: string;
  slug: string;
  tagline: string;
  color: string;
  order: number;
}

const SCHOOLS: SchoolData[] = [
  {
    code: "S00",
    name: "Compétences transversales",
    slug: "competences-transversales",
    tagline: "Socle commun de compétences pour tous les parcours",
    color: "#6B7280",
    order: 0,
  },
  {
    code: "S01",
    name: "École de l'Intelligence Artificielle et de l'Automatisation",
    slug: "ecole-intelligence-artificielle",
    tagline: "Usages professionnels de l'IA, assistants, automatisations, agents et gouvernance responsable",
    color: "#1E8FE1",
    order: 1,
  },
  {
    code: "S02",
    name: "École du Développement logiciel et du Web",
    slug: "ecole-developpement-web",
    tagline: "Conception, développement, test, déploiement et maintenance de solutions numériques",
    color: "#5B3FA8",
    order: 2,
  },
  {
    code: "S03",
    name: "École des Données et de l'Intelligence décisionnelle",
    slug: "ecole-donnees-intelligence-decisionnelle",
    tagline: "Collecte, qualité, analyse, visualisation et exploitation décisionnelle des données",
    color: "#00BCD4",
    order: 3,
  },
  {
    code: "S04",
    name: "École de la Cybersécurité et du Support informatique",
    slug: "ecole-cybersecurite-support",
    tagline: "Support technique, systèmes, réseaux, prévention, détection et réponse aux incidents",
    color: "#DC2626",
    order: 4,
  },
  {
    code: "S05",
    name: "École du Marketing, de la Vente et du Commerce numérique",
    slug: "ecole-marketing-vente",
    tagline: "Acquisition, contenu, vente, relation client, e-commerce et mesure des performances",
    color: "#F59E0B",
    order: 5,
  },
  {
    code: "S06",
    name: "École du Design et de la Création numérique",
    slug: "ecole-design-creation",
    tagline: "Identité visuelle, UX/UI, contenus, vidéo et communication visuelle",
    color: "#7C3AED",
    order: 6,
  },
  {
    code: "S07",
    name: "École de la Productivité et de l'Administration numérique",
    slug: "ecole-productivite-administration",
    tagline: "Bureautique, collaboration, gestion documentaire, reporting et assistance à distance",
    color: "#059669",
    order: 7,
  },
  {
    code: "S08",
    name: "École de l'Entrepreneuriat et de la Gestion de projets numériques",
    slug: "ecole-entrepreneuriat-gestion",
    tagline: "Création d'activité, offre, vente, pilotage de projets et transformation numérique",
    color: "#2B5CC6",
    order: 8,
  },
  {
    code: "S09",
    name: "École de la Formation numérique et de la Pédagogie digitale",
    slug: "ecole-formation-pedagogie",
    tagline: "Ingénierie pédagogique, LMS, production e-learning, tutorat, évaluation et pilotage",
    color: "#E11D48",
    order: 9,
  },
];

// ─── Courses ────────────────────────────────────────────────────────────────

interface CourseData {
  code: string;
  school: string; // school code, e.g. "S00"
  title: string;
  slug: string;
  level: string; // French level name
  hours: number;
  price: number;
  badge: string;
  priority: string;
}

const COURSES: CourseData[] = [
  // ═══ CORE (S00) — 12 courses ═══════════════════════════════════════════════
  { code: "CORE-001", school: "S00", title: "Culture numérique professionnelle", slug: "culture-numerique-professionnelle", level: "Découverte", hours: 8, price: 7500, badge: "Culture numérique", priority: "Vague 1" },
  { code: "CORE-002", school: "S00", title: "Communication professionnelle écrite et orale", slug: "communication-professionnelle-ecrite-et-orale", level: "Pratique", hours: 10, price: 10000, badge: "Communication professionnelle", priority: "Vague 1" },
  { code: "CORE-003", school: "S00", title: "Gestion du temps et organisation personnelle", slug: "gestion-du-temps-et-organisation-personnelle", level: "Pratique", hours: 6, price: 7500, badge: "Organisation professionnelle", priority: "Vague 1" },
  { code: "CORE-004", school: "S00", title: "Travail collaboratif et outils d'équipe", slug: "travail-collaboratif-et-outils-dequipe", level: "Pratique", hours: 8, price: 7500, badge: "Collaboration numérique", priority: "Vague 1" },
  { code: "CORE-005", school: "S00", title: "Gestion de projet numérique : fondamentaux", slug: "gestion-de-projet-numerique-fondamentaux", level: "Pratique", hours: 12, price: 10000, badge: "Gestion de projet", priority: "Vague 1" },
  { code: "CORE-006", school: "S00", title: "Résolution de problèmes et pensée critique", slug: "resolution-de-problemes-et-pensee-critique", level: "Pratique", hours: 8, price: 7500, badge: "Résolution de problèmes", priority: "Vague 1" },
  { code: "CORE-007", school: "S00", title: "Intelligence artificielle générative responsable", slug: "intelligence-artificielle-generative-responsable", level: "Découverte", hours: 8, price: 7500, badge: "IA responsable", priority: "Vague 1" },
  { code: "CORE-008", school: "S00", title: "Cyberhygiène et protection des données", slug: "cyberhygiene-et-protection-des-donnees", level: "Découverte", hours: 8, price: 7500, badge: "Cyberhygiène", priority: "Vague 1" },
  { code: "CORE-009", school: "S00", title: "Portfolio et preuve de compétences", slug: "portfolio-et-preuve-de-competences", level: "Pratique", hours: 8, price: 7500, badge: "Portfolio professionnel", priority: "Vague 1" },
  { code: "CORE-010", school: "S00", title: "Employabilité et recherche d'opportunités", slug: "employabilite-et-recherche-dopportunites", level: "Pratique", hours: 12, price: 10000, badge: "Employabilité", priority: "Vague 1" },
  { code: "CORE-011", school: "S00", title: "Freelance : bases de l'activité indépendante", slug: "freelance-bases-de-lactivite-independante", level: "Pratique", hours: 10, price: 10000, badge: "Bases du freelance", priority: "Vague 2" },
  { code: "CORE-012", school: "S00", title: "Présentation, démonstration et soutenance de projet", slug: "presentation-demonstration-et-soutenance-de-projet", level: "Pratique", hours: 6, price: 7500, badge: "Soutenance professionnelle", priority: "Vague 1" },

  // ═══ AI (S01) — 15 courses ═════════════════════════════════════════════════
  { code: "AI-001", school: "S01", title: "Comprendre l'intelligence artificielle générative", slug: "comprendre-lintelligence-artificielle-generative", level: "Découverte", hours: 6, price: 7500, badge: "Fondamentaux IA", priority: "Vague 1" },
  { code: "AI-002", school: "S01", title: "Prompt Engineering : fondamentaux", slug: "prompt-engineering-fondamentaux", level: "Pratique", hours: 10, price: 10000, badge: "Prompt Engineering", priority: "Vague 1" },
  { code: "AI-003", school: "S01", title: "Prompt Engineering avancé et bibliothèques de prompts", slug: "prompt-engineering-avance-et-bibliotheques-de-prompts", level: "Autonomie", hours: 14, price: 15000, badge: "Prompt Engineering avancé", priority: "Vague 1" },
  { code: "AI-004", school: "S01", title: "Recherche, vérification et synthèse assistées par IA", slug: "recherche-verification-et-synthese-assistees-par-ia", level: "Pratique", hours: 10, price: 10000, badge: "Recherche assistée par IA", priority: "Vague 1" },
  { code: "AI-005", school: "S01", title: "Rédaction de documents professionnels avec l'IA", slug: "redaction-de-documents-professionnels-avec-lia", level: "Pratique", hours: 12, price: 10000, badge: "Rédaction assistée par IA", priority: "Vague 1" },
  { code: "AI-006", school: "S01", title: "Analyse de données assistée par IA", slug: "analyse-de-donnees-assistee-par-ia-fondamentaux", level: "Pratique", hours: 12, price: 10000, badge: "Analyse assistée par IA", priority: "Vague 2" },
  { code: "AI-007", school: "S01", title: "Création de contenus multimédias avec l'IA", slug: "creation-de-contenus-multimedias-avec-lia", level: "Pratique", hours: 14, price: 15000, badge: "Création multimodale IA", priority: "Vague 2" },
  { code: "AI-008", school: "S01", title: "Créer un assistant IA métier sans code", slug: "creer-un-assistant-ia-metier-sans-code", level: "Autonomie", hours: 18, price: 15000, badge: "Assistant IA métier", priority: "Vague 1" },
  { code: "AI-009", school: "S01", title: "Bases de connaissances et recherche augmentée (RAG)", slug: "bases-de-connaissances-et-recherche-augmentee-rag", level: "Autonomie", hours: 18, price: 15000, badge: "Base de connaissances IA", priority: "Vague 2" },
  { code: "AI-010", school: "S01", title: "Automatisation professionnelle avec Make", slug: "automatisation-professionnelle-avec-make", level: "Autonomie", hours: 18, price: 15000, badge: "Automatisation Make", priority: "Vague 1" },
  { code: "AI-011", school: "S01", title: "Automatisation professionnelle avec n8n", slug: "automatisation-professionnelle-avec-n8n", level: "Autonomie", hours: 20, price: 20000, badge: "Automatisation n8n", priority: "Vague 1" },
  { code: "AI-012", school: "S01", title: "Comprendre les agents IA et les workflows agentiques", slug: "comprendre-les-agents-ia-et-les-workflows-agentiques", level: "Pratique", hours: 10, price: 10000, badge: "Fondamentaux agents IA", priority: "Vague 1" },
  { code: "AI-013", school: "S01", title: "Concevoir un agent IA junior", slug: "concevoir-un-agent-ia-junior", level: "Professionnalisation", hours: 24, price: 20000, badge: "Conception d'agent IA", priority: "Vague 2" },
  { code: "AI-014", school: "S01", title: "Gouvernance, éthique, confidentialité et sécurité de l'IA", slug: "gouvernance-ethique-confidentialite-et-securite-de-lia", level: "Autonomie", hours: 14, price: 15000, badge: "Gouvernance IA", priority: "Vague 1" },
  { code: "AI-015", school: "S01", title: "Plan d'adoption de l'IA dans une organisation", slug: "plan-dadoption-de-lia-dans-une-organisation", level: "Professionnalisation", hours: 18, price: 15000, badge: "Adoption de l'IA", priority: "Vague 2" },

  // ═══ DEV (S02) — 23 courses ════════════════════════════════════════════════
  { code: "DEV-001", school: "S02", title: "Comprendre le Web et les architectures numériques", slug: "comprendre-le-web-et-les-architectures-numeriques", level: "Découverte", hours: 6, price: 7500, badge: "Culture Web", priority: "Vague 1" },
  { code: "DEV-002", school: "S02", title: "HTML : structurer des pages Web", slug: "html-structurer-des-pages-web", level: "Pratique", hours: 14, price: 15000, badge: "HTML", priority: "Vague 1" },
  { code: "DEV-003", school: "S02", title: "CSS : mise en forme et composants visuels", slug: "css-mise-en-forme-et-composants-visuels", level: "Pratique", hours: 16, price: 15000, badge: "CSS", priority: "Vague 1" },
  { code: "DEV-004", school: "S02", title: "Responsive Design et Mobile First", slug: "responsive-design-et-mobile-first", level: "Autonomie", hours: 14, price: 15000, badge: "Responsive Design", priority: "Vague 1" },
  { code: "DEV-005", school: "S02", title: "JavaScript : fondamentaux", slug: "javascript-fondamentaux", level: "Pratique", hours: 20, price: 20000, badge: "JavaScript fondamental", priority: "Vague 1" },
  { code: "DEV-006", school: "S02", title: "JavaScript moderne et asynchrone", slug: "javascript-moderne-et-asynchrone", level: "Autonomie", hours: 22, price: 20000, badge: "JavaScript moderne", priority: "Vague 1" },
  { code: "DEV-007", school: "S02", title: "TypeScript pour applications fiables", slug: "typescript-pour-applications-fiables", level: "Autonomie", hours: 18, price: 15000, badge: "TypeScript", priority: "Vague 1" },
  { code: "DEV-008", school: "S02", title: "Git et GitHub pour le versionnement", slug: "git-et-github-pour-le-versionnement", level: "Pratique", hours: 12, price: 10000, badge: "Git & GitHub", priority: "Vague 1" },
  { code: "DEV-009", school: "S02", title: "React : construire des interfaces", slug: "react-construire-des-interfaces", level: "Autonomie", hours: 24, price: 20000, badge: "React", priority: "Vague 1" },
  { code: "DEV-010", school: "S02", title: "Next.js : applications Web modernes", slug: "next-js-applications-web-modernes", level: "Professionnalisation", hours: 28, price: 20000, badge: "Next.js", priority: "Vague 1" },
  { code: "DEV-011", school: "S02", title: "Node.js et création d'API REST", slug: "node-js-et-creation-dapi-rest", level: "Professionnalisation", hours: 24, price: 20000, badge: "API Node.js", priority: "Vague 1" },
  { code: "DEV-012", school: "S02", title: "PHP et Laravel : fondamentaux", slug: "php-et-laravel-fondamentaux", level: "Autonomie", hours: 24, price: 20000, badge: "Laravel", priority: "Vague 2" },
  { code: "DEV-013", school: "S02", title: "Fondamentaux des bases de données pour développeurs", slug: "fondamentaux-des-bases-de-donnees-pour-developpeurs", level: "Pratique", hours: 16, price: 15000, badge: "Bases de données", priority: "Vague 1" },
  { code: "DEV-014", school: "S02", title: "PostgreSQL et Prisma ORM", slug: "postgresql-et-prisma-orm", level: "Professionnalisation", hours: 22, price: 20000, badge: "PostgreSQL & Prisma", priority: "Vague 1" },
  { code: "DEV-015", school: "S02", title: "Authentification, autorisation et sécurité applicative", slug: "authentification-autorisation-et-securite-applicative", level: "Professionnalisation", hours: 20, price: 20000, badge: "Sécurité applicative", priority: "Vague 1" },
  { code: "DEV-016", school: "S02", title: "Tests logiciels et assurance qualité", slug: "tests-logiciels-et-assurance-qualite", level: "Autonomie", hours: 18, price: 15000, badge: "Tests logiciels", priority: "Vague 1" },
  { code: "DEV-017", school: "S02", title: "Déploiement Web sur Vercel et services cloud", slug: "deploiement-web-sur-vercel-et-services-cloud", level: "Pratique", hours: 12, price: 10000, badge: "Déploiement Web", priority: "Vague 1" },
  { code: "DEV-018", school: "S02", title: "Docker et bases du Cloud", slug: "docker-et-bases-du-cloud", level: "Autonomie", hours: 20, price: 20000, badge: "Docker & Cloud", priority: "Vague 2" },
  { code: "DEV-019", school: "S02", title: "WordPress professionnel", slug: "wordpress-professionnel", level: "Autonomie", hours: 20, price: 20000, badge: "WordPress professionnel", priority: "Vague 1" },
  { code: "DEV-020", school: "S02", title: "FlutterFlow et création d'applications No-Code", slug: "flutterflow-et-creation-dapplications-no-code", level: "Autonomie", hours: 22, price: 20000, badge: "FlutterFlow", priority: "Vague 2" },
  { code: "DEV-021", school: "S02", title: "Développement mobile multiplateforme", slug: "developpement-mobile-multiplateforme", level: "Professionnalisation", hours: 28, price: 20000, badge: "Développement mobile", priority: "Vague 2" },
  { code: "DEV-022", school: "S02", title: "Développement assisté par IA et revue de code", slug: "developpement-assiste-par-ia-et-revue-de-code", level: "Autonomie", hours: 14, price: 15000, badge: "Développement assisté par IA", priority: "Vague 1" },
  { code: "DEV-023", school: "S02", title: "Accessibilité, performance et SEO technique", slug: "accessibilite-performance-et-seo-technique", level: "Autonomie", hours: 16, price: 15000, badge: "Qualité Web", priority: "Vague 1" },

  // ═══ DATA (S03) — 20 courses ═══════════════════════════════════════════════
  { code: "DATA-001", school: "S03", title: "Culture de la donnée et prise de décision", slug: "culture-de-la-donnee-et-prise-de-decision", level: "Découverte", hours: 8, price: 7500, badge: "Culture de la donnée", priority: "Vague 1" },
  { code: "DATA-002", school: "S03", title: "Excel : prise en main professionnelle", slug: "excel-prise-en-main-professionnelle", level: "Découverte", hours: 12, price: 10000, badge: "Excel fondamental", priority: "Vague 1" },
  { code: "DATA-003", school: "S03", title: "Excel : formules et fonctions essentielles", slug: "excel-formules-et-fonctions-essentielles", level: "Pratique", hours: 16, price: 15000, badge: "Formules Excel", priority: "Vague 1" },
  { code: "DATA-004", school: "S03", title: "Excel avancé et automatisation", slug: "excel-avance-et-automatisation", level: "Autonomie", hours: 20, price: 20000, badge: "Excel avancé", priority: "Vague 1" },
  { code: "DATA-005", school: "S03", title: "Tableaux croisés dynamiques et analyse Excel", slug: "tableaux-croises-dynamiques-et-analyse-excel", level: "Autonomie", hours: 14, price: 15000, badge: "Tableaux croisés dynamiques", priority: "Vague 1" },
  { code: "DATA-006", school: "S03", title: "Créer des tableaux de bord avec Excel", slug: "creer-des-tableaux-de-bord-avec-excel", level: "Professionnalisation", hours: 18, price: 15000, badge: "Dashboard Excel", priority: "Vague 1" },
  { code: "DATA-007", school: "S03", title: "Nettoyage et préparation des données", slug: "nettoyage-et-preparation-des-donnees", level: "Pratique", hours: 16, price: 15000, badge: "Nettoyage des données", priority: "Vague 1" },
  { code: "DATA-008", school: "S03", title: "SQL : fondamentaux", slug: "sql-fondamentaux", level: "Pratique", hours: 18, price: 15000, badge: "SQL fondamental", priority: "Vague 1" },
  { code: "DATA-009", school: "S03", title: "SQL pour l'analyse de données", slug: "sql-pour-lanalyse-de-donnees", level: "Autonomie", hours: 20, price: 20000, badge: "SQL analytique", priority: "Vague 1" },
  { code: "DATA-010", school: "S03", title: "Modélisation relationnelle", slug: "modelisation-relationnelle", level: "Autonomie", hours: 16, price: 15000, badge: "Modélisation de données", priority: "Vague 1" },
  { code: "DATA-011", school: "S03", title: "Administration PostgreSQL junior", slug: "administration-postgresql-junior", level: "Professionnalisation", hours: 22, price: 20000, badge: "Administration PostgreSQL", priority: "Vague 2" },
  { code: "DATA-012", school: "S03", title: "Power BI : fondamentaux", slug: "power-bi-fondamentaux", level: "Pratique", hours: 18, price: 15000, badge: "Power BI fondamental", priority: "Vague 1" },
  { code: "DATA-013", school: "S03", title: "Power Query et préparation des données", slug: "power-query-et-preparation-des-donnees", level: "Autonomie", hours: 18, price: 15000, badge: "Power Query", priority: "Vague 1" },
  { code: "DATA-014", school: "S03", title: "DAX et calculs dans Power BI", slug: "dax-et-calculs-dans-power-bi", level: "Autonomie", hours: 20, price: 20000, badge: "DAX", priority: "Vague 1" },
  { code: "DATA-015", school: "S03", title: "Concevoir des tableaux de bord Power BI", slug: "concevoir-des-tableaux-de-bord-power-bi", level: "Professionnalisation", hours: 22, price: 20000, badge: "Dashboard Power BI", priority: "Vague 1" },
  { code: "DATA-016", school: "S03", title: "Python pour l'analyse de données", slug: "python-pour-lanalyse-de-donnees", level: "Autonomie", hours: 28, price: 20000, badge: "Python Data", priority: "Vague 2" },
  { code: "DATA-017", school: "S03", title: "Visualisation et narration des données", slug: "visualisation-et-narration-des-donnees", level: "Autonomie", hours: 14, price: 15000, badge: "Data Storytelling", priority: "Vague 1" },
  { code: "DATA-018", school: "S03", title: "Qualité, gouvernance et protection des données", slug: "qualite-gouvernance-et-protection-des-donnees", level: "Autonomie", hours: 16, price: 15000, badge: "Gouvernance des données", priority: "Vague 1" },
  { code: "DATA-019", school: "S03", title: "Indicateurs clés de performance et reporting", slug: "indicateurs-cles-de-performance-et-reporting", level: "Pratique", hours: 14, price: 15000, badge: "KPI & Reporting", priority: "Vague 1" },
  { code: "DATA-020", school: "S03", title: "Analyse de données assistée par IA", slug: "analyse-de-donnees-assistee-par-ia", level: "Autonomie", hours: 14, price: 15000, badge: "IA pour la donnée", priority: "Vague 1" },

  // ═══ CYB (S04) — 18 courses ═══════════════════════════════════════════════
  { code: "CYB-001", school: "S04", title: "Matériel, systèmes et poste de travail", slug: "materiel-systemes-et-poste-de-travail", level: "Découverte", hours: 14, price: 15000, badge: "Poste de travail", priority: "Vague 1" },
  { code: "CYB-002", school: "S04", title: "Diagnostic et maintenance informatique", slug: "diagnostic-et-maintenance-informatique", level: "Pratique", hours: 20, price: 20000, badge: "Maintenance informatique", priority: "Vague 1" },
  { code: "CYB-003", school: "S04", title: "Support utilisateur et gestion des tickets", slug: "support-utilisateur-et-gestion-des-tickets", level: "Pratique", hours: 16, price: 15000, badge: "Support utilisateur", priority: "Vague 1" },
  { code: "CYB-004", school: "S04", title: "Fondamentaux des réseaux informatiques", slug: "fondamentaux-des-reseaux-informatiques", level: "Pratique", hours: 20, price: 20000, badge: "Réseaux fondamentaux", priority: "Vague 1" },
  { code: "CYB-005", school: "S04", title: "Administration Windows junior", slug: "administration-windows-junior", level: "Autonomie", hours: 22, price: 20000, badge: "Administration Windows", priority: "Vague 2" },
  { code: "CYB-006", school: "S04", title: "Linux : fondamentaux et administration", slug: "linux-fondamentaux-et-administration", level: "Autonomie", hours: 22, price: 20000, badge: "Linux", priority: "Vague 2" },
  { code: "CYB-007", school: "S04", title: "Fondamentaux de la cybersécurité", slug: "fondamentaux-de-la-cybersecurite", level: "Découverte", hours: 14, price: 15000, badge: "Cybersécurité fondamentale", priority: "Vague 1" },
  { code: "CYB-008", school: "S04", title: "Identités, accès, mots de passe et MFA", slug: "identites-acces-mots-de-passe-et-mfa", level: "Pratique", hours: 12, price: 10000, badge: "Gestion des accès", priority: "Vague 1" },
  { code: "CYB-009", school: "S04", title: "Hameçonnage, ingénierie sociale et sensibilisation", slug: "hameconnage-ingenierie-sociale-et-sensibilisation", level: "Pratique", hours: 10, price: 10000, badge: "Prévention du phishing", priority: "Vague 1" },
  { code: "CYB-010", school: "S04", title: "Sauvegarde, restauration et continuité d'activité", slug: "sauvegarde-restauration-et-continuite-dactivite", level: "Autonomie", hours: 14, price: 15000, badge: "Continuité numérique", priority: "Vague 1" },
  { code: "CYB-011", school: "S04", title: "Sécurité WordPress", slug: "securite-wordpress", level: "Autonomie", hours: 16, price: 15000, badge: "Sécurité WordPress", priority: "Vague 1" },
  { code: "CYB-012", school: "S04", title: "Sécurité des applications Web", slug: "securite-des-applications-web", level: "Professionnalisation", hours: 22, price: 20000, badge: "Sécurité Web", priority: "Vague 2" },
  { code: "CYB-013", school: "S04", title: "Gestion des vulnérabilités et audit junior", slug: "gestion-des-vulnerabilites-et-audit-junior", level: "Professionnalisation", hours: 22, price: 20000, badge: "Audit de vulnérabilités", priority: "Vague 2" },
  { code: "CYB-014", school: "S04", title: "Journaux, SIEM et analyse SOC", slug: "journaux-siem-et-analyse-soc", level: "Professionnalisation", hours: 24, price: 20000, badge: "Analyse SOC", priority: "Vague 2" },
  { code: "CYB-015", school: "S04", title: "Réponse aux incidents et rapport de sécurité", slug: "reponse-aux-incidents-et-rapport-de-securite", level: "Professionnalisation", hours: 20, price: 20000, badge: "Réponse aux incidents", priority: "Vague 2" },
  { code: "CYB-016", school: "S04", title: "Politique de sécurité pour PME", slug: "politique-de-securite-pour-pme", level: "Autonomie", hours: 16, price: 15000, badge: "Politique de sécurité PME", priority: "Vague 1" },
  { code: "CYB-017", school: "S04", title: "Sécurité du Cloud : fondamentaux", slug: "securite-du-cloud-fondamentaux", level: "Autonomie", hours: 16, price: 15000, badge: "Sécurité Cloud", priority: "Vague 2" },
  { code: "CYB-018", school: "S04", title: "Sécurité, confidentialité et risques liés à l'IA", slug: "securite-confidentialite-et-risques-lies-a-lia", level: "Autonomie", hours: 14, price: 15000, badge: "Sécurité de l'IA", priority: "Vague 1" },

  // ═══ MKT (S05) — 23 courses ═══════════════════════════════════════════════
  { code: "MKT-001", school: "S05", title: "Fondamentaux du marketing digital", slug: "fondamentaux-du-marketing-digital", level: "Découverte", hours: 10, price: 10000, badge: "Marketing digital", priority: "Vague 1" },
  { code: "MKT-002", school: "S05", title: "Cibles, personas et proposition de valeur", slug: "cibles-personas-et-proposition-de-valeur", level: "Pratique", hours: 10, price: 10000, badge: "Ciblage marketing", priority: "Vague 1" },
  { code: "MKT-003", school: "S05", title: "Stratégie de réseaux sociaux", slug: "strategie-de-reseaux-sociaux", level: "Autonomie", hours: 16, price: 15000, badge: "Stratégie social media", priority: "Vague 1" },
  { code: "MKT-004", school: "S05", title: "Calendrier éditorial et planification de contenu", slug: "calendrier-editorial-et-planification-de-contenu", level: "Pratique", hours: 12, price: 10000, badge: "Calendrier éditorial", priority: "Vague 1" },
  { code: "MKT-005", school: "S05", title: "Rédaction Web et copywriting", slug: "redaction-web-et-copywriting", level: "Autonomie", hours: 18, price: 15000, badge: "Copywriting", priority: "Vague 1" },
  { code: "MKT-006", school: "S05", title: "Création de visuels marketing avec Canva", slug: "creation-de-visuels-marketing-avec-canva", level: "Pratique", hours: 14, price: 15000, badge: "Visuels marketing Canva", priority: "Vague 1" },
  { code: "MKT-007", school: "S05", title: "Vidéo courte pour les réseaux sociaux", slug: "video-courte-pour-les-reseaux-sociaux", level: "Pratique", hours: 14, price: 15000, badge: "Vidéo sociale", priority: "Vague 1" },
  { code: "MKT-008", school: "S05", title: "Animation et modération de communauté", slug: "animation-et-moderation-de-communaute", level: "Autonomie", hours: 14, price: 15000, badge: "Community Management", priority: "Vague 1" },
  { code: "MKT-009", school: "S05", title: "Mesure et reporting des réseaux sociaux", slug: "mesure-et-reporting-des-reseaux-sociaux", level: "Autonomie", hours: 12, price: 10000, badge: "Reporting social media", priority: "Vague 1" },
  { code: "MKT-010", school: "S05", title: "Publicité Meta Ads", slug: "publicite-meta-ads", level: "Professionnalisation", hours: 22, price: 20000, badge: "Meta Ads", priority: "Vague 1" },
  { code: "MKT-011", school: "S05", title: "Publicité Google Ads", slug: "publicite-google-ads", level: "Professionnalisation", hours: 22, price: 20000, badge: "Google Ads", priority: "Vague 2" },
  { code: "MKT-012", school: "S05", title: "Référencement naturel : fondamentaux", slug: "referencement-naturel-fondamentaux", level: "Pratique", hours: 16, price: 15000, badge: "SEO fondamental", priority: "Vague 1" },
  { code: "MKT-013", school: "S05", title: "Rédaction et optimisation de contenus SEO", slug: "redaction-et-optimisation-de-contenus-seo", level: "Autonomie", hours: 18, price: 15000, badge: "Contenu SEO", priority: "Vague 1" },
  { code: "MKT-014", school: "S05", title: "Email marketing", slug: "email-marketing", level: "Autonomie", hours: 16, price: 15000, badge: "Email marketing", priority: "Vague 1" },
  { code: "MKT-015", school: "S05", title: "Automatisation marketing", slug: "automatisation-marketing", level: "Professionnalisation", hours: 18, price: 15000, badge: "Marketing Automation", priority: "Vague 2" },
  { code: "MKT-016", school: "S05", title: "CRM et gestion des prospects", slug: "crm-et-gestion-des-prospects", level: "Autonomie", hours: 16, price: 15000, badge: "Gestion CRM", priority: "Vague 1" },
  { code: "MKT-017", school: "S05", title: "Prospection et vente digitale", slug: "prospection-et-vente-digitale", level: "Autonomie", hours: 18, price: 15000, badge: "Prospection digitale", priority: "Vague 1" },
  { code: "MKT-018", school: "S05", title: "WhatsApp Business pour les organisations", slug: "whatsapp-business-pour-les-organisations", level: "Pratique", hours: 10, price: 10000, badge: "WhatsApp Business", priority: "Vague 1" },
  { code: "MKT-019", school: "S05", title: "Créer une boutique avec Shopify", slug: "creer-une-boutique-avec-shopify", level: "Autonomie", hours: 22, price: 20000, badge: "Shopify", priority: "Vague 1" },
  { code: "MKT-020", school: "S05", title: "Créer une boutique avec WooCommerce", slug: "creer-une-boutique-avec-woocommerce", level: "Autonomie", hours: 22, price: 20000, badge: "WooCommerce", priority: "Vague 2" },
  { code: "MKT-021", school: "S05", title: "Opérations e-commerce : commandes, stock et service", slug: "operations-e-commerce-commandes-stock-et-service", level: "Autonomie", hours: 16, price: 15000, badge: "Opérations e-commerce", priority: "Vague 1" },
  { code: "MKT-022", school: "S05", title: "Service client numérique", slug: "service-client-numerique", level: "Pratique", hours: 12, price: 10000, badge: "Service client digital", priority: "Vague 1" },
  { code: "MKT-023", school: "S05", title: "Intelligence artificielle pour le marketing", slug: "intelligence-artificielle-pour-le-marketing", level: "Autonomie", hours: 14, price: 15000, badge: "IA Marketing", priority: "Vague 1" },

  // ═══ DES (S06) — 18 courses ═══════════════════════════════════════════════
  { code: "DES-001", school: "S06", title: "Fondamentaux du design graphique", slug: "fondamentaux-du-design-graphique", level: "Découverte", hours: 12, price: 10000, badge: "Fondamentaux du design", priority: "Vague 1" },
  { code: "DES-002", school: "S06", title: "Couleurs, typographies et mise en page", slug: "couleurs-typographies-et-mise-en-page", level: "Pratique", hours: 12, price: 10000, badge: "Couleurs & Typographie", priority: "Vague 1" },
  { code: "DES-003", school: "S06", title: "Canva professionnel", slug: "canva-professionnel", level: "Pratique", hours: 18, price: 15000, badge: "Canva professionnel", priority: "Vague 1" },
  { code: "DES-004", school: "S06", title: "Adobe Photoshop : fondamentaux", slug: "adobe-photoshop-fondamentaux", level: "Autonomie", hours: 24, price: 20000, badge: "Photoshop", priority: "Vague 2" },
  { code: "DES-005", school: "S06", title: "Adobe Illustrator : fondamentaux", slug: "adobe-illustrator-fondamentaux", level: "Autonomie", hours: 24, price: 20000, badge: "Illustrator", priority: "Vague 2" },
  { code: "DES-006", school: "S06", title: "Identité visuelle et charte graphique", slug: "identite-visuelle-et-charte-graphique", level: "Professionnalisation", hours: 22, price: 20000, badge: "Identité visuelle", priority: "Vague 1" },
  { code: "DES-007", school: "S06", title: "Figma : fondamentaux", slug: "figma-fondamentaux", level: "Pratique", hours: 18, price: 15000, badge: "Figma", priority: "Vague 1" },
  { code: "DES-008", school: "S06", title: "Recherche utilisateur et expérience UX", slug: "recherche-utilisateur-et-experience-ux", level: "Autonomie", hours: 18, price: 15000, badge: "Recherche UX", priority: "Vague 1" },
  { code: "DES-009", school: "S06", title: "Conception d'interfaces UI", slug: "conception-dinterfaces-ui", level: "Professionnalisation", hours: 22, price: 20000, badge: "UI Design", priority: "Vague 1" },
  { code: "DES-010", school: "S06", title: "Prototypage et tests utilisateurs", slug: "prototypage-et-tests-utilisateurs", level: "Professionnalisation", hours: 18, price: 15000, badge: "Prototypage UX", priority: "Vague 1" },
  { code: "DES-011", school: "S06", title: "Photographie et vidéo avec smartphone", slug: "photographie-et-video-avec-smartphone", level: "Pratique", hours: 14, price: 15000, badge: "Photo & vidéo mobile", priority: "Vague 1" },
  { code: "DES-012", school: "S06", title: "Montage vidéo avec CapCut", slug: "montage-video-avec-capcut", level: "Pratique", hours: 18, price: 15000, badge: "Montage CapCut", priority: "Vague 1" },
  { code: "DES-013", school: "S06", title: "Montage vidéo avec Premiere Pro", slug: "montage-video-avec-premiere-pro", level: "Professionnalisation", hours: 26, price: 20000, badge: "Premiere Pro", priority: "Vague 2" },
  { code: "DES-014", school: "S06", title: "Motion Design : fondamentaux", slug: "motion-design-fondamentaux", level: "Professionnalisation", hours: 24, price: 20000, badge: "Motion Design", priority: "Vague 2" },
  { code: "DES-015", school: "S06", title: "Création de contenus visuels pour réseaux sociaux", slug: "creation-de-contenus-visuels-pour-reseaux-sociaux", level: "Autonomie", hours: 18, price: 15000, badge: "Contenu visuel social", priority: "Vague 1" },
  { code: "DES-016", school: "S06", title: "Design de présentations professionnelles", slug: "design-de-presentations-professionnelles", level: "Autonomie", hours: 14, price: 15000, badge: "Presentation Design", priority: "Vague 1" },
  { code: "DES-017", school: "S06", title: "Portfolio créatif et présentation de projet", slug: "portfolio-creatif-et-presentation-de-projet", level: "Autonomie", hours: 12, price: 10000, badge: "Portfolio créatif", priority: "Vague 1" },
  { code: "DES-018", school: "S06", title: "Création d'images et vidéos assistée par IA", slug: "creation-dimages-et-videos-assistee-par-ia", level: "Autonomie", hours: 14, price: 15000, badge: "IA créative", priority: "Vague 1" },

  // ═══ PROD (S07) — 16 courses ══════════════════════════════════════════════
  { code: "PROD-001", school: "S07", title: "Initiation à l'ordinateur et à Internet", slug: "initiation-a-lordinateur-et-a-internet", level: "Découverte", hours: 12, price: 10000, badge: "Initiation numérique", priority: "Vague 1" },
  { code: "PROD-002", school: "S07", title: "Microsoft Word professionnel", slug: "microsoft-word-professionnel", level: "Pratique", hours: 18, price: 15000, badge: "Word professionnel", priority: "Vague 1" },
  { code: "PROD-003", school: "S07", title: "Excel pour les activités administratives", slug: "excel-pour-les-activites-administratives", level: "Pratique", hours: 16, price: 15000, badge: "Excel administratif", priority: "Vague 1" },
  { code: "PROD-004", school: "S07", title: "PowerPoint professionnel", slug: "powerpoint-professionnel", level: "Pratique", hours: 16, price: 15000, badge: "PowerPoint professionnel", priority: "Vague 1" },
  { code: "PROD-005", school: "S07", title: "Microsoft 365 pour le travail collaboratif", slug: "microsoft-365-pour-le-travail-collaboratif", level: "Autonomie", hours: 18, price: 15000, badge: "Microsoft 365", priority: "Vague 1" },
  { code: "PROD-006", school: "S07", title: "Google Workspace professionnel", slug: "google-workspace-professionnel", level: "Autonomie", hours: 18, price: 15000, badge: "Google Workspace", priority: "Vague 1" },
  { code: "PROD-007", school: "S07", title: "Gestion documentaire et organisation des fichiers", slug: "gestion-documentaire-et-organisation-des-fichiers", level: "Autonomie", hours: 16, price: 15000, badge: "Gestion documentaire", priority: "Vague 1" },
  { code: "PROD-008", school: "S07", title: "Messagerie et communication administrative", slug: "messagerie-et-communication-administrative", level: "Pratique", hours: 12, price: 10000, badge: "Messagerie professionnelle", priority: "Vague 1" },
  { code: "PROD-009", school: "S07", title: "Gestion d'agenda, réunions et comptes rendus", slug: "gestion-dagenda-reunions-et-comptes-rendus", level: "Pratique", hours: 14, price: 15000, badge: "Organisation de réunions", priority: "Vague 1" },
  { code: "PROD-010", school: "S07", title: "Rapports, tableaux de bord et reporting administratif", slug: "rapports-tableaux-de-bord-et-reporting-administratif", level: "Autonomie", hours: 18, price: 15000, badge: "Reporting administratif", priority: "Vague 1" },
  { code: "PROD-011", school: "S07", title: "Formulaires numériques et collecte de données", slug: "formulaires-numeriques-et-collecte-de-donnees", level: "Pratique", hours: 14, price: 15000, badge: "Formulaires numériques", priority: "Vague 1" },
  { code: "PROD-012", school: "S07", title: "Notion et Trello pour organiser le travail", slug: "notion-et-trello-pour-organiser-le-travail", level: "Pratique", hours: 14, price: 15000, badge: "Organisation No-Code", priority: "Vague 1" },
  { code: "PROD-013", school: "S07", title: "Assistance virtuelle et travail à distance", slug: "assistance-virtuelle-et-travail-a-distance", level: "Autonomie", hours: 18, price: 15000, badge: "Assistance virtuelle", priority: "Vague 1" },
  { code: "PROD-014", school: "S07", title: "Automatisation bureautique et IA de productivité", slug: "automatisation-bureautique-et-ia-de-productivite", level: "Autonomie", hours: 16, price: 15000, badge: "Bureautique augmentée", priority: "Vague 1" },
  { code: "PROD-015", school: "S07", title: "Création de modèles de documents professionnels", slug: "creation-de-modeles-de-documents-professionnels", level: "Autonomie", hours: 14, price: 15000, badge: "Modèles documentaires", priority: "Vague 1" },
  { code: "PROD-016", school: "S07", title: "Rédaction administrative professionnelle", slug: "redaction-administrative-professionnelle", level: "Autonomie", hours: 18, price: 15000, badge: "Rédaction administrative", priority: "Vague 1" },

  // ═══ ENT (S08) — 18 courses ═══════════════════════════════════════════════
  { code: "ENT-001", school: "S08", title: "Esprit entrepreneurial et posture professionnelle", slug: "esprit-entrepreneurial-et-posture-professionnelle", level: "Découverte", hours: 8, price: 7500, badge: "Posture entrepreneuriale", priority: "Vague 1" },
  { code: "ENT-002", school: "S08", title: "Identifier et valider un problème à résoudre", slug: "identifier-et-valider-un-probleme-a-resoudre", level: "Pratique", hours: 12, price: 10000, badge: "Validation de problème", priority: "Vague 1" },
  { code: "ENT-003", school: "S08", title: "Business Model et modèle économique", slug: "business-model-et-modele-economique", level: "Autonomie", hours: 16, price: 15000, badge: "Business Model", priority: "Vague 1" },
  { code: "ENT-004", school: "S08", title: "Étude de marché pratique", slug: "etude-de-marche-pratique", level: "Autonomie", hours: 16, price: 15000, badge: "Étude de marché", priority: "Vague 1" },
  { code: "ENT-005", school: "S08", title: "Construire une offre et fixer ses prix", slug: "construire-une-offre-et-fixer-ses-prix", level: "Autonomie", hours: 16, price: 15000, badge: "Offre & Tarification", priority: "Vague 1" },
  { code: "ENT-006", school: "S08", title: "Marque personnelle et crédibilité professionnelle", slug: "marque-personnelle-et-credibilite-professionnelle", level: "Pratique", hours: 12, price: 10000, badge: "Personal Branding", priority: "Vague 1" },
  { code: "ENT-007", school: "S08", title: "Prospection commerciale", slug: "prospection-commerciale", level: "Autonomie", hours: 18, price: 15000, badge: "Prospection commerciale", priority: "Vague 1" },
  { code: "ENT-008", school: "S08", title: "Vente et négociation", slug: "vente-et-negociation", level: "Autonomie", hours: 18, price: 15000, badge: "Vente & Négociation", priority: "Vague 1" },
  { code: "ENT-009", school: "S08", title: "Proposition commerciale, devis et cadre contractuel", slug: "proposition-commerciale-devis-et-cadre-contractuel", level: "Autonomie", hours: 16, price: 15000, badge: "Proposition commerciale", priority: "Vague 1" },
  { code: "ENT-010", school: "S08", title: "Gestion budgétaire et financière simplifiée", slug: "gestion-budgetaire-et-financiere-simplifiee", level: "Pratique", hours: 16, price: 15000, badge: "Gestion financière", priority: "Vague 1" },
  { code: "ENT-011", school: "S08", title: "Gestion de projet : planification et pilotage", slug: "gestion-de-projet-planification-et-pilotage", level: "Autonomie", hours: 18, price: 15000, badge: "Pilotage de projet", priority: "Vague 1" },
  { code: "ENT-012", school: "S08", title: "Méthodes Agile et Scrum", slug: "methodes-agile-et-scrum", level: "Autonomie", hours: 16, price: 15000, badge: "Agile & Scrum", priority: "Vague 1" },
  { code: "ENT-013", school: "S08", title: "Gestion de produit numérique", slug: "gestion-de-produit-numerique", level: "Professionnalisation", hours: 20, price: 20000, badge: "Product Management", priority: "Vague 2" },
  { code: "ENT-014", school: "S08", title: "Diagnostic de transformation numérique", slug: "diagnostic-de-transformation-numerique", level: "Professionnalisation", hours: 20, price: 20000, badge: "Diagnostic numérique", priority: "Vague 1" },
  { code: "ENT-015", school: "S08", title: "Cartographie et amélioration des processus de PME", slug: "cartographie-et-amelioration-des-processus-de-pme", level: "Professionnalisation", hours: 18, price: 15000, badge: "Optimisation des processus", priority: "Vague 1" },
  { code: "ENT-016", school: "S08", title: "Livraison de service et relation client", slug: "livraison-de-service-et-relation-client", level: "Autonomie", hours: 16, price: 15000, badge: "Gestion de mission client", priority: "Vague 1" },
  { code: "ENT-017", school: "S08", title: "Plan de lancement d'un produit ou service", slug: "plan-de-lancement-dun-produit-ou-service", level: "Professionnalisation", hours: 18, price: 15000, badge: "Plan de lancement", priority: "Vague 1" },
  { code: "ENT-018", school: "S08", title: "Pitch et présentation à des partenaires", slug: "pitch-et-presentation-a-des-partenaires", level: "Autonomie", hours: 12, price: 10000, badge: "Pitch professionnel", priority: "Vague 1" },

  // ═══ EDU (S09) — 17 courses ═══════════════════════════════════════════════
  { code: "EDU-001", school: "S09", title: "Fondamentaux de l'apprentissage des adultes", slug: "fondamentaux-de-lapprentissage-des-adultes", level: "Découverte", hours: 10, price: 10000, badge: "Andragogie", priority: "Vague 1" },
  { code: "EDU-002", school: "S09", title: "Ingénierie pédagogique et analyse des besoins", slug: "ingenierie-pedagogique-et-analyse-des-besoins", level: "Autonomie", hours: 18, price: 15000, badge: "Ingénierie pédagogique", priority: "Vague 1" },
  { code: "EDU-003", school: "S09", title: "Objectifs, compétences et évaluations", slug: "objectifs-competences-et-evaluations", level: "Autonomie", hours: 16, price: 15000, badge: "Alignement pédagogique", priority: "Vague 1" },
  { code: "EDU-004", school: "S09", title: "Scénarisation d'un cours en ligne", slug: "scenarisation-dun-cours-en-ligne", level: "Professionnalisation", hours: 20, price: 20000, badge: "Scénarisation e-learning", priority: "Vague 1" },
  { code: "EDU-005", school: "S09", title: "Administration Moodle", slug: "administration-moodle", level: "Professionnalisation", hours: 24, price: 20000, badge: "Administration Moodle", priority: "Vague 1" },
  { code: "EDU-006", school: "S09", title: "Créer et organiser un cours dans Moodle", slug: "creer-et-organiser-un-cours-dans-moodle", level: "Autonomie", hours: 18, price: 15000, badge: "Création de cours Moodle", priority: "Vague 1" },
  { code: "EDU-007", school: "S09", title: "Créer des quiz et évaluations dans Moodle", slug: "creer-des-quiz-et-evaluations-dans-moodle", level: "Autonomie", hours: 18, price: 15000, badge: "Évaluation Moodle", priority: "Vague 1" },
  { code: "EDU-008", school: "S09", title: "Créer des activités interactives avec H5P", slug: "creer-des-activites-interactives-avec-h5p", level: "Autonomie", hours: 16, price: 15000, badge: "H5P", priority: "Vague 1" },
  { code: "EDU-009", school: "S09", title: "Animer une classe virtuelle", slug: "animer-une-classe-virtuelle", level: "Pratique", hours: 14, price: 15000, badge: "Classe virtuelle", priority: "Vague 1" },
  { code: "EDU-010", school: "S09", title: "Produire des vidéos pédagogiques", slug: "produire-des-videos-pedagogiques", level: "Autonomie", hours: 18, price: 15000, badge: "Vidéo pédagogique", priority: "Vague 1" },
  { code: "EDU-011", school: "S09", title: "Tutorat et accompagnement à distance", slug: "tutorat-et-accompagnement-a-distance", level: "Autonomie", hours: 16, price: 15000, badge: "Tutorat à distance", priority: "Vague 1" },
  { code: "EDU-012", school: "S09", title: "Suivi et analyse des apprentissages", slug: "suivi-et-analyse-des-apprentissages", level: "Professionnalisation", hours: 16, price: 15000, badge: "Learning Analytics", priority: "Vague 1" },
  { code: "EDU-013", school: "S09", title: "Accessibilité des contenus pédagogiques", slug: "accessibilite-des-contenus-pedagogiques", level: "Autonomie", hours: 14, price: 15000, badge: "Accessibilité pédagogique", priority: "Vague 1" },
  { code: "EDU-014", school: "S09", title: "Intelligence artificielle pour la conception pédagogique", slug: "intelligence-artificielle-pour-la-conception-pedagogique", level: "Autonomie", hours: 16, price: 15000, badge: "IA pédagogique", priority: "Vague 1" },
  { code: "EDU-015", school: "S09", title: "Badges, certificats et validation des compétences", slug: "badges-certificats-et-validation-des-competences", level: "Autonomie", hours: 14, price: 15000, badge: "Certification des compétences", priority: "Vague 1" },
  { code: "EDU-016", school: "S09", title: "Assurance qualité d'un dispositif e-learning", slug: "assurance-qualite-dun-dispositif-e-learning", level: "Professionnalisation", hours: 18, price: 15000, badge: "Qualité e-learning", priority: "Vague 1" },
  { code: "EDU-017", school: "S09", title: "Déploiement et exploitation d'une plateforme LMS", slug: "deploiement-et-exploitation-dune-plateforme-lms", level: "Professionnalisation", hours: 22, price: 20000, badge: "Exploitation LMS", priority: "Vague 2" },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Catalogue Seed: 10 schools + 180 courses ===\n");

  // ── 1. Upsert Schools ──────────────────────────────────────────────────────
  const schoolMap: Record<string, string> = {}; // code → id

  for (const s of SCHOOLS) {
    const school = await prisma.school.upsert({
      where: { slug: s.slug },
      update: {
        code: s.code,
        name: s.name,
        tagline: s.tagline,
        description: `${s.tagline}.`,
        color: s.color,
        order: s.order,
      },
      create: {
        code: s.code,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: `${s.tagline}.`,
        color: s.color,
        order: s.order,
        status: "PUBLISHED",
      },
    });
    schoolMap[s.code] = school.id;
    console.log(`  School ${s.code} → ${school.id}  ${s.name}`);
  }
  console.log(`\n✓ ${SCHOOLS.length} schools upserted.\n`);

  // ── 2. Upsert Courses + SchoolCourse junctions ─────────────────────────────
  const courseMap: Record<string, string> = {}; // code → id
  let count = 0;

  for (let idx = 0; idx < COURSES.length; idx++) {
    const c = COURSES[idx];
    const level = LEVEL[c.level];
    if (!level) {
      throw new Error(`Unknown level "${c.level}" for course ${c.code}`);
    }

    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        code: c.code,
        title: c.title,
        level,
        durationHours: c.hours,
        price: c.price,
        badgeTitle: c.badge,
        priority: c.priority,
        description: c.title,
      },
      create: {
        code: c.code,
        title: c.title,
        slug: c.slug,
        level,
        durationHours: c.hours,
        price: c.price,
        badgeTitle: c.badge,
        priority: c.priority,
        description: c.title,
        status: "DRAFT" as ContentStatus,
      },
    });

    courseMap[c.code] = course.id;

    // SchoolCourse junction
    const schoolId = schoolMap[c.school];
    if (!schoolId) {
      throw new Error(`Unknown school code "${c.school}" for course ${c.code}`);
    }

    await prisma.schoolCourse.upsert({
      where: {
        schoolId_courseId: { schoolId, courseId: course.id },
      },
      update: {},
      create: {
        schoolId,
        courseId: course.id,
        isPrimary: true,
        position: idx,
      },
    });

    count++;
    if (count % 20 === 0) {
      console.log(`  ... ${count} courses upserted`);
    }
  }

  console.log(`\n✓ ${count} courses upserted with SchoolCourse junctions.`);
  console.log(`\nDone. schoolMap has ${Object.keys(schoolMap).length} entries, courseMap has ${Object.keys(courseMap).length} entries.\n`);
}

main()
  .then(() => {
    console.log("Catalogue seed completed successfully.");
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error("Catalogue seed failed:", err);
    return prisma.$disconnect().then(() => process.exit(1));
  });

// ─── Programs and Career Paths are seeded in catalogue-seed-part2.ts ───

import { PrismaClient, type ChapterType, type CourseLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ─────────────────────────── Vidéos de démonstration ───────────────────────────
   Embeds YouTube stables (contenu réel branché via le studio instructeur, S8). */
const V = {
  intro: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  demo: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  nextjs: "https://www.youtube.com/watch?v=Sklc_fQBmcs",
};

/* ─────────────────────────────── Types du seed ────────────────────────────── */

interface SeedQuizQuestion {
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

interface SeedChapter {
  title: string;
  type: ChapterType;
  content?: string;
  videoUrl?: string;
  videoDuration?: number;
  isPreview?: boolean;
  resources?: { label: string; url: string }[];
  quiz?: { passingScore?: number; questions: SeedQuizQuestion[] };
}

interface SeedCourse {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  isFree: boolean;
  level: CourseLevel;
  categorySlug: string;
  instructorEmail: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  durationMinutes: number;
  objectives: string[];
  prerequisites: string[];
  modules: { title: string; chapters: SeedChapter[] }[];
}

/* ────────────────────────────────── Cours ─────────────────────────────────── */

const courses: SeedCourse[] = [
  {
    slug: "marketing-reseaux-sociaux",
    title: "Marketing digital : réussir sur les réseaux sociaux",
    subtitle: "Développez votre audience et transformez vos abonnés en clients",
    description:
      "Facebook, Instagram, TikTok et WhatsApp sont devenus les places de marché de la Côte d'Ivoire. Cette formation complète et 100 % gratuite vous apprend, pas à pas, à construire une présence qui attire, engage et vend. Aucun prérequis : uniquement l'envie de faire grandir votre activité.",
    price: 0,
    isFree: true,
    level: "BEGINNER",
    categorySlug: "marketing-digital",
    instructorEmail: "marc@digitalaccess.ci",
    rating: 4.7,
    ratingCount: 210,
    enrollmentCount: 980,
    durationMinutes: 360,
    objectives: [
      "Choisir les bons réseaux pour votre activité",
      "Créer du contenu qui engage réellement votre audience",
      "Comprendre et apprivoiser les algorithmes",
      "Lancer vos premières publicités Facebook & Instagram",
      "Transformer vos abonnés en clients payants",
    ],
    prerequisites: ["Un smartphone ou un ordinateur", "Un compte Facebook ou Instagram"],
    modules: [
      {
        title: "Les fondamentaux",
        chapters: [
          {
            title: "Bienvenue dans la formation",
            type: "VIDEO",
            videoUrl: V.intro,
            videoDuration: 240,
            isPreview: true,
            content:
              "Dans cette vidéo d'introduction, nous faisons connaissance et je vous présente le programme complet : les fondamentaux, la création de contenu, la croissance de votre communauté, puis la vente.\n\n**Conseil** : gardez un carnet à portée de main — chaque chapitre se termine par une action concrète à réaliser pour votre propre activité.",
          },
          {
            title: "Le paysage digital en Côte d'Ivoire",
            type: "TEXT",
            content:
              "## Un marché en pleine explosion\n\nLa Côte d'Ivoire compte aujourd'hui **plus de 14 millions d'internautes**, dont l'immense majorité se connecte via mobile. WhatsApp, Facebook, TikTok et Instagram dominent largement les usages.\n\nCe que cela signifie pour vous : *vos clients sont déjà en ligne*. La question n'est pas de savoir s'il faut y être, mais comment y être efficacement.\n\n## Les 4 réseaux qui comptent\n\n| Réseau | Point fort | Idéal pour |\n|--------|-----------|------------|\n| **WhatsApp** | Relation directe, confiance | Vente conversationnelle, SAV |\n| **Facebook** | Large audience, groupes | Commerces locaux, services |\n| **Instagram** | Visuel, image de marque | Mode, beauté, restauration |\n| **TikTok** | Portée organique massive | Notoriété, jeunes audiences |\n\n## Les erreurs à éviter dès le départ\n\n1. **Être partout à la fois** — mieux vaut exceller sur un réseau que végéter sur quatre.\n2. **Publier sans stratégie** — chaque publication doit servir un objectif.\n3. **Acheter des abonnés** — l'algorithme le détecte et votre portée s'effondre.\n\n> **Action du chapitre** : listez les 2 réseaux où vos clients passent le plus de temps.",
          },
          {
            title: "Choisir les bons réseaux pour votre activité",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 420,
            content:
              "Nous passons en revue la méthode **ACP** : Audience (où sont vos clients ?), Contenu (que savez-vous produire ?), Potentiel (où est la croissance ?).\n\nÀ la fin de cette vidéo, vous saurez précisément où concentrer vos efforts.",
          },
          {
            title: "Quiz — Les fondamentaux",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Quel réseau est le plus adapté à la vente conversationnelle en Côte d'Ivoire ?",
                  options: ["TikTok", "WhatsApp", "LinkedIn", "X (Twitter)"],
                  correctAnswers: [1],
                  explanation:
                    "WhatsApp est le canal de confiance n°1 en Côte d'Ivoire : la vente s'y conclut par la conversation.",
                },
                {
                  question: "Pourquoi ne faut-il pas acheter des abonnés ?",
                  options: [
                    "C'est trop cher",
                    "L'algorithme détecte l'audience factice et réduit la portée",
                    "C'est illégal",
                    "Ça prend trop de temps",
                  ],
                  correctAnswers: [1],
                  explanation:
                    "Des abonnés qui n'interagissent jamais signalent à l'algorithme que votre contenu n'intéresse pas — votre portée réelle s'effondre.",
                },
                {
                  question: "Que signifie la méthode ACP ?",
                  options: [
                    "Achat, Contenu, Publicité",
                    "Audience, Contenu, Potentiel",
                    "Analyse, Création, Publication",
                    "Abonnés, Clients, Profits",
                  ],
                  correctAnswers: [1],
                  explanation:
                    "ACP = Audience (où sont vos clients), Contenu (ce que vous savez produire), Potentiel (où est la croissance).",
                },
                {
                  question: "Quels réseaux privilégier pour un restaurant à Abidjan ? (plusieurs réponses)",
                  options: ["Instagram", "LinkedIn", "Facebook", "GitHub"],
                  correctAnswers: [0, 2],
                  explanation:
                    "La restauration est un métier visuel et local : Instagram pour l'image, Facebook pour la proximité et les avis.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Créer du contenu qui engage",
        chapters: [
          {
            title: "Les 4 piliers d'un contenu efficace",
            type: "TEXT",
            content:
              "## La règle des 4 E\n\nUn contenu performant fait au moins l'une de ces quatre choses :\n\n1. **Éduquer** — astuces, tutoriels, conseils métier.\n2. **Émouvoir** — coulisses, histoires vraies, réussites de clients.\n3. **Étonner** — chiffres surprenants, avant/après spectaculaires.\n4. **Engager** — questions, sondages, jeux-concours.\n\n## La proportion gagnante\n\nSur 10 publications : **7 apportent de la valeur**, **3 vendent**. Un compte qui ne fait que vendre fait fuir ; un compte qui ne vend jamais ne rapporte rien.\n\n## Le calendrier éditorial minimal\n\n- **Lundi** : conseil ou astuce (éduquer)\n- **Mercredi** : coulisses ou témoignage (émouvoir)\n- **Vendredi** : offre ou produit (vendre)\n\nTrois publications par semaine, tenues sur la durée, battent dix publications un mois puis plus rien.\n\n> **Action du chapitre** : rédigez vos 3 prochaines publications avec la règle des 4 E.",
          },
          {
            title: "Créer des visuels professionnels avec Canva",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 600,
            content:
              "Démonstration complète : créer un visuel produit, une affiche promo et une story animée avec Canva (gratuit), en respectant votre identité visuelle.",
            resources: [
              { label: "Canva — modèles gratuits", url: "https://www.canva.com" },
              { label: "Palette de couleurs — Coolors", url: "https://coolors.co" },
            ],
          },
          {
            title: "Écrire des légendes qui convertissent",
            type: "TEXT",
            content:
              "## La structure AIDA appliquée aux réseaux\n\n- **A**ccroche : la première ligne doit arrêter le pouce. Question, chiffre, promesse.\n- **I**ntérêt : développez le problème que vit votre client.\n- **D**ésir : montrez la transformation, pas le produit.\n- **A**ction : dites exactement quoi faire (« Écrivez-nous *PRIX* en commentaire »).\n\n## Exemple concret\n\n❌ *« Nouveau stock de chaussures disponible »*\n\n✅ *« Vous êtes debout toute la journée ? 👟 Ces sandales orthopédiques soulagent vos pieds dès la première heure. Stock limité — écrivez PRIX en commentaire. »*\n\n## Les hashtags en Côte d'Ivoire\n\nRestez local et pertinent : `#Abidjan` `#CoteDivoire` `#225` + 3 à 5 hashtags métier. Au-delà de 10, l'effet s'inverse.\n\n> **Action du chapitre** : réécrivez votre dernière publication avec la structure AIDA.",
          },
          {
            title: "Quiz — Le contenu",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Sur 10 publications, combien devraient vendre directement ?",
                  options: ["10", "7", "3", "0"],
                  correctAnswers: [2],
                  explanation: "La proportion gagnante : 7 publications de valeur pour 3 publications de vente.",
                },
                {
                  question: "Que signifie le premier « A » de la méthode AIDA ?",
                  options: ["Argent", "Accroche", "Audience", "Algorithme"],
                  correctAnswers: [1],
                  explanation: "L'Accroche : la première ligne doit arrêter le défilement.",
                },
                {
                  question: "Quels éléments composent la règle des 4 E ? (plusieurs réponses)",
                  options: ["Éduquer", "Économiser", "Émouvoir", "Engager"],
                  correctAnswers: [0, 2, 3],
                  explanation: "Les 4 E : Éduquer, Émouvoir, Étonner, Engager. « Économiser » n'en fait pas partie.",
                },
                {
                  question: "Combien de hashtags maximum recommandons-nous par publication ?",
                  options: ["30", "20", "Environ 8 (3-5 métier + locaux)", "Aucun"],
                  correctAnswers: [2],
                  explanation: "Au-delà d'une dizaine de hashtags, l'effet devient contre-productif.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Faire grandir sa communauté",
        chapters: [
          {
            title: "Les algorithmes expliqués simplement",
            type: "VIDEO",
            videoUrl: V.intro,
            videoDuration: 540,
            content:
              "Ce que récompensent vraiment Facebook, Instagram et TikTok : le temps de visionnage, les partages privés, les commentaires — et comment en tirer parti sans tricher.",
          },
          {
            title: "Programmer et planifier ses publications",
            type: "TEXT",
            content:
              "## Pourquoi programmer ?\n\nLa régularité bat l'intensité. Programmer vos publications une fois par semaine vous garantit une présence constante, même quand l'activité déborde.\n\n## Les outils gratuits\n\n- **Meta Business Suite** — programme Facebook + Instagram, gratuit et officiel.\n- **TikTok Studio** — programmation native jusqu'à 10 jours.\n- **Buffer** (plan gratuit) — multi-réseaux, 10 publications programmées.\n\n## Les meilleurs créneaux en Côte d'Ivoire\n\n- **12h00 – 14h00** : pause déjeuner, fort trafic mobile.\n- **19h00 – 22h00** : pic du soir, le plus engageant.\n- **Dimanche après-midi** : excellent pour les contenus longs.\n\nTestez, mesurez, ajustez : vos statistiques personnelles priment toujours sur les moyennes.\n\n> **Action du chapitre** : programmez votre semaine de publications dans Meta Business Suite.",
          },
          {
            title: "Gérer les commentaires et messages comme un pro",
            type: "TEXT",
            content:
              "## La règle des 2 heures\n\nSur les réseaux, un prospect qui écrit veut une réponse **maintenant**. Au-delà de 2 heures, la probabilité de conclure chute de moitié. Activez les notifications et préparez des réponses types.\n\n## Réponses types à préparer\n\n1. **Demande de prix** → prix + bénéfice + question de relance.\n2. **Objection « c'est cher »** → valeur, facilités de paiement (Mobile Money !), garantie.\n3. **Client mécontent** → excuse sincère, solution concrète, passage en privé.\n\n## Transformer les commentaires en ventes\n\nChaque commentaire est une opportunité publique : votre réponse est lue par des dizaines de prospects silencieux. Répondez toujours proprement, même aux messages désagréables.\n\n> **Action du chapitre** : rédigez vos 3 réponses types et épinglez-les dans WhatsApp Business.",
          },
        ],
      },
      {
        title: "Vendre grâce aux réseaux",
        chapters: [
          {
            title: "Du follower au client : construire son tunnel de vente",
            type: "TEXT",
            content:
              "## Le parcours en 4 étapes\n\n```\nDécouverte → Confiance → Conversation → Vente\n   (contenu)   (preuves)    (WhatsApp)   (Mobile Money)\n```\n\n1. **Découverte** — vos publications attirent l'attention.\n2. **Confiance** — avis clients, photos réelles, régularité.\n3. **Conversation** — le prospect bascule sur WhatsApp : c'est là que tout se joue.\n4. **Vente** — paiement simple : Orange Money, MTN MoMo, Wave.\n\n## Réduire la friction\n\nChaque étape supplémentaire fait perdre des clients. Lien WhatsApp direct dans la bio, catalogue à jour, paiement mobile immédiat : le trio gagnant ivoirien.\n\n## Mesurer ce qui compte\n\nAbonnés = vanité. Conversations démarrées, taux de réponse, ventes conclues = réalité. Suivez ces trois chiffres chaque semaine.\n\n> **Action du chapitre** : ajoutez votre lien wa.me dans toutes vos bios.",
          },
          {
            title: "La publicité Facebook & Instagram pas à pas",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 720,
            content:
              "Création complète d'une première campagne : objectif, audience ivoirienne, budget de 5 000 FCFA/jour, visuel, suivi des résultats. Démonstration en conditions réelles.",
            resources: [
              { label: "Meta Business Suite", url: "https://business.facebook.com" },
            ],
          },
          {
            title: "Quiz final — Vendre en ligne",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Où se conclut généralement la vente en Côte d'Ivoire ?",
                  options: ["Dans les commentaires", "Sur WhatsApp", "Par email", "En boutique uniquement"],
                  correctAnswers: [1],
                  explanation: "Le tunnel ivoirien type : découverte sur les réseaux, conversion en conversation WhatsApp.",
                },
                {
                  question: "Quel indicateur est le PLUS important pour votre business ?",
                  options: [
                    "Le nombre d'abonnés",
                    "Le nombre de likes",
                    "Les ventes conclues",
                    "Le nombre de stories vues",
                  ],
                  correctAnswers: [2],
                  explanation: "Les abonnés et les likes sont des métriques de vanité ; seules les ventes paient les factures.",
                },
                {
                  question: "Quels moyens de paiement réduisent la friction en Côte d'Ivoire ? (plusieurs réponses)",
                  options: ["Orange Money", "Chèque bancaire", "Wave", "MTN MoMo"],
                  correctAnswers: [0, 2, 3],
                  explanation: "Le Mobile Money (Orange, Wave, MTN) est immédiat et universel — le chèque est une friction énorme.",
                },
                {
                  question: "Dans le parcours de vente, qu'est-ce qui crée la « Confiance » ?",
                  options: [
                    "Les avis clients et photos réelles",
                    "Les publicités répétées",
                    "Les prix cachés",
                    "Les messages automatiques",
                  ],
                  correctAnswers: [0],
                  explanation: "Preuves sociales : avis, témoignages, photos réelles et régularité construisent la confiance.",
                },
                {
                  question: "Quelle est la « règle des 2 heures » ?",
                  options: [
                    "Publier toutes les 2 heures",
                    "Répondre aux messages en moins de 2 heures",
                    "Faire 2 heures de live par semaine",
                    "Limiter les publicités à 2 heures",
                  ],
                  correctAnswers: [1],
                  explanation: "Au-delà de 2 heures sans réponse, la probabilité de conclure la vente chute de moitié.",
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    slug: "site-web-nextjs",
    title: "Créer un site web moderne avec Next.js",
    subtitle: "De zéro à la mise en ligne, sans prérequis",
    description:
      "Apprenez à construire un site web professionnel, rapide et bien référencé avec Next.js — le framework qui propulse les plus grands sites du monde. De l'installation de l'environnement jusqu'au déploiement sur Vercel, vous construisez un vrai projet de bout en bout.",
    price: 45000,
    isFree: false,
    level: "INTERMEDIATE",
    categorySlug: "developpement-web",
    instructorEmail: "koffi@digitalaccess.ci",
    rating: 4.9,
    ratingCount: 132,
    enrollmentCount: 540,
    durationMinutes: 720,
    objectives: [
      "Maîtriser l'App Router et les Server Components",
      "Construire des interfaces avec Tailwind CSS",
      "Gérer formulaires et données avec les Server Actions",
      "Déployer un site performant en production",
    ],
    prerequisites: ["Bases de HTML/CSS", "Notions de JavaScript"],
    modules: [
      {
        title: "Introduction",
        chapters: [
          {
            title: "Bienvenue dans le cours",
            type: "VIDEO",
            videoUrl: V.nextjs,
            videoDuration: 300,
            isPreview: true,
            content: "Présentation du projet fil rouge : un site vitrine complet que nous construirons ensemble, chapitre après chapitre.",
          },
          {
            title: "Pourquoi Next.js ?",
            type: "TEXT",
            isPreview: true,
            content:
              "## Le standard de l'industrie\n\nNext.js combine le meilleur de React avec ce qui lui manque : le **rendu serveur** (SSR), la **génération statique** (SSG), le **routage par fichiers** et une **optimisation automatique** des images, polices et scripts.\n\n## Ce que ça change concrètement\n\n- **SEO** : vos pages sont indexables par Google dès la première seconde.\n- **Performance** : idéal pour les connexions 3G/4G de nos utilisateurs.\n- **Productivité** : conventions claires, déploiement en un clic sur Vercel.\n\n## Qui l'utilise ?\n\nNetflix, TikTok, Notion, Nike… et Digital Access ! Les compétences que vous développez ici sont directement monnayables sur le marché.",
          },
          {
            title: "Installer son environnement de travail",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 480,
            content: "Node.js, VS Code, extensions indispensables et création du projet avec `create-next-app`. Tout l'outillage en une vidéo.",
            resources: [
              { label: "Node.js (LTS)", url: "https://nodejs.org" },
              { label: "Visual Studio Code", url: "https://code.visualstudio.com" },
            ],
          },
        ],
      },
      {
        title: "Les bases de Next.js",
        chapters: [
          {
            title: "Pages et routage avec l'App Router",
            type: "VIDEO",
            videoUrl: V.nextjs,
            videoDuration: 600,
            content: "Le dossier `app/`, les fichiers `page.tsx` et `layout.tsx`, les routes dynamiques `[slug]` et les groupes de routes.",
          },
          {
            title: "Composants Serveur vs composants Client",
            type: "TEXT",
            content:
              "## La grande idée de Next.js 15\n\nPar défaut, tout composant est un **Server Component** : il s'exécute sur le serveur, peut lire la base de données directement, et n'envoie aucun JavaScript au navigateur.\n\n```tsx\n// Server Component (par défaut)\nexport default async function Page() {\n  const cours = await getCours(); // accès direct aux données\n  return <Liste cours={cours} />;\n}\n```\n\nOn n'ajoute `\"use client\"` **que** lorsqu'on a besoin d'interactivité : état local, événements, animations.\n\n```tsx\n\"use client\";\nexport function Compteur() {\n  const [n, setN] = useState(0); // hooks = client\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}\n```\n\n## La règle d'or\n\n> Serveur par défaut, client par nécessité. Votre site restera léger et rapide.",
          },
          {
            title: "Quiz — Les bases",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Quel dossier contient les routes dans l'App Router ?",
                  options: ["pages/", "app/", "routes/", "src/components/"],
                  correctAnswers: [1],
                  explanation: "L'App Router (Next.js 13+) utilise le dossier app/ avec ses fichiers page.tsx et layout.tsx.",
                },
                {
                  question: "Quand faut-il ajouter la directive \"use client\" ?",
                  options: [
                    "Sur tous les composants",
                    "Uniquement pour l'interactivité (état, événements, hooks)",
                    "Jamais",
                    "Seulement en production",
                  ],
                  correctAnswers: [1],
                  explanation: "Serveur par défaut, client par nécessité : \"use client\" sert uniquement à l'interactivité.",
                },
                {
                  question: "Quels sont les avantages du rendu serveur ? (plusieurs réponses)",
                  options: [
                    "Meilleur référencement (SEO)",
                    "Moins de JavaScript envoyé au navigateur",
                    "Plus d'animations",
                    "Accès direct à la base de données",
                  ],
                  correctAnswers: [0, 1, 3],
                  explanation: "Le SSR améliore le SEO, allège le bundle client et permet l'accès direct aux données.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Style et interactivité",
        chapters: [
          {
            title: "Tailwind CSS en pratique",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 720,
            content: "Mise en page complète du site fil rouge : grille responsive, dark mode, composants réutilisables.",
          },
          {
            title: "Formulaires et Server Actions",
            type: "TEXT",
            content:
              "## Muter des données sans API\n\nLes **Server Actions** permettent d'appeler une fonction serveur directement depuis un formulaire — sans créer de route API.\n\n```tsx\n// actions.ts\n\"use server\";\nexport async function creerContact(data: FormData) {\n  const nom = data.get(\"nom\");\n  await db.contact.create({ ... });\n}\n```\n\n## Toujours valider côté serveur\n\nNe faites **jamais** confiance aux données du client. Zod est votre meilleur allié :\n\n```ts\nconst schema = z.object({\n  email: z.string().email(),\n  message: z.string().min(10),\n});\n```\n\nValidation côté client pour l'expérience utilisateur, validation côté serveur pour la sécurité : les deux, toujours.",
          },
        ],
      },
      {
        title: "Mise en production",
        chapters: [
          {
            title: "Déployer sur Vercel",
            type: "TEXT",
            content:
              "## Du code au monde entier en 3 minutes\n\n1. Poussez votre code sur **GitHub**.\n2. Importez le dépôt sur **vercel.com** — la configuration est détectée automatiquement.\n3. Chaque `git push` déclenche un déploiement ; chaque pull request obtient son URL de prévisualisation.\n\n## Les variables d'environnement\n\nVos secrets (base de données, clés API) se configurent dans *Settings → Environment Variables* — jamais dans le code.\n\n## Domaine personnalisé\n\nAjoutez votre `.ci` en deux clics et Vercel gère le HTTPS automatiquement.\n\n> **Action finale** : déployez votre projet fil rouge et partagez l'URL dans le forum du cours !",
          },
          {
            title: "Quiz final — Next.js",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Que déclenche un `git push` sur un projet Vercel connecté ?",
                  options: ["Rien", "Un déploiement automatique", "Un email", "Une sauvegarde locale"],
                  correctAnswers: [1],
                  explanation: "Vercel déploie automatiquement chaque push — c'est le principe du déploiement continu.",
                },
                {
                  question: "Où stocker les clés secrètes d'API ?",
                  options: [
                    "Dans le code source",
                    "Dans les variables d'environnement",
                    "Dans un commentaire",
                    "Sur WhatsApp",
                  ],
                  correctAnswers: [1],
                  explanation: "Les secrets vont dans les variables d'environnement, jamais dans le code versionné.",
                },
                {
                  question: "Pourquoi valider les données côté serveur ET côté client ?",
                  options: [
                    "Client = UX immédiate, serveur = sécurité réelle",
                    "C'est plus joli",
                    "Ce n'est pas nécessaire",
                    "Uniquement pour la performance",
                  ],
                  correctAnswers: [0],
                  explanation: "La validation client améliore l'expérience ; seule la validation serveur protège vraiment.",
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    slug: "design-figma",
    title: "Design d'interfaces avec Figma",
    subtitle: "Concevez des interfaces qui convertissent",
    description:
      "Figma est devenu l'outil de référence du design d'interface — gratuit, collaboratif et puissant. Cette formation vous emmène des principes fondamentaux du design jusqu'aux prototypes interactifs prêts à être livrés aux développeurs.",
    price: 35000,
    isFree: false,
    level: "BEGINNER",
    categorySlug: "design-ux-ui",
    instructorEmail: "awa@digitalaccess.ci",
    rating: 4.8,
    ratingCount: 98,
    enrollmentCount: 410,
    durationMinutes: 540,
    objectives: [
      "Maîtriser les frames, composants et l'auto-layout",
      "Construire un système de couleurs et de typographie cohérent",
      "Prototyper des parcours interactifs",
      "Livrer des maquettes propres aux développeurs",
    ],
    prerequisites: ["Aucun — un compte Figma gratuit suffit"],
    modules: [
      {
        title: "Démarrer avec Figma",
        chapters: [
          {
            title: "Bienvenue dans la formation",
            type: "VIDEO",
            videoUrl: V.intro,
            videoDuration: 240,
            isPreview: true,
            content: "Tour d'horizon de l'interface Figma et présentation du projet fil rouge : l'application mobile d'un restaurant abidjanais.",
          },
          {
            title: "Les principes du design d'interface",
            type: "TEXT",
            content:
              "## Les 4 principes fondamentaux\n\n1. **Hiérarchie** — l'œil doit savoir où regarder en premier. Taille, graisse, couleur : chaque élément a un rang.\n2. **Espacement** — l'espace blanc n'est pas du vide, c'est de la respiration. Un design aéré paraît premium.\n3. **Cohérence** — mêmes boutons, mêmes espacements, mêmes couleurs partout. La cohérence crée la confiance.\n4. **Contraste** — le texte doit rester lisible par tous (norme WCAG AA : ratio 4,5:1 minimum).\n\n## L'erreur du débutant\n\nVouloir décorer au lieu de structurer. Un bon design commence en noir et blanc : si la hiérarchie fonctionne sans couleur, elle fonctionnera avec.\n\n> **Action du chapitre** : analysez votre application préférée et identifiez ces 4 principes.",
          },
        ],
      },
      {
        title: "Construire ses maquettes",
        chapters: [
          {
            title: "Maîtriser les frames et l'auto-layout",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 660,
            content: "L'auto-layout est LA fonctionnalité qui sépare les amateurs des professionnels : des maquettes qui s'adaptent toutes seules.",
          },
          {
            title: "Couleurs et typographie : créer son système",
            type: "TEXT",
            content:
              "## La palette 60-30-10\n\n- **60 %** : couleur dominante (fonds, surfaces)\n- **30 %** : couleur secondaire (blocs, cartes)\n- **10 %** : couleur d'accent (boutons, liens — l'action !)\n\n## La typographie en 3 niveaux\n\n| Rôle | Taille | Graisse |\n|------|--------|---------|\n| Titres | 24–40 px | Bold (700) |\n| Corps | 16 px | Regular (400) |\n| Légendes | 12–14 px | Medium (500) |\n\nDeux polices maximum par projet. Dans Figma, enregistrez tout en **styles** : un changement se propage à toute la maquette.\n\n> **Action du chapitre** : créez vos styles de couleurs et de textes dans le projet fil rouge.",
          },
          {
            title: "Quiz — Les bases du design",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Que signifie la règle 60-30-10 ?",
                  options: [
                    "Les proportions de la palette de couleurs",
                    "Les tailles de police",
                    "Les marges en pixels",
                    "Le taux de conversion",
                  ],
                  correctAnswers: [0],
                  explanation: "60 % dominante, 30 % secondaire, 10 % accent : l'équilibre classique d'une palette.",
                },
                {
                  question: "Combien de polices maximum par projet ?",
                  options: ["1", "2", "5", "Autant qu'on veut"],
                  correctAnswers: [1],
                  explanation: "Deux polices maximum : une pour les titres, une pour le corps. Au-delà, le design se disperse.",
                },
                {
                  question: "Quels sont des principes fondamentaux du design d'interface ? (plusieurs réponses)",
                  options: ["Hiérarchie", "Décoration", "Espacement", "Cohérence"],
                  correctAnswers: [0, 2, 3],
                  explanation: "Hiérarchie, espacement, cohérence (et contraste). La décoration n'est pas un principe — c'est souvent un piège.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Prototyper et livrer",
        chapters: [
          {
            title: "Prototyper ses écrans",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 540,
            content: "Connexions, smart animate, overlays : transformez vos maquettes statiques en prototype cliquable à présenter au client.",
          },
          {
            title: "Préparer ses maquettes pour les développeurs",
            type: "TEXT",
            content:
              "## Le handoff professionnel\n\nUne maquette livrée sans préparation fait perdre des heures aux développeurs. Checklist avant livraison :\n\n- [ ] Calques **nommés** proprement (pas de « Rectangle 47 »)\n- [ ] Composants et styles utilisés partout\n- [ ] États prévus : hover, focus, erreur, vide, chargement\n- [ ] Version mobile ET desktop\n- [ ] Mode développeur (Dev Mode) activé sur le fichier\n\n## Communiquer les intentions\n\nAnnotez les comportements invisibles : animations attendues, règles de validation, contenus dynamiques. Le pixel ne dit pas tout.\n\n> **Action finale** : livrez le projet fil rouge en Dev Mode et récoltez le retour d'un développeur !",
          },
        ],
      },
    ],
  },

  {
    slug: "excel-avance",
    title: "Excel avancé pour la gestion",
    subtitle: "Tableaux croisés, formules et automatisation",
    description:
      "Excel reste l'outil n°1 de la gestion d'entreprise. Cette formation avancée vous fait passer du niveau « je saisis des données » au niveau « je construis des tableaux de bord qui pilotent l'activité » : formules puissantes, tableaux croisés dynamiques, graphiques et macros.",
    price: 25000,
    isFree: false,
    level: "ADVANCED",
    categorySlug: "bureautique",
    instructorEmail: "grace@digitalaccess.ci",
    rating: 4.9,
    ratingCount: 76,
    enrollmentCount: 320,
    durationMinutes: 480,
    objectives: [
      "Maîtriser RECHERCHEX, SI.CONDITIONS et les fonctions clés",
      "Construire des tableaux croisés dynamiques",
      "Créer des tableaux de bord visuels",
      "Automatiser les tâches répétitives avec les macros",
    ],
    prerequisites: ["Bonne pratique d'Excel (formules simples, mise en forme)"],
    modules: [
      {
        title: "Les formules qui changent tout",
        chapters: [
          {
            title: "Bienvenue dans la formation",
            type: "VIDEO",
            videoUrl: V.intro,
            videoDuration: 180,
            isPreview: true,
            content: "Présentation du fichier fil rouge : la gestion complète d'une PME de distribution à Abidjan (ventes, stock, salaires).",
          },
          {
            title: "Références absolues et fonctions clés",
            type: "TEXT",
            content:
              "## Le dollar qui change tout : $A$1\n\nUne référence **relative** (`A1`) se décale quand on recopie la formule ; une référence **absolue** (`$A$1`) reste fixe. Maîtriser cette différence, c'est débloquer 80 % des formules avancées.\n\n## Les 5 fonctions indispensables du gestionnaire\n\n1. `RECHERCHEX(valeur; plage_recherche; plage_retour)` — la remplaçante moderne de RECHERCHEV.\n2. `SI.CONDITIONS(test1; valeur1; test2; valeur2; …)` — des conditions multiples lisibles.\n3. `SOMME.SI.ENS` — additionner selon plusieurs critères.\n4. `NB.SI.ENS` — compter selon plusieurs critères.\n5. `SIERREUR(formule; \"—\")` — des tableaux propres, sans #N/A.\n\n## Exemple concret\n\n```\n=SIERREUR(RECHERCHEX(A2;Produits[Code];Produits[Prix]);\"Produit inconnu\")\n```\n\nCette formule cherche le prix d'un produit et affiche un message clair si le code n'existe pas.\n\n> **Action du chapitre** : remplacez vos RECHERCHEV par RECHERCHEX dans le fichier fil rouge.",
          },
        ],
      },
      {
        title: "Analyser avec les tableaux croisés",
        chapters: [
          {
            title: "Tableaux croisés dynamiques : l'analyse sans formule",
            type: "TEXT",
            content:
              "## L'outil le plus puissant d'Excel\n\nUn tableau croisé dynamique (TCD) résume des milliers de lignes en quelques secondes : ventes par mois, par vendeur, par région — sans écrire une seule formule.\n\n## La préparation des données\n\nUn TCD exige des données propres :\n\n- Une ligne d'en-têtes unique, sans cellules fusionnées\n- Une ligne = un enregistrement\n- Pas de lignes ou colonnes vides\n- Idéalement : transformez la plage en **Tableau** (Ctrl+L)\n\n## Les 4 zones du TCD\n\n| Zone | Rôle | Exemple |\n|------|------|---------|\n| Lignes | Regrouper | Vendeur |\n| Colonnes | Comparer | Mois |\n| Valeurs | Calculer | Somme des ventes |\n| Filtres | Cibler | Région |\n\n## Aller plus loin\n\nGroupez les dates par mois/trimestre, ajoutez des **segments** (boutons de filtre visuels) et des champs calculés (marge = ventes − coûts).\n\n> **Action du chapitre** : construisez le TCD « ventes par vendeur et par mois » du fichier fil rouge.",
          },
          {
            title: "Graphiques et tableaux de bord",
            type: "VIDEO",
            videoUrl: V.demo,
            videoDuration: 600,
            content: "Construction d'un tableau de bord complet : indicateurs clés, graphiques dynamiques reliés aux segments, mise en page professionnelle.",
          },
          {
            title: "Quiz — Analyse de données",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  question: "Que fait la référence $A$1 lors d'une recopie de formule ?",
                  options: ["Elle se décale", "Elle reste fixe", "Elle s'efface", "Elle double sa valeur"],
                  correctAnswers: [1],
                  explanation: "Le symbole $ fige la référence : elle ne bouge pas lors de la recopie.",
                },
                {
                  question: "Quelle fonction moderne remplace RECHERCHEV ?",
                  options: ["INDEX", "RECHERCHEX", "EQUIV", "CHERCHE"],
                  correctAnswers: [1],
                  explanation: "RECHERCHEX est plus simple, plus lisible et cherche dans les deux sens.",
                },
                {
                  question: "Que faut-il pour construire un bon tableau croisé dynamique ? (plusieurs réponses)",
                  options: [
                    "Une ligne d'en-têtes unique",
                    "Des cellules fusionnées",
                    "Une ligne par enregistrement",
                    "Des données transformées en Tableau",
                  ],
                  correctAnswers: [0, 2, 3],
                  explanation: "Les cellules fusionnées sont l'ennemi n°1 des TCD — tout le reste est indispensable.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Automatiser son travail",
        chapters: [
          {
            title: "Automatiser avec les macros",
            type: "TEXT",
            content:
              "## L'enregistreur de macros : l'automatisation sans code\n\nOnglet **Développeur → Enregistrer une macro** : Excel mémorise vos actions (mise en forme, tri, filtres, impression) et peut les rejouer à l'infini d'un raccourci clavier.\n\n## Les bons candidats à l'automatisation\n\n- Le rapport hebdomadaire mis en forme chaque lundi\n- L'import et le nettoyage du même fichier CSV\n- L'impression des bulletins ou factures en série\n\n## Les règles de prudence\n\n1. Enregistrez toujours dans un classeur **.xlsm**.\n2. Testez sur une **copie** des données.\n3. Utilisez les **références relatives** quand l'action doit s'appliquer « ici », absolues quand elle vise toujours la même plage.\n\n## Aller plus loin\n\nL'éditeur VBA (Alt+F11) permet de retoucher les macros enregistrées — première marche vers l'automatisation sur mesure.\n\n> **Action finale** : automatisez la mise en forme du rapport de ventes du fichier fil rouge.",
          },
        ],
      },
    ],
  },
];

/* ─────────────────────────────── Catégories ───────────────────────────────── */

const categories = [
  { name: "Développement Web", slug: "developpement-web", icon: "code", color: "#2B5CC6", description: "Créez des sites et applications web modernes." },
  { name: "Design & UX/UI", slug: "design-ux-ui", icon: "palette", color: "#7C3AED", description: "Concevez des interfaces belles et efficaces." },
  { name: "Marketing Digital", slug: "marketing-digital", icon: "megaphone", color: "#00BCD4", description: "Développez votre audience et vos ventes en ligne." },
  { name: "Bureautique", slug: "bureautique", icon: "file-text", color: "#059669", description: "Maîtrisez les outils du quotidien professionnel." },
  { name: "Entrepreneuriat", slug: "entrepreneuriat", icon: "rocket", color: "#F59E0B", description: "Lancez et développez votre activité." },
  { name: "Data & IA", slug: "data-ia", icon: "brain", color: "#1E8FE1", description: "Exploitez la puissance des données et de l'IA." },
];

/* ──────────────────────────────── Utilisateurs ────────────────────────────── */

const instructors = [
  { email: "koffi@digitalaccess.ci", name: "Koffi N'Guessan", bio: "Développeur fullstack et formateur passionné. 8 ans d'expérience sur React et Next.js, des dizaines de sites livrés pour des PME ivoiriennes." },
  { email: "awa@digitalaccess.ci", name: "Awa Diallo", bio: "Designer produit senior. Elle a conçu les interfaces d'applications bancaires et e-commerce utilisées par des millions d'Ouest-Africains." },
  { email: "marc@digitalaccess.ci", name: "Marc Apo", bio: "Consultant en marketing digital. Il accompagne commerces et marques ivoiriennes dans leur croissance sur les réseaux sociaux depuis 2018." },
  { email: "grace@digitalaccess.ci", name: "Grace Kouassi", bio: "Contrôleuse de gestion et experte Excel certifiée. Elle forme les équipes financières de grandes entreprises d'Abidjan." },
];

const reviewers = [
  { email: "fatou.b@example.ci", name: "Fatou Bamba" },
  { email: "ibrahim.s@example.ci", name: "Ibrahim Sanogo" },
  { email: "mariam.c@example.ci", name: "Mariam Coulibaly" },
  { email: "jean.k@example.ci", name: "Jean Kouamé" },
];

const reviewTexts: Record<string, { rating: number; comment: string }[]> = {
  "marketing-reseaux-sociaux": [
    { rating: 5, comment: "Formation très concrète, adaptée à la réalité ivoirienne. Mes ventes WhatsApp ont doublé en un mois !" },
    { rating: 5, comment: "Enfin des exemples locaux ! La méthode AIDA a transformé mes publications." },
    { rating: 4, comment: "Excellent contenu, très accessible. J'aurais aimé encore plus de cas TikTok." },
  ],
  "site-web-nextjs": [
    { rating: 5, comment: "Le cours le plus clair que j'aie suivi sur Next.js, en français en plus. Le projet fil rouge est top." },
    { rating: 5, comment: "De zéro à mon premier site en ligne. Koffi explique remarquablement bien." },
  ],
  "design-figma": [
    { rating: 5, comment: "Awa est une pédagogue exceptionnelle. L'auto-layout n'a plus de secret pour moi." },
    { rating: 4, comment: "Très bon cours, le module sur le handoff développeur vaut de l'or." },
  ],
  "excel-avance": [
    { rating: 5, comment: "Les TCD ont changé ma façon de travailler. Je gagne des heures chaque semaine." },
    { rating: 5, comment: "Formation dense et efficace. Le fichier fil rouge est directement réutilisable au bureau." },
  ],
};

/* ─────────────────────────────────── Seed ─────────────────────────────────── */

async function main() {
  console.log("🌱 Seed Digital Access — écosystème complet…");
  const passwordHash = await bcrypt.hash("DigitalAccess2026!", 12);

  /* ── Utilisateurs ── */
  const admin = await prisma.user.upsert({
    where: { email: "admin@digitalaccess.ci" },
    update: {},
    create: {
      name: "Administrateur DA",
      email: "admin@digitalaccess.ci",
      password: passwordHash,
      roles: ["ADMIN", "SUPER_ADMIN"],
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const instructorIds: Record<string, string> = {};
  for (const i of instructors) {
    const u = await prisma.user.upsert({
      where: { email: i.email },
      update: { bio: i.bio, roles: ["INSTRUCTOR", "LEARNER"] },
      create: {
        name: i.name,
        email: i.email,
        password: passwordHash,
        roles: ["INSTRUCTOR", "LEARNER"],
        bio: i.bio,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    instructorIds[i.email] = u.id;
  }

  const reviewerIds: string[] = [];
  for (const r of reviewers) {
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        name: r.name,
        email: r.email,
        password: passwordHash,
        roles: ["LEARNER"],
        emailVerified: new Date(),
        isActive: true,
      },
    });
    reviewerIds.push(u.id);
  }

  const demoLearner = await prisma.user.upsert({
    where: { email: "apprenant@digitalaccess.ci" },
    update: {},
    create: {
      name: "Aya Apprenante",
      email: "apprenant@digitalaccess.ci",
      password: passwordHash,
      roles: ["LEARNER"],
      emailVerified: new Date(),
      isActive: true,
      streak: 3,
      xp: 65,
      lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  /* ── Catégories ── */
  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { icon: c.icon, color: c.color, description: c.description },
      create: c,
    });
    categoryIds[c.slug] = cat.id;
  }

  /* ── Cours (recréés à neuf pour un contenu à jour) ── */
  await prisma.course.deleteMany({});
  console.log("  ↳ anciens cours purgés, création du contenu…");

  const firstChapterIds: Record<string, string[]> = {};
  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        description: c.description,
        price: c.price,
        isFree: c.isFree,
        level: c.level,
        status: "PUBLISHED",
        rating: c.rating,
        ratingCount: c.ratingCount,
        enrollmentCount: c.enrollmentCount,
        durationMinutes: c.durationMinutes,
        objectives: c.objectives,
        prerequisites: c.prerequisites,
        publishedAt: new Date(),
        instructorId: instructorIds[c.instructorEmail]!,
        categoryId: categoryIds[c.categorySlug]!,
        modules: {
          create: c.modules.map((m, mi) => ({
            title: m.title,
            position: mi + 1,
            chapters: {
              create: m.chapters.map((ch, ci) => ({
                title: ch.title,
                type: ch.type,
                position: ci + 1,
                isPreview: ch.isPreview ?? false,
                content: ch.content ?? null,
                videoUrl: ch.videoUrl ?? null,
                videoDuration: ch.videoDuration ?? 0,
                resources: ch.resources ?? [],
                ...(ch.quiz
                  ? {
                      quiz: {
                        create: {
                          passingScore: ch.quiz.passingScore ?? 70,
                          questions: {
                            create: ch.quiz.questions.map((q, qi) => ({
                              question: q.question,
                              options: q.options,
                              correctAnswers: q.correctAnswers,
                              explanation: q.explanation,
                              position: qi + 1,
                            })),
                          },
                        },
                      },
                    }
                  : {}),
              })),
            },
          })),
        },
      },
      select: {
        id: true,
        slug: true,
        modules: {
          orderBy: { position: "asc" },
          select: { chapters: { orderBy: { position: "asc" }, select: { id: true } } },
        },
      },
    });
    firstChapterIds[c.slug] = course.modules.flatMap((m) => m.chapters.map((ch) => ch.id));

    /* Avis */
    const reviews = reviewTexts[c.slug] ?? [];
    for (let ri = 0; ri < reviews.length; ri++) {
      await prisma.review.create({
        data: {
          userId: reviewerIds[ri % reviewerIds.length]!,
          courseId: course.id,
          rating: reviews[ri]!.rating,
          comment: reviews[ri]!.comment,
        },
      });
    }

    /* Salon de chat (S11) */
    await prisma.chatRoom.create({ data: { courseId: course.id } });
    console.log(`  ↳ cours créé : ${c.title}`);
  }

  /* ── Apprenant de démo : inscrit au cours gratuit, 3 chapitres complétés ── */
  const marketingCourse = await prisma.course.findUnique({
    where: { slug: "marketing-reseaux-sociaux" },
    select: { id: true },
  });
  if (marketingCourse) {
    const chapters = firstChapterIds["marketing-reseaux-sociaux"] ?? [];
    const done = chapters.slice(0, 3);
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: demoLearner.id,
        courseId: marketingCourse.id,
        progress: Math.round((done.length / chapters.length) * 100),
        progresses: {
          create: done.map((chapterId) => ({
            chapterId,
            completed: true,
            completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          })),
        },
      },
      select: { id: true },
    });
    console.log(`  ↳ apprenant de démo inscrit (enrollment ${enrollment.id})`);
  }

  /* ── Portail client (apps/web) : client de démo + projet complet ── */
  const client = await prisma.user.upsert({
    where: { email: "client@digitalaccess.ci" },
    update: {},
    create: {
      name: "Aïcha Koné",
      email: "client@digitalaccess.ci",
      password: passwordHash,
      roles: ["CLIENT", "LEARNER"],
      emailVerified: new Date(),
      isActive: true,
      phone: "+225 07 11 22 33 44",
      location: "Cocody, Abidjan",
    },
  });

  const existingProject = await prisma.project.findUnique({
    where: { slug: "boutique-elegance-ecommerce" },
    select: { id: true },
  });

  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title: "Boutique Élégance — Site e-commerce",
        slug: "boutique-elegance-ecommerce",
        type: "SITE_VITRINE",
        description:
          "Création d'une boutique en ligne de prêt-à-porter féminin : catalogue produits, panier, paiement Mobile Money et espace d'administration.",
        budget: 850000,
        status: "IN_PROGRESS",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        stages: {
          create: [
            {
              name: "Devis & cadrage",
              description: "Définition du besoin, du périmètre et du calendrier.",
              status: "COMPLETED",
              position: 1,
              completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
              deliverables: [],
            },
            {
              name: "Acompte reçu",
              description: "Versement de l'acompte de 40 % pour lancer le projet.",
              status: "COMPLETED",
              position: 2,
              completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
              deliverables: [],
            },
            {
              name: "Maquette & design",
              description: "Conception des maquettes validées ensemble.",
              status: "COMPLETED",
              position: 3,
              completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
              deliverables: [],
            },
            {
              name: "Intégration & développement",
              description: "Développement du site, du catalogue et du paiement.",
              status: "IN_PROGRESS",
              position: 4,
              deliverables: [],
            },
            {
              name: "Corrections & recette",
              description: "Vos retours et les ajustements finaux.",
              status: "PENDING",
              position: 5,
              deliverables: [],
            },
            {
              name: "Mise en ligne",
              description: "Déploiement en production et formation.",
              status: "PENDING",
              position: 6,
              deliverables: [],
            },
          ],
        },
        messages: {
          create: [
            {
              userId: admin.id,
              content:
                "Bonjour Aïcha ! Les maquettes de la page d'accueil et de la fiche produit sont prêtes. Dites-nous ce que vous en pensez.",
            },
            {
              userId: client.id,
              content:
                "Bonjour ! Elles sont superbes, j'adore les couleurs. J'aimerais juste un logo un peu plus grand dans l'en-tête.",
            },
            {
              userId: admin.id,
              content: "C'est noté, nous ajustons ça dès aujourd'hui. Bon week-end !",
            },
          ],
        },
      },
      select: { id: true },
    });

    await prisma.invoice.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        number: "DA-2026-0042",
        items: [
          { label: "Acompte — Site e-commerce Boutique Élégance (40 %)", quantity: 1, unitPrice: 340000 },
        ],
        amount: 340000,
        tax: 0,
        total: 340000,
        status: "PAID",
        dueDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.invoice.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        number: "DA-2026-0043",
        items: [
          { label: "Solde — Site e-commerce Boutique Élégance (60 %)", quantity: 1, unitPrice: 510000 },
        ],
        amount: 510000,
        tax: 0,
        total: 510000,
        status: "SENT",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.maintenanceContract.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        plan: "STANDARD",
        services: [
          "Mises à jour de sécurité",
          "Sauvegardes hebdomadaires",
          "Support prioritaire par ticket",
          "2 h de modifications / mois",
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        monthlyAmount: 25000,
      },
    });

    await prisma.ticket.create({
      data: {
        clientId: client.id,
        projectId: project.id,
        title: "Ajouter le mode de paiement Wave",
        description:
          "Bonjour, serait-il possible d'ajouter Wave en plus d'Orange Money sur la page de paiement ? Merci !",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        messages: {
          create: [
            {
              userId: admin.id,
              content:
                "Bonjour Aïcha, tout à fait ! Nous intégrons Wave cette semaine, je vous tiens informée dès que c'est en ligne.",
            },
          ],
        },
      },
    });

    console.log(`  ↳ portail client de démo créé (projet ${project.id})`);
  }

  /* ── Contenu du site vitrine (inchangé) ── */
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        { name: "Aïcha Koné", role: "Directrice", company: "Boutique Élégance", content: "Digital Access a transformé notre présence en ligne.", rating: 5, featured: true },
        { name: "Dr. Mamadou Traoré", role: "Fondateur", company: "Clinique La Providence", content: "Un travail sérieux et un vrai sens du détail.", rating: 5, featured: true },
      ],
    });
  }

  await prisma.portfolioProject.upsert({
    where: { slug: "boutique-elegance" },
    update: {},
    create: {
      title: "Boutique Élégance — E-commerce mode",
      slug: "boutique-elegance",
      description: "Refonte complète et boutique en ligne.",
      client: "Boutique Élégance Abidjan",
      type: "Site E-commerce",
      technologies: ["Next.js", "Tailwind CSS", "CinetPay"],
      featured: true,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "pourquoi-site-web-2026" },
    update: {},
    create: {
      title: "Pourquoi votre entreprise a besoin d'un site web en 2026",
      slug: "pourquoi-site-web-2026",
      excerpt: "Une présence en ligne n'est plus un luxe mais une nécessité.",
      content: "# Introduction\nÀ l'ère du digital…",
      category: "Stratégie digitale",
      status: "PUBLISHED",
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

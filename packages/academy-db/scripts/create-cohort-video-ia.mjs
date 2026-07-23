// Crée la formation « Création de vidéos publicitaires avec l'IA » + sa cohorte
// « Août 2026 » (parcours autonome en 9 modules + webinaires d'accompagnement).
// Idempotent : reconstruit intégralement à chaque exécution (upsert par slug).
//   node --env-file=../../.env scripts/create-cohort-video-ia.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const DIRECT = process.env.ACADEMY_DATABASE_URL_UNPOOLED || process.env.ACADEMY_DATABASE_URL;
const POOLED = process.env.ACADEMY_DATABASE_URL;
if (!DIRECT) {
  console.error("❌ ACADEMY_DATABASE_URL(_UNPOOLED) manquante (charger la racine .env).");
  process.exit(1);
}
const prisma = new PrismaClient({ datasourceUrl: DIRECT });

async function wake() {
  const p = new PrismaClient({ datasourceUrl: POOLED });
  for (let i = 0; i < 20; i++) {
    try { await p.$queryRawUnsafe("SELECT 1"); break; } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  await p.$disconnect();
}

/* Abidjan = UTC+0 → l'heure locale est stockée telle quelle en UTC. */
const at = (iso) => new Date(`${iso}:00.000Z`);

const COURSE_SLUG = "creation-de-videos-publicitaires-avec-lia";
const COHORT_SLUG = "creation-videos-publicitaires-ia-aout-2026";

/* ─────────────────────────── Fiche de la formation ───────────────────────── */
const FICHE = {
  code: "DES-019",
  title: "Création de vidéos publicitaires avec l'intelligence artificielle",
  subtitle:
    "Concevez et produisez, en autonomie, une vraie publicité vidéo (30–60 s) avec ChatGPT, Veo 3, ElevenLabs et CapCut — du brief au montage final, prête pour votre portfolio.",
  description:
    "## Présentation\n\n" +
    "Cette formation permet d'apprendre, **en toute autonomie**, à concevoir et produire une vidéo publicitaire complète à l'aide d'outils d'intelligence artificielle et de montage vidéo.\n\n" +
    "Le parcours couvre toutes les étapes de production : définition du besoin publicitaire, identification de la cible, concept et scénario, storyboard, génération des scènes vidéo, voix off, montage, habillage sonore et export de la vidéo finale.\n\n" +
    "## Les outils\n\n" +
    "- **ChatGPT** — réflexion créative, brief, scénario, storyboard et prompts ;\n" +
    "- **Veo 3** — génération et animation des scènes vidéo ;\n" +
    "- **ElevenLabs** — création de la voix off ;\n" +
    "- **CapCut** — montage, mixage, sous-titres et export final.\n\n" +
    "## Un projet fil rouge\n\n" +
    "Dès le début, chaque participant choisit un produit, un service, une entreprise, une association ou un projet à promouvoir. Chaque module produit une partie de ce projet unique : vous ne réalisez pas des exercices isolés, vous construisez progressivement une seule production complète.\n\n" +
    "À la fin, vous disposez d'une **vidéo publicitaire professionnelle (30–60 s)** que vous pouvez présenter dans votre portfolio ou utiliser pour promouvoir votre projet.\n\n" +
    "| Étape | Production attendue | Module |\n|---|---|---|\n" +
    "| 1 | Choix du projet | Module 1 |\n| 2 | Brief publicitaire | Module 2 |\n| 3 | Scénario | Module 3 |\n" +
    "| 4 | Storyboard & prompts | Module 4 |\n| 5 | Scènes vidéo générées | Module 5 |\n| 6 | Voix off | Module 6 |\n" +
    "| 7 | Première version montée | Module 7 |\n| 8 | Vidéo finale | Module 8 |\n| 9 | Présentation portfolio | Module 9 |",
  objectives: [
    "Analyser un besoin de communication publicitaire",
    "Définir la cible d'une publicité",
    "Déterminer le message principal et l'appel à l'action",
    "Rédiger un brief créatif",
    "Concevoir un concept publicitaire avec ChatGPT",
    "Rédiger un scénario adapté à une vidéo courte",
    "Transformer le scénario en storyboard",
    "Rédiger des prompts de génération vidéo",
    "Générer des scènes avec Veo 3",
    "Améliorer la cohérence entre plusieurs scènes",
    "Rédiger un texte de voix off",
    "Générer une voix off avec ElevenLabs",
    "Monter une publicité dans CapCut",
    "Synchroniser les scènes, la voix et la musique",
    "Ajouter des textes, sous-titres, logos et appels à l'action",
    "Exporter une vidéo adaptée aux réseaux sociaux",
    "Présenter une réalisation professionnelle dans un portfolio",
  ],
  targetAudience: [
    "Entrepreneurs et responsables de petites et moyennes entreprises",
    "Créateurs de contenu et community managers",
    "Responsables de communication et chargés de marketing",
    "Responsables d'associations et promoteurs de projets",
    "Formateurs, freelances et infographistes",
    "Étudiants souhaitant développer des compétences en création de contenu",
  ],
  prerequisitesText: [
    "Savoir utiliser un ordinateur et naviguer sur Internet",
    "Disposer d'une adresse électronique et pouvoir créer des comptes sur les outils utilisés",
    "Disposer d'un ordinateur (portable ou de bureau) et d'une connexion Internet stable",
    "Savoir télécharger et organiser des fichiers",
    "Prévoir des écouteurs ou un casque audio",
    "Avoir un produit, un service, une organisation ou un projet à promouvoir",
    "Connaître les bases de CapCut est un plus (non obligatoire)",
  ],
  tools: ["ChatGPT", "Veo 3", "ElevenLabs", "CapCut"],
  level: "BEGINNER",
  price: 50000,
  durationHours: 30,
  certificateTitle: "Certificat de réussite — Création de vidéos publicitaires avec l'intelligence artificielle",
};

/* Aide : leçon vidéo (URL à fournir par le formateur via le studio). */
const video = (title, desc) => ({
  type: "VIDEO",
  title,
  videoUrl: null,
  content: `> ▶️ **Vidéo de démonstration à intégrer par le formateur** (bouton « Modifier la leçon » du studio).\n\n${desc}`,
  durationMinutes: 12,
});
const read = (title, content) => ({ type: "TEXT", title, content, durationMinutes: 18 });
const link = (title, url, content) => ({ type: "EXTERNAL_LINK", title, externalUrl: url, content, durationMinutes: 8 });

/* Leçon « plan du module » construite à partir de l'ossature (objectifs +
   contenus + activité). Le contenu détaillé et les démonstrations vidéo seront
   mis en ligne par le formateur — d'où le rappel en bas de leçon. */
const planLesson = (objectives, contents, activity) =>
  read(
    "Plan et notions clés du module",
    `## Objectifs\n\n${objectives.map((o) => `- ${o}`).join("\n")}\n\n` +
      `## Au programme\n\n${contents.map((c) => `- ${c}`).join("\n")}\n\n` +
      `## Activité pratique\n\n${activity}\n\n` +
      `> 📚 Le contenu détaillé (leçons pas à pas et démonstrations vidéo) de ce module sera mis en ligne par le formateur.`,
  );
/* Emplacement de la vidéo de démonstration (URL à fournir via le studio). */
const demoLesson = (theme) =>
  video(`Démonstration — ${theme}`, `Démonstration pratique : ${theme}.`);

/* ─── Question helpers (encodage identique à import-content.mjs) ─── */
const scq = (question, options, correctIndex, explanation) => ({ type: "SINGLE_CHOICE", question, options, correctIndex, explanation, points: 1 });
const mcq = (question, options, correctIndexes, explanation) => ({ type: "MULTIPLE_CHOICE", question, options, correctIndexes, explanation, points: 2 });
const tf = (question, correctTrue, explanation) => ({ type: "TRUE_FALSE", question, correctTrue, explanation, points: 1 });

/* Construit un module à partir de l'ossature pédagogique (squelette fourni).
   Le contenu détaillé des leçons sera fourni ensuite par le formateur : ici on
   pose la structure (plan + emplacement vidéo), l'autoévaluation et le livrable. */
const mod = ({ title, description, theme, objectives, contents, activity, quiz, assignment }) => ({
  title,
  description,
  objectives,
  lessons: [planLesson(objectives, contents, activity), demoLesson(theme)],
  quiz,
  assignment,
});

/* ───────────────── 9 modules (ossature — projet fil rouge) ─────────────────── */
const MODULES = [
  mod({
    title: "Module 1 — Comprendre la vidéo publicitaire assistée par IA",
    description: "Comprendre ce qu'est une vidéo publicitaire, ses étapes de production et le rôle de chaque outil, puis choisir le sujet de son projet fil rouge.",
    theme: "panorama et outils de la publicité vidéo IA",
    objectives: [
      "Comprendre les caractéristiques d'une vidéo publicitaire",
      "Identifier les différentes étapes de production",
      "Découvrir le rôle de chaque outil (ChatGPT, Veo 3, ElevenLabs, CapCut)",
      "Choisir le sujet du projet fil rouge",
    ],
    contents: [
      "Qu'est-ce qu'une vidéo publicitaire ?",
      "Différence entre vidéo informative et vidéo publicitaire",
      "Les principaux formats publicitaires",
      "Les étapes de création d'une publicité",
      "Présentation de ChatGPT, Veo 3, ElevenLabs et CapCut",
      "Limites et responsabilités liées à l'utilisation de l'IA",
      "Présentation du projet final",
    ],
    activity: "Choisir le produit, le service ou le projet qui sera utilisé pendant toute la formation.",
    quiz: {
      title: "Autoévaluation — Comprendre la publicité vidéo IA",
      questions: [
        scq("Qu'est-ce qui distingue une vidéo publicitaire d'une vidéo simplement informative ?", ["Sa durée", "Elle vise une action précise de la cible", "La qualité de l'image", "Le format du fichier"], 1, "La publicité cherche à déclencher une action (le fameux appel à l'action)."),
        mcq("Quels outils sont utilisés dans cette formation ?", ["ChatGPT", "Veo 3", "Photoshop", "CapCut"], [0, 1, 3], "ChatGPT, Veo 3, ElevenLabs et CapCut — pas Photoshop."),
        tf("Une vidéo publicitaire efficace se termine généralement par un appel à l'action.", true, "Le CTA indique au spectateur quoi faire ensuite."),
      ],
    },
    assignment: { title: "Livrable — Fiche de présentation du projet", description: "**Livrable du module 1.** Déposez une fiche de présentation de votre projet fil rouge comportant : le nom du projet ; le produit ou service concerné ; la cible principale ; le besoin de communication ; le canal de diffusion envisagé. Formats acceptés : PDF, DOCX ou texte." },
  }),
  mod({
    title: "Module 2 — Définir le brief et le concept publicitaire avec ChatGPT",
    description: "Transformer un besoin en concept créatif : cible, promesse, ton et appel à l'action, en explorant plusieurs idées avec ChatGPT.",
    theme: "brief et concept avec ChatGPT",
    objectives: [
      "Identifier le besoin du client ou du projet",
      "Définir la cible",
      "Clarifier la promesse publicitaire",
      "Construire un concept créatif",
    ],
    contents: [
      "Le rôle du brief publicitaire",
      "L'objectif de communication",
      "La cible principale",
      "Le problème ou besoin de la cible",
      "La proposition de valeur",
      "La promesse publicitaire",
      "Le ton de communication et l'émotion recherchée",
      "L'appel à l'action",
      "Utiliser ChatGPT pour explorer plusieurs idées",
      "Comparer et sélectionner un concept",
    ],
    activity: "Utiliser ChatGPT pour produire trois concepts publicitaires différents à partir du projet choisi.",
    quiz: {
      title: "Autoévaluation — Brief & concept",
      questions: [
        scq("La proposition de valeur exprime avant tout…", ["le prix du produit", "le principal bénéfice pour la cible", "le format d'export", "le nom de la marque"], 1, "C'est le bénéfice n°1 pour la cible, formulé simplement."),
        tf("Un même brief peut donner lieu à plusieurs concepts créatifs différents.", true, "On diverge avant de sélectionner le concept le plus fort."),
        scq("À l'étape du concept, ChatGPT sert surtout à…", ["monter la vidéo", "explorer et comparer plusieurs idées créatives", "générer la voix off", "exporter la vidéo"], 1, "ChatGPT aide à générer et comparer des angles créatifs."),
      ],
    },
    assignment: { title: "Livrable — Brief publicitaire", description: "**Livrable du module 2.** Déposez un brief publicitaire validé comprenant : la cible ; l'objectif ; le message principal ; la promesse ; le ton ; l'appel à l'action ; le concept retenu. PDF ou DOCX." },
  }),
  mod({
    title: "Module 3 — Rédiger le scénario publicitaire",
    description: "Structurer une publicité courte (30–60 s) et transformer l'idée en narration, avec l'aide de ChatGPT.",
    theme: "écriture du scénario publicitaire",
    objectives: [
      "Structurer une publicité courte",
      "Transformer une idée en narration",
      "Rédiger un scénario adapté à une durée de 30 à 60 secondes",
    ],
    contents: [
      "Les différentes structures narratives",
      "L'accroche publicitaire",
      "La présentation du problème",
      "La mise en situation",
      "La découverte de la solution",
      "La transformation ou le bénéfice",
      "La preuve",
      "L'appel à l'action",
      "La gestion de la durée",
      "La rédaction avec ChatGPT",
      "La vérification et l'amélioration du scénario",
    ],
    activity: "Rédiger deux versions du scénario du projet fil rouge, puis sélectionner la version la plus pertinente.",
    quiz: {
      title: "Autoévaluation — Scénario",
      questions: [
        scq("Où se situe l'accroche dans une publicité ?", ["à la fin", "au tout début", "au générique", "elle est facultative"], 1, "L'accroche ouvre la vidéo et retient l'attention."),
        tf("Pour une vidéo de 30 à 60 s, le scénario doit rester court et aller à l'essentiel.", true, "La durée impose la concision."),
        scq("Que doit contenir la fin d'un scénario publicitaire ?", ["le budget", "un appel à l'action", "les crédits", "la liste des outils"], 1, "On termine sur le CTA."),
      ],
    },
    assignment: { title: "Livrable — Scénario", description: "**Livrable du module 3.** Déposez un scénario complet précisant : le déroulement de la publicité ; le contenu de chaque scène ; les dialogues éventuels ; la voix off ; le message final ; l'appel à l'action." },
  }),
  mod({
    title: "Module 4 — Construire le storyboard et préparer les prompts",
    description: "Découper le scénario en scènes, définir les plans et préparer les prompts de génération vidéo.",
    theme: "storyboard et préparation des prompts",
    objectives: [
      "Découper le scénario en scènes",
      "Définir les plans",
      "Préparer les instructions nécessaires à la génération vidéo",
    ],
    contents: [
      "Le rôle du storyboard",
      "Le découpage scène par scène",
      "Les types de plans et le cadrage",
      "Les mouvements de caméra",
      "L'ambiance visuelle, les décors et la lumière",
      "Les personnages, vêtements et accessoires",
      "La continuité entre les scènes",
      "La structure d'un prompt pour Veo 3",
      "Les indications à éviter",
      "La préparation d'un prompt par scène",
    ],
    activity: "Transformer le scénario en storyboard de cinq à huit scènes.",
    quiz: {
      title: "Autoévaluation — Storyboard & prompts",
      questions: [
        scq("À quoi sert le storyboard ?", ["à monter la vidéo", "à découper la publicité scène par scène avant la génération", "à générer la voix off", "à publier sur les réseaux"], 1, "Le storyboard planifie chaque plan avant la génération."),
        tf("La continuité (personnage, décor) entre les scènes est importante pour la cohérence.", true, "Sans continuité, la vidéo paraît décousue."),
        scq("Un bon prompt de génération vidéo décrit notamment…", ["le prix", "le sujet, l'action, le cadrage et l'ambiance", "le nom du monteur", "le nombre de vues"], 1, "On décrit le contenu visuel de la scène."),
      ],
    },
    assignment: { title: "Livrable — Storyboard & prompts", description: "**Livrable du module 4.** Déposez un storyboard précisant, pour chaque scène : le numéro ; la durée estimée ; la description visuelle ; le cadrage ; l'action ; le mouvement de caméra ; l'ambiance ; le texte ou la voix off ; le prompt de génération." },
  }),
  mod({
    title: "Module 5 — Générer les scènes vidéo avec Veo 3",
    description: "Générer les scènes à partir des prompts, contrôler le mouvement et l'ambiance, puis sélectionner les meilleures prises.",
    theme: "génération des scènes avec Veo 3",
    objectives: [
      "Générer des scènes vidéo à partir des prompts",
      "Contrôler le mouvement et l'ambiance",
      "Sélectionner les meilleures générations",
    ],
    contents: [
      "Présentation de Veo 3",
      "Préparation d'un prompt vidéo",
      "Description du sujet et de l'environnement",
      "Actions et mouvements",
      "Position et mouvement de caméra",
      "Lumière et rendu visuel",
      "Durée des scènes",
      "Maintien de la cohérence du personnage et du décor",
      "Correction des défauts fréquents",
      "Multiplication des variantes et sélection des meilleures prises",
      "Organisation des fichiers générés",
    ],
    activity: "Générer les différentes scènes du storyboard.",
    quiz: {
      title: "Autoévaluation — Génération avec Veo 3",
      questions: [
        tf("La génération vidéo étant variable, il est utile de produire plusieurs variantes puis de sélectionner la meilleure.", true, "On multiplie les prises puis on choisit."),
        scq("Que faut-il maintenir d'une scène à l'autre ?", ["rien", "la cohérence du personnage et du décor", "le même prompt exact", "la même durée que le fichier"], 1, "La cohérence assure une vidéo homogène."),
        scq("Veo 3 sert principalement à…", ["monter la vidéo", "générer et animer les scènes vidéo", "écrire le scénario", "créer la voix off"], 1, "Veo 3 génère les scènes vidéo."),
      ],
    },
    assignment: { title: "Livrable — Scènes vidéo générées", description: "**Livrable du module 5.** Déposez un dossier contenant : les scènes générées ; les versions retenues ; les prompts utilisés ; les éventuelles corrections apportées." },
  }),
  mod({
    title: "Module 6 — Créer la voix off avec ElevenLabs",
    description: "Rédiger et générer une voix off naturelle, adaptée au ton de la publicité, avec ElevenLabs.",
    theme: "voix off avec ElevenLabs",
    objectives: [
      "Rédiger une voix off adaptée à la publicité",
      "Choisir un style de narration",
      "Générer une voix naturelle",
    ],
    contents: [
      "Le rôle de la voix off",
      "La relation entre scénario et narration",
      "La durée du texte",
      "Le choix de la voix",
      "Le rythme, le ton et les émotions",
      "Les pauses et les indications d'interprétation",
      "La génération avec ElevenLabs",
      "La comparaison de plusieurs versions",
      "La correction de la prononciation",
      "Les précautions relatives aux voix et au consentement",
    ],
    activity: "Générer au moins deux versions de la voix off du projet.",
    quiz: {
      title: "Autoévaluation — Voix off",
      questions: [
        tf("Le texte de la voix off doit être adapté à la durée de la vidéo.", true, "On chronomètre le texte pour tenir dans la durée."),
        scq("Comment corriger un mot mal prononcé par une voix off IA ?", ["changer d'outil", "écrire le mot phonétiquement", "supprimer la voix", "augmenter le volume"], 1, "L'orthographe phonétique guide la prononciation."),
        scq("Quelle précaution éthique concerne la voix off ?", ["aucune", "le consentement pour l'utilisation d'une voix", "la couleur de la vidéo", "la taille du fichier"], 1, "On n'utilise pas la voix d'un tiers sans consentement."),
      ],
    },
    assignment: { title: "Livrable — Voix off", description: "**Livrable du module 6.** Déposez la voix off finale au format audio, accompagnée du texte utilisé. Vérifiez les droits et le consentement liés à la voix." },
  }),
  mod({
    title: "Module 7 — Monter la publicité avec CapCut",
    description: "Assembler les scènes, ajouter la voix off et la musique, et régler le rythme de la publicité dans CapCut.",
    theme: "montage avec CapCut",
    objectives: [
      "Assembler les scènes",
      "Ajouter la voix off et la musique",
      "Améliorer le rythme général de la publicité",
    ],
    contents: [
      "Présentation de l'interface de CapCut",
      "Création d'un projet",
      "Importation des vidéos et fichiers audio",
      "Organisation de la timeline",
      "Découpage des scènes",
      "Synchronisation de la voix off",
      "Choix de la musique et réglage des volumes",
      "Transitions et effets visuels",
      "Correction des couleurs",
      "Ralentissement ou accélération et ajout de bruitages",
      "Gestion du rythme publicitaire",
    ],
    activity: "Réaliser une première version montée de la vidéo.",
    quiz: {
      title: "Autoévaluation — Montage CapCut",
      questions: [
        tf("La voix off et la musique doivent être équilibrées pour ne pas couvrir le message.", true, "La musique accompagne la voix, elle ne la couvre pas."),
        scq("Dans CapCut, la timeline sert à…", ["exporter uniquement", "organiser et synchroniser les scènes et l'audio", "générer les scènes", "écrire le scénario"], 1, "La timeline organise le montage."),
        scq("Le rythme d'une publicité se règle notamment par…", ["la durée des plans et les transitions", "la couleur du logo", "le nombre d'outils", "le prix"], 0, "Des plans plus courts accélèrent le rythme."),
      ],
    },
    assignment: { title: "Livrable — Première version montée", description: "**Livrable du module 7.** Déposez une version provisoire de la publicité avec : les scènes assemblées ; la voix off ; la musique ; les principales transitions. Fichier vidéo ou lien." },
  }),
  mod({
    title: "Module 8 — Ajouter l'identité visuelle et finaliser la vidéo",
    description: "Ajouter les éléments de marque, améliorer la lisibilité et exporter la vidéo pour la diffusion.",
    theme: "identité visuelle, finalisation et export",
    objectives: [
      "Ajouter les éléments de marque",
      "Améliorer la lisibilité",
      "Préparer la diffusion",
    ],
    contents: [
      "Ajout du logo et des couleurs de la marque",
      "Ajout des titres et des sous-titres",
      "Présentation d'un produit ou service",
      "Affichage de l'appel à l'action et des informations de contact",
      "Création d'une scène finale",
      "Contrôle de la qualité audio et visuelle",
      "Vérification de l'orthographe",
      "Export horizontal, vertical et carré",
      "Compression et qualité",
      "Création d'une miniature",
    ],
    activity: "Finaliser la publicité et préparer au moins un format de diffusion.",
    quiz: {
      title: "Autoévaluation — Finalisation & export",
      questions: [
        tf("Sur les réseaux sociaux, les sous-titres sont importants car beaucoup regardent sans le son.", true, "Le sous-titrage améliore la rétention et l'accessibilité."),
        mcq("Quels éléments d'identité visuelle ajoute-t-on à la finalisation ?", ["Le logo", "Les couleurs de la marque", "L'appel à l'action", "Le prix de l'outil"], [0, 1, 2], "Logo, couleurs et CTA — pas le prix de l'outil."),
        scq("Quel format convient le mieux à TikTok et aux Reels ?", ["horizontal 16:9", "vertical 9:16", "carré 1:1", "panoramique 21:9"], 1, "Le vertical 9:16 est le standard mobile."),
      ],
    },
    assignment: { title: "Livrable — Vidéo publicitaire finale", description: "**Livrable du module 8.** Déposez la vidéo publicitaire finale (30–60 s), avec logo, titres/sous-titres, appel à l'action, exportée en bonne qualité et adaptée à au moins un canal de diffusion. Fichier vidéo ou lien." },
  }),
  mod({
    title: "Module 9 — Présenter et valoriser son projet dans un portfolio",
    description: "Présenter sa démarche de création, valoriser les compétences acquises et intégrer la réalisation à un portfolio.",
    theme: "présentation et valorisation dans un portfolio",
    objectives: [
      "Présenter sa démarche de création",
      "Valoriser les compétences acquises",
      "Intégrer la réalisation dans un portfolio",
    ],
    contents: [
      "Présenter le contexte du projet",
      "Expliquer le besoin de communication",
      "Présenter les outils utilisés",
      "Montrer les étapes de production",
      "Présenter les difficultés rencontrées",
      "Expliquer les choix créatifs",
      "Ajouter la vidéo à un portfolio",
      "Rédiger une courte étude de cas",
      "Publier le projet sur les réseaux professionnels",
    ],
    activity: "Préparer une fiche portfolio consacrée au projet réalisé.",
    quiz: {
      title: "Autoévaluation — Portfolio",
      questions: [
        tf("Présenter sa démarche (contexte, choix, étapes) valorise le projet dans un portfolio.", true, "L'étude de cas montre les compétences mobilisées."),
        scq("Une étude de cas de projet explique notamment…", ["uniquement le prix", "le contexte, les choix créatifs et les étapes de production", "le nom du formateur", "la marque de l'ordinateur"], 1, "Elle raconte la démarche et les choix."),
        scq("Où valoriser la vidéo réalisée ?", ["nulle part", "dans un portfolio et sur les réseaux professionnels", "seulement en local", "dans un tableur"], 1, "Portfolio + réseaux professionnels."),
      ],
    },
    assignment: { title: "Projet final — Fiche portfolio", description: "**Livrable du module 9 (projet final).** Déposez une fiche de présentation comportant : le nom du projet ; le contexte ; l'objectif ; la cible ; les outils utilisés ; les principales étapes ; la vidéo finale ; les compétences mobilisées." },
  }),
];

/* ─────────────────────── Cohorte & webinaires (Events) ────────────────────── */
const COHORT = {
  name: "Création de vidéos publicitaires avec l'IA — Cohorte Août 2026",
  type: "HYBRID",
  status: "OPEN",
  startDate: at("2026-08-04T08:00"),
  endDate: at("2026-08-30T20:00"),
  enrollmentDeadline: at("2026-08-01T18:00"),
  capacity: 25,
  price: 50000,
  rhythm: "Formation en autonomie (4 semaines) · 1 webinaire d'accompagnement par semaine",
  description:
    "Cette cohorte accompagne les participants dans la réalisation autonome d'une vidéo publicitaire avec l'intelligence artificielle.\n\n" +
    "La formation est suivie principalement en autonomie sur la plateforme. Chaque participant avance à travers des cours, des démonstrations, des exercices et un projet fil rouge.\n\n" +
    "Tout au long du parcours, les activités permettent de construire progressivement une publicité complète : brief, concept, scénario, storyboard, prompts, scènes vidéo, voix off et montage final.\n\n" +
    "Les principaux outils utilisés sont ChatGPT, Veo 3, ElevenLabs et CapCut.\n\n" +
    "Un webinaire d'accompagnement est organisé chaque semaine. Ces rencontres permettent au formateur de répondre aux questions, résoudre les difficultés techniques, effectuer des démonstrations complémentaires et commenter les productions des participants.\n\n" +
    "À la fin de la formation, chaque participant réalise une vidéo publicitaire de 30 à 60 secondes et prépare une fiche de présentation pouvant être intégrée à son portfolio.",
  rules:
    "### Conditions de participation\n\n" +
    "- Disposer d'un ordinateur et d'une connexion Internet stable.\n" +
    "- Savoir utiliser un ordinateur, naviguer sur Internet et organiser des fichiers.\n" +
    "- Créer les comptes nécessaires sur les outils (ChatGPT, Veo 3, ElevenLabs, CapCut).\n" +
    "- Prévoir des écouteurs ou un casque audio.\n" +
    "- Avoir un produit, un service, une organisation ou un projet à promouvoir.\n\n" +
    "### Organisation & engagement\n\n" +
    "Le participant s'engage à :\n\n" +
    "- progresser régulièrement dans les modules et respecter le calendrier de la cohorte ;\n" +
    "- réaliser les exercices et soumettre les étapes obligatoires de son projet ;\n" +
    "- consulter les modules et préparer ses questions avant chaque webinaire ;\n" +
    "- produire un projet personnel et vérifier les droits des contenus utilisés ;\n" +
    "- respecter les autres participants et accepter les retours constructifs.\n\n" +
    "### Évaluation\n\n" +
    "L'évaluation porte principalement sur la réalisation progressive du **projet fil rouge**, et non sur la simple mémorisation.\n\n" +
    "| Évaluation | Pondération |\n|---|---|\n" +
    "| Quiz et activités d'autoévaluation | 10 % |\n" +
    "| Brief publicitaire | 10 % |\n" +
    "| Scénario et storyboard | 20 % |\n" +
    "| Scènes vidéo et voix off | 20 % |\n" +
    "| Vidéo publicitaire finale | 30 % |\n" +
    "| Présentation portfolio | 10 % |\n\n" +
    "### Conditions de réussite\n\n" +
    "Pour valider la formation, le participant doit :\n\n" +
    "- consulter l'ensemble des modules obligatoires ;\n" +
    "- réaliser les activités principales ;\n" +
    "- remettre les étapes obligatoires du projet ;\n" +
    "- soumettre une vidéo publicitaire finale ;\n" +
    "- obtenir une note globale d'au moins **70 %**.\n\n" +
    "La participation aux webinaires est fortement recommandée ; un rattrapage reste possible via l'enregistrement lorsqu'il est disponible.\n\n" +
    "### La vidéo finale doit…\n\n" +
    "- durer entre 30 et 60 secondes ;\n" +
    "- comporter une accroche identifiable et un message principal clair ;\n" +
    "- présenter un produit, un service ou un projet ;\n" +
    "- inclure une voix off ou une narration pertinente ;\n" +
    "- disposer d'un montage fluide et d'une cohérence visuelle suffisante ;\n" +
    "- intégrer un appel à l'action et être exportée en bonne qualité, adaptée à au moins un canal de diffusion.\n\n" +
    "### Utilisation responsable de l'intelligence artificielle\n\n" +
    "Les outils ne doivent pas servir à : usurper l'identité d'une personne ; créer des contenus frauduleux ou une publicité mensongère ; porter atteinte à la réputation d'autrui ; utiliser sans autorisation la voix ou l'image d'un tiers ; reproduire illégalement une marque ou une œuvre protégée ; diffuser des contenus discriminatoires ou préjudiciables.\n\n" +
    "### Outils & coûts\n\n" +
    "Certains outils nécessitent la création d'un compte et peuvent proposer des crédits gratuits limités, un abonnement payant, ou ne pas être disponibles dans tous les pays. Le participant reste responsable des abonnements ou crédits nécessaires à son projet ; des solutions alternatives peuvent être proposées lorsque c'est possible.",
};

/* Webinaires hebdomadaires d'ACCOMPAGNEMENT (jeudi 18 h 30). Ce ne sont PAS des
   cours magistraux : le cours se suit en autonomie, ces séances répondent aux
   questions, corrigent et guident l'avancement du projet (§ modèle pédagogique). */
const SESSIONS = [
  { kind: "WEBINAR", title: "Webinaire 1 — Lancement de la cohorte", date: "2026-08-06T18:30", end: "2026-08-06T20:00", online: true,
    desc: "Présentation du fonctionnement de la formation et du projet fil rouge, aide au choix du sujet, vérification de l'accès aux outils et premières questions. **Modules 1 & 2.**" },
  { kind: "WEBINAR", title: "Webinaire 2 — Scénario, storyboard et prompts", date: "2026-08-13T18:30", end: "2026-08-13T19:30", online: true,
    desc: "Questions sur le brief, corrections de scénarios, amélioration des storyboards, analyse d'exemples de prompts et préparation de la génération avec Veo 3. **Modules 3 & 4.**" },
  { kind: "WEBINAR", title: "Webinaire 3 — Génération vidéo et voix off", date: "2026-08-20T18:30", end: "2026-08-20T19:30", online: true,
    desc: "Difficultés liées à Veo 3, problèmes de cohérence, correction de prompts, sélection des scènes et questions sur ElevenLabs. **Modules 5 & 6.**" },
  { kind: "WEBINAR", title: "Webinaire 4 — Montage et présentation finale", date: "2026-08-27T18:30", end: "2026-08-27T20:00", online: true,
    desc: "Questions sur CapCut, analyse de premières versions, corrections collectives, vérification de l'appel à l'action, préparation de l'export et du portfolio. **Modules 7, 8 & 9.**" },
];

/* ─── Encodage des questions (identique à l'importeur) ─── */
function encodeQuestion(q, order) {
  const base = { type: q.type, question: String(q.question).trim(), explanation: q.explanation ?? null, points: Math.min(3, Math.max(1, q.points || 1)), order };
  if (q.type === "SINGLE_CHOICE") return { ...base, options: q.options.map(String), correctAnswer: q.correctIndex };
  if (q.type === "MULTIPLE_CHOICE") return { ...base, options: q.options.map(String), correctAnswer: [...new Set(q.correctIndexes)].sort((a, b) => a - b) };
  if (q.type === "TRUE_FALSE") return { ...base, options: ["Vrai", "Faux"], correctAnswer: q.correctTrue };
  return null;
}

async function main() {
  await wake();

  // Écoles de rattachement (primaire Design/Création + cross-list Marketing & IA).
  const schools = await prisma.school.findMany({
    where: { slug: { in: ["ecole-design-creation", "ecole-marketing-vente", "ecole-intelligence-artificielle"] } },
    select: { id: true, slug: true },
  });
  const bySlug = Object.fromEntries(schools.map((s) => [s.slug, s.id]));
  const primarySchoolId = bySlug["ecole-design-creation"] ?? schools[0]?.id ?? null;

  // Formateur (host + encadrant) si présent dans la base.
  const instructor = await prisma.user.findFirst({ where: { email: "formateur@digitalaccess.ci" }, select: { id: true } });

  // 1) Formation (Course) — upsert par slug, reconstruite intégralement.
  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: {
      code: FICHE.code, title: FICHE.title, subtitle: FICHE.subtitle, description: FICHE.description,
      objectives: FICHE.objectives, targetAudience: FICHE.targetAudience, prerequisitesText: FICHE.prerequisitesText,
      tools: FICHE.tools, level: FICHE.level, price: FICHE.price, durationHours: FICHE.durationHours,
      certificateTitle: FICHE.certificateTitle, unlockMode: "SEQUENTIAL", status: "PUBLISHED", publishedAt: new Date(),
    },
    create: {
      slug: COURSE_SLUG, code: FICHE.code, title: FICHE.title, subtitle: FICHE.subtitle, description: FICHE.description,
      objectives: FICHE.objectives, targetAudience: FICHE.targetAudience, prerequisitesText: FICHE.prerequisitesText,
      tools: FICHE.tools, level: FICHE.level, language: "fr", price: FICHE.price, durationHours: FICHE.durationHours,
      certificateTitle: FICHE.certificateTitle, unlockMode: "SEQUENTIAL", status: "PUBLISHED", publishedAt: new Date(),
    },
    select: { id: true },
  });

  // Nettoyage idempotent du contenu.
  await prisma.module.deleteMany({ where: { courseId: course.id } });
  await prisma.assessment.deleteMany({ where: { courseId: course.id } });

  // Liens écoles.
  await prisma.schoolCourse.deleteMany({ where: { courseId: course.id } });
  let pos = 0;
  for (const [slug, id] of Object.entries(bySlug)) {
    await prisma.schoolCourse.create({ data: { schoolId: id, courseId: course.id, isPrimary: id === primarySchoolId, isFeatured: id === primarySchoolId, position: pos++ } });
  }

  // 2) Modules + leçons + quiz + exercices.
  let mOrder = 0, firstPreview = false, nLessons = 0, nQuiz = 0, nAssign = 0, nQ = 0;
  for (const m of MODULES) {
    mOrder += 1;
    const createdModule = await prisma.module.create({
      data: { courseId: course.id, title: m.title, description: m.description, objectives: m.objectives, order: mOrder, status: "PUBLISHED" },
      select: { id: true },
    });
    let lOrder = 0;
    for (const les of m.lessons) {
      lOrder += 1;
      const isPreview = !firstPreview;
      firstPreview = true;
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id, title: les.title, lessonType: les.type, content: les.content ?? null,
          videoUrl: les.videoUrl ?? null, fileUrl: les.fileUrl ?? null, externalUrl: les.externalUrl ?? null,
          durationMinutes: les.durationMinutes ?? null, order: lOrder, isPreview, isRequired: true, status: "PUBLISHED",
        },
      });
      nLessons += 1;
    }
    // Quiz d'autoévaluation de fin de module.
    if (m.quiz?.questions?.length) {
      const assessment = await prisma.assessment.create({
        data: { courseId: course.id, moduleId: createdModule.id, title: m.quiz.title, type: "QUIZ", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: mOrder, status: "PUBLISHED" },
        select: { id: true },
      });
      let qOrder = 0;
      for (const q of m.quiz.questions) {
        const enc = encodeQuestion(q, ++qOrder);
        if (!enc) continue;
        await prisma.question.create({ data: { assessmentId: assessment.id, type: enc.type, question: enc.question, options: enc.options, correctAnswer: enc.correctAnswer, explanation: enc.explanation, points: enc.points, order: enc.order } });
        nQ += 1;
      }
      nQuiz += 1;
    }
    // Exercice pratique / livrable du projet fil rouge (dépôt de fichiers).
    if (m.assignment) {
      await prisma.assessment.create({
        data: { courseId: course.id, moduleId: createdModule.id, title: m.assignment.title, description: m.assignment.description, type: "ASSIGNMENT", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: 100 + mOrder, status: "PUBLISHED" },
      });
      nAssign += 1;
    }
  }

  // 3) Cohorte — upsert par slug.
  const cohort = await prisma.cohort.upsert({
    where: { slug: COHORT_SLUG },
    update: { name: COHORT.name, type: COHORT.type, status: COHORT.status, courseId: course.id, careerPathId: null, schoolId: primarySchoolId, startDate: COHORT.startDate, endDate: COHORT.endDate, enrollmentDeadline: COHORT.enrollmentDeadline, capacity: COHORT.capacity, price: COHORT.price, rhythm: COHORT.rhythm, description: COHORT.description, rules: COHORT.rules },
    create: { slug: COHORT_SLUG, name: COHORT.name, type: COHORT.type, status: COHORT.status, courseId: course.id, schoolId: primarySchoolId, startDate: COHORT.startDate, endDate: COHORT.endDate, enrollmentDeadline: COHORT.enrollmentDeadline, capacity: COHORT.capacity, price: COHORT.price, rhythm: COHORT.rhythm, description: COHORT.description, rules: COHORT.rules },
    select: { id: true },
  });

  // Encadrant.
  if (instructor) {
    await prisma.cohortInstructor.upsert({ where: { cohortId_userId: { cohortId: cohort.id, userId: instructor.id } }, update: { roleLabel: "Formateur principal" }, create: { cohortId: cohort.id, userId: instructor.id, roleLabel: "Formateur principal" } });
  }

  // 4) Webinaires d'accompagnement (Events) — reconstruits.
  await prisma.event.deleteMany({ where: { cohortId: cohort.id } });
  let sIdx = 0;
  for (const s of SESSIONS) {
    sIdx += 1;
    await prisma.event.create({
      data: {
        title: s.title,
        slug: `${COHORT_SLUG}-s${sIdx}`,
        description: `${s.desc}${s.online ? "\n\nEn ligne (Google Meet) — le lien est communiqué aux inscrits avant la séance." : "\n\nEn présentiel à Abidjan — le lieu est communiqué aux inscrits."}`,
        type: s.kind, audience: "COHORT",
        startAt: at(s.date), endAt: at(s.end), timezone: "Africa/Abidjan",
        provider: s.online ? "GOOGLE_MEET" : "IN_PERSON",
        meetingUrl: null,
        location: s.online ? null : "Abidjan — Côte d'Ivoire (lieu communiqué aux inscrits)",
        cohortId: cohort.id, courseId: course.id, hostId: instructor?.id ?? null,
        status: "PUBLISHED",
      },
    });
  }

  // 5) Événement PUBLIC de promotion (apparaît sur /evenements).
  await prisma.event.create({
    data: {
      title: "Session d'info — Créez des publicités vidéo avec l'IA",
      slug: `${COHORT_SLUG}-info`,
      description:
        "Présentation gratuite de la cohorte « Création de vidéos publicitaires avec l'IA » (Août 2026) : programme, outils, projet fil rouge, tarif et modalités d'inscription. Posez vos questions en direct, puis rejoignez la cohorte.",
      type: "WEBINAR",
      audience: "PUBLIC",
      startAt: at("2026-07-30T18:30"),
      endAt: at("2026-07-30T19:30"),
      timezone: "Africa/Abidjan",
      provider: "GOOGLE_MEET",
      meetingUrl: null,
      speakerName: "Koffi N'Guessan",
      cohortId: cohort.id,
      courseId: course.id,
      schoolId: primarySchoolId,
      hostId: instructor?.id ?? null,
      status: "PUBLISHED",
    },
  });

  console.log("=== COHORTE CRÉÉE ===");
  console.log(JSON.stringify({ course: COURSE_SLUG, cohort: COHORT_SLUG, schools: Object.keys(bySlug), modules: mOrder, lessons: nLessons, quiz: nQuiz, questions: nQ, assignments: nAssign, webinars: SESSIONS.length, instructor: !!instructor }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

// Crée la formation « Création de vidéos publicitaires avec l'IA » + sa cohorte
// « Août 2026 » (sessions live, leçons vidéo/à lire, quiz, exercices pratiques).
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
    "Concevez et produisez, de A à Z, une vraie publicité vidéo (30–60 s) avec l'IA : concept, scénario, visuels, animation, voix off, montage et diffusion.",
  description:
    "Cette formation pratique vous accompagne dans la conception et la réalisation complète d'une **vidéo publicitaire professionnelle** à l'aide d'outils d'intelligence artificielle. À partir d'un produit, d'un service, d'une entreprise ou d'un projet réel, vous apprendrez à définir un concept, rédiger un scénario, créer un storyboard, générer des visuels cohérents, animer les scènes, produire une voix off, composer une ambiance musicale et réaliser le montage final.\n\nLa pédagogie repose sur un **projet fil rouge** : à la fin, chaque participant présente une publicité de 30 à 60 secondes, cohérente avec l'identité de la marque choisie et adaptée aux réseaux sociaux. Chaque module alterne **vidéos**, **ressources à lire**, **quiz** de validation et **exercices pratiques** à déposer pour correction ; la cohorte y ajoute des **séances live (Google Meet)** et deux ateliers en présentiel.",
  objectives: [
    "Analyser un besoin de communication et définir la cible et la promesse publicitaire",
    "Rédiger un brief créatif et un concept publicitaire",
    "Construire un scénario court (30–60 s) et un storyboard exploitable",
    "Générer et animer des images cohérentes avec l'IA (personnage, décor, produit)",
    "Rédiger des prompts précis pour l'image et la vidéo",
    "Produire une voix off naturelle et une musique d'ambiance adaptée",
    "Réaliser le montage, le mixage, le sous-titrage et l'export",
    "Adapter la vidéo aux formats des réseaux sociaux (horizontal, vertical, carré)",
    "Respecter les droits d'auteur, le droit à l'image et les règles éthiques",
    "Produire de façon autonome une publicité vidéo professionnelle complète",
  ],
  targetAudience: [
    "Entrepreneurs et responsables de petites entreprises",
    "Community managers et chargés de communication",
    "Créateurs de contenu et infographistes",
    "Freelances et agences digitales",
    "Étudiants en communication, marketing ou audiovisuel",
    "Responsables d'associations, d'écoles ou d'institutions",
  ],
  prerequisitesText: [
    "Maîtriser les usages de base d'un ordinateur et naviguer sur Internet",
    "Disposer d'un ordinateur portable fonctionnel et d'une connexion stable",
    "Venir avec une idée de produit, service, marque ou projet à promouvoir",
    "Installer les applications demandées et prévoir un casque audio",
    "Connaître Canva ou CapCut est un plus (non obligatoire)",
  ],
  tools: [
    "Générateurs d'images IA (Midjourney, DALL·E, Leonardo)",
    "Génération vidéo IA (Runway, Kling, Pika)",
    "Voix off IA (ElevenLabs)",
    "Musique & sons (Suno, banques libres de droits)",
    "Montage (CapCut, Adobe Premiere Pro)",
    "Design & miniatures (Canva)",
  ],
  level: "INTERMEDIATE",
  price: 50000,
  durationHours: 40,
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

/* ─── Question helpers (encodage identique à import-content.mjs) ─── */
const scq = (question, options, correctIndex, explanation) => ({ type: "SINGLE_CHOICE", question, options, correctIndex, explanation, points: 1 });
const mcq = (question, options, correctIndexes, explanation) => ({ type: "MULTIPLE_CHOICE", question, options, correctIndexes, explanation, points: 2 });
const tf = (question, correctTrue, explanation) => ({ type: "TRUE_FALSE", question, correctTrue, explanation, points: 1 });

/* ────────────────────────────── 8 modules ────────────────────────────────── */
const MODULES = [
  {
    title: "Module 1 — Comprendre la publicité vidéo assistée par IA",
    description: "Comprendre le processus complet de création d'une publicité vidéo avec l'IA et choisir son projet fil rouge.",
    objectives: ["Distinguer contenu promotionnel et publicité structurée", "Maîtriser le schéma cible–problème–promesse–preuve–CTA", "Situer les étapes d'une production assistée par IA"],
    lessons: [
      video("Panorama : créer une pub vidéo avec l'IA", "Cette vidéo présente le parcours complet — du brief au montage — et montre des exemples de publicités réalisées avec l'IA."),
      read(
        "À lire — Les fondamentaux d'une publicité vidéo efficace",
        "## Ce qui fait une bonne publicité vidéo\n\nUne publicité n'est pas un simple contenu promotionnel : c'est un **message structuré** qui vise une action précise.\n\n### Le schéma AIDA appliqué à la vidéo courte\n\n1. **Cible** — à qui parle-t-on ? (âge, besoin, contexte)\n2. **Problème** — quelle frustration vit la cible ?\n3. **Promesse** — quelle transformation propose votre produit ?\n4. **Preuve** — pourquoi vous croire ? (démonstration, chiffre, témoignage)\n5. **Appel à l'action (CTA)** — que doit faire le spectateur maintenant ?\n\n> **Règle des 3 secondes** : sur les réseaux, l'accroche des 3 premières secondes décide si l'on regarde la suite.\n\n### Contenu promotionnel vs publicité structurée\n\n| Contenu promotionnel | Publicité structurée |\n|---|---|\n| « Voici notre produit » | « Voici votre problème, et comment on le résout » |\n| Centré sur la marque | Centré sur le client |\n| Pas d'objectif mesurable | Un CTA clair et unique |\n\n### Les grandes étapes d'une production IA\n\nBrief → concept → scénario → storyboard → visuels → animation → voix off & musique → montage → déclinaisons.",
      ),
      link("À préparer — Créer vos comptes outils", "https://www.canva.com", "Avant la première séance pratique, créez vos comptes sur les outils que nous utiliserons (Canva, CapCut, un générateur d'images, ElevenLabs). Des alternatives gratuites seront proposées quand un outil est payant."),
    ],
    quiz: {
      title: "Quiz — Fondamentaux de la publicité vidéo",
      questions: [
        scq("Quel élément conclut une publicité efficace en indiquant quoi faire ?", ["La preuve", "L'appel à l'action (CTA)", "La musique", "Le logo"], 1, "Le CTA invite le spectateur à passer à l'action."),
        mcq("Quels éléments composent le schéma d'un message publicitaire structuré ?", ["Cible", "Problème", "Promesse", "Durée du fichier"], [0, 1, 2], "Cible, problème, promesse, preuve et CTA — la durée du fichier n'en fait pas partie."),
        tf("Les 3 premières secondes d'une vidéo sociale sont décisives pour retenir l'attention.", true, "L'accroche initiale détermine la rétention."),
        scq("Une publicité structurée est avant tout centrée sur…", ["la marque", "le client et son problème", "les fonctionnalités techniques", "le budget"], 1, "On part du besoin du client, pas de la marque."),
      ],
    },
    assignment: { title: "Exercice — Choisir votre projet", description: "**Livrable du module 1.** Choisissez le produit, le service, la marque ou le projet que vous promouvrez tout au long de la formation. Déposez une note (½ page) : nom du produit, à qui il s'adresse, et pourquoi vous le choisissez. Formats acceptés : PDF, DOCX ou texte." },
  },
  {
    title: "Module 2 — Construire le brief et le concept publicitaire",
    description: "Transformer un besoin commercial en concept créatif exploitable.",
    objectives: ["Identifier la cible et l'objectif de campagne", "Formuler une proposition de valeur et un message principal", "Explorer plusieurs concepts avec l'IA"],
    lessons: [
      video("Explorer des concepts publicitaires avec l'IA", "Démonstration : utiliser un assistant IA pour générer et comparer plusieurs angles créatifs à partir d'un même brief."),
      read(
        "À lire — Le brief créatif, étape par étape",
        "## Du besoin au concept\n\nLe **brief** est la colonne vertébrale de votre campagne. Un bon brief tient sur une page et répond à :\n\n- **Cible** : persona précis (qui, où, quels usages).\n- **Objectif** : notoriété, trafic, vente, inscription…\n- **Proposition de valeur** : le bénéfice n°1, en une phrase.\n- **Message principal** : ce que la cible doit retenir.\n- **Ton & émotion** : sérieux, fun, inspirant, rassurant…\n- **Identité visuelle** : couleurs, logo, style.\n- **Format & canal** : vertical TikTok, carré Instagram, 30 ou 60 s.\n\n### Utiliser l'IA pour diverger\n\nDonnez votre brief à un assistant IA et demandez **5 concepts différents** (angle émotionnel, angle démonstration, angle témoignage…). Vous choisirez ensuite le plus fort.\n\n> **Astuce** : un bon concept se résume en une phrase — « Montrer [transformation] pour [cible] grâce à [produit] ».",
      ),
    ],
    quiz: {
      title: "Quiz — Brief & concept",
      questions: [
        scq("La proposition de valeur, c'est…", ["la liste des fonctionnalités", "le bénéfice n°1 pour la cible", "le budget de campagne", "le format d'export"], 1, "C'est le principal bénéfice, formulé simplement."),
        tf("Un bon brief publicitaire peut tenir sur une seule page.", true, "La concision force la clarté."),
        mcq("Que doit préciser un brief avant la production ?", ["La cible", "Le ton et l'émotion", "Le format et le canal", "Le nom du monteur"], [0, 1, 2], "Cible, ton, format/canal : oui. Le nom du monteur n'est pas un élément de brief."),
      ],
    },
    assignment: { title: "Exercice — Votre brief publicitaire", description: "**Livrable du module 2.** Rédigez le brief de votre projet : cible, objectif, proposition de valeur, message principal, ton, identité visuelle, format et canal. Déposez le document (PDF/DOCX) — il servira de base à tout le reste de la formation." },
  },
  {
    title: "Module 3 — Scénario, narration et storyboard",
    description: "Structurer une publicité courte et convaincante, scène par scène.",
    objectives: ["Écrire une structure narrative en 30–60 s", "Rédiger une voix off", "Produire un storyboard continu"],
    lessons: [
      video("Créer un storyboard exploitable", "Comment découper votre pub en scènes et décrire chaque plan (cadrage, mouvement, action) pour guider la génération d'images."),
      read(
        "À lire — Raconter en 30 à 60 secondes",
        "## La structure d'une pub courte\n\n**Accroche → Problème → Transformation → Solution → Appel à l'action.**\n\nChaque scène dure 2 à 5 secondes. Pour 40 s, prévoyez 8 à 12 scènes.\n\n### La voix off\n\n- Une idée par phrase, phrases courtes.\n- ~2,5 mots par seconde → **≈ 100 mots pour 40 s**.\n- Terminez toujours par le CTA.\n\n### Le storyboard\n\nPour chaque scène, notez : **le plan** (large, moyen, gros plan), **l'action**, **le texte/voix off**, **l'ambiance**. La *continuité* (même personnage, même univers) est essentielle : gardez une fiche de référence de votre personnage et de votre décor.",
      ),
    ],
    quiz: {
      title: "Quiz — Scénario & storyboard",
      questions: [
        scq("Pour une voix off de 40 s, visez environ…", ["40 mots", "100 mots", "250 mots", "500 mots"], 1, "≈ 2,5 mots/seconde → ~100 mots."),
        tf("La continuité du personnage et du décor est essentielle entre les scènes.", true, "Sans continuité, la vidéo paraît incohérente."),
        scq("Quelle est une structure narrative adaptée à une pub courte ?", ["Introduction–développement–conclusion académique", "Accroche–problème–transformation–solution–CTA", "Générique–crédits–remerciements", "FAQ–tarifs–contact"], 1, "C'est la structure publicitaire efficace."),
      ],
    },
    assignment: { title: "Exercice — Scénario + storyboard", description: "**Livrable du module 3** (préparé lors de l'atelier présentiel du samedi). Déposez votre scénario complet (voix off incluse) et votre storyboard scène par scène (tableau ou planche). PDF, images ou document." },
  },
  {
    title: "Module 4 — Génération des visuels publicitaires",
    description: "Créer des scènes visuelles réalistes et cohérentes avec l'IA.",
    objectives: ["Écrire un prompt d'image structuré", "Maintenir la cohérence d'un personnage", "Corriger les erreurs fréquentes de génération"],
    lessons: [
      video("Générer un personnage cohérent", "Techniques pour obtenir le même visage, la même tenue et le même décor d'une image à l'autre."),
      read(
        "À lire — Anatomie d'un prompt d'image",
        "## Décrire pour mieux générer\n\nUn prompt efficace précise, dans l'ordre : **sujet → action → cadrage → lumière → décor → style**.\n\n> Exemple : « Jeune entrepreneuse ivoirienne souriante, plan moyen, lumière naturelle douce, bureau moderne lumineux, style photographie réaliste ».\n\n### Cohérence\n\n- Fixez une **fiche personnage** (âge, tenue, coiffure) et réutilisez-la.\n- Variez seulement le cadrage : plan large, plan moyen, gros plan, plan par-dessus l'épaule.\n\n### Erreurs fréquentes et parades\n\n| Problème | Parade |\n|---|---|\n| Mains déformées | Cadrer plus serré, régénérer, retoucher |\n| Texte illisible | Ajouter le texte au montage, pas dans l'image |\n| Écrans/produits incohérents | Intégrer le vrai visuel produit en post-production |\n\nSélectionnez toujours 2–3 variantes par scène avant d'animer.",
      ),
    ],
    quiz: {
      title: "Quiz — Visuels IA",
      questions: [
        mcq("Que préciser dans un bon prompt d'image ?", ["Le sujet et l'action", "Le cadrage et la lumière", "Le décor et le style", "Le prix du produit"], [0, 1, 2], "Sujet, action, cadrage, lumière, décor, style — pas le prix."),
        tf("Il vaut mieux ajouter les textes au montage plutôt que de les faire générer dans l'image.", true, "L'IA gère mal le texte dans l'image."),
        scq("Pour garder le même personnage entre les scènes, on…", ["change de style à chaque image", "réutilise une fiche personnage de référence", "génère une seule image", "évite les gros plans"], 1, "La fiche de référence assure la cohérence."),
      ],
    },
    assignment: { title: "Exercice — Vos images fixes", description: "**Livrable du module 4.** Générez et déposez l'ensemble des images fixes nécessaires à votre publicité (une par scène du storyboard), avec un personnage et un univers cohérents. Déposez les images (ou un PDF planche-contact) + les prompts utilisés." },
  },
  {
    title: "Module 5 — Animation et génération vidéo",
    description: "Transformer les images fixes en scènes animées.",
    objectives: ["Écrire un prompt d'animation", "Contrôler le rythme et la durée", "Assembler les meilleures prises"],
    lessons: [
      video("Animer des images fixes", "Passer de l'image à la vidéo : mouvement de personnage, mouvement de caméra, durée et cohérence."),
      read(
        "À lire — Du fixe à l'animé\n",
        "## Prompt d'animation\n\nPrécisez le **type de mouvement** (léger zoom avant, panoramique, marche du personnage), sa **vitesse** et sa **durée**. Restez sobre : un mouvement subtil rend mieux qu'un effet spectaculaire raté.\n\n### Bonnes pratiques\n\n- Générez des clips courts (3–5 s) puis assemblez.\n- Gardez la **cohérence visuelle** (même personnage, même lumière).\n- Prévoyez plusieurs prises : la génération vidéo est aléatoire, sélectionnez la meilleure.\n- Animer un produit ou une interface : mouvements lents et nets.\n\n> **Astuce budget** : beaucoup d'outils offrent des crédits limités. Générez en priorité les scènes clés (accroche + CTA).",
      ),
    ],
    quiz: {
      title: "Quiz — Animation",
      questions: [
        tf("Un mouvement subtil est souvent préférable à un effet spectaculaire mal maîtrisé.", true, "La sobriété est plus professionnelle."),
        scq("Face au caractère aléatoire de la génération vidéo, il faut…", ["ne générer qu'une seule prise", "générer plusieurs prises et sélectionner la meilleure", "éviter d'animer", "tout animer manuellement"], 1, "On multiplie les prises puis on choisit."),
        scq("Un prompt d'animation doit préciser…", ["uniquement la couleur", "le type, la vitesse et la durée du mouvement", "le prix de l'outil", "le nombre de spectateurs"], 1, "Type, vitesse et durée du mouvement."),
      ],
    },
    assignment: { title: "Exercice — Séquences animées", description: "**Livrable du module 5.** Déposez les séquences animées de votre projet (clips courts issus de vos images), prêtes à être montées. Indiquez l'outil utilisé et joignez éventuellement les prompts d'animation." },
  },
  {
    title: "Module 6 — Voix off, musique et identité sonore",
    description: "Construire une ambiance sonore professionnelle.",
    objectives: ["Générer une voix off naturelle", "Choisir une musique adaptée", "Synchroniser voix, musique et images"],
    lessons: [
      video("Générer une voix off naturelle", "Régler le ton, le rythme et l'intention d'une voix off IA (ElevenLabs) et corriger les défauts de prononciation."),
      read(
        "À lire — L'ambiance sonore\n",
        "## Voix off\n\n- Adaptez le texte à la durée (relisez à voix haute, chronométrez).\n- Choisissez un **ton** cohérent avec la marque (chaleureux, dynamique, premium).\n- Ajoutez des indications d'intention et corrigez les mots mal prononcés (orthographe phonétique).\n\n## Musique & effets\n\n- La musique porte l'émotion et le **rythme** ; elle ne doit jamais couvrir la voix.\n- Ajoutez des effets discrets (whoosh, clic) pour marquer les transitions.\n\n## Droits\n\nUtilisez des voix, musiques et sons **libres de droits** ou générés par IA dont la licence autorise l'usage commercial. La **synchronisation** voix/musique/images se règle au montage.",
      ),
    ],
    quiz: {
      title: "Quiz — Son & voix off",
      questions: [
        tf("La musique ne doit jamais couvrir la voix off.", true, "La voix porte le message ; la musique l'accompagne."),
        mcq("Que vérifier pour la bande sonore d'une publicité commerciale ?", ["Les droits d'utilisation", "L'équilibre voix/musique", "La synchronisation avec l'image", "La marque de l'ordinateur"], [0, 1, 2], "Droits, équilibre et synchro — pas la marque de l'ordinateur."),
        scq("Pour corriger un mot mal prononcé par une voix off IA, on peut…", ["changer de projet", "écrire le mot phonétiquement", "supprimer la voix off", "augmenter le volume"], 1, "L'orthographe phonétique guide la prononciation."),
      ],
    },
    assignment: { title: "Exercice — Voix off + bande sonore", description: "**Livrable du module 6.** Déposez la voix off générée et la musique/effets de votre projet (fichiers audio), ainsi que le texte final de la voix off. Vérifiez les droits d'usage." },
  },
  {
    title: "Module 7 — Montage de la vidéo publicitaire",
    description: "Assembler tous les éléments en une publicité cohérente.",
    objectives: ["Organiser et monter les scènes", "Synchroniser voix, musique et sous-titres", "Exporter en haute qualité"],
    lessons: [
      video("Montage pas à pas (CapCut / Premiere)", "Import, ordre des scènes, transitions, synchronisation de la voix off, mixage, logo, sous-titres, colorimétrie et export."),
      read(
        "À lire — Monter comme un pro\n",
        "## Méthode de montage\n\n1. **Organisez** vos fichiers (scènes, voix, musique, logo).\n2. **Posez** les scènes dans l'ordre du storyboard.\n3. Réglez le **rythme** : plans courts sur l'accroche et le CTA.\n4. Ajoutez des **transitions** simples (cut, fondu léger).\n5. **Synchronisez** la voix off avec l'image ; calez la musique.\n6. Incrustez **logo, titres, sous-titres et CTA**.\n7. **Corrigez les couleurs** pour une image homogène.\n8. **Exportez** en haute qualité (1080p, bon débit).\n\n> **Accessibilité** : sur les réseaux, la majorité regarde **sans le son** → les sous-titres sont indispensables.",
      ),
    ],
    quiz: {
      title: "Quiz — Montage",
      questions: [
        tf("Sur les réseaux sociaux, les sous-titres sont importants car beaucoup regardent sans le son.", true, "Le sous-titrage améliore la rétention et l'accessibilité."),
        scq("Où placer les plans les plus courts ?", ["Nulle part", "Sur l'accroche et le CTA", "Uniquement au générique", "Partout de façon identique"], 1, "Le rythme se resserre sur l'accroche et le CTA."),
        mcq("Quelles étapes font partie du montage final ?", ["Synchroniser la voix off", "Ajouter les sous-titres", "Corriger les couleurs", "Rédiger le brief"], [0, 1, 2], "Le brief appartient au début de la production, pas au montage."),
      ],
    },
    assignment: { title: "Exercice — Première version montée", description: "**Livrable du module 7.** Déposez la première version complète de votre publicité montée (fichier vidéo ou lien). Elle doit inclure voix off, musique, sous-titres, logo et CTA." },
  },
  {
    title: "Module 8 — Adaptation, diffusion et projet final",
    description: "Finaliser et présenter une campagne exploitable, déclinée pour les réseaux.",
    objectives: ["Décliner la vidéo aux formats des réseaux", "Préparer un kit de diffusion", "Présenter et défendre son projet"],
    lessons: [
      video("Exporter pour chaque plateforme", "Décliner la vidéo en horizontal (YouTube), vertical (TikTok/Reels) et carré (feed), créer une miniature et rédiger le texte de publication."),
      read(
        "À lire — Décliner et diffuser\n",
        "## Un master, plusieurs formats\n\n| Format | Ratio | Plateformes |\n|---|---|---|\n| Horizontal | 16:9 | YouTube, LinkedIn |\n| Vertical | 9:16 | TikTok, Reels, Shorts, Stories |\n| Carré | 1:1 | Feed Instagram/Facebook |\n\nRecadrez en gardant le sujet centré et les textes visibles dans chaque format.\n\n## Kit de diffusion\n\n- **Miniature** accrocheuse (visage + bénéfice).\n- **Texte de publication** avec le CTA et les hashtags.\n- **Contrôle qualité** : son, lisibilité, durée, logo, CTA.\n\n## Présentation finale\n\nLors de la dernière séance (présentiel), vous présentez votre publicité, expliquez vos choix et recevez les retours du groupe et du formateur.",
      ),
    ],
    quiz: {
      title: "Quiz — Diffusion & formats",
      questions: [
        scq("Quel format convient le mieux à TikTok et aux Reels ?", ["Horizontal 16:9", "Vertical 9:16", "Carré 1:1", "Panoramique 21:9"], 1, "Le vertical 9:16 est le standard mobile."),
        mcq("Que contient un kit de diffusion ?", ["Une miniature", "Le texte de publication avec CTA", "Les déclinaisons de formats", "Le contrat de travail du client"], [0, 1, 2], "Miniature, texte/CTA, déclinaisons — pas de contrat."),
        tf("On peut réutiliser un même master vidéo pour générer plusieurs formats adaptés aux réseaux.", true, "On décline le master en 16:9, 9:16 et 1:1."),
      ],
    },
    assignment: { title: "Projet final — Publicité vidéo + kit de diffusion", description: "**Projet final (évalué).** Déposez votre publicité définitive (30–60 s) et son kit de diffusion : déclinaisons de formats, miniature et texte de publication. Critères : cible identifiable, message clair, cohérence visuelle, voix off audible, musique équilibrée, logo + CTA, respect des droits. À présenter lors de la séance finale du 29 août." },
  },
];

/* ─────────────────────── Cohorte & sessions live (Events) ─────────────────── */
const COHORT = {
  name: "Création de vidéos publicitaires avec l'IA — Cohorte Août 2026",
  type: "HYBRID",
  status: "OPEN",
  startDate: at("2026-08-04T18:30"),
  endDate: at("2026-08-29T13:00"),
  enrollmentDeadline: at("2026-08-01T18:00"),
  capacity: 20,
  price: 50000,
  rhythm: "Formation en autonomie sur 4 semaines · 1 webinaire d'accompagnement par semaine",
  description:
    "Cette cohorte accompagne les participants dans la réalisation autonome d'une vidéo publicitaire avec l'intelligence artificielle.\n\n" +
    "La formation est suivie principalement en autonomie sur la plateforme. Chaque participant avance à travers des cours, des démonstrations, des exercices et un projet fil rouge.\n\n" +
    "Tout au long du parcours, les activités permettent de construire progressivement une publicité complète : brief, concept, scénario, storyboard, prompts, scènes vidéo, voix off et montage final.\n\n" +
    "Les principaux outils utilisés sont ChatGPT, Veo 3, ElevenLabs et CapCut.\n\n" +
    "Un webinaire d'accompagnement est organisé chaque semaine. Ces rencontres permettent au formateur de répondre aux questions, résoudre les difficultés techniques, effectuer des démonstrations complémentaires et commenter les productions des participants.\n\n" +
    "À la fin de la formation, chaque participant réalise une vidéo publicitaire de 30 à 60 secondes et prépare une fiche de présentation pouvant être intégrée à son portfolio.",
  rules:
    "### Conditions de participation\n\n" +
    "- Disposer d'un ordinateur fonctionnel.\n" +
    "- Disposer d'une connexion Internet stable.\n" +
    "- Savoir utiliser les fonctions de base d'un ordinateur et d'un navigateur.\n" +
    "- Créer les comptes nécessaires sur les outils utilisés.\n" +
    "- Choisir un produit, un service, une entreprise ou un projet à promouvoir.\n" +
    "- Prévoir un casque ou des écouteurs.\n\n" +
    "### Organisation du travail\n\n" +
    "- La formation est suivie principalement en autonomie.\n" +
    "- Chaque participant doit progresser régulièrement dans les modules.\n" +
    "- Les activités du parcours contribuent à la réalisation du projet final.\n" +
    "- Un webinaire d'accompagnement est organisé chaque semaine.\n" +
    "- Les participants doivent consulter les modules prévus avant le webinaire correspondant.\n" +
    "- Les questions peuvent être préparées et transmises avant les rencontres.\n\n" +
    "### Validation de la formation\n\n" +
    "Pour valider la formation, le participant doit :\n\n" +
    "- consulter les modules obligatoires ;\n" +
    "- réaliser les activités principales ;\n" +
    "- remettre les différentes étapes du projet ;\n" +
    "- produire une vidéo publicitaire finale ;\n" +
    "- obtenir une note globale d'au moins **70 %**.\n\n" +
    "### Utilisation responsable\n\n" +
    "Les participants doivent respecter :\n\n" +
    "- les droits d'auteur ;\n" +
    "- le droit à l'image ;\n" +
    "- les droits liés aux marques ;\n" +
    "- le consentement relatif à l'utilisation d'une voix ;\n" +
    "- les conditions d'utilisation des outils employés.\n\n" +
    "Les contenus trompeurs, frauduleux, diffamatoires ou portant atteinte à une personne sont interdits.\n\n" +
    "### Certificat\n\n" +
    "À l'issue de la formation, les participants ayant satisfait aux conditions de réussite peuvent recevoir le **Certificat de réussite — Création de vidéos publicitaires avec l'intelligence artificielle**.\n\n" +
    "Le certificat peut mentionner les compétences principales :\n\n" +
    "- conception d'un brief publicitaire ;\n" +
    "- écriture d'un scénario ;\n" +
    "- préparation d'un storyboard ;\n" +
    "- génération vidéo avec l'IA ;\n" +
    "- création d'une voix off ;\n" +
    "- montage et finalisation d'une publicité.",
};

/* Sessions live = ACCOMPAGNEMENT (rencontre, questions, ateliers, revue,
   soutenance) — PAS des cours magistraux (le cours se suit en autonomie). */
const SESSIONS = [
  { kind: "VIRTUAL_CLASS", title: "Lancement de la cohorte", date: "2026-08-04T18:30", end: "2026-08-04T20:00", online: true,
    desc: "On fait connaissance, on présente le **calendrier** de progression autonome et la prise en main des outils. Vous repartez avec votre projet choisi." },
  { kind: "QA_SESSION", title: "Live d'accompagnement — Semaine 1", date: "2026-08-06T18:30", end: "2026-08-06T19:30", online: true,
    desc: "Vos **questions** sur les modules 1–2 (brief & concept) et point d'avancement collectif selon le calendrier." },
  { kind: "WORKSHOP", title: "Atelier encadré — Scénario & storyboard", date: "2026-08-08T09:00", end: "2026-08-08T12:00", online: false,
    desc: "Travail pratique en direct sur votre scénario et votre storyboard, avec retours du formateur." },
  { kind: "QA_SESSION", title: "Live d'accompagnement — Semaine 2", date: "2026-08-13T18:30", end: "2026-08-13T19:30", online: true,
    desc: "Vos **questions** sur les modules 3–4 (visuels & prompts) et point d'avancement." },
  { kind: "QA_SESSION", title: "Live d'accompagnement — Semaine 3", date: "2026-08-20T18:30", end: "2026-08-20T19:30", online: true,
    desc: "Vos **questions** sur les modules 5–6 (animation, voix off, son) et point d'avancement." },
  { kind: "WORKSHOP", title: "Atelier encadré — Montage & finalisation", date: "2026-08-22T09:00", end: "2026-08-22T12:00", online: false,
    desc: "Retours sur vos premières versions montées et coup de main sur la finalisation." },
  { kind: "VIRTUAL_CLASS", title: "Revue des projets", date: "2026-08-27T18:30", end: "2026-08-27T20:00", online: true,
    desc: "Retours individualisés sur les projets et derniers ajustements avant la soutenance." },
  { kind: "DEFENSE", title: "Soutenance finale & remise des attestations", date: "2026-08-29T09:00", end: "2026-08-29T13:00", online: false,
    desc: "Présentation des publicités devant le groupe, évaluation finale et remise des attestations." },
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
  for (const mod of MODULES) {
    mOrder += 1;
    const createdModule = await prisma.module.create({
      data: { courseId: course.id, title: mod.title, description: mod.description, objectives: mod.objectives, order: mOrder, status: "PUBLISHED" },
      select: { id: true },
    });
    let lOrder = 0;
    for (const les of mod.lessons) {
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
    // Quiz de fin de module.
    if (mod.quiz?.questions?.length) {
      const assessment = await prisma.assessment.create({
        data: { courseId: course.id, moduleId: createdModule.id, title: mod.quiz.title, type: "QUIZ", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: mOrder, status: "PUBLISHED" },
        select: { id: true },
      });
      let qOrder = 0;
      for (const q of mod.quiz.questions) {
        const enc = encodeQuestion(q, ++qOrder);
        if (!enc) continue;
        await prisma.question.create({ data: { assessmentId: assessment.id, type: enc.type, question: enc.question, options: enc.options, correctAnswer: enc.correctAnswer, explanation: enc.explanation, points: enc.points, order: enc.order } });
        nQ += 1;
      }
      nQuiz += 1;
    }
    // Exercice pratique (dépôt de fichiers).
    if (mod.assignment) {
      await prisma.assessment.create({
        data: { courseId: course.id, moduleId: createdModule.id, title: mod.assignment.title, description: mod.assignment.description, type: "ASSIGNMENT", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: 100 + mOrder, status: "PUBLISHED" },
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

  // 4) Sessions live d'ACCOMPAGNEMENT (Events) — reconstruites.
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
  console.log(JSON.stringify({ course: COURSE_SLUG, cohort: COHORT_SLUG, schools: Object.keys(bySlug), modules: mOrder, lessons: nLessons, quiz: nQuiz, questions: nQ, assignments: nAssign, sessions: SESSIONS.length, instructor: !!instructor }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

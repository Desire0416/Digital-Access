// Crée la formation « Cours pratique d'analyse de film » à partir du dossier
// pédagogique fourni par le formateur (Dossier_formation_Analyse_de_film).
// Formateur = utilisateur EXISTANT « Jean Baptiste Doamba » (dmbajb26@gmail.com).
// Idempotent : reconstruit intégralement le curriculum (upsert par slug).
//   node --env-file=../../.env scripts/create-course-analyse-film.mjs
//
// Note : le dossier source fournit le contenu intégral des 10 leçons mais laisse
// les quiz et devoirs « à créer par le formateur ». Les quiz (QCM) et les
// livrables ci-dessous sont dérivés fidèlement du contenu enseigné, à faire
// relire/ajuster par le formateur.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const DIRECT = process.env.ACADEMY_DATABASE_URL_UNPOOLED || process.env.ACADEMY_DATABASE_URL;
const POOLED = process.env.ACADEMY_DATABASE_URL;
if (!DIRECT) { console.error("❌ ACADEMY_DATABASE_URL(_UNPOOLED) manquante."); process.exit(1); }
const prisma = new PrismaClient({ datasourceUrl: DIRECT });

async function wake() {
  const p = new PrismaClient({ datasourceUrl: POOLED });
  for (let i = 0; i < 20; i++) { try { await p.$queryRawUnsafe("SELECT 1"); break; } catch { await new Promise((r) => setTimeout(r, 3000)); } }
  await p.$disconnect();
}

const COURSE_SLUG = "cours-pratique-danalyse-de-film";
const INSTRUCTOR_EMAIL = "dmbajb26@gmail.com";
const PRIMARY_SCHOOL = "ecole-design-creation";

const FICHE = {
  code: "DES-020",
  title: "Cours pratique d'analyse de film",
  subtitle:
    "Apprendre à décoder l'image et le récit d'un film pour en analyser les choix formels avec méthode.",
  description:
    "## La promesse\n\n" +
    "Un film ne raconte jamais une histoire uniquement par son scénario : chaque plan résulte de choix de cadrage, de mouvement, de lumière, de son et de montage qui orientent ce que le spectateur comprend et ressent. Ce cours pratique propose d'apprendre à « lire » une image filmique comme on apprend à lire un texte, puis d'ouvrir la mécanique du récit cinématographique — structure, personnages, temps et point de vue.\n\n" +
    "À l'issue des deux modules, vous disposez d'une **grille d'analyse complète et transférable**, applicable à tout extrait de film, et vous êtes capable de justifier vos observations à partir de choix formels précis plutôt que d'impressions générales.\n\n" +
    "## Le parcours en deux modules\n\n" +
    "| Module | Ce que vous apprenez | Résultat |\n|---|---|---|\n" +
    "| 1 — Décoder l'image | Cadre, mouvements de caméra, lumière, son, montage | Analyser les choix formels d'une scène selon 5 axes |\n" +
    "| 2 — Récit et émotion | Structures narratives, personnages, temps, point de vue, implication affective | Analyser la mécanique du récit selon 4 axes |\n\n" +
    "## L'approche pédagogique\n\n" +
    "L'approche privilégie l'analyse d'extraits concrets plutôt que la seule théorie : chaque notion est immédiatement mise à l'épreuve sur des séquences filmiques, à travers des grilles d'analyse, des comparaisons et des débats argumentés.\n\n" +
    "> Apprenez à lire un film comme on lit un texte.",
  objectives: [
    "Analyser un extrait de film selon cinq axes formels : cadre, mouvement, lumière, son, montage",
    "Reconstituer la structure narrative en trois actes d'un film et y situer une scène",
    "Rédiger une fiche personnage (désir conscient / besoin inconscient / obstacle / transformation)",
    "Distinguer suspense et surprise dans une scène et argumenter ce choix narratif",
    "Comparer deux traitements formels d'une même idée et en expliquer l'effet sur le spectateur",
  ],
  targetAudience: [
    "Cinéphiles souhaitant structurer leur regard critique",
    "Étudiants en cinéma, communication ou arts",
    "Créateurs de contenu et vidéastes",
    "Professionnels de l'audiovisuel souhaitant affiner leur analyse",
  ],
  prerequisitesText: [
    "Aucune connaissance technique du cinéma requise",
    "Un ordinateur ou un smartphone avec une connexion internet",
    "Un accès à des extraits de films pour les activités pratiques",
  ],
  tools: [],
  level: "BEGINNER",
  price: 0, // Tarif non précisé dans le dossier (« soumis à validation ») → gratuit par défaut, à ajuster en admin.
  durationHours: 5, // Estimation : ~2 h 30 par module (à préciser par le formateur).
  certificateTitle: "Certificat de réussite — Cours pratique d'analyse de film",
  badgeTitle: "Analyste de film",
};

/* ─────────────────────────── MODULE 1 ─────────────────────────── */
const M1 = {
  title: "Module 1 — Décoder l'image : langage et techniques du cinéma",
  objectives: [
    "Nommer et reconnaître les principales échelles de plans et leurs effets narratifs",
    "Identifier les mouvements de caméra courants et leur fonction dramatique",
    "Analyser le rôle de la lumière dans la construction d'une atmosphère",
    "Distinguer les différentes fonctions du son au cinéma (diégétique, non diégétique, silence)",
    "Comprendre les principes de base du montage et leur impact sur le rythme et le sens",
    "Appliquer ces outils d'analyse à un extrait de film concret",
  ],
  description:
    "Un film ne raconte jamais une histoire uniquement par son scénario. Chaque plan résulte d'une série de choix — cadrage, mouvement, lumière, son, montage — qui, ensemble, orientent ce que le spectateur comprend, ressent et retient. Ce module propose d'apprendre à « lire » une image filmique comme on apprend à lire un texte : en identifiant son vocabulaire, sa syntaxe et ses effets de sens. L'objectif n'est pas de faire de vous un technicien du cinéma, mais de vous donner des clés d'analyse transférables.",
  lessons: [
    {
      title: "Le cadre et la composition",
      durationMinutes: 15,
      content:
`Le cadre est la première décision d'un film : ce qu'il montre, ce qu'il exclut, et à quelle distance il place le spectateur.

## 1. L'échelle des plans

Le choix de la taille du cadre détermine la distance émotionnelle entre le spectateur et le sujet.

| Plan | Description | Effet typique |
|---|---|---|
| Plan général / large | Le sujet est petit dans un vaste espace | Situe l'action, insiste sur l'environnement, isolement |
| Plan moyen | Cadre le personnage en pied ou à mi-corps | Équilibre entre individu et contexte |
| Plan rapproché | Buste ou visage | Rapproche émotionnellement du personnage |
| Gros plan | Visage ou détail isolé | Intensité, intimité, importance dramatique |
| Très gros plan | Détail extrême (un œil, un objet) | Tension, symbolique, insistance |

## 2. Les angles de prise de vue

- **Plongée** (caméra au-dessus, regard vers le bas) : suggère la vulnérabilité, l'infériorité du sujet.
- **Contreplongée** (caméra en dessous, regard vers le haut) : donne une impression de puissance, de domination.
- **Caméra à hauteur d'yeux** : neutralité, identification directe au personnage.

## 3. La composition dans le cadre

- **Règle des tiers** : répartition des éléments clés sur des lignes imaginaires pour équilibrer l'image.
- **Profondeur de champ** : ce qui est net ou flou hiérarchise l'attention du spectateur.
- **Symétrie / asymétrie** : la symétrie rassure ou évoque le contrôle ; l'asymétrie crée du malaise ou du dynamisme.
- **Hors-champ** : ce qui n'est pas montré mais suggéré (un bruit, un regard hors cadre) mobilise l'imagination du spectateur.`,
    },
    {
      title: "Les mouvements de caméra",
      durationMinutes: 12,
      content:
`Un mouvement de caméra n'est jamais neutre : il guide le regard et traduit une intention narrative ou émotionnelle.

- **Panoramique** (rotation horizontale ou verticale sur pied fixe) : découvre un espace, relie deux éléments, accompagne un regard.
- **Travelling** (déplacement physique de la caméra) : *avant* (immersion, rapprochement dramatique), *arrière* (mise à distance, révélation d'un contexte), *latéral* (accompagnement d'un mouvement).
- **Zoom** : rapprochement optique sans déplacement physique ; effet plus artificiel que le travelling, souvent utilisé pour souligner un détail brutalement.
- **Caméra portée / épaule** : instabilité contrôlée, sensation d'urgence, de réalisme documentaire ou de tension.
- **Plan séquence** : plan unique, sans coupe, qui prolonge l'action en temps réel — renforce l'immersion et la continuité dramatique.
- **Caméra sur grue / drone** : prises de vue aériennes ou amples, souvent utilisées pour ouvrir ou clore une séquence, donner une échelle épique.

> 💭 Point clé : posez-vous systématiquement la question « pourquoi la caméra bouge-t-elle (ou reste-t-elle fixe) à cet instant précis ? »`,
    },
    {
      title: "La lumière",
      durationMinutes: 12,
      content:
`La lumière ne se contente pas d'éclairer une scène : elle sculpte les volumes, dirige le regard et installe une tonalité émotionnelle.

## 1. Les sources

- **Lumière naturelle** : renforce le réalisme, dépend des conditions du tournage.
- **Lumière artificielle** : totalement maîtrisée, permet de construire une ambiance précise.

## 2. Le dispositif classique à trois points

- **Lumière clé** (*key light*) : source principale, modèle le visage / le sujet.
- **Lumière de remplissage** (*fill light*) : adoucit les ombres créées par la clé.
- **Contre-jour** (*back light*) : détache le sujet du fond, crée du relief.

## 3. Qualités expressives de la lumière

- **Dure vs douce** : une lumière dure (ombres nettes) évoque la tension, le danger ; une lumière douce (ombres diffuses) évoque la tendresse, le rêve.
- **Clair-obscur** : forts contrastes entre zones éclairées et zones sombres — associé au thriller, au film noir, à l'introspection.
- **Température de couleur** : dominantes chaudes (nostalgie, intimité, chaleur) vs dominantes froides (distance, danger, mélancolie).
- **Direction de la lumière** : de face (aplatit, neutralise), de côté (sculpte, dramatise), du dessous (inquiétant, inversion des codes).`,
    },
    {
      title: "Le son",
      durationMinutes: 12,
      content:
`Le son est souvent sous-estimé alors qu'il façonne autant la perception du spectateur que l'image.

## 1. Les catégories de son

- **Son diégétique** : provient de l'univers de la fiction (dialogues, bruits d'ambiance, musique jouée à l'écran).
- **Son non diégétique** : extérieur à la fiction, perçu seulement par le spectateur (musique de score, voix off commentative).

## 2. Fonctions du son

- **La musique** : oriente l'émotion, anticipe ou contredit une action (musique en contrepoint), crée une identité thématique (leitmotiv).
- **Le silence** : outil dramatique à part entière — un silence soudain peut créer une tension plus forte qu'une musique.
- **La voix off** : commente, informe, ou installe un point de vue subjectif.
- **Le mixage sonore** : hiérarchise les sons (ce qu'on met en avant ou en arrière-plan) pour orienter l'attention.
- **Son in / hors-champ / over** : un son dont la source est visible, invisible mais présente dans la scène, ou totalement extérieure à l'espace-temps de la fiction.`,
    },
    {
      title: "Le montage",
      durationMinutes: 15,
      content:
`Il est important de dissocier la technique du sens artistique : le logiciel de montage utilisé n'influence ni la qualité du film ni son style de narration. Ce qui façonne réellement le récit, ce sont les choix du monteur — la durée de chaque plan, le rythme des coupes, le type de raccord, les ellipses, l'alternance entre les points de vue. L'enjeu prioritaire est donc de comprendre la **grammaire du montage** plutôt que de maîtriser un logiciel en particulier.

Le montage organise les plans entre eux ; c'est l'art de la relation, du rythme et du sens créé par la juxtaposition.

## 1. Les raccords

- **Raccord dans l'axe / de mouvement** : continuité fluide entre deux plans.
- **Champ / contrechamp** : alterne les points de vue, typique des dialogues.
- **Faux raccord** : rupture volontaire ou accidentelle de continuité, utilisée à des fins expressives.

## 2. Les figures de montage

- **Montage alterné** : deux actions simultanées montées en alternance, crée du suspense.
- **Montage parallèle** : rapproche deux actions distinctes pour suggérer un lien thématique.
- **Ellipse** : saut temporel qui condense l'action, laisse le spectateur reconstruire le temps manquant.
- **Cut / coupe franche** : transition brutale, dynamique.
- **Fondu enchaîné, fondu au noir** : transitions douces, souvent associées au temps qui passe ou à une clôture émotionnelle.

## 3. Le rythme

La durée des plans et la fréquence des coupes déterminent le tempo perçu : montage rapide (action, urgence, chaos) vs montage lent (contemplation, malaise, gravité).

## À retenir

Aucun de ces outils n'agit isolément. Une scène de tension, par exemple, peut combiner un cadrage resserré (gros plan), une lumière dure en clair-obscur, une caméra portée légèrement instable, un son ambiant réduit au minimum et un montage qui accélère progressivement.

Apprendre à décomposer une scène selon ces **cinq axes** (cadre, mouvement, lumière, son, montage) permet de comprendre non seulement ce que montre un film, mais comment il le fait ressentir.`,
    },
  ],
  quiz: {
    title: "Quiz — Module 1 : Décoder l'image",
    questions: [
      { question: "Quel plan est le mieux adapté pour isoler un détail extrême, comme un œil ou un objet ?", options: ["Plan général", "Plan moyen", "Gros plan", "Très gros plan"], answerIndex: 3, explanation: "Le très gros plan isole un détail extrême et crée tension, symbolique ou insistance." },
      { question: "Que suggère généralement une contreplongée (caméra en dessous, regard vers le haut) ?", options: ["La vulnérabilité du sujet", "La puissance ou la domination", "La neutralité", "La confusion"], answerIndex: 1, explanation: "La contreplongée donne une impression de puissance et de domination ; la plongée, à l'inverse, suggère la vulnérabilité." },
      { question: "Quel effet produit principalement un travelling avant ?", options: ["La mise à distance", "L'immersion et le rapprochement dramatique", "La neutralité", "La révélation d'un contexte lointain"], answerIndex: 1, explanation: "Le travelling avant rapproche physiquement du sujet : immersion et intensité dramatique. Le travelling arrière met à distance." },
      { question: "Dans le dispositif classique à trois points, quelle source détache le sujet du fond ?", options: ["La lumière clé (key light)", "La lumière de remplissage (fill light)", "Le contre-jour (back light)", "La lumière naturelle"], answerIndex: 2, explanation: "Le contre-jour détache le sujet du fond et crée du relief. La clé modèle le sujet, le fill adoucit les ombres." },
      { question: "Qu'est-ce qu'un son non diégétique ?", options: ["Un son provenant de l'univers de la fiction", "Un son extérieur à la fiction, perçu seulement par le spectateur", "Un dialogue entre deux personnages", "Un bruit d'ambiance"], answerIndex: 1, explanation: "Le son non diégétique (musique de score, voix off commentative) n'existe pas dans l'univers des personnages : seul le spectateur l'entend." },
      { question: "À quoi sert principalement le montage alterné ?", options: ["Condenser le temps", "Créer du suspense en montant deux actions simultanées", "Adoucir une transition", "Neutraliser le rythme"], answerIndex: 1, explanation: "Le montage alterné entrelace deux actions simultanées et crée du suspense. Le montage parallèle, lui, suggère un lien thématique." },
    ],
  },
  assignment: {
    title: "Livrable — Grille d'analyse formelle d'un extrait",
    description:
`## Objectif

Appliquer les cinq axes formels du Module 1 à un extrait de film au style visuel marqué (2 à 4 minutes de votre choix).

## Consigne

Visionnez l'extrait puis complétez une grille d'analyse en cinq axes :

| Axe | À observer |
|---|---|
| **Cadre** | Échelle des plans, angles, composition |
| **Mouvement** | Mouvements de caméra et leur fonction |
| **Lumière** | Sources, qualité (dure/douce), température, direction |
| **Son** | Diégétique / non diégétique, musique, silence, voix off |
| **Montage** | Raccords, figures, rythme des coupes |

Pour chaque axe, ne vous contentez pas de **décrire** : expliquez **l'effet produit** sur le spectateur et **l'intention** possible du réalisateur.

## Livrable attendu

Un document (texte, tableau ou PDF) présentant la grille complétée, en justifiant chaque observation par un choix formel précis (pas par une impression générale). Indiquez le titre de l'extrait et le minutage analysé.`,
  },
};

/* ─────────────────────────── MODULE 2 ─────────────────────────── */
const M2 = {
  title: "Module 2 — Récit et émotion : les rouages de la narration cinématographique",
  objectives: [
    "Identifier les grandes structures narratives utilisées au cinéma et leurs variantes",
    "Analyser la construction d'un personnage et sa fonction dans le récit",
    "Repérer les manipulations du temps (ordre, durée, fréquence) et leurs effets",
    "Distinguer les différents points de vue narratifs et focalisations",
    "Comprendre les mécanismes par lesquels un film suscite l'empathie, la tension ou la surprise",
    "Appliquer ces outils à l'analyse d'un film ou d'un extrait",
  ],
  description:
    "Un film fonctionne comme une machine à produire des émotions organisées dans le temps. Contrairement au roman, le récit filmique impose son rythme au spectateur : il ne peut ni ralentir ni revenir en arrière à sa guise. Comprendre comment un film construit son histoire — sa structure, ses personnages, son traitement du temps, ses points de vue — permet de saisir pourquoi certaines scènes nous bouleversent, nous surprennent ou nous tiennent en haleine. Ce module ouvre la « mécanique » du récit filmique et les procédés concrets par lesquels le cinéma capte et oriente notre implication affective.",
  lessons: [
    {
      title: "Les structures narratives",
      durationMinutes: 14,
      content:
`Toute analyse de récit commence par sa structure : la manière dont les événements sont organisés dans le temps pour produire du sens et de l'émotion.

## 1. La structure en trois actes

Modèle dominant du cinéma occidental, hérité du théâtre classique :

- **Acte 1 — Exposition** : présentation du monde, du personnage principal, de son manque ou désir, puis élément déclencheur qui bouleverse l'équilibre initial.
- **Acte 2 — Confrontation** : le personnage poursuit son objectif, rencontre des obstacles croissants, souvent structurés autour d'un point médian qui relance l'intrigue.
- **Acte 3 — Résolution** : climax où les enjeux se cristallisent, puis dénouement qui rétablit un nouvel équilibre.

## 2. Le voyage du héros

Structure archétypale théorisée à partir des mythes (**Joseph Campbell**, popularisée par Christopher Vogler) : appel à l'aventure, refus puis acceptation, mentor, épreuves, épreuve suprême, retour transformé. Très présente dans les films d'aventure, le fantastique et le blockbuster.

## 3. Structures non linéaires et alternatives

- **Récit éclaté / fragmenté** : la chronologie est brisée, obligeant le spectateur à reconstruire l'histoire.
- **Structure circulaire** : le film se termine là où il a commencé, avec un sens transformé.
- **Récits à protagonistes multiples** : plusieurs lignes narratives qui se croisent ou restent parallèles.
- **Structure épisodique** : succession de séquences reliées par un thème ou un personnage plus que par une logique de cause à effet stricte.

## 4. Les schémas actanciels

- **Objectif / obstacle / enjeu** : tout personnage principal poursuit un but concret, rencontre des résistances, et un enjeu donne du poids dramatique à cette quête.
- **Le conflit** : moteur essentiel du récit — externe (antagoniste, environnement) ou interne (dilemme moral, contradiction intérieure).`,
    },
    {
      title: "Les personnages",
      durationMinutes: 13,
      content:
`Une structure ne produit d'émotion que si les personnages qui l'habitent sont incarnés avec justesse.

## 1. Fonctions narratives

- **Protagoniste** : porteur du regard et de l'enjeu principal du récit.
- **Antagoniste** : force d'opposition, pas nécessairement incarnée par une personne (peut être la nature, la société, soi-même).
- **Personnages secondaires et adjuvants** : soutiennent, informent ou compliquent la trajectoire du héros.

## 2. Construction et caractérisation

- **Caractérisation directe** : ce que le personnage dit de lui-même ou ce que d'autres disent de lui.
- **Caractérisation indirecte** : déduite des actions, des choix, du langage corporel, de l'environnement — généralement plus efficace au cinéma, qui privilégie le « montrer » au « dire ».
- **L'arc de transformation** : évolution psychologique du personnage entre le début et la fin (ou son absence volontaire, pour les personnages statiques qui révèlent le monde autour d'eux).
- **Désir conscient vs besoin inconscient** : un personnage poursuit souvent un objectif explicite (désir) tout en ayant besoin, sans le savoir, d'autre chose pour être en paix — la tension entre les deux nourrit l'arc dramatique.

## 3. L'identification et l'empathie

Le spectateur s'attache à un personnage par plusieurs leviers cumulables : la vulnérabilité montrée tôt, la compétence démontrée dans l'action, l'injustice subie, l'humour, ou simplement le temps d'écran et la proximité du cadrage (gros plans répétés favorisant la connexion émotionnelle).`,
    },
    {
      title: "Le temps du récit",
      durationMinutes: 12,
      content:
`Le cinéma manipule trois dimensions du temps, à distinguer clairement.

## 1. L'ordre

- **Récit chronologique** : les événements sont montrés dans leur ordre naturel.
- **Analepse (flashback)** : retour en arrière qui éclaire le présent, informe, crée du contraste ou de la nostalgie.
- **Prolepse (flashforward)** : anticipation d'un événement futur, crée de l'attente ou du suspense.

## 2. La durée

- **Scène** : durée du récit à peu près égale à la durée de l'histoire (dialogue en temps réel).
- **Ellipse** : compression du temps, on saute des événements jugés non essentiels.
- **Sommaire** : condensation rapide d'une période plus longue (plusieurs mois d'entraînement en quelques plans).
- **Pause** : le temps du récit s'arrête ou ralentit fortement pour une description ou une insistance (ralenti).

## 3. La fréquence

- **Singulatif** : un événement raconté une fois.
- **Répétitif** : un même événement montré plusieurs fois, sous des angles ou points de vue différents, pour révéler une vérité progressivement (récits à énigme).

## 4. Effets du traitement temporel sur l'émotion

Un flashback bien placé peut transformer rétroactivement la compréhension d'un personnage. Une ellipse peut accentuer la brutalité d'une conséquence en évitant d'en montrer la cause. Un ralenti insiste sur l'intensité d'un instant et invite à une contemplation impossible dans la vie réelle.`,
    },
    {
      title: "Le point de vue",
      durationMinutes: 12,
      content:
`Qui « voit » et qui « sait » dans un récit conditionne directement l'émotion ressentie.

## 1. La focalisation

- **Focalisation zéro (narrateur omniscient)** : le spectateur en sait plus que n'importe quel personnage — favorise le suspense dramatique (on voit venir un danger que le personnage ignore).
- **Focalisation interne** : le récit reste attaché au point de vue et aux connaissances d'un personnage — favorise l'identification et la surprise partagée.
- **Focalisation externe** : la caméra observe sans accès aux pensées de quiconque — crée distance, ambiguïté, parfois mystère.

## 2. Le narrateur au cinéma

- **Narration implicite** : portée par la mise en scène elle-même (cadrage, montage) sans commentaire explicite.
- **Voix off narrative** : un narrateur commente, explique ou interprète les événements — fiable ou non fiable.
- **Narrateur personnage vs extérieur** : un personnage qui raconte sa propre histoire engage une subjectivité assumée ; un narrateur extérieur suggère une autorité plus neutre.

## 3. Suspense vs surprise

Distinction popularisée par **Alfred Hitchcock** : le *suspense* naît quand le spectateur en sait plus que les personnages (une bombe est cachée sous la table, les personnages l'ignorent) ; la *surprise* naît quand une information est révélée d'un coup, sans anticipation partagée. Le choix entre ces deux mécanismes dépend directement du point de vue narratif adopté.`,
    },
    {
      title: "Les mécanismes de l'implication affective",
      durationMinutes: 14,
      content:
`Comment un film capte concrètement nos émotions ? En articulant construction de personnage et outils formels.

## 1. L'empathie et l'identification

Le spectateur ressent des émotions par un mélange de **simulation mentale** (se mettre à la place du personnage) et de **réaction directe** aux stimuli audiovisuels (musique, rythme, cadrage). Les films exploitent ce double mécanisme.

## 2. La tension dramatique

Créée par l'écart entre ce que le personnage veut et les obstacles qui s'y opposent, mais aussi par le rythme du montage, l'utilisation du hors-champ, ou une temporalité suspendue (compte à rebours, attente prolongée).

## 3. Les enjeux émotionnels

- **Enjeux externes** : survie, réussite d'une mission, victoire sur un adversaire.
- **Enjeux internes** : rédemption, acceptation, réconciliation avec soi-même ou un proche.

Les films les plus marquants articulent souvent les deux niveaux simultanément.

## 4. Le contrat de genre

Chaque genre installe des attentes émotionnelles spécifiques (peur au film d'horreur, tension au thriller, catharsis au mélodrame, satisfaction au film d'action) que le récit peut respecter, détourner ou subvertir.

## 5. La catharsis et la résolution émotionnelle

Le dénouement propose généralement une décharge émotionnelle après l'accumulation de tension de l'acte 2 — soulagement, tristesse assumée, ou ambiguïté volontairement non résolue (fins ouvertes).

## À retenir

Structure, personnages, temps et point de vue ne fonctionnent jamais isolément : analyser un film, c'est toujours **croiser ces quatre axes** plutôt que les isoler.`,
    },
  ],
  quiz: {
    title: "Quiz — Module 2 : Récit et émotion",
    questions: [
      { question: "Dans la structure en trois actes, l'élément déclencheur survient généralement à la fin de quel acte ?", options: ["L'Acte 1 (exposition)", "L'Acte 2 (confrontation)", "L'Acte 3 (résolution)", "Le générique de fin"], answerIndex: 0, explanation: "L'élément déclencheur clôt l'exposition (Acte 1) en bouleversant l'équilibre initial et en lançant la quête." },
      { question: "Le « voyage du héros » a été théorisé à partir des mythes par…", options: ["Alfred Hitchcock", "Joseph Campbell", "Christopher Nolan", "Aristote"], answerIndex: 1, explanation: "Joseph Campbell a théorisé le monomythe (le voyage du héros), popularisé ensuite au cinéma par Christopher Vogler." },
      { question: "La caractérisation indirecte d'un personnage se déduit surtout…", options: ["De ce qu'il dit de lui-même", "De ce que le narrateur affirme explicitement", "De ses actions, ses choix et son langage corporel", "De son nom au générique"], answerIndex: 2, explanation: "La caractérisation indirecte passe par les actions et les choix : au cinéma, « montrer » est plus efficace que « dire »." },
      { question: "Un flashback correspond à quelle manipulation du temps ?", options: ["Une prolepse", "Une analepse", "Une ellipse", "Un sommaire"], answerIndex: 1, explanation: "L'analepse est un retour en arrière (flashback). La prolepse, elle, anticipe un événement futur (flashforward)." },
      { question: "Selon la distinction d'Hitchcock, le suspense naît quand…", options: ["Une information est révélée d'un coup", "Le spectateur en sait plus que les personnages", "Le personnage en sait plus que le spectateur", "Il n'y a aucune musique"], answerIndex: 1, explanation: "Le suspense repose sur un savoir partagé avec le spectateur mais ignoré du personnage (la bombe sous la table). La surprise, elle, révèle sans anticipation." },
      { question: "La focalisation zéro (narrateur omniscient) favorise surtout…", options: ["L'identification à un seul personnage", "Le suspense dramatique", "L'ambiguïté totale", "La surprise partagée avec le héros"], answerIndex: 1, explanation: "Quand le spectateur en sait plus que les personnages (focalisation zéro), le récit peut installer un suspense dramatique." },
    ],
  },
  assignment: {
    title: "Livrable — Cartographie narrative & fiche personnage",
    description:
`## Objectif

Appliquer les outils narratifs du Module 2 à un film que vous connaissez bien.

## Partie 1 — Cartographie narrative

Reconstituez la **structure en trois actes** du film sur un support visuel (tableau ou schéma) :

- Acte 1 : situation initiale, personnage, désir/manque, élément déclencheur
- Acte 2 : obstacles principaux, point médian
- Acte 3 : climax et dénouement

## Partie 2 — Fiche personnage

Rédigez, pour le personnage principal, une fiche en quatre points :

| Élément | À renseigner |
|---|---|
| **Désir conscient** | Ce que le personnage veut explicitement |
| **Besoin inconscient** | Ce dont il a réellement besoin, sans le savoir |
| **Obstacle principal** | Ce qui s'oppose à lui (externe ou interne) |
| **Transformation** | Comment il change entre le début et la fin |

## Livrable attendu

Un document (texte, tableau ou PDF) rassemblant la cartographie et la fiche personnage. Précisez le titre du film analysé et justifiez vos choix par des éléments concrets du récit.`,
  },
};

const MODULES = [M1, M2];

function encQ(q, order) {
  return { type: "SINGLE_CHOICE", question: q.question.trim(), options: q.options.map(String), correctAnswer: q.answerIndex, explanation: q.explanation || null, points: 1, order };
}

async function main() {
  await wake();

  // 1) Formateur EXISTANT — jamais créé ici.
  const instructor = await prisma.user.findUnique({ where: { email: INSTRUCTOR_EMAIL }, select: { id: true, name: true, roles: true } });
  if (!instructor) { console.error(`❌ Formateur introuvable (${INSTRUCTOR_EMAIL}). Abandon — aucun compte créé.`); await prisma.$disconnect(); process.exit(1); }

  // Le rôle INSTRUCTOR est requis pour accéder au studio et corriger ; on l'ajoute sans retirer LEARNER.
  if (!instructor.roles.includes("INSTRUCTOR")) {
    await prisma.user.update({ where: { id: instructor.id }, data: { roles: { set: [...new Set([...instructor.roles, "INSTRUCTOR"])] } } });
  }

  const school = await prisma.school.findUnique({ where: { slug: PRIMARY_SCHOOL }, select: { id: true } });

  // 2) Formation (upsert par slug).
  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: {
      code: FICHE.code, title: FICHE.title, subtitle: FICHE.subtitle, description: FICHE.description,
      objectives: FICHE.objectives, targetAudience: FICHE.targetAudience, prerequisitesText: FICHE.prerequisitesText,
      tools: FICHE.tools, level: FICHE.level, price: FICHE.price, durationHours: FICHE.durationHours,
      certificateTitle: FICHE.certificateTitle, badgeTitle: FICHE.badgeTitle, unlockMode: "SEQUENTIAL",
      status: "PUBLISHED", publishedAt: new Date(),
    },
    create: {
      slug: COURSE_SLUG, code: FICHE.code, title: FICHE.title, subtitle: FICHE.subtitle, description: FICHE.description,
      objectives: FICHE.objectives, targetAudience: FICHE.targetAudience, prerequisitesText: FICHE.prerequisitesText,
      tools: FICHE.tools, level: FICHE.level, language: "fr", price: FICHE.price, durationHours: FICHE.durationHours,
      certificateTitle: FICHE.certificateTitle, badgeTitle: FICHE.badgeTitle, unlockMode: "SEQUENTIAL",
      status: "PUBLISHED", publishedAt: new Date(),
    },
    select: { id: true },
  });

  // 3) Reconstruction propre du curriculum.
  await prisma.module.deleteMany({ where: { courseId: course.id } });
  await prisma.assessment.deleteMany({ where: { courseId: course.id } });

  // 4) École (rattachement).
  if (school) {
    await prisma.schoolCourse.deleteMany({ where: { courseId: course.id } });
    await prisma.schoolCourse.create({ data: { schoolId: school.id, courseId: course.id, isPrimary: true, isFeatured: false, position: 0 } });
  }

  // 5) Modules + leçons + quiz + livrable.
  let firstPreview = false, nLessons = 0, nQuiz = 0, nQ = 0, nAssign = 0, mOrder = 0;
  for (const m of MODULES) {
    mOrder += 1;
    const mod = await prisma.module.create({
      data: { courseId: course.id, title: m.title, description: m.description, objectives: m.objectives, order: mOrder, status: "PUBLISHED" },
      select: { id: true },
    });
    let lOrder = 0;
    for (const les of m.lessons) {
      lOrder += 1;
      const isPreview = !firstPreview; firstPreview = true;
      await prisma.lesson.create({
        data: { moduleId: mod.id, title: les.title, lessonType: "TEXT", content: les.content, durationMinutes: les.durationMinutes ?? null, order: lOrder, isPreview, isRequired: true, status: "PUBLISHED" },
      });
      nLessons += 1;
    }
    // Quiz (seuil 70 %).
    const quiz = await prisma.assessment.create({
      data: { courseId: course.id, moduleId: mod.id, title: m.quiz.title, type: "QUIZ", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: mOrder, status: "PUBLISHED" },
      select: { id: true },
    });
    let qOrder = 0;
    for (const q of m.quiz.questions) { const e = encQ(q, ++qOrder); await prisma.question.create({ data: { assessmentId: quiz.id, ...e } }); nQ += 1; }
    nQuiz += 1;
    // Livrable (devoir).
    await prisma.assessment.create({
      data: { courseId: course.id, moduleId: mod.id, title: m.assignment.title, description: m.assignment.description, type: "ASSIGNMENT", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: 100 + mOrder, status: "PUBLISHED" },
    });
    nAssign += 1;
  }

  // 6) Formateur (CourseInstructor).
  await prisma.courseInstructor.upsert({
    where: { courseId_userId: { courseId: course.id, userId: instructor.id } },
    update: { roleLabel: "Formateur principal" },
    create: { courseId: course.id, userId: instructor.id, roleLabel: "Formateur principal", order: 0 },
  });

  console.log("=== FORMATION CRÉÉE ===");
  console.log(JSON.stringify({ course: COURSE_SLUG, title: FICHE.title, school: PRIMARY_SCHOOL, instructor: instructor.name, instructorEmail: INSTRUCTOR_EMAIL, modules: MODULES.length, lessons: nLessons, quiz: nQuiz, questions: nQ, assignments: nAssign }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

// Crée la formation « Création de vidéos publicitaires avec l'IA » + sa cohorte
// « Août 2026 », À PARTIR DU CONTENU RÉEL du manuel LMS (content-video-ia.json,
// produit par parse-contenu-video-ia.py depuis le .docx « Plan adopté »).
// Idempotent : reconstruit intégralement à chaque exécution (upsert par slug).
//   node --env-file=../../.env scripts/create-cohort-video-ia.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTENT = JSON.parse(readFileSync(join(HERE, "content-video-ia.json"), "utf-8"));

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

/* Retire une étiquette majuscule en tête de ligne (« BIENVENUE — », etc.). */
const strip = (s) => (s || "").replace(/^[A-ZÀ-ŸÉÈÊ' ]+—\s*/, "").trim();
const bullets = (arr) => arr.map((x) => `- ${x}`).join("\n");

/* ───────────────────── Fiche de la formation (métadonnées) ────────────────── */
const FICHE = {
  code: "DES-019",
  title: "Création de vidéos publicitaires avec l'intelligence artificielle",
  subtitle:
    "Concevez et produisez, en autonomie accompagnée, une vraie publicité vidéo (30–60 s) avec ChatGPT, Veo 3, ElevenLabs et CapCut — du brief au montage final, prête pour votre portfolio.",
  description:
    "## Promesse\n\n" +
    "Cette formation apprend à concevoir une vidéo publicitaire professionnelle courte en combinant stratégie, narration, génération vidéo, voix synthétique et montage. L'objectif n'est pas de laisser les outils décider à la place du créateur, mais de savoir leur donner un cadre précis, évaluer leurs propositions et assembler un résultat crédible.\n\n" +
    "## Les quatre outils\n\n" +
    "| Outil | Rôle principal | Responsabilité humaine |\n|---|---|---|\n" +
    "| ChatGPT | Explorer, structurer, rédiger et réviser | Fournir le contexte, vérifier, choisir et réécrire |\n" +
    "| Veo 3 | Générer des plans vidéo à partir d'instructions | Diriger, sélectionner, contrôler les artefacts et les droits |\n" +
    "| ElevenLabs | Produire une voix à partir d'un texte | Choisir la voix, obtenir les consentements et diriger l'interprétation |\n" +
    "| CapCut | Assembler, rythmer, titrer, sous-titrer et exporter | Construire le sens, contrôler la qualité et la conformité |\n\n" +
    "## Un projet fil rouge\n\n" +
    "Chaque participant choisit dès le début un produit, un service, une entreprise, une association ou un projet à promouvoir. Ce sujet devient son projet fil rouge : les exercices ne sont pas indépendants, chaque module produit une partie de la vidéo finale.\n\n" +
    "| Étape | Production attendue | Module |\n|---|---|---|\n" +
    "| 1 | Choix du projet | Module 1 |\n| 2 | Brief publicitaire | Module 2 |\n| 3 | Scénario | Module 3 |\n" +
    "| 4 | Storyboard et prompts | Module 4 |\n| 5 | Scènes vidéo générées | Module 5 |\n| 6 | Voix off | Module 6 |\n" +
    "| 7 | Première version montée | Module 7 |\n| 8 | Vidéo finale | Module 8 |\n| 9 | Présentation portfolio | Module 9 |\n\n" +
    "## Modalités pédagogiques\n\n" +
    "- **Autonomie guidée** : le participant avance dans les leçons, reproduit les démonstrations et dépose un livrable.\n" +
    "- **Projet fil rouge** : chaque production est réutilisée dans le module suivant.\n" +
    "- **Webinaire hebdomadaire** : le formateur répond, démontre, corrige et fixe le prochain standard.\n" +
    "- **Évaluation formative** : quiz, autoévaluation, retours des pairs et corrections.\n" +
    "- **Traçabilité** : prompts, versions, sources et autorisations sont conservés.",
  objectives: [
    "Distinguer information, argumentation et publicité",
    "Élaborer un brief, une promesse et un concept",
    "Construire un scénario audiovisuel court",
    "Découper en plans et formaliser les prompts",
    "Produire et sélectionner des scènes cohérentes",
    "Créer et diriger une voix off responsable",
    "Assembler image, son et rythme dans CapCut",
    "Intégrer marque, sous-titres et formats",
    "Présenter la démarche dans un portfolio",
  ],
  targetAudience: [
    "Entrepreneurs, responsables de petites entreprises, associations ou projets",
    "Chargés de communication, community managers et créateurs de contenu",
    "Formateurs, consultants, freelances et agences souhaitant prototyper des publicités",
    "Débutants motivés disposant d'une culture numérique de base",
  ],
  prerequisitesText: [
    "Savoir utiliser un navigateur, télécharger et classer des fichiers",
    "Disposer d'un ordinateur, d'écouteurs et d'une connexion stable",
    "Disposer des accès nécessaires aux outils, selon les offres disponibles au moment de la cohorte",
    "Avoir un produit, un service, une organisation ou un projet à promouvoir",
    "Prévoir 5 à 7 heures de travail par semaine, webinaire compris",
  ],
  tools: ["ChatGPT", "Veo 3", "ElevenLabs", "CapCut"],
  level: "BEGINNER",
  price: 50000,
  durationHours: 55,
  certificateTitle: "Certificat de réussite — Création de vidéos publicitaires avec l'intelligence artificielle",
};

/* Annexes (modèles prêts à l'emploi) rattachées aux modules concernés. */
const ANNEXES_BY_MODULE = {
  1: ["A", "N"], 2: ["B"], 3: ["C"], 4: ["D", "E", "F"],
  5: ["G"], 6: ["H"], 7: ["I", "J"], 8: ["K", "M"], 9: ["L"],
};
const annexById = Object.fromEntries(CONTENT.annexes.map((a) => [a.letter, a]));

/* Met en forme le corps d'une annexe : blocs de tableau isolés par une ligne
   vide, lignes de formulaire préservées par un retour forcé markdown. */
function formatAnnexe(body) {
  const out = [];
  const lines = body.split("\n");
  let prevTable = false;
  for (const raw of lines) {
    const l = raw.replace(/\s+$/, "");
    const isTable = l.trim().startsWith("|");
    if (isTable && !prevTable && out.length && out[out.length - 1] !== "") out.push("");
    if (!isTable && prevTable) out.push("");
    if (l.trim() === "") out.push("");
    else if (isTable) out.push(l);
    else out.push(l + "  "); // retour forcé pour les lignes de formulaire
    prevTable = isTable;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ─── Construit les leçons d'un module à partir du contenu réel ─── */
function lessonsForModule(m) {
  const lessons = [];
  // 1) Introduction (page d'ouverture)
  const d = m.dureeRow || ["", "", ""];
  lessons.push({
    type: "TEXT",
    title: "Introduction du module",
    durationMinutes: 8,
    content:
      `${strip(m.bienvenue)}\n\n` +
      `**Ce module en bref**\n\n` +
      `- ⏱️ ${d[0]}\n- ✅ Validation : ${d[1]}\n- 📦 Livrable fil rouge : ${d[2]}\n\n` +
      `## Objectifs\n\n${bullets(m.objectives)}\n\n` +
      `## Au programme\n\n${bullets(m.parcours)}`,
  });
  // 2) Une leçon par sous-section (théorie + à retenir + réflexion)
  for (const s of m.sections) {
    lessons.push({
      type: "TEXT",
      title: `${s.key} ${s.title}`,
      durationMinutes: 12,
      content:
        `${s.prose.join("\n\n")}\n\n` +
        (s.retenir.length ? `**À retenir**\n\n${bullets(s.retenir)}\n\n` : "") +
        (s.question ? `> 💭 ${strip(s.question)}` : ""),
    });
  }
  // 3) Tutoriel pas à pas + activité pratique
  const tutoName = m.tutoTitle.replace(/^Tutoriel pas à pas\s*—\s*/, "").trim();
  lessons.push({
    type: "TEXT",
    title: `Tutoriel — ${tutoName}`,
    durationMinutes: 20,
    content:
      `## ${tutoName}\n\n` +
      m.tutoSteps.map((s, i) => `${i + 1}. ${s}`).join("\n") +
      `\n\n## Activité pratique\n\n${strip(m.consigne)}\n\n` +
      (m.modalites.length ? `**Modalités**\n\n${bullets(m.modalites)}` : ""),
  });
  // 4) Modèles (annexes) rattachés au module
  for (const letter of ANNEXES_BY_MODULE[m.num] || []) {
    const a = annexById[letter];
    if (!a) continue;
    lessons.push({
      type: "TEXT",
      title: `Modèle — ${a.title}`,
      durationMinutes: 6,
      content: `> 🧩 Modèle prêt à l'emploi (annexe ${a.letter}) à copier pour votre projet.\n\n${formatAnnexe(a.body)}`,
    });
  }
  return lessons;
}

function assignmentForModule(m) {
  return {
    title: `Livrable — ${m.title}`,
    description:
      `${strip(m.prod)}\n\n` +
      (m.criteres.length ? `**Critères de réussite**\n\n${bullets(m.criteres)}` : ""),
  };
}

/* ─── Encodage des questions (identique à l'importeur) ─── */
function encodeQuestion(q, order) {
  return {
    type: "SINGLE_CHOICE",
    question: String(q.question).trim(),
    options: q.options.map(String),
    correctAnswer: q.answerIndex,
    explanation: q.explanation || null,
    points: 1,
    order,
  };
}

/* ─────────────────────── Cohorte & webinaires ─────────────────────── */
const COHORT = {
  name: "Création de vidéos publicitaires avec l'IA — Cohorte Août 2026",
  type: "HYBRID",
  status: "OPEN",
  startDate: at("2026-08-03T08:00"),
  endDate: at("2026-10-02T20:00"),
  enrollmentDeadline: at("2026-08-01T18:00"),
  capacity: 20,
  price: 50000,
  rhythm: "9 semaines · 1 module + 1 webinaire d'accompagnement par semaine",
  description:
    "Cette cohorte accompagne les participants dans la réalisation autonome d'une vidéo publicitaire avec l'intelligence artificielle.\n\n" +
    "La formation est suivie principalement en autonomie sur la plateforme. Chaque participant avance à travers des cours, des démonstrations, des exercices et un projet fil rouge.\n\n" +
    "Tout au long du parcours, les activités permettent de construire progressivement une publicité complète : brief, concept, scénario, storyboard, prompts, scènes vidéo, voix off et montage final.\n\n" +
    "Les principaux outils utilisés sont ChatGPT, Veo 3, ElevenLabs et CapCut.\n\n" +
    "Un webinaire d'accompagnement est organisé chaque semaine. Ces rencontres permettent au formateur de répondre aux questions, résoudre les difficultés techniques, effectuer des démonstrations complémentaires et commenter les productions des participants.\n\n" +
    "À la fin de la formation, chaque participant réalise une vidéo publicitaire de 30 à 60 secondes et prépare une fiche de présentation pouvant être intégrée à son portfolio.",
  rules:
    "### Conditions de participation\n\n" +
    bullets(FICHE.prerequisitesText) + "\n\n" +
    "### Organisation & engagement\n\n" +
    "- Un module par semaine et un webinaire d'accompagnement par semaine (9 semaines).\n" +
    "- Chaque semaine : découvrir l'introduction et les objectifs, étudier les leçons et reproduire le tutoriel, réaliser l'activité, compléter le livrable fil rouge, passer le quiz (**≥ 80 %**) et déposer le travail avant le webinaire.\n" +
    "- Participer à la correction et améliorer le livrable.\n\n" +
    "### Évaluation continue\n\n" +
    "| Élément | Pondération | Condition |\n|---|---|---|\n" +
    "| Quiz des neuf modules | 10 % | Moyenne minimale de 80 % après tentatives |\n" +
    "| Livrables fil rouge | 30 % | Au moins huit livrables remis sur neuf |\n" +
    "| Vidéo finale | 40 % | 30 à 60 secondes et aucun critère éliminatoire |\n" +
    "| Portfolio et soutenance | 20 % | Fiche complète et présentation argumentée |\n\n" +
    "### Certification\n\n" +
    "La certification interne (attestation de réussite) est délivrée à partir de **70/100**, sous réserve de la soutenance, de la remise des éléments obligatoires et de l'absence de critère éliminatoire. Entre 60 et 69, un rattrapage ciblé peut être proposé sous sept jours. En dessous, une attestation de participation peut être remise selon l'assiduité.\n\n" +
    "### Critères éliminatoires\n\n" +
    "- Fichier final illisible ou absence de vidéo.\n" +
    "- Contenu illégal, dangereux, discriminatoire ou manifestement trompeur.\n" +
    "- Usage non autorisé d'une image, d'une voix, d'une musique, d'une marque ou d'une donnée personnelle.\n" +
    "- Faux témoignage ou imitation d'une personne réelle présentée comme authentique.\n" +
    "- Plagiat ou falsification substantielle des sources et résultats.\n\n" +
    "### Utilisation responsable de l'IA\n\n" +
    "Le participant reste responsable du contenu publié : il vérifie les faits, les licences, les droits à l'image et à la voix, les règles des plateformes et les politiques des outils. Il évite les faux témoignages, l'imitation non autorisée, les allégations trompeuses et la présentation d'un contenu synthétique comme un fait réel.\n\n" +
    "### Outils & coûts\n\n" +
    "Certains outils nécessitent la création d'un compte et peuvent proposer des crédits gratuits limités, un abonnement payant, ou ne pas être disponibles dans tous les pays. Le participant reste responsable des accès nécessaires à son projet ; des solutions alternatives peuvent être proposées lorsque c'est possible.",
};

/* 9 webinaires hebdomadaires d'accompagnement (jeudi 18 h 30, 1 h 30). */
const WEBINAR_DATES = [
  "2026-08-06", "2026-08-13", "2026-08-20", "2026-08-27",
  "2026-09-03", "2026-09-10", "2026-09-17", "2026-09-24", "2026-10-01",
];

async function main() {
  await wake();

  const schools = await prisma.school.findMany({
    where: { slug: { in: ["ecole-design-creation", "ecole-marketing-vente", "ecole-intelligence-artificielle"] } },
    select: { id: true, slug: true },
  });
  const bySlug = Object.fromEntries(schools.map((s) => [s.slug, s.id]));
  const primarySchoolId = bySlug["ecole-design-creation"] ?? schools[0]?.id ?? null;
  const instructor = await prisma.user.findFirst({ where: { email: "formateur@digitalaccess.ci" }, select: { id: true } });

  // 1) Formation (Course).
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

  await prisma.module.deleteMany({ where: { courseId: course.id } });
  await prisma.assessment.deleteMany({ where: { courseId: course.id } });
  await prisma.schoolCourse.deleteMany({ where: { courseId: course.id } });
  let pos = 0;
  for (const [slug, id] of Object.entries(bySlug)) {
    await prisma.schoolCourse.create({ data: { schoolId: id, courseId: course.id, isPrimary: id === primarySchoolId, isFeatured: id === primarySchoolId, position: pos++ } });
  }

  // 2) Modules + leçons + quiz + livrables (depuis le contenu réel).
  let firstPreview = false, nLessons = 0, nQuiz = 0, nAssign = 0, nQ = 0;
  for (const m of CONTENT.modules) {
    const createdModule = await prisma.module.create({
      data: { courseId: course.id, title: `Module ${m.num} — ${m.title}`, description: strip(m.bienvenue), objectives: m.objectives, order: m.num, status: "PUBLISHED" },
      select: { id: true },
    });
    let lOrder = 0;
    for (const les of lessonsForModule(m)) {
      lOrder += 1;
      const isPreview = !firstPreview;
      firstPreview = true;
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id, title: les.title, lessonType: les.type, content: les.content ?? null,
          videoUrl: null, fileUrl: null, externalUrl: null,
          durationMinutes: les.durationMinutes ?? null, order: lOrder, isPreview, isRequired: true, status: "PUBLISHED",
        },
      });
      nLessons += 1;
    }
    // Quiz (6 questions, seuil 80 %).
    const quiz = await prisma.assessment.create({
      data: { courseId: course.id, moduleId: createdModule.id, title: `Quiz — Module ${m.num}`, type: "QUIZ", passingScore: 80, attemptsAllowed: 0, weight: 1, isRequired: true, order: m.num, status: "PUBLISHED" },
      select: { id: true },
    });
    let qOrder = 0;
    for (const q of m.quiz) {
      const enc = encodeQuestion(q, ++qOrder);
      await prisma.question.create({ data: { assessmentId: quiz.id, type: enc.type, question: enc.question, options: enc.options, correctAnswer: enc.correctAnswer, explanation: enc.explanation, points: enc.points, order: enc.order } });
      nQ += 1;
    }
    nQuiz += 1;
    // Livrable fil rouge (dépôt de fichiers).
    const a = assignmentForModule(m);
    await prisma.assessment.create({
      data: { courseId: course.id, moduleId: createdModule.id, title: a.title, description: a.description, type: "ASSIGNMENT", passingScore: 70, attemptsAllowed: 0, weight: 1, isRequired: true, order: 100 + m.num, status: "PUBLISHED" },
    });
    nAssign += 1;
  }

  // 3) Cohorte.
  const cohort = await prisma.cohort.upsert({
    where: { slug: COHORT_SLUG },
    update: { name: COHORT.name, type: COHORT.type, status: COHORT.status, courseId: course.id, careerPathId: null, schoolId: primarySchoolId, startDate: COHORT.startDate, endDate: COHORT.endDate, enrollmentDeadline: COHORT.enrollmentDeadline, capacity: COHORT.capacity, price: COHORT.price, rhythm: COHORT.rhythm, description: COHORT.description, rules: COHORT.rules },
    create: { slug: COHORT_SLUG, name: COHORT.name, type: COHORT.type, status: COHORT.status, courseId: course.id, schoolId: primarySchoolId, startDate: COHORT.startDate, endDate: COHORT.endDate, enrollmentDeadline: COHORT.enrollmentDeadline, capacity: COHORT.capacity, price: COHORT.price, rhythm: COHORT.rhythm, description: COHORT.description, rules: COHORT.rules },
    select: { id: true },
  });
  if (instructor) {
    await prisma.cohortInstructor.upsert({ where: { cohortId_userId: { cohortId: cohort.id, userId: instructor.id } }, update: { roleLabel: "Formateur principal" }, create: { cohortId: cohort.id, userId: instructor.id, roleLabel: "Formateur principal" } });
  }

  // 4) Webinaires d'accompagnement (1 par module).
  await prisma.event.deleteMany({ where: { cohortId: cohort.id } });
  for (let i = 0; i < CONTENT.modules.length; i++) {
    const m = CONTENT.modules[i];
    const date = WEBINAR_DATES[i] ?? WEBINAR_DATES[WEBINAR_DATES.length - 1];
    await prisma.event.create({
      data: {
        title: `Webinaire ${m.num} — ${m.title}`,
        slug: `${COHORT_SLUG}-w${m.num}`,
        description:
          `**Objectif** : ${m.webinaire}\n\n` +
          `Séance d'accompagnement de 90 minutes (rappel actif, correction du quiz, démonstration, revue de travaux et plan d'action). ` +
          `En ligne (Google Meet) — le lien est communiqué aux inscrits avant la séance.`,
        type: "WEBINAR", audience: "COHORT",
        startAt: at(`${date}T18:30`), endAt: at(`${date}T20:00`), timezone: "Africa/Abidjan",
        provider: "GOOGLE_MEET", meetingUrl: null,
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
      type: "WEBINAR", audience: "PUBLIC",
      startAt: at("2026-07-30T18:30"), endAt: at("2026-07-30T19:30"), timezone: "Africa/Abidjan",
      provider: "GOOGLE_MEET", meetingUrl: null, speakerName: "Koffi N'Guessan",
      cohortId: cohort.id, courseId: course.id, schoolId: primarySchoolId, hostId: instructor?.id ?? null,
      status: "PUBLISHED",
    },
  });

  console.log("=== COHORTE & CONTENU CRÉÉS ===");
  console.log(JSON.stringify({ course: COURSE_SLUG, cohort: COHORT_SLUG, schools: Object.keys(bySlug), modules: CONTENT.modules.length, lessons: nLessons, quiz: nQuiz, questions: nQ, assignments: nAssign, webinars: CONTENT.modules.length, annexes: CONTENT.annexes.length, instructor: !!instructor }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

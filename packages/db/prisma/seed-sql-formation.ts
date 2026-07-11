import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* ══════════════════════════════════════════════════════════════════════════
   Seed ciblé — Formation certifiante « Fondamentaux des bases de données &
   SQL » (issue du document pédagogique Access Academy). Intégrée comme
   CareerPath (seul vecteur pleinement « apprenable » : détail → inscription →
   player → quiz → progression → certificat) sous l'École de Données & Analyse.
   Idempotent (upsert par slug). Ne reconstruit le curriculum que si aucun
   apprenant n'a de progression (garde anti-perte). Forçable : SEED_REFRESH=1.
   Neon : réveil via le POOLER, écritures via l'URL DIRECTE (connection_limit=1).
   ══════════════════════════════════════════════════════════════════════════ */

type AnyRec = Record<string, unknown>;
interface ModuleData {
  n: number;
  title: string;
  durationMinutes: number | null;
  objectives: string[];
  cours: string;
  pratique: string;
  quiz: { title: string; passingScore: number; questions: AnyRec[] };
}
const modulesData = (
  JSON.parse(readFileSync(fileURLToPath(new URL("./seed-sql-formation.json", import.meta.url)), "utf8")) as {
    modules: ModuleData[];
  }
).modules;

const POOLED = process.env.DATABASE_URL as string;
const DIRECT = (process.env.DATABASE_URL_UNPOOLED as string) || POOLED;
const withParam = (u: string, p: string) => u + (u.includes("?") ? "&" : "?") + p;

const SCHOOL_SLUG = "data";
const PATH_SLUG = "fondamentaux-bases-donnees-sql";

const pathScalars = {
  title: "Fondamentaux des bases de données et initiation au SQL",
  shortDescription:
    "Formation certifiante niveau débutant (40 h) : comprendre le modèle relationnel, concevoir une base et maîtriser SQL avec PostgreSQL — de la donnée brute au projet complet.",
  longDescription:
    "Sans aucun prérequis en programmation, apprenez à raisonner « données ». Vous découvrez le rôle d'un SGBD, le modèle relationnel (tables, clés, relations), puis vous écrivez du SQL pour créer, consulter, modifier, filtrer, agréger et relier des données avec PostgreSQL. Chaque module combine un cours illustré, des travaux pratiques guidés, une activité notée et un quiz. Le parcours se conclut par un devoir, un examen et un projet certifiant : concevoir la base d'un centre de formation. Outils : PostgreSQL, pgAdmin, DBeaver, dbdiagram.io et fichiers CSV.",
  targetJob: "Assistant données, futur analyste ou administrateur de bases de données",
  level: "BEGINNER" as const,
  duration: "40 heures",
  estimatedHours: 40,
  price: 0,
  prerequisites: [
    "Savoir utiliser un ordinateur et un navigateur web",
    "Savoir créer et organiser des fichiers et des dossiers",
    "Aucune connaissance préalable en programmation ou en SQL",
  ],
  objectives: [
    "Expliquer le rôle d'une base de données et d'un SGBD",
    "Identifier tables, colonnes, lignes, clés et relations",
    "Modéliser une base relationnelle simple",
    "Créer une base et ses tables avec SQL",
    "Réaliser les opérations CRUD (INSERT, SELECT, UPDATE, DELETE)",
    "Filtrer, trier, regrouper et agréger les données",
    "Combiner des données de plusieurs tables avec les jointures",
    "Importer et exporter des données au format CSV",
    "Documenter et présenter une petite base de données professionnelle",
  ],
  outcomes: [
    "Certificat Access Academy — Fondamentaux des bases de données et SQL",
    "Un projet certifiant : la base de données d'un centre de formation",
    "Un portefeuille de scripts SQL commentés réutilisables",
  ],
  tools: ["PostgreSQL", "pgAdmin", "DBeaver", "dbdiagram.io", "Fichiers CSV"],
  certificateTitle: "Fondamentaux des bases de données et SQL",
};

/* ── Module 11 : Évaluation & certification (leçons de contenu) ─────────── */
const L_DEVOIR = `## Devoir intermédiaire — Base de gestion d'une bibliothèque

Ce devoir est réalisé **après le module 6**. Il vérifie la maîtrise de la modélisation de base, de la création des tables et des opérations CRUD avec filtres et tris.

### Contexte
Une petite bibliothèque souhaite suivre ses **livres**, ses **membres** et ses **emprunts**. Chaque livre possède un titre, un auteur, une année de publication et un état de disponibilité. Chaque membre possède un nom, un prénom, une adresse électronique et une date d'adhésion. Un emprunt relie un membre à un livre et contient une date d'emprunt, une date prévue de retour et une date réelle de retour éventuelle.

### Travail demandé
- Écrire les règles de gestion essentielles.
- Proposer un schéma comprenant \`livres\`, \`membres\` et \`emprunts\`.
- Créer les tables avec clés et contraintes adaptées.
- Insérer au moins **8 livres, 5 membres et 6 emprunts**.
- Écrire **10 requêtes** : sélection, filtre, tri, modification et suppression contrôlée.
- Fournir un fichier SQL commenté et une note explicative d'une page.

### Barème (100 points)
| Critère | Points |
| --- | --- |
| Modèle et règles de gestion | 20 |
| Création des tables et contraintes | 25 |
| Jeu de données | 10 |
| Requêtes SQL | 30 |
| Qualité du fichier et documentation | 15 |`;

const L_PROJET = `## Projet certifiant — Système de gestion d'un centre de formation

### Finalité
Concevoir et réaliser une **base de données relationnelle opérationnelle** permettant de gérer les apprenants, les formations, les sessions et les inscriptions d'un centre de formation. Le projet constitue la **principale preuve de compétence** du parcours.

### Scénario fonctionnel
Access Academy souhaite enregistrer ses apprenants, publier plusieurs formations, organiser des sessions datées et inscrire les apprenants à ces sessions. Une formation peut avoir plusieurs sessions ; une session appartient à une seule formation. Un apprenant peut participer à plusieurs sessions et une session peut accueillir plusieurs apprenants. Chaque inscription possède une date, un statut et éventuellement une note finale.

### Livrables obligatoires
- Document d'analyse : acteurs, besoins et au moins **8 règles de gestion**.
- Dictionnaire de données complet.
- Diagramme relationnel comportant **au minimum 4 tables**.
- Script SQL de création avec clés primaires, clés étrangères et contraintes.
- Jeu de données réaliste : **15 apprenants, 5 formations, 8 sessions, 25 inscriptions** minimum.
- Fichier d'**au moins 20 requêtes** couvrant CRUD, filtres, tris, agrégations et jointures.
- Export CSV d'au moins deux résultats utiles.
- Guide d'installation et d'utilisation.
- Présentation ou vidéo de démonstration de 5 à 8 minutes.

### Requêtes minimales attendues
- Lister les apprenants actifs par ordre alphabétique.
- Afficher les sessions futures d'une formation.
- Compter les inscriptions par session.
- Calculer la moyenne des notes par formation.
- Afficher chaque inscription avec l'apprenant, la formation et la session.
- Lister les formations sans session ; identifier les apprenants sans inscription.
- Modifier le statut d'une inscription ; supprimer une inscription de test de façon contrôlée.
- Exporter la liste des participants d'une session.

### Grille d'évaluation (100 points)
| Domaine | Indicateurs | Points |
| --- | --- | --- |
| Analyse | Besoins compris, règles de gestion pertinentes, cohérence générale | 10 |
| Modélisation | Entités, attributs, cardinalités, clés et normalisation élémentaire | 15 |
| Structure SQL | Types, contraintes, clés primaires et étrangères, exécution sans erreur | 20 |
| Données de test | Volume minimal, réalisme, diversité et cohérence | 10 |
| Requêtes | Couverture fonctionnelle, exactitude, jointures et agrégations | 25 |
| Documentation | Clarté, installation, commentaires et organisation des fichiers | 10 |
| Démonstration | Explication, maîtrise, qualité de la présentation et réponses | 10 |

> Le projet est validé à partir de **60/100**. L'absence de script exécutable, de schéma relationnel ou de démonstration entraîne une demande de correction avant certification.`;

const L_EXAMEN = `## Examen final

Durée indicative : **90 minutes**. L'examen combine connaissances fondamentales et résolution pratique. Il compte pour **10 %** de la note finale.

### Partie A — Questions de connaissances (20 points)
1. Expliquez la différence entre une base de données et un SGBD.
2. Définissez une clé primaire et une clé étrangère.
3. Citez quatre contraintes SQL et leur utilité.
4. Expliquez la différence entre \`WHERE\` et \`HAVING\`.
5. Expliquez la différence entre \`INNER JOIN\` et \`LEFT JOIN\`.

### Partie B — Analyse de requêtes (30 points)
À partir des tables \`apprenants(id, nom, prenom, email)\`, \`formations(id, titre, prix)\` et \`inscriptions(id, apprenant_id, formation_id, date_inscription, statut)\`, écrire les requêtes suivantes :
- Afficher tous les apprenants triés par nom.
- Afficher les formations dont le prix dépasse 50 000 FCFA.
- Compter le nombre d'inscriptions par formation.
- Afficher les apprenants inscrits avec le titre de leur formation.
- Lister toutes les formations, même celles sans inscription.

### Partie C — Cas pratique (50 points)
Créer une petite base de gestion des produits et ventes comprenant au minimum les tables \`produits\`, \`clients\` et \`ventes\`. Définir les clés, insérer des données et produire cinq requêtes utiles, dont **une jointure** et **une agrégation**.

### Barème
| Partie | Éléments attendus | Points |
| --- | --- | --- |
| A | Définitions précises, vocabulaire correct, exemples pertinents | 20 |
| B | Syntaxe correcte, conditions, agrégation et jointures | 30 |
| C | Schéma cohérent, contraintes, données et requêtes exécutables | 50 |`;

const L_ANNEXE = `## Annexe A — Schéma SQL de référence

Schéma complet réutilisable pour le fil rouge « centre de formation ».

\`\`\`sql
CREATE TABLE apprenants (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telephone VARCHAR(30),
  actif BOOLEAN DEFAULT TRUE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE formations (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(150) NOT NULL,
  description TEXT,
  duree_heures INTEGER CHECK (duree_heures > 0),
  prix NUMERIC(12,2) CHECK (prix >= 0),
  publiee BOOLEAN DEFAULT FALSE
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  formation_id INTEGER NOT NULL REFERENCES formations(id),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  capacite INTEGER CHECK (capacite > 0),
  CHECK (date_fin >= date_debut)
);

CREATE TABLE inscriptions (
  id SERIAL PRIMARY KEY,
  apprenant_id INTEGER NOT NULL REFERENCES apprenants(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  date_inscription DATE DEFAULT CURRENT_DATE,
  statut VARCHAR(30) DEFAULT 'EN_ATTENTE',
  note_finale NUMERIC(5,2) CHECK (note_finale BETWEEN 0 AND 100),
  UNIQUE (apprenant_id, session_id)
);
\`\`\``;

const L_MODALITES = `## Modalités de certification

### Calcul de la note finale
| Élément | Poids |
| --- | --- |
| Moyenne des quiz | 20 % |
| Moyenne des travaux pratiques | 25 % |
| Devoir intermédiaire | 15 % |
| Projet certifiant | 30 % |
| Examen final | 10 % |

Le certificat est délivré avec une **moyenne générale d'au moins 60 %**, au moins **90 % des activités obligatoires** réalisées, le **projet final soumis** et aucune fraude académique.

### Mentions
| Résultat | Décision |
| --- | --- |
| 80 à 100 % | Certificat obtenu avec mention **Très bien** |
| 70 à 79,99 % | Certificat obtenu avec mention **Bien** |
| 60 à 69,99 % | Certificat obtenu |
| 50 à 59,99 % | Rattrapage ciblé autorisé |
| Moins de 50 % | Formation à reprendre partiellement |

## Banque de questions — auto-évaluation
Révisez en vous interrogeant, puis vérifiez la réponse attendue.

| Question | Réponse attendue |
| --- | --- |
| Quel type SQL convient à un montant précis ? | NUMERIC |
| Quelle clause limite le nombre de résultats ? | LIMIT |
| Que fait DISTINCT ? | Supprime les doublons du résultat |
| Quel opérateur signifie « différent » ? | \`<>\` ou \`!=\` |
| Quelle commande supprime une table ? | DROP TABLE |
| Une clé primaire peut-elle être NULL ? | Non |
| Quelle fonction additionne des valeurs ? | SUM |
| Comment tester plusieurs valeurs possibles ? | IN |
| Quel mot-clé renomme temporairement une colonne ? | AS |
| Quelle jointure conserve toutes les lignes de gauche ? | LEFT JOIN |
| Quel format sert à importer des données tabulaires ? | CSV |
| Pourquoi utiliser une contrainte CHECK ? | Pour imposer une règle de validité |
| Quelle commande annule une transaction non validée ? | ROLLBACK |
| Pourquoi sauvegarder une base ? | Pour restaurer les données après un incident |
| Que représente une ligne ? | Un enregistrement |`;

const evalLessons: { title: string; lessonType: string; content: string; estimatedDuration: number }[] = [
  { title: "Devoir intermédiaire — Bibliothèque", lessonType: "EXERCISE", content: L_DEVOIR, estimatedDuration: 90 },
  { title: "Projet certifiant — Centre de formation", lessonType: "EXERCISE", content: L_PROJET, estimatedDuration: 240 },
  { title: "Examen final", lessonType: "EXERCISE", content: L_EXAMEN, estimatedDuration: 90 },
  { title: "Annexe — Schéma SQL de référence", lessonType: "RESOURCE", content: L_ANNEXE, estimatedDuration: 15 },
  { title: "Certification & auto-évaluation", lessonType: "TEXT", content: L_MODALITES, estimatedDuration: 20 },
];

async function wakePooler() {
  const c = new PrismaClient({ datasources: { db: { url: withParam(POOLED, "connect_timeout=30") } } });
  for (let i = 0; i < 25; i++) {
    try {
      await c.$queryRawUnsafe("SELECT 1");
      await c.$disconnect();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  await c.$disconnect();
  throw new Error("Neon injoignable via le pooler après plusieurs tentatives.");
}

const prisma = new PrismaClient({ datasources: { db: { url: withParam(DIRECT, "connection_limit=1") } } });

async function main() {
  console.log("🌱 Seed formation SQL — réveil de Neon…");
  await wakePooler();

  // École (existe déjà normalement ; créée sinon)
  let school = await prisma.school.findUnique({ where: { slug: SCHOOL_SLUG }, select: { id: true } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "École de Données & Analyse",
        slug: SCHOOL_SLUG,
        shortDescription: "Bases de données, SQL, analyse et data.",
        icon: "database",
        color: "#1e8fe1",
        order: 50,
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    console.log("  École 'data' créée.");
  }
  const schoolId = school.id;

  // CareerPath (upsert scalaires)
  const existing = await prisma.careerPath.findUnique({ where: { slug: PATH_SLUG }, select: { id: true } });
  const scalars = { ...pathScalars, featured: true, status: "PUBLISHED" as const, schoolId };

  let pathId: string;
  if (existing) {
    await prisma.careerPath.update({ where: { id: existing.id }, data: scalars });
    pathId = existing.id;
    const learnerProgress = await prisma.lessonProgress.count({
      where: { lesson: { module: { careerPathId: existing.id } } },
    });
    if (process.env.SEED_REFRESH === "1" || learnerProgress === 0) {
      await prisma.module.deleteMany({ where: { careerPathId: existing.id } });
      console.log("  Curriculum réinitialisé.");
    } else {
      console.log(`  ⚠ ${learnerProgress} progression(s) apprenant — curriculum conservé (SEED_REFRESH=1 pour forcer).`);
      await prisma.$disconnect();
      return;
    }
  } else {
    const created = await prisma.careerPath.create({ data: { ...scalars, slug: PATH_SLUG } });
    pathId = created.id;
    console.log("  CareerPath créé.");
  }

  const pref = pathId.slice(0, 6);
  let mOrder = 0;

  // ── Modules de contenu (1..10) ──
  for (const m of modulesData) {
    const mod = await prisma.module.create({
      data: {
        careerPathId: pathId,
        title: m.title,
        description: `Durée estimée : ${m.durationMinutes ? Math.round(m.durationMinutes / 60) : "?"} h.`,
        order: mOrder++,
        objectives: m.objectives,
        estimatedDuration: m.durationMinutes ?? null,
        status: "PUBLISHED",
      },
    });

    const lessons = [
      { title: "Cours", lessonType: "TEXT", content: m.cours, duration: 30 },
      { title: "Travaux pratiques & activité notée", lessonType: "EXERCISE", content: m.pratique, duration: 45 },
      { title: "Quiz de validation", lessonType: "QUIZ", content: "Validez vos acquis du module. Réussite à partir de 3 bonnes réponses sur 5.", duration: 10 },
    ];

    let lOrder = 0;
    for (const l of lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          title: l.title,
          slug: `${pref}-${mOrder}-${++lOrder}`,
          content: l.content,
          lessonType: l.lessonType as never,
          estimatedDuration: l.duration,
          order: lOrder,
          isPreview: mOrder === 1 && lOrder === 1, // 1re leçon du 1er module = aperçu gratuit
          status: "PUBLISHED",
        },
      });

      if (l.lessonType === "QUIZ") {
        const quiz = await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            title: m.quiz.title,
            description: "Quiz de validation du module (2 tentatives autorisées).",
            passingScore: m.quiz.passingScore,
            attemptsAllowed: 2,
            status: "PUBLISHED",
          },
        });
        let qOrder = 0;
        for (const q of m.quiz.questions) {
          await prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              question: q.question as string,
              type: q.type as never,
              options: (q.options as never) ?? undefined,
              correctAnswer: q.correctAnswer as never,
              explanation: (q.explanation as string) ?? null,
              points: 1,
              order: qOrder++,
            },
          });
        }
      }
    }
  }

  // ── Module 11 : Évaluation & certification ──
  const evalMod = await prisma.module.create({
    data: {
      careerPathId: pathId,
      title: "Module 11 — Évaluation, projet certifiant & certification",
      description: "Devoir intermédiaire, projet certifiant, examen final et modalités de certification.",
      order: mOrder++,
      objectives: [
        "Réaliser le devoir intermédiaire (bibliothèque)",
        "Concevoir et livrer le projet certifiant (centre de formation)",
        "Réussir l'examen final",
      ],
      estimatedDuration: 455,
      status: "PUBLISHED",
    },
  });
  let elo = 0;
  for (const l of evalLessons) {
    await prisma.lesson.create({
      data: {
        moduleId: evalMod.id,
        title: l.title,
        slug: `${pref}-${mOrder}-${++elo}`,
        content: l.content,
        lessonType: l.lessonType as never,
        estimatedDuration: l.estimatedDuration,
        order: elo,
        status: "PUBLISHED",
      },
    });
  }

  const counts = {
    modules: await prisma.module.count({ where: { careerPathId: pathId } }),
    lessons: await prisma.lesson.count({ where: { module: { careerPathId: pathId } } }),
    quizzes: await prisma.quiz.count({ where: { lesson: { module: { careerPathId: pathId } } } }),
    questions: await prisma.quizQuestion.count({
      where: { quiz: { lesson: { module: { careerPathId: pathId } } } },
    }),
  };
  console.log("✅ Formation SQL intégrée :", counts, "| slug:", PATH_SLUG);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed SQL échoué :", e);
  await prisma.$disconnect();
  process.exit(1);
});

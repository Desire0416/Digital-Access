import { PrismaClient, Prisma } from "../generated/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* ══════════════════════════════════════════════════════════════════════════
   SEED — Base DÉDIÉE Access Academy (cahier des charges §51 : Bases de données)

   Matérialise l'exemple de référence :
   · 3 écoles (Données & IA, Développement logiciel, Cybersécurité)
   · 3 formations publiées (F1 débutant → F3 avancé) + 2 complémentaires DRAFT
   · 1 parcours « Administrateur de bases de données » (5 phases, jonctions)
   · Compétences, prérequis structurés, projets, instructeur, utilisateurs démo

   Idempotent : upsert par slug/email ; le curriculum (modules/leçons/quiz/
   projets) est reconstruit à chaque exécution (delete + create), puis les
   données de démo (inscription, progression, tentative, avis) sont recréées.

   Neon : réveil via le POOLER (connect_timeout=30), écritures via l'URL
   DIRECTE (connection_limit=1).
   ══════════════════════════════════════════════════════════════════════════ */

const POOLED = process.env.ACADEMY_DATABASE_URL as string;
const DIRECT = (process.env.ACADEMY_DATABASE_URL_UNPOOLED as string) || POOLED;
if (!POOLED) {
  console.error("❌ ACADEMY_DATABASE_URL manquante.");
  process.exit(1);
}
const withParam = (u: string, p: string) => u + (u.includes("?") ? "&" : "?") + p;

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

/* ── Contenus réels (JSON) ─────────────────────────────────────────────────── */

interface F1Question {
  question: string;
  type: "SINGLE_CHOICE" | "TRUE_FALSE";
  options: string[];
  correctAnswer: number | boolean;
  explanation?: string;
}
interface F1Module {
  n: number;
  title: string;
  durationMinutes: number | null;
  objectives: string[];
  cours: string;
  pratique: string;
  quiz: { title: string; passingScore: number; questions: F1Question[] };
}
interface F2Question {
  question: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: string[];
  correctIndexes: number[];
  explanation?: string;
}
interface F2Lesson {
  title: string;
  type: "TEXT" | "EXERCISE" | "RESOURCE" | "VIDEO";
  content: string;
}
interface F2Module {
  title: string;
  summary?: string;
  objectives: string[];
  estimatedDuration: number | null;
  lessons: F2Lesson[];
  quiz: { title: string; passingScore: number; questions: F2Question[] } | null;
}
interface F2Path {
  title: string;
  level: string;
  targetJob: string;
  shortDescription: string;
  longDescription: string;
  duration: string;
  estimatedHours: number;
  prerequisites: string[];
  objectives: string[];
  outcomes: string[];
  tools: string[];
  certificateTitle: string;
}

const readJson = <T>(rel: string): T =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")) as T;

const f1 = readJson<{ modules: F1Module[] }>("./content/formation-1-sql-fondamentaux.json");
const f2 = readJson<{ path: F2Path; modules: F2Module[] }>("./content/formation-2-sql-intermediaire.json");

/* ── Encodage correctAnswer (règle du schéma) ──────────────────────────────
   SINGLE_CHOICE = index (number) · MULTIPLE_CHOICE = number[] ·
   TRUE_FALSE = boolean (true = « Vrai », options ["Vrai","Faux"]).           */

function f2CorrectAnswer(q: F2Question): Prisma.InputJsonValue {
  if (q.type === "TRUE_FALSE") return q.correctIndexes[0] === 0;
  if (q.type === "SINGLE_CHOICE") return q.correctIndexes[0];
  return q.correctIndexes;
}

/* ══════════════════════════════════════════════════════════════════════════
   FORMATION 3 — « Architecture, performance et administration avancée des
   bases de données » (contenu original PostgreSQL, niveau avancé).
   ══════════════════════════════════════════════════════════════════════════ */

interface F3Question {
  question: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options?: string[];
  correctAnswer: number | number[] | boolean;
  explanation: string;
}
interface F3Lesson {
  title: string;
  content: string;
  durationMinutes: number;
}
interface F3Module {
  title: string;
  description: string;
  objectives: string[];
  durationMinutes: number;
  lessons: F3Lesson[];
  quiz: { title: string; passingScore: number; questions: F3Question[] };
}

const TF_OPTS = ["Vrai", "Faux"];

const f3Modules: F3Module[] = [
  {
    title: "Module 1 — Architecture du moteur PostgreSQL et MVCC",
    description:
      "Comprendre en profondeur les processus, les zones mémoire et le contrôle de concurrence multiversion (MVCC) qui fondent le comportement de PostgreSQL.",
    objectives: [
      "Décrire les processus d'arrière-plan de PostgreSQL et leur rôle",
      "Expliquer le cheminement d'une écriture : shared buffers, WAL, checkpoint",
      "Expliquer le fonctionnement de MVCC (xmin, xmax, versions de lignes)",
      "Justifier le rôle de VACUUM et prévenir le wraparound des transactions",
    ],
    durationMinutes: 420,
    lessons: [
      {
        title: "Processus et mémoire : anatomie d'une instance PostgreSQL",
        durationMinutes: 60,
        content: `## L'architecture processus de PostgreSQL

PostgreSQL suit un modèle **un processus par connexion**. Au démarrage, le processus principal (\`postmaster\`) écoute sur le port configuré (5432 par défaut) et lance une famille de processus d'arrière-plan :

- **backend** : un processus dédié est créé pour chaque connexion cliente ; il exécute les requêtes de cette session.
- **walwriter** : écrit régulièrement le journal de transactions (WAL) sur disque.
- **checkpointer** : synchronise périodiquement les pages modifiées (« dirty pages ») des *shared buffers* vers les fichiers de données.
- **background writer** : lisse les écritures entre deux checkpoints pour éviter les à-coups d'entrées/sorties.
- **autovacuum launcher** et ses *workers* : déclenchent automatiquement le nettoyage des lignes mortes.
- **archiver** : copie les segments WAL terminés vers l'archive (si \`archive_mode = on\`), fondation du PITR.
- **stats collector / logger** : statistiques d'activité et journalisation.

## Les zones mémoire

Deux familles de mémoire coexistent :

1. **Mémoire partagée** — commune à tous les processus :
   - \`shared_buffers\` : cache des pages de données (point de passage obligé de toute lecture/écriture). Valeur usuelle : 25 % de la RAM du serveur dédié.
   - \`wal_buffers\` : tampon d'écriture du journal de transactions.
2. **Mémoire locale** — propre à chaque backend :
   - \`work_mem\` : tris, agrégations par hachage, jointures ; allouée **par opération**, donc potentiellement plusieurs fois par requête.
   - \`maintenance_work_mem\` : VACUUM, CREATE INDEX, ALTER TABLE.

## Le cheminement d'une écriture

Une commande \`UPDATE\` ne modifie jamais directement le fichier de données. La séquence est la suivante :

\`\`\`sql
BEGIN;
UPDATE comptes SET solde = solde - 50000 WHERE id = 42;
COMMIT;
\`\`\`

1. La page contenant la ligne est chargée dans les \`shared_buffers\` (si absente).
2. La modification est appliquée **en mémoire** et un enregistrement est écrit dans le **WAL** (Write-Ahead Log).
3. Au \`COMMIT\`, le WAL est synchronisé sur disque (\`fsync\`) : la transaction est durable **avant** que le fichier de données ne soit mis à jour.
4. Plus tard, le *checkpointer* écrira la page modifiée dans le fichier de données.

Ce principe *write-ahead* (« journal d'abord ») garantit qu'après un crash, PostgreSQL peut rejouer le WAL depuis le dernier checkpoint et retrouver un état cohérent. C'est aussi la brique de base de la réplication et de la restauration à un instant donné (PITR), étudiées plus loin.

> **À retenir** : régler \`shared_buffers\`, comprendre le rôle du WAL et du checkpointer est le préalable à tout travail sérieux de performance ou de haute disponibilité.`,
      },
      {
        title: "MVCC : versions de lignes, VACUUM et wraparound",
        durationMinutes: 60,
        content: `## Le contrôle de concurrence multiversion (MVCC)

PostgreSQL ne pose pas de verrou de lecture : **les lecteurs ne bloquent jamais les écrivains, et inversement**. Le mécanisme qui le permet s'appelle MVCC (*Multi-Version Concurrency Control*).

Chaque ligne physique (tuple) porte deux colonnes système :

- \`xmin\` : identifiant de la transaction qui a **créé** cette version de la ligne ;
- \`xmax\` : identifiant de la transaction qui l'a **supprimée ou remplacée** (0 si la version est vivante).

Un \`UPDATE\` ne modifie pas la ligne en place : il **insère une nouvelle version** et marque l'ancienne avec \`xmax\`. Chaque transaction travaille avec un *snapshot* qui détermine quelles versions lui sont visibles :

\`\`\`sql
SELECT xmin, xmax, id, solde FROM comptes WHERE id = 42;
\`\`\`

Deux sessions concurrentes peuvent ainsi voir deux versions différentes de la même ligne, chacune cohérente avec le début de sa transaction (niveau \`READ COMMITTED\` par défaut, \`REPEATABLE READ\` et \`SERIALIZABLE\` disponibles).

## La contrepartie : les lignes mortes

Les anciennes versions (« dead tuples ») restent physiquement dans la table jusqu'à leur nettoyage. Sans entretien, la table **gonfle** (*bloat*), les parcours ralentissent et l'espace disque est gaspillé.

C'est le rôle de **VACUUM** :

\`\`\`sql
VACUUM (VERBOSE, ANALYZE) commandes;   -- nettoie et met à jour les statistiques
\`\`\`

- \`VACUUM\` marque l'espace des lignes mortes comme réutilisable (sans le rendre à l'OS).
- \`VACUUM FULL\` réécrit la table entièrement (récupère l'espace mais pose un verrou exclusif — à réserver aux fenêtres de maintenance).
- **autovacuum** exécute ce nettoyage automatiquement ; on ne le désactive jamais en production, on l'**ajuste** (\`autovacuum_vacuum_scale_factor\`, \`autovacuum_vacuum_cost_limit\`) sur les tables très écrites.

## Le wraparound des identifiants de transaction

Les identifiants de transaction (XID) sont stockés sur 32 bits : ils forment un compteur circulaire d'environ 4 milliards de valeurs. Si une table n'est jamais « gelée », d'anciennes lignes pourraient un jour paraître... créées dans le futur, donc invisibles : c'est le **wraparound**, l'un des rares incidents capables de forcer l'arrêt d'une instance.

VACUUM prévient ce risque en **gelant** les lignes anciennes (\`FREEZE\`). Les indicateurs à surveiller :

\`\`\`sql
SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
\`\`\`

Au-delà de \`autovacuum_freeze_max_age\` (200 millions par défaut), un vacuum anti-wraparound se déclenche d'office, même si autovacuum est désactivé.

> **À retenir** : MVCC offre une concurrence excellente au prix d'un entretien obligatoire. Un DBA avancé surveille le bloat, ajuste autovacuum table par table et garde un œil sur \`age(datfrozenxid)\`.`,
      },
    ],
    quiz: {
      title: "Quiz — Architecture du moteur et MVCC",
      passingScore: 60,
      questions: [
        {
          question: "Dans PostgreSQL, quel principe garantit la durabilité d'une transaction validée ?",
          type: "SINGLE_CHOICE",
          options: [
            "Les pages de données sont écrites sur disque à chaque COMMIT",
            "Le journal WAL est synchronisé sur disque avant la validation",
            "Le checkpointer s'exécute à chaque COMMIT",
            "Les shared buffers sont vidés à chaque COMMIT",
          ],
          correctAnswer: 1,
          explanation:
            "Principe write-ahead : l'enregistrement WAL est rendu durable (fsync) au COMMIT ; les fichiers de données sont mis à jour plus tard par le checkpointer.",
        },
        {
          question: "Que fait réellement un UPDATE sous MVCC ?",
          type: "SINGLE_CHOICE",
          options: [
            "Il modifie la ligne en place",
            "Il insère une nouvelle version de la ligne et marque l'ancienne avec xmax",
            "Il verrouille la table entière",
            "Il supprime la ligne puis la réinsère dans une autre table",
          ],
          correctAnswer: 1,
          explanation:
            "MVCC crée une nouvelle version du tuple ; l'ancienne devient une ligne morte nettoyée plus tard par VACUUM.",
        },
        {
          question: "Quels processus d'arrière-plan participent directement à l'écriture des données sur disque ?",
          type: "MULTIPLE_CHOICE",
          options: ["checkpointer", "background writer", "walwriter", "stats collector"],
          correctAnswer: [0, 1, 2],
          explanation:
            "Checkpointer et background writer écrivent les pages modifiées, walwriter écrit le journal. Le collecteur de statistiques n'écrit pas les données.",
        },
        {
          question: "Sous MVCC, un lecteur peut bloquer un écrivain sur la même ligne.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation: "C'est l'intérêt majeur de MVCC : lectures et écritures ne se bloquent pas mutuellement.",
        },
        {
          question: "Quel risque le gel (FREEZE) exécuté par VACUUM prévient-il ?",
          type: "SINGLE_CHOICE",
          options: [
            "La corruption des index",
            "Le wraparound des identifiants de transaction",
            "La saturation de work_mem",
            "La perte du fichier de configuration",
          ],
          correctAnswer: 1,
          explanation:
            "Les XID sont un compteur circulaire 32 bits : sans gel des lignes anciennes, elles deviendraient invisibles (wraparound).",
        },
      ],
    },
  },
  {
    title: "Module 2 — Indexation avancée : B-tree, GIN et BRIN",
    description:
      "Choisir et concevoir le bon index pour chaque usage : B-tree multicolonnes, index couvrants et partiels, GIN pour JSONB et la recherche plein texte, BRIN pour les tables massives.",
    objectives: [
      "Concevoir des index B-tree multicolonnes, couvrants, partiels et fonctionnels",
      "Utiliser GIN pour JSONB, les tableaux et la recherche plein texte",
      "Utiliser BRIN sur les grandes tables append-only",
      "Détecter les index inutilisés et mesurer le coût des index en écriture",
    ],
    durationMinutes: 420,
    lessons: [
      {
        title: "B-tree en profondeur : multicolonnes, couvrants, partiels, fonctionnels",
        durationMinutes: 60,
        content: `## L'index B-tree, cheval de trait de PostgreSQL

Le B-tree est l'index par défaut : équilibré, trié, il sert les comparaisons \`=\`, \`<\`, \`>\`, \`BETWEEN\`, les tris (\`ORDER BY\`) et les recherches de préfixe (\`LIKE 'abc%'\`). Un DBA avancé va au-delà de \`CREATE INDEX\` de base.

### Index multicolonnes : l'ordre des colonnes est décisif

\`\`\`sql
CREATE INDEX idx_cmd_client_date ON commandes (client_id, date_commande);
\`\`\`

Cet index sert parfaitement \`WHERE client_id = 12 AND date_commande >= '2026-01-01'\`, correctement \`WHERE client_id = 12\` seul, mais **mal** \`WHERE date_commande >= '2026-01-01'\` seul : la règle du « préfixe le plus à gauche » s'applique. On place donc en tête la colonne d'égalité la plus sélective, puis les colonnes d'intervalle.

### Index couvrants (INCLUDE) : viser l'Index Only Scan

\`\`\`sql
CREATE INDEX idx_cmd_couvrant
  ON commandes (client_id, date_commande)
  INCLUDE (montant);
\`\`\`

Les colonnes \`INCLUDE\` sont stockées dans les feuilles sans participer au tri. Si toutes les colonnes demandées par la requête figurent dans l'index, PostgreSQL peut répondre **sans toucher la table** (*Index Only Scan*) — à condition que la *visibility map* soit à jour, donc que VACUUM passe régulièrement.

### Index partiels : indexer seulement ce qui sert

\`\`\`sql
CREATE INDEX idx_paiements_en_attente
  ON paiements (created_at)
  WHERE status = 'PENDING';
\`\`\`

Sur une table où 2 % des paiements sont en attente, cet index est minuscule, très rapide à maintenir, et sert exactement l'écran « paiements à valider ». Condition : la requête doit reprendre le même prédicat \`WHERE status = 'PENDING'\`.

### Index fonctionnels (sur expression)

\`\`\`sql
CREATE INDEX idx_users_email_lower ON users (lower(email));
-- servi par :  WHERE lower(email) = lower('Aya@Example.ci')
\`\`\`

L'index n'est utilisé que si la requête emploie **exactement la même expression**.

### Le coût caché des index

Chaque index doit être mis à jour à chaque \`INSERT\`/\`UPDATE\`/\`DELETE\`. Trop d'index ralentit les écritures et gonfle le stockage. Auditer régulièrement :

\`\`\`sql
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
\`\`\`

Un index jamais parcouru (\`idx_scan = 0\`) depuis des semaines est un candidat sérieux à la suppression.`,
      },
      {
        title: "GIN et BRIN : JSONB, plein texte et tables massives",
        durationMinutes: 60,
        content: `## GIN : l'index inversé généralisé

Un B-tree indexe **une valeur par ligne**. GIN (*Generalized Inverted Index*) indexe **les éléments contenus dans une valeur composite** : clés d'un document JSONB, éléments d'un tableau, lexèmes d'un texte. Comme l'index d'un livre, il associe chaque élément à la liste des lignes qui le contiennent.

### GIN et JSONB

\`\`\`sql
CREATE TABLE evenements (
  id BIGSERIAL PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE INDEX idx_evenements_payload ON evenements USING GIN (payload);

-- Servi par GIN (opérateur de contenance @>) :
SELECT * FROM evenements WHERE payload @> '{"type": "paiement", "operateur": "WAVE"}';
\`\`\`

Variante \`jsonb_path_ops\` : index plus petit et plus rapide, mais limité à l'opérateur \`@>\`.

### GIN et recherche plein texte

\`\`\`sql
ALTER TABLE formations ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('french', coalesce(titre,'') || ' ' || coalesce(description,''))) STORED;

CREATE INDEX idx_formations_tsv ON formations USING GIN (tsv);

SELECT titre FROM formations
WHERE tsv @@ plainto_tsquery('french', 'administration postgresql');
\`\`\`

GIN est plus lent à **maintenir** qu'un B-tree (chaque document insère de nombreuses entrées) : sur des tables très écrites, surveiller \`gin_pending_list_limit\` et le nettoyage de la *pending list*.

## BRIN : l'index minuscule des tables géantes

BRIN (*Block Range Index*) ne stocke pas les valeurs ligne à ligne : il mémorise, **par plage de blocs** (128 pages par défaut), le minimum et le maximum de la colonne. Il est donc minuscule — quelques Mo pour une table de plusieurs centaines de Go.

Condition d'efficacité : la valeur doit être **corrélée à l'ordre physique** des lignes. Cas idéal : journaux, mesures, tables append-only où \`created_at\` croît avec l'insertion.

\`\`\`sql
CREATE INDEX idx_logs_date_brin ON logs USING BRIN (created_at);

-- PostgreSQL ne lira que les plages de blocs dont l'intervalle chevauche la condition :
SELECT count(*) FROM logs
WHERE created_at BETWEEN '2026-06-01' AND '2026-06-30';
\`\`\`

Vérifier la corrélation avant de choisir BRIN :

\`\`\`sql
SELECT attname, correlation FROM pg_stats
WHERE tablename = 'logs' AND attname = 'created_at';
-- proche de 1 (ou -1) : BRIN pertinent ; proche de 0 : préférer B-tree
\`\`\`

## Choisir en une phrase

| Besoin | Index |
| --- | --- |
| Égalité, intervalle, tri sur colonne scalaire | **B-tree** |
| Contenance JSONB, tableaux, plein texte | **GIN** |
| Très grande table append-only, filtre par plage de dates | **BRIN** |
| Sous-ensemble précis de lignes (statut rare) | **B-tree partiel** |`,
      },
    ],
    quiz: {
      title: "Quiz — Indexation avancée",
      passingScore: 60,
      questions: [
        {
          question:
            "Un index B-tree sur (client_id, date_commande) est-il efficace pour la requête WHERE date_commande >= '2026-01-01' seule ?",
          type: "SINGLE_CHOICE",
          options: [
            "Oui, l'ordre des colonnes n'a aucune importance",
            "Non, car la première colonne de l'index n'est pas filtrée (règle du préfixe gauche)",
            "Oui, mais uniquement si la table est petite",
            "Non, un B-tree ne sait pas indexer les dates",
          ],
          correctAnswer: 1,
          explanation:
            "Un B-tree multicolonnes sert d'abord son préfixe le plus à gauche : sans condition sur client_id, l'index est peu utile.",
        },
        {
          question: "Quel est l'intérêt de la clause INCLUDE dans un index ?",
          type: "SINGLE_CHOICE",
          options: [
            "Réduire la taille de l'index",
            "Permettre un Index Only Scan en stockant des colonnes supplémentaires dans les feuilles",
            "Accélérer les écritures",
            "Créer automatiquement un index partiel",
          ],
          correctAnswer: 1,
          explanation:
            "INCLUDE ajoute des colonnes non triées aux feuilles : si la requête n'a besoin que de colonnes présentes dans l'index, la table n'est pas lue.",
        },
        {
          question: "Pour quels usages l'index GIN est-il adapté ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Recherche de contenance dans un document JSONB (@>)",
            "Recherche plein texte (tsvector @@ tsquery)",
            "Tri d'une colonne numérique (ORDER BY montant)",
            "Recherche d'éléments dans un tableau",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "GIN indexe les éléments contenus dans des valeurs composites (JSONB, tableaux, lexèmes). Le tri scalaire reste le domaine du B-tree.",
        },
        {
          question: "Un index BRIN reste efficace même si les valeurs de la colonne sont réparties aléatoirement dans la table.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "BRIN mémorise min/max par plage de blocs : sans corrélation entre valeur et position physique, presque toutes les plages doivent être lues.",
        },
        {
          question: "Comment repérer les index probablement inutiles d'une base ?",
          type: "SINGLE_CHOICE",
          options: [
            "Consulter idx_scan dans pg_stat_user_indexes",
            "Lister les index de plus de 1 Go",
            "Compter les colonnes de chaque index",
            "Supprimer tous les index puis observer",
          ],
          correctAnswer: 0,
          explanation:
            "pg_stat_user_indexes.idx_scan compte les parcours : un index jamais utilisé et volumineux est un candidat à la suppression (après vérification).",
        },
      ],
    },
  },
  {
    title: "Module 3 — Optimisation des requêtes et EXPLAIN ANALYZE",
    description:
      "Lire et interpréter les plans d'exécution, comprendre le rôle des statistiques et réécrire les requêtes coûteuses.",
    objectives: [
      "Lire un plan d'exécution : nœuds, coûts, lignes estimées vs réelles",
      "Distinguer Seq Scan, Index Scan, Bitmap Scan et les trois algorithmes de jointure",
      "Diagnostiquer une mauvaise estimation et corriger via ANALYZE et les statistiques",
      "Réécrire des requêtes coûteuses et dimensionner work_mem",
    ],
    durationMinutes: 420,
    lessons: [
      {
        title: "Lire un plan d'exécution avec EXPLAIN ANALYZE",
        durationMinutes: 60,
        content: `## EXPLAIN, la radiographie d'une requête

Avant d'exécuter une requête, le **planificateur** choisit un plan parmi des dizaines de possibilités en estimant leur coût. \`EXPLAIN\` montre le plan choisi ; \`EXPLAIN ANALYZE\` **exécute réellement** la requête et confronte estimations et réalité.

\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.nom, sum(cmd.montant)
FROM clients c
JOIN commandes cmd ON cmd.client_id = c.id
WHERE cmd.date_commande >= '2026-01-01'
GROUP BY c.nom;
\`\`\`

Un plan se lit **de l'intérieur vers l'extérieur** (les nœuds les plus indentés s'exécutent d'abord). Chaque nœud affiche :

- \`cost=0.43..8.45\` : coût estimé de démarrage puis coût total (unités arbitraires) ;
- \`rows=120\` : nombre de lignes **estimé** ;
- \`actual time=0.031..2.117 rows=118 loops=1\` : temps et lignes **réels** ;
- avec \`BUFFERS\` : pages lues en cache (\`shared hit\`) ou sur disque (\`read\`).

**Le signal d'alarme numéro un** : un écart massif entre \`rows\` estimé et \`rows\` réel (× 100, × 1000). Le planificateur choisit alors souvent un mauvais algorithme.

## Les nœuds d'accès aux tables

- **Seq Scan** : lecture complète de la table. Optimal pour lire une grande fraction des lignes ; pathologique pour en extraire trois.
- **Index Scan** : parcours de l'index puis lecture de la table ligne à ligne. Idéal pour une forte sélectivité.
- **Index Only Scan** : tout est dans l'index (cf. module 2), la table n'est pas lue.
- **Bitmap Index Scan + Bitmap Heap Scan** : l'index produit une carte des pages à lire, puis les pages sont lues dans l'ordre physique — bon compromis pour une sélectivité moyenne, permet de **combiner plusieurs index**.

## Les trois algorithmes de jointure

| Algorithme | Principe | Cas favorable |
| --- | --- | --- |
| **Nested Loop** | Pour chaque ligne externe, chercher les correspondances internes | Peu de lignes externes + index sur la table interne |
| **Hash Join** | Construire une table de hachage sur la petite table, sonder avec la grande | Grandes tables, jointure d'égalité, hash tenant dans work_mem |
| **Merge Join** | Fusionner deux entrées triées | Très grandes tables déjà triées (index) |

Un \`Hash Join\` qui déborde de \`work_mem\` bascule sur disque (\`Batches: 2+\` dans le plan) ; un \`Sort\` affiche alors \`Sort Method: external merge Disk: 48200kB\` — signaux qu'il faut augmenter \`work_mem\` **pour cette requête** :

\`\`\`sql
SET LOCAL work_mem = '128MB';  -- dans la transaction concernée uniquement
\`\`\`

> **Méthode** : toujours mesurer avant/après avec \`EXPLAIN (ANALYZE, BUFFERS)\`, sur des données représentatives, jamais sur une base vide.`,
      },
      {
        title: "Statistiques, ANALYZE et réécriture de requêtes",
        durationMinutes: 60,
        content: `## D'où viennent les estimations du planificateur ?

Le planificateur ne connaît pas vos données : il s'appuie sur des **statistiques** collectées par \`ANALYZE\` (ou autovacuum) et stockées dans \`pg_stats\` : valeurs les plus fréquentes, histogrammes de répartition, nombre de valeurs distinctes, corrélation physique.

\`\`\`sql
ANALYZE commandes;                       -- rafraîchit les statistiques
ALTER TABLE commandes ALTER COLUMN status SET STATISTICS 500;  -- échantillon plus fin
\`\`\`

### Statistiques étendues : corriger les colonnes corrélées

Par défaut, PostgreSQL suppose les colonnes **indépendantes**. Or « ville = Abidjan » et « pays = Côte d'Ivoire » sont totalement corrélées : la sélectivité combinée est surestimée, les estimations s'effondrent.

\`\`\`sql
CREATE STATISTICS stats_ville_pays (dependencies, ndistinct)
  ON ville, pays FROM clients;
ANALYZE clients;
\`\`\`

## Réécritures classiques

**1. Rendre les prédicats « sargables »** (compatibles index) :

\`\`\`sql
-- Mauvais : la fonction sur la colonne empêche l'index
WHERE date_trunc('month', date_commande) = '2026-06-01'
-- Bon : intervalle sur la colonne nue
WHERE date_commande >= '2026-06-01' AND date_commande < '2026-07-01'
\`\`\`

**2. Remplacer NOT IN par NOT EXISTS** (NOT IN se comporte mal avec les NULL et se planifie souvent moins bien) :

\`\`\`sql
SELECT c.* FROM clients c
WHERE NOT EXISTS (SELECT 1 FROM commandes cmd WHERE cmd.client_id = c.id);
\`\`\`

**3. Paginer par curseur plutôt que par OFFSET** : \`OFFSET 100000\` lit et jette 100 000 lignes.

\`\`\`sql
SELECT * FROM formations WHERE id > $dernier_id ORDER BY id LIMIT 20;
\`\`\`

**4. Ne demander que les colonnes utiles** : \`SELECT *\` interdit l'Index Only Scan et gonfle le trafic réseau.

**5. Matérialiser les agrégats coûteux** consultés souvent :

\`\`\`sql
CREATE MATERIALIZED VIEW mv_ca_mensuel AS
SELECT date_trunc('month', date_commande) AS mois, sum(montant) AS ca
FROM commandes GROUP BY 1;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ca_mensuel;  -- nécessite un index unique
\`\`\`

## Démarche d'optimisation en cinq étapes

1. Identifier les requêtes coûteuses (\`pg_stat_statements\`, module 7).
2. Reproduire avec \`EXPLAIN (ANALYZE, BUFFERS)\` sur des données réalistes.
3. Chercher l'écart estimé/réel → statistiques ; le nœud dominant → index ou réécriture.
4. Corriger **une chose à la fois** et mesurer.
5. Documenter le gain (avant/après) dans le journal d'exploitation.`,
      },
    ],
    quiz: {
      title: "Quiz — Optimisation et plans d'exécution",
      passingScore: 60,
      questions: [
        {
          question: "Quelle est la différence entre EXPLAIN et EXPLAIN ANALYZE ?",
          type: "SINGLE_CHOICE",
          options: [
            "Aucune, ce sont des synonymes",
            "EXPLAIN ANALYZE exécute réellement la requête et affiche les mesures réelles",
            "EXPLAIN ANALYZE ne fonctionne que sur les SELECT",
            "EXPLAIN ANALYZE met à jour les statistiques de la table",
          ],
          correctAnswer: 1,
          explanation:
            "EXPLAIN montre le plan estimé ; EXPLAIN ANALYZE exécute la requête et confronte estimations (rows) et réalité (actual rows, temps).",
        },
        {
          question: "Quel signal dans un plan indique le plus souvent des statistiques obsolètes ou insuffisantes ?",
          type: "SINGLE_CHOICE",
          options: [
            "Un Seq Scan sur une petite table",
            "Un écart massif entre lignes estimées (rows) et lignes réelles (actual rows)",
            "La présence d'un Hash Join",
            "Un coût total supérieur à 1000",
          ],
          correctAnswer: 1,
          explanation:
            "Quand l'estimation diverge de la réalité d'un facteur 100 ou 1000, le planificateur choisit de mauvais algorithmes : ANALYZE ou statistiques étendues s'imposent.",
        },
        {
          question: "Quelles réécritures améliorent généralement les performances ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Remplacer date_trunc('month', col) = ... par un intervalle sur la colonne nue",
            "Remplacer la pagination OFFSET profonde par une pagination par curseur (WHERE id > dernier)",
            "Remplacer SELECT colonnes utiles par SELECT *",
            "Remplacer NOT IN par NOT EXISTS",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "Prédicats sargables, pagination par curseur et NOT EXISTS sont des gains classiques ; SELECT * fait l'inverse (interdit l'Index Only Scan).",
        },
        {
          question: "Un Nested Loop est toujours moins performant qu'un Hash Join.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "Avec peu de lignes externes et un index sur la table interne, le Nested Loop est souvent l'algorithme le plus rapide.",
        },
        {
          question: "Que signale « Sort Method: external merge Disk: 48200kB » dans un plan ?",
          type: "SINGLE_CHOICE",
          options: [
            "Le tri a débordé de work_mem et s'est effectué sur disque",
            "La table est corrompue",
            "Le tri a utilisé un index",
            "Le résultat a été mis en cache",
          ],
          correctAnswer: 0,
          explanation:
            "Le tri n'a pas tenu en mémoire : augmenter work_mem (idéalement via SET LOCAL pour la requête concernée) ou réduire le volume trié.",
        },
      ],
    },
  },
  {
    title: "Module 4 — Partitionnement des grandes tables",
    description:
      "Découper les tables volumineuses en partitions (RANGE, LIST, HASH), exploiter l'élagage de partitions et industrialiser la maintenance.",
    objectives: [
      "Choisir la bonne stratégie de partitionnement (RANGE, LIST, HASH)",
      "Créer une table partitionnée et vérifier l'élagage (partition pruning)",
      "Gérer le cycle de vie : ATTACH/DETACH, index partitionnés, valeurs par défaut",
      "Connaître les limites et anti-patterns du partitionnement",
    ],
    durationMinutes: 360,
    lessons: [
      {
        title: "Partitionnement déclaratif : RANGE, LIST, HASH et pruning",
        durationMinutes: 55,
        content: `## Pourquoi partitionner ?

Au-delà de quelques dizaines de millions de lignes, certaines opérations deviennent pénibles sur une table monolithique : purge de l'historique (DELETE massif = bloat massif), VACUUM interminable, index géants. Le **partitionnement** découpe la table logique en tables physiques plus petites (partitions), tout en conservant une interface unique pour les requêtes.

Bénéfices concrets :

- **Élagage (partition pruning)** : une requête filtrée sur la clé de partition ne lit que les partitions concernées.
- **Purge instantanée** : supprimer un mois d'historique = \`DETACH\` + \`DROP\` d'une partition (métadonnées), au lieu d'un DELETE de millions de lignes.
- Maintenance (VACUUM, REINDEX) partition par partition.

## Les trois stratégies

\`\`\`sql
-- RANGE : le cas le plus courant (dates)
CREATE TABLE paiements (
  id BIGSERIAL,
  created_at TIMESTAMPTZ NOT NULL,
  montant INTEGER NOT NULL,
  operateur TEXT,
  PRIMARY KEY (id, created_at)          -- la clé de partition DOIT figurer
) PARTITION BY RANGE (created_at);       -- dans toute clé primaire/unique

CREATE TABLE paiements_2026_06 PARTITION OF paiements
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE paiements_2026_07 PARTITION OF paiements
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE paiements_defaut PARTITION OF paiements DEFAULT;
\`\`\`

- **RANGE** : intervalles (dates, identifiants) — historisation, archivage.
- **LIST** : valeurs discrètes (\`pays\`, \`region\`) — répartition métier.
- **HASH** : répartition uniforme quand aucune clé naturelle ne s'impose ; utile pour éclater la contention d'écriture.

\`\`\`sql
CREATE TABLE sessions_hash (...) PARTITION BY HASH (user_id);
CREATE TABLE sessions_p0 PARTITION OF sessions_hash FOR VALUES WITH (MODULUS 4, REMAINDER 0);
\`\`\`

## Vérifier l'élagage

\`\`\`sql
EXPLAIN SELECT sum(montant) FROM paiements
WHERE created_at >= '2026-07-01' AND created_at < '2026-08-01';
-- Le plan ne doit mentionner QUE paiements_2026_07.
\`\`\`

L'élagage fonctionne à la planification (valeurs constantes) et à l'exécution (paramètres, jointures). Règle d'or : **filtrer sur la colonne de partition nue** — une fonction appliquée à la colonne (\`date_trunc(...)\`) désactive le pruning, exactement comme pour un index.

> **Dimensionnement** : viser des partitions de quelques Go à quelques dizaines de Go, et rarement plus de quelques centaines de partitions — chaque partition ajoute du travail au planificateur.`,
      },
      {
        title: "Cycle de vie et limites : ATTACH, DETACH, index, anti-patterns",
        durationMinutes: 55,
        content: `## Industrialiser la rotation des partitions

Le quotidien d'une table partitionnée par mois : **créer la partition suivante à l'avance** et **archiver les plus anciennes**.

\`\`\`sql
-- Sortir une partition de la table (instantané, les données restent consultables) :
ALTER TABLE paiements DETACH PARTITION paiements_2025_01 CONCURRENTLY;

-- L'archiver puis la supprimer :
DROP TABLE paiements_2025_01;

-- Rattacher une table préparée (import massif hors ligne) :
ALTER TABLE paiements ATTACH PARTITION paiements_2026_08
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
\`\`\`

\`DETACH ... CONCURRENTLY\` évite de bloquer les requêtes en cours. Avant un \`ATTACH\`, poser sur la table candidate une contrainte \`CHECK\` équivalente aux bornes évite un balayage complet de validation.

En production, cette rotation est **automatisée** : l'extension \`pg_partman\` (ou un simple job pg_cron) crée les partitions futures et détache les anciennes selon une politique de rétention.

## Index et contraintes sur tables partitionnées

Un index créé sur la table mère est automatiquement décliné sur chaque partition (index **partitionné**) :

\`\`\`sql
CREATE INDEX idx_paiements_operateur ON paiements (operateur, created_at);
\`\`\`

Points de vigilance :

- Toute contrainte **PRIMARY KEY / UNIQUE doit inclure la clé de partition** : PostgreSQL ne sait pas garantir l'unicité globale entre partitions sans cela.
- \`CREATE INDEX CONCURRENTLY\` ne s'applique pas directement à la table mère : on crée l'index \`ON ONLY\` la mère, puis concurremment sur chaque partition, avant de les rattacher — c'est le prix des très grandes volumétries sans interruption.
- La partition \`DEFAULT\` est un filet de sécurité, pas une poubelle : une partition DEFAULT volumineuse gêne l'élagage et bloque les \`ATTACH\` chevauchants.

## Anti-patterns fréquents

1. **Partitionner trop tôt** : sous quelques dizaines de millions de lignes, un bon index suffit presque toujours ; le partitionnement ajoute une vraie complexité d'exploitation.
2. **Mauvaise clé** : si 95 % des requêtes filtrent sur \`client_id\` mais que la table est partitionnée par date, l'élagage ne sert à rien — toutes les partitions sont lues.
3. **Partitions minuscules et innombrables** (une par jour sur dix ans = 3650 partitions) : temps de planification en hausse, gain marginal.
4. **Oublier la partition suivante** : sans partition pour le mois à venir (ni DEFAULT), les insertions échouent le 1er du mois à minuit. L'automatisation n'est pas optionnelle.

> **À retenir** : le partitionnement est un outil de **cycle de vie des données** avant d'être un outil de vitesse. Sa réussite se mesure à la simplicité des purges et des archivages, plan d'automatisation compris.`,
      },
    ],
    quiz: {
      title: "Quiz — Partitionnement",
      passingScore: 60,
      questions: [
        {
          question: "Quel est l'avantage principal du partitionnement RANGE par date pour l'historisation ?",
          type: "SINGLE_CHOICE",
          options: [
            "Il accélère toutes les requêtes sans exception",
            "La purge d'une période devient un DETACH/DROP instantané au lieu d'un DELETE massif",
            "Il supprime le besoin d'index",
            "Il compresse automatiquement les données",
          ],
          correctAnswer: 1,
          explanation:
            "Détacher puis supprimer une partition est une opération de métadonnées, sans bloat ni VACUUM géant, contrairement à un DELETE de millions de lignes.",
        },
        {
          question: "Pourquoi la clé primaire d'une table partitionnée doit-elle inclure la colonne de partition ?",
          type: "SINGLE_CHOICE",
          options: [
            "Pour des raisons de style",
            "Parce que PostgreSQL ne garantit pas l'unicité globale entre partitions sans cela",
            "Pour activer la compression",
            "Parce que les BIGSERIAL sont interdits sur les partitions",
          ],
          correctAnswer: 1,
          explanation:
            "Chaque partition vérifie ses propres contraintes ; l'unicité inter-partitions n'est possible que si la clé de partition fait partie de la contrainte.",
        },
        {
          question: "Quelles affirmations sur l'élagage de partitions (pruning) sont exactes ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Il nécessite un filtre sur la colonne de partition",
            "Une fonction appliquée à la colonne de partition (date_trunc) peut le désactiver",
            "Il ne fonctionne qu'avec la stratégie HASH",
            "Il peut opérer à la planification comme à l'exécution",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "Le pruning s'appuie sur les prédicats portant sur la clé de partition nue et fonctionne pour RANGE, LIST et HASH.",
        },
        {
          question: "Il est recommandé de partitionner toute table dès sa création, même petite.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "Le partitionnement ajoute une complexité d'exploitation réelle ; sous des volumétries modestes, un bon schéma d'indexation suffit.",
        },
      ],
    },
  },
  {
    title: "Module 5 — Réplication et haute disponibilité",
    description:
      "Mettre en place la réplication physique en streaming, comprendre la réplication logique et organiser la bascule (failover) d'une instance PostgreSQL.",
    objectives: [
      "Expliquer la réplication physique par flux WAL (primaire → standby)",
      "Configurer les slots de réplication et mesurer le retard (lag)",
      "Distinguer réplication physique et réplication logique et choisir selon le besoin",
      "Décrire une procédure de bascule maîtrisée et le rôle d'outils comme Patroni",
    ],
    durationMinutes: 420,
    lessons: [
      {
        title: "Réplication physique en streaming : primaire, standby, slots",
        durationMinutes: 60,
        content: `## Le principe : rejouer le WAL ailleurs

Le WAL (module 1) décrit **toutes** les modifications de l'instance. La réplication physique consiste à expédier ce flux vers un second serveur (**standby**) qui le rejoue en continu : le standby est une copie binaire, identique bloc à bloc, du **primaire**.

- Le standby en **hot standby** accepte les requêtes en lecture seule : idéal pour délester les rapports et tableaux de bord.
- En cas de panne du primaire, le standby peut être **promu** en quelques secondes.

## Mise en place (vue d'ensemble)

Sur le primaire :

\`\`\`sql
-- postgresql.conf
wal_level = replica
max_wal_senders = 10
-- création d'un rôle dédié :
CREATE ROLE replicateur WITH REPLICATION LOGIN PASSWORD '***';
-- pg_hba.conf : host replication replicateur 10.0.0.0/24 scram-sha-256
\`\`\`

Sur le futur standby, on clone le primaire puis on démarre en mode réplication :

\`\`\`bash
pg_basebackup -h primaire -U replicateur -D /var/lib/postgresql/data \
  --wal-method=stream --write-recovery-conf --checkpoint=fast
# crée standby.signal + primary_conninfo automatiquement
\`\`\`

## Les slots de réplication : ne jamais perdre le fil

Sans précaution, un standby lent ou déconnecté peut « rater » des segments WAL déjà recyclés par le primaire — il faut alors le reconstruire. Un **slot de réplication** oblige le primaire à conserver le WAL tant que le standby ne l'a pas consommé :

\`\`\`sql
SELECT pg_create_physical_replication_slot('slot_standby1');
-- côté standby : primary_slot_name = 'slot_standby1'
\`\`\`

⚠ Revers de la médaille : un slot **orphelin** (standby disparu) retient le WAL indéfiniment et peut **saturer le disque du primaire**. Toujours superviser :

\`\`\`sql
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retenu
FROM pg_replication_slots;
\`\`\`

## Mesurer le retard (lag)

\`\`\`sql
SELECT client_addr, state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_octets,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
\`\`\`

## Synchrone ou asynchrone ?

Par défaut la réplication est **asynchrone** : une panne du primaire peut perdre les toutes dernières transactions. En mode **synchrone** (\`synchronous_standby_names\`), le COMMIT attend l'accusé du standby : zéro perte (RPO = 0), au prix d'une latence d'écriture accrue et d'un risque de blocage si le standby tombe. Beaucoup d'architectures retiennent un compromis : deux standbys, dont un synchrone en \`ANY 1 (...)\`.`,
      },
      {
        title: "Réplication logique, promotion et bascule maîtrisée",
        durationMinutes: 60,
        content: `## Réplication logique : répliquer des tables, pas des blocs

La réplication **physique** copie l'instance entière, à version identique de PostgreSQL. La réplication **logique** décode le WAL en changements ligne à ligne (\`INSERT/UPDATE/DELETE\`) et les rejoue sur un abonné qui peut être différent : autre version majeure, sous-ensemble de tables, base déjà utilisée en écriture ailleurs.

\`\`\`sql
-- Sur la source (wal_level = logical) :
CREATE PUBLICATION pub_academy FOR TABLE "Enrollment", "Payment";

-- Sur la cible :
CREATE SUBSCRIPTION sub_academy
  CONNECTION 'host=source dbname=academy user=replicateur password=***'
  PUBLICATION pub_academy;
\`\`\`

Cas d'usage : **migration de version majeure sans coupure**, consolidation analytique, synchronisation partielle. Limites à connaître : le DDL n'est pas répliqué (schémas à synchroniser à la main), les séquences ne sont pas suivies, et chaque table répliquée doit avoir une identité de réplique (clé primaire).

| Critère | Physique | Logique |
| --- | --- | --- |
| Granularité | Instance entière | Tables choisies |
| Versions différentes | Non | Oui |
| Cible consultable en écriture | Non (lecture seule) | Oui |
| Usage type | HA / bascule | Migration, agrégation |

## Promouvoir un standby

Le jour J (panne ou maintenance planifiée) :

\`\`\`bash
# Sur le standby à promouvoir :
pg_ctl promote -D /var/lib/postgresql/data
# ou : SELECT pg_promote();
\`\`\`

La promotion met fin au rejeu, ouvre l'instance en écriture et démarre une nouvelle *timeline*. La check-list d'une bascule sérieuse :

1. **Vérifier le lag** : promouvoir un standby en retard = perdre les transactions non rejouées.
2. **Isoler l'ancien primaire** (arrêt, pare-feu) pour interdire le **split-brain** — deux primaires acceptant des écritures est le pire scénario.
3. Rediriger les applications (DNS, chaîne de connexion, pooler type PgBouncer).
4. Reconstruire l'ancien primaire en standby : \`pg_rewind\` évite un re-clonage complet s'il a divergé peu.

## Automatiser : Patroni et les managed services

Une bascule manuelle prend des minutes et exige un humain disponible. **Patroni** supervise le cluster via un magasin de consensus (etcd), détecte la panne du leader, élit et promeut automatiquement un réplica, et reconfigure les nœuds — c'est le standard de fait de la HA PostgreSQL auto-hébergée. Les offres managées (Neon, RDS, Cloud SQL) intègrent cette logique : le métier du DBA se déplace alors vers la **validation régulière** des bascules (exercices de failover) et la surveillance du lag et des slots.

> **À retenir** : la haute disponibilité n'est pas un composant qu'on installe, c'est une **procédure qu'on répète**. Une bascule jamais testée est une bascule qui échouera.`,
      },
    ],
    quiz: {
      title: "Quiz — Réplication et haute disponibilité",
      passingScore: 60,
      questions: [
        {
          question: "Sur quoi repose la réplication physique en streaming de PostgreSQL ?",
          type: "SINGLE_CHOICE",
          options: [
            "L'envoi périodique de dumps SQL",
            "L'expédition continue du flux WAL rejoué par le standby",
            "La copie des fichiers de données toutes les heures",
            "Des triggers posés sur chaque table",
          ],
          correctAnswer: 1,
          explanation:
            "Le standby rejoue en continu le journal de transactions (WAL) reçu du primaire : il en est une copie binaire exacte.",
        },
        {
          question: "Quel est le risque principal d'un slot de réplication orphelin ?",
          type: "SINGLE_CHOICE",
          options: [
            "Le standby devient accessible en écriture",
            "Le primaire retient le WAL indéfiniment et peut saturer son disque",
            "Les index du primaire sont corrompus",
            "Les connexions clientes sont refusées",
          ],
          correctAnswer: 1,
          explanation:
            "Un slot force la rétention du WAL non consommé : si le consommateur a disparu, le WAL s'accumule jusqu'à remplir le disque.",
        },
        {
          question: "Quels cas relèvent de la réplication LOGIQUE plutôt que physique ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Migrer vers une version majeure supérieure sans coupure",
            "Répliquer seulement quelques tables vers une base analytique",
            "Disposer d'un standby prêt à être promu en secours complet de l'instance",
            "Alimenter une base cible qui reste ouverte en écriture",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "La réplication logique décode le WAL en changements par table (versions différentes possibles, cible inscriptible). Le secours complet d'instance est le domaine de la réplication physique.",
        },
        {
          question: "En réplication synchrone, une transaction validée sur le primaire peut être perdue si celui-ci tombe immédiatement après le COMMIT.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "En mode synchrone, le COMMIT n'est acquitté qu'après confirmation du standby : c'est précisément la garantie RPO = 0 (au prix de la latence).",
        },
        {
          question: "Quelle précaution est indispensable AVANT de promouvoir un standby lors d'une bascule ?",
          type: "SINGLE_CHOICE",
          options: [
            "Supprimer les slots de réplication",
            "Isoler l'ancien primaire pour éviter le split-brain et vérifier le lag de réplication",
            "Passer wal_level à minimal",
            "Désactiver autovacuum",
          ],
          correctAnswer: 1,
          explanation:
            "Deux primaires simultanés (split-brain) divergent irrémédiablement ; et promouvoir un standby en retard perd les transactions non rejouées.",
        },
      ],
    },
  },
  {
    title: "Module 6 — Sauvegardes et restauration à un instant donné (PITR)",
    description:
      "Construire une stratégie de sauvegarde professionnelle : dumps logiques, sauvegardes physiques, archivage WAL et Point-In-Time Recovery.",
    objectives: [
      "Choisir entre sauvegarde logique (pg_dump) et physique (pg_basebackup)",
      "Mettre en place l'archivage continu du WAL",
      "Exécuter une restauration à un instant précis (PITR)",
      "Définir RPO/RTO et tester régulièrement les restaurations",
    ],
    durationMinutes: 360,
    lessons: [
      {
        title: "Sauvegarde logique et physique : pg_dump, pg_restore, pg_basebackup",
        durationMinutes: 55,
        content: `## Deux familles de sauvegardes

**La sauvegarde logique** exporte le *contenu* (ordres SQL ou format binaire propre) ; **la sauvegarde physique** copie les *fichiers* de l'instance. Un DBA avancé utilise les deux, pour des besoins différents.

### pg_dump / pg_restore : souplesse et portabilité

\`\`\`bash
# Format custom (compressé, restauration sélective et parallèle) :
pg_dump -Fc -d academy -f academy.dump

# Restaurer 4 jobs en parallèle, seulement le schéma public :
pg_restore -d academy_restauree -j 4 -n public academy.dump

# Dump global des rôles et tablespaces (souvent oublié !) :
pg_dumpall --globals-only > globals.sql
\`\`\`

Atouts : restauration table par table, migration entre versions/architectures, fichier compact. Limites : sur une base volumineuse, le dump **et surtout la restauration** (rejouer les index, les contraintes) prennent des heures ; et un dump est une **photo à l'instant du lancement** — tout ce qui suit est perdu.

> \`pg_dump\` est cohérent sans bloquer l'activité : il travaille dans une transaction \`REPEATABLE READ\` (snapshot MVCC, module 1).

### pg_basebackup : la copie physique

\`\`\`bash
pg_basebackup -h primaire -U replicateur -D /backup/base_20260711 \
  --wal-method=stream --checkpoint=fast --progress
\`\`\`

Copie binaire de l'instance entière (toutes les bases, mêmes versions et architecture requises pour la restauration). C'est la **fondation** du PITR et la méthode de création des standbys (module 5). Pour l'industrialisation, les outils spécialisés **pgBackRest** ou **Barman** ajoutent : sauvegardes incrémentales, compression, chiffrement, rétention, vérification d'intégrité et parallélisme.

### Ce qu'une stratégie sérieuse contient toujours

1. Des sauvegardes **physiques régulières** (quotidiennes) + archivage WAL continu → PITR.
2. Des dumps **logiques périodiques** (hebdomadaires) pour la portabilité et la restauration fine.
3. \`pg_dumpall --globals-only\` pour les rôles.
4. Une **externalisation** (autre site/région, stockage objet) et un chiffrement des artefacts.
5. Des **tests de restauration** planifiés — une sauvegarde jamais restaurée n'existe pas.`,
      },
      {
        title: "Archivage WAL et Point-In-Time Recovery",
        durationMinutes: 55,
        content: `## L'idée du PITR

Une sauvegarde physique + la suite **complète** des WAL produits ensuite = la capacité de reconstruire l'état de l'instance **à n'importe quel instant** postérieur à la sauvegarde. C'est le Point-In-Time Recovery, l'arme absolue contre l'erreur humaine : « un \`DELETE\` sans \`WHERE\` a été exécuté à 14 h 03 » → on restaure l'état de 14 h 02.

### 1. Activer l'archivage continu

\`\`\`ini
# postgresql.conf (primaire)
wal_level = replica
archive_mode = on
archive_command = 'pgbackrest --stanza=academy archive-push %p'
# (ou une copie vers stockage objet ; %p = chemin du segment WAL)
\`\`\`

Chaque segment WAL de 16 Mo terminé est poussé vers l'archive. **Surveiller les échecs d'archivage** (\`pg_stat_archiver\`) : un \`archive_command\` qui échoue en silence accumule le WAL localement jusqu'à saturation.

### 2. Restaurer à un instant précis

\`\`\`bash
# a) Restaurer la dernière sauvegarde physique dans un répertoire vierge
# b) Configurer la cible de récupération :
\`\`\`

\`\`\`ini
# postgresql.conf (instance de restauration)
restore_command = 'pgbackrest --stanza=academy archive-get %f "%p"'
recovery_target_time = '2026-07-11 14:02:00+00'
recovery_target_action = 'pause'   -- inspecter avant d'ouvrir
\`\`\`

\`\`\`bash
touch /var/lib/postgresql/data/recovery.signal
pg_ctl start
\`\`\`

L'instance rejoue le WAL archivé jusqu'à la cible puis **se met en pause** : on vérifie que les données perdues sont bien là, puis :

\`\`\`sql
SELECT pg_wal_replay_resume();  -- ouvre l'instance (nouvelle timeline)
\`\`\`

Autres cibles possibles : \`recovery_target_lsn\`, \`recovery_target_xid\`, ou un \`recovery_target_name\` posé à l'avance avec \`SELECT pg_create_restore_point('avant_migration_v2');\` — réflexe précieux avant toute opération risquée.

## RPO et RTO : parler le langage du métier

- **RPO** (*Recovery Point Objective*) : combien de données peut-on perdre ? Avec archivage WAL continu : quelques secondes. Avec un dump quotidien seul : jusqu'à 24 h.
- **RTO** (*Recovery Time Objective*) : en combien de temps le service doit-il revenir ? Restaurer 500 Go + rejouer 12 h de WAL peut prendre des heures : le RTO se **mesure** lors des exercices, il ne se décrète pas.

| Stratégie | RPO | RTO typique |
| --- | --- | --- |
| Dump quotidien seul | ≤ 24 h | Heures |
| Base + WAL archivé (PITR) | Secondes/minutes | Dizaines de minutes à heures |
| PITR + standby répliqué | ~0 | Minutes |

> **À retenir** : PITR protège des erreurs logiques (le standby, lui, rejoue fidèlement le DELETE fautif !). Réplication et PITR sont **complémentaires**, jamais substituables.`,
      },
    ],
    quiz: {
      title: "Quiz — Sauvegardes et PITR",
      passingScore: 60,
      questions: [
        {
          question: "Pourquoi une réplication en streaming ne remplace-t-elle pas les sauvegardes PITR ?",
          type: "SINGLE_CHOICE",
          options: [
            "Parce que la réplication est trop lente",
            "Parce que le standby rejoue fidèlement une erreur humaine (DELETE sans WHERE) au lieu de l'annuler",
            "Parce que la réplication ne fonctionne qu'en lecture",
            "Parce que le WAL n'est pas utilisé par la réplication",
          ],
          correctAnswer: 1,
          explanation:
            "La réplique propage l'erreur en quelques millisecondes ; seul le PITR permet de revenir à l'instant précédant l'incident logique.",
        },
        {
          question: "Quels éléments sont nécessaires pour une restauration à un instant donné (PITR) ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Une sauvegarde physique de base (pg_basebackup ou équivalent)",
            "La suite complète des segments WAL archivés depuis cette sauvegarde",
            "Une cible de récupération (recovery_target_time, LSN ou point nommé)",
            "Un dump pg_dump de la veille",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "PITR = base physique + WAL archivé continu + cible de récupération. Le dump logique est utile mais ne participe pas au PITR.",
        },
        {
          question: "Quel avantage le format custom (-Fc) de pg_dump apporte-t-il ?",
          type: "SINGLE_CHOICE",
          options: [
            "Il sauvegarde aussi les rôles de l'instance",
            "Il permet une restauration sélective (par table/schéma) et parallèle avec pg_restore",
            "Il capture les modifications en continu",
            "Il est lisible directement dans un éditeur de texte",
          ],
          correctAnswer: 1,
          explanation:
            "Le format custom est compressé et indexé : pg_restore peut en extraire des objets précis et paralléliser (-j). Les rôles exigent pg_dumpall --globals-only.",
        },
        {
          question: "Le RPO mesure le temps nécessaire pour remettre le service en ligne après un incident.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "Le RPO mesure la perte de données maximale acceptable ; le temps de remise en service est le RTO.",
        },
      ],
    },
  },
  {
    title: "Module 7 — Supervision, observabilité et tuning mémoire",
    description:
      "Outiller la surveillance d'une instance (pg_stat_statements, verrous, logs) et régler les paramètres mémoire et connexions pour un serveur de production.",
    objectives: [
      "Identifier les requêtes les plus coûteuses avec pg_stat_statements",
      "Diagnostiquer sessions bloquées et verrous avec pg_stat_activity et pg_locks",
      "Régler shared_buffers, work_mem, maintenance_work_mem et effective_cache_size",
      "Maîtriser le nombre de connexions avec un pooler (PgBouncer)",
    ],
    durationMinutes: 360,
    lessons: [
      {
        title: "Observer : pg_stat_statements, sessions, verrous et logs",
        durationMinutes: 55,
        content: `## pg_stat_statements : le hit-parade des requêtes

L'extension \`pg_stat_statements\` agrège toutes les exécutions par requête normalisée (les constantes sont remplacées par \`$1\`). C'est **le** point de départ de toute campagne d'optimisation :

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- postgresql.conf : shared_preload_libraries = 'pg_stat_statements'

SELECT round(total_exec_time)::bigint AS total_ms,
       calls,
       round(mean_exec_time::numeric, 2) AS moy_ms,
       rows,
       query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
\`\`\`

Lire ce tableau intelligemment : une requête à 2 ms exécutée 500 000 fois par heure pèse plus lourd qu'une requête à 4 s exécutée deux fois par jour. On optimise le **temps total**, pas seulement les requêtes « spectaculaires ».

## pg_stat_activity : qui fait quoi, maintenant

\`\`\`sql
SELECT pid, usename, state,
       now() - query_start AS duree,
       wait_event_type, wait_event,
       left(query, 80) AS requete
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duree DESC;
\`\`\`

Signaux d'alerte :

- \`idle in transaction\` durable : une application a ouvert une transaction et ne la ferme pas — elle retient des verrous **et empêche VACUUM de nettoyer** (bloat garanti). Garde-fou : \`idle_in_transaction_session_timeout = '5min'\`.
- \`wait_event_type = 'Lock'\` : la session attend un verrou.

## Résoudre une chaîne de blocage

\`\`\`sql
SELECT blocked.pid  AS bloque,
       blocking.pid AS bloquant,
       left(blocking.query, 60) AS requete_bloquante
FROM pg_stat_activity blocked
JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(pid) ON true
JOIN pg_stat_activity blocking ON blocking.pid = b.pid;

-- Terminer proprement la session fautive :
SELECT pg_terminate_backend(12345);
\`\`\`

Les **deadlocks** (blocages croisés) sont détectés et tranchés automatiquement par PostgreSQL (\`deadlock_timeout\`, 1 s) : l'une des transactions est annulée. Leur prévention est applicative : toujours verrouiller les ressources **dans le même ordre**.

## Des logs qui travaillent pour vous

\`\`\`ini
log_min_duration_statement = 500      # journaliser toute requête > 500 ms
log_lock_waits = on                    # attentes de verrou > deadlock_timeout
log_autovacuum_min_duration = 0       # visibilité sur autovacuum
log_checkpoints = on
log_line_prefix = '%m [%p] %u@%d '
\`\`\`

Ces quatre réglages transforment le journal en outil de diagnostic permanent, exploitable par \`pgBadger\` (rapports HTML) ou une pile de supervision (Prometheus + postgres_exporter + Grafana pour les tendances : connexions, lag, bloat, cache hit ratio).`,
      },
      {
        title: "Régler la mémoire et les connexions d'un serveur de production",
        durationMinutes: 55,
        content: `## Les quatre paramètres mémoire qui comptent

### shared_buffers — le cache de PostgreSQL

Point de passage de toutes les pages lues et écrites. Règle éprouvée : **25 % de la RAM** d'un serveur dédié (au-delà de 40 %, les bénéfices s'estompent : PostgreSQL s'appuie aussi sur le cache de l'OS). Modification → redémarrage.

\`\`\`sql
-- Mesurer l'efficacité du cache (viser > 99 % en OLTP) :
SELECT round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2)
       AS cache_hit_ratio
FROM pg_stat_database;
\`\`\`

### work_mem — la mémoire des tris et hachages

Allouée **par opération de tri/hachage**, donc plusieurs fois par requête et par session. Le danger : \`work_mem = 512MB\` × 200 connexions × 2 tris = le serveur part en swap. Démarche : une valeur globale prudente (16–64 Mo), puis des augmentations **ciblées** :

\`\`\`sql
SET LOCAL work_mem = '256MB';   -- pour LA requête de reporting qui trie 10 M de lignes
\`\`\`

Les tris qui débordent se repèrent dans les plans (\`external merge Disk\`) et dans les logs (\`log_temp_files = 0\`).

### maintenance_work_mem — VACUUM et création d'index

Utilisée par \`VACUUM\`, \`CREATE INDEX\`, \`ALTER TABLE ADD FOREIGN KEY\`. Peu de sessions concernées simultanément : on peut être généreux (512 Mo – 1 Go) ; les REINDEX et VACUUM en profitent directement.

### effective_cache_size — une promesse, pas une allocation

N'alloue **rien** : indique au planificateur la mémoire cache totale probablement disponible (shared_buffers + cache OS). Valeur usuelle : **50–75 % de la RAM**. Trop bas, le planificateur boude les index ; c'est un paramètre d'**estimation**.

## Connexions : le faux ami max_connections

Chaque connexion est un processus (module 1). Monter \`max_connections\` à 1000 pour absorber les pics est une erreur classique : au-delà de quelques centaines de backends actifs, le serveur s'écroule en changements de contexte.

La bonne réponse est un **pooler de connexions** — PgBouncer en tête :

\`\`\`ini
; pgbouncer.ini
[databases]
academy = host=127.0.0.1 port=5432 dbname=academy
[pgbouncer]
pool_mode = transaction     ; une connexion serveur n'est tenue que le temps d'une transaction
default_pool_size = 20
max_client_conn = 2000
\`\`\`

En mode \`transaction\`, 2000 clients se partagent ~20 connexions serveur réelles. Contrepartie : pas d'état de session persistant (\`SET\` global, \`PREPARE\` nommés, \`LISTEN\`) — les applications doivent le savoir. Les plateformes serverless (Neon et son pooler intégré) appliquent exactement ce principe.

> **Méthode de tuning** : mesurer (cache hit ratio, tris sur disque, connexions actives) → changer **un** paramètre → mesurer de nouveau. Le tuning au doigt mouillé fait plus de dégâts que l'absence de tuning.`,
      },
    ],
    quiz: {
      title: "Quiz — Supervision et tuning",
      passingScore: 60,
      questions: [
        {
          question: "Avec pg_stat_statements, quelle requête faut-il optimiser en priorité ?",
          type: "SINGLE_CHOICE",
          options: [
            "Celle dont le temps moyen par exécution est le plus élevé, toujours",
            "Celle dont le temps total cumulé (total_exec_time) est le plus élevé",
            "Celle qui contient le plus de jointures",
            "La plus récente",
          ],
          correctAnswer: 1,
          explanation:
            "Une requête rapide mais exécutée des millions de fois peut coûter plus que la requête lente occasionnelle : on classe par temps total.",
        },
        {
          question: "Pourquoi une session « idle in transaction » prolongée est-elle nocive ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "Elle retient des verrous qui peuvent bloquer d'autres sessions",
            "Elle empêche VACUUM de nettoyer les lignes mortes (bloat)",
            "Elle consomme tout le work_mem du serveur",
            "Un timeout dédié (idle_in_transaction_session_timeout) permet de s'en protéger",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "Transaction ouverte = verrous conservés + horizon MVCC bloqué pour VACUUM. Le timeout dédié est le garde-fou standard.",
        },
        {
          question: "work_mem est alloué une seule fois par connexion, quelle que soit la requête.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "work_mem peut être alloué plusieurs fois PAR REQUÊTE (un tri, un hachage = une allocation chacun) : d'où la prudence sur la valeur globale.",
        },
        {
          question: "Quel est le rôle d'effective_cache_size ?",
          type: "SINGLE_CHOICE",
          options: [
            "Allouer un cache supplémentaire à PostgreSQL",
            "Informer le planificateur de la mémoire cache totale probable (shared_buffers + cache OS) pour ses estimations",
            "Limiter la mémoire des index",
            "Fixer la taille du WAL",
          ],
          correctAnswer: 1,
          explanation:
            "effective_cache_size n'alloue rien : c'est une indication d'estimation qui encourage (ou non) l'usage des index par le planificateur.",
        },
        {
          question: "Que permet PgBouncer en mode « transaction » ?",
          type: "SINGLE_CHOICE",
          options: [
            "Chiffrer automatiquement les données",
            "Faire partager un petit nombre de connexions serveur à des milliers de clients",
            "Répliquer les transactions vers un standby",
            "Accélérer les VACUUM",
          ],
          correctAnswer: 1,
          explanation:
            "En pool_mode = transaction, une connexion serveur n'est occupée que le temps d'une transaction : 2000 clients peuvent vivre sur ~20 backends réels.",
        },
      ],
    },
  },
  {
    title: "Module 8 — Sécurité avancée et chiffrement",
    description:
      "Verrouiller une instance de production : privilèges fins, Row Level Security, TLS, chiffrement des données et journal d'audit.",
    objectives: [
      "Appliquer le moindre privilège : rôles de groupe, GRANT ciblés, REVOKE sur public",
      "Mettre en œuvre la Row Level Security (RLS) avec des politiques",
      "Chiffrer les flux (TLS/scram-sha-256) et les données sensibles (pgcrypto)",
      "Organiser l'audit des accès et des modifications",
    ],
    durationMinutes: 360,
    lessons: [
      {
        title: "Moindre privilège et Row Level Security",
        durationMinutes: 55,
        content: `## Le moindre privilège, concrètement

Une application ne doit jamais se connecter en superutilisateur, ni même en propriétaire des objets. Le schéma cible : des **rôles de groupe** porteurs de privilèges (sans LOGIN), des **rôles de connexion** qui en héritent.

\`\`\`sql
-- Rôles de groupe
CREATE ROLE app_lecture  NOLOGIN;
CREATE ROLE app_ecriture NOLOGIN;

-- Nettoyer les droits par défaut trop permissifs
REVOKE ALL   ON SCHEMA public FROM PUBLIC;
REVOKE ALL   ON DATABASE academy FROM PUBLIC;

GRANT USAGE  ON SCHEMA public TO app_lecture, app_ecriture;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_lecture;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_ecriture;

-- Et pour les tables FUTURES (piège classique) :
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_lecture;

-- Rôles de connexion
CREATE ROLE api_academy LOGIN PASSWORD '***' IN ROLE app_ecriture;
CREATE ROLE bi_readonly LOGIN PASSWORD '***' IN ROLE app_lecture;
\`\`\`

Compléments indispensables : \`connection limit\` par rôle, \`statement_timeout\` pour les comptes de reporting, et un compte d'administration nominatif **par humain** (traçabilité) plutôt qu'un « admin » partagé.

## Row Level Security : le filtre au plus près des données

Les \`GRANT\` contrôlent l'accès aux **tables** ; la **RLS** contrôle l'accès aux **lignes**. Même si l'application est compromise ou qu'une requête oublie son \`WHERE\`, la base n'expose que les lignes autorisées.

\`\`\`sql
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;

-- Chaque session applicative annonce l'utilisateur courant :
-- SET app.user_id = 'cku_123';

CREATE POLICY enrollment_proprietaire ON "Enrollment"
  FOR ALL
  USING ("userId" = current_setting('app.user_id', true))
  WITH CHECK ("userId" = current_setting('app.user_id', true));

-- Un rôle de back-office peut tout voir :
CREATE POLICY enrollment_admin ON "Enrollment"
  FOR SELECT TO app_backoffice
  USING (true);
\`\`\`

- \`USING\` filtre les lignes **visibles** (SELECT/UPDATE/DELETE) ; \`WITH CHECK\` valide les lignes **écrites** (INSERT/UPDATE).
- Par défaut, le **propriétaire de la table contourne la RLS** : \`ALTER TABLE ... FORCE ROW LEVEL SECURITY\` s'applique alors aussi à lui.
- Les politiques sont combinées en OU (permissives) ; des politiques \`RESTRICTIVE\` s'ajoutent en ET.

> La RLS est la ceinture de sécurité des architectures multi-locataires (SaaS) : le filtre \`tenant_id\` cesse d'être une convention applicative pour devenir une **garantie du moteur**. Coût : chaque politique s'ajoute aux prédicats des requêtes — les colonnes filtrées par RLS doivent être indexées.`,
      },
      {
        title: "Chiffrement en transit et au repos, et journal d'audit",
        durationMinutes: 55,
        content: `## Chiffrer les flux : TLS + SCRAM

Sans TLS, identifiants et données circulent en clair. Configuration côté serveur :

\`\`\`ini
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file  = 'server.key'
ssl_min_protocol_version = 'TLSv1.2'
password_encryption = 'scram-sha-256'    # jamais md5
\`\`\`

\`\`\`
# pg_hba.conf — exiger TLS + SCRAM pour tout accès distant :
hostssl academy api_academy 10.0.0.0/24 scram-sha-256
# et refuser le non-TLS :
hostnossl all all 0.0.0.0/0 reject
\`\`\`

Côté client, \`sslmode=verify-full\` vérifie le certificat **et** l'identité de l'hôte — c'est le mode exigé pour toute connexion traversant Internet (les chaînes Neon utilisent au minimum \`sslmode=require\`).

## Chiffrer les données

**Au repos, couche disque** : chiffrement du volume (LUKS, ou chiffrement natif du fournisseur cloud). Transparent, il protège contre le vol de disque — pas contre un compte SQL compromis.

**Au repos, couche colonne** avec \`pgcrypto\` pour les données réellement sensibles :

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Mots de passe : hachage adaptatif (jamais de chiffrement réversible !)
UPDATE "User" SET password = crypt('Secret2026!', gen_salt('bf', 12));
SELECT (password = crypt('Secret2026!', password)) AS ok FROM "User" WHERE email = 'x@y.ci';

-- Donnée confidentielle : chiffrement symétrique
INSERT INTO dossiers (patient, donnees)
VALUES ('P-114', pgp_sym_encrypt('groupe sanguin O+', current_setting('app.cle_chiffrement')));

SELECT pgp_sym_decrypt(donnees::bytea, current_setting('app.cle_chiffrement')) FROM dossiers;
\`\`\`

Règle d'or : la **clé ne vit jamais dans la base** (variable d'environnement, coffre de secrets type Vault/KMS). Et l'on distingue toujours *hachage* (mot de passe, irréversible) et *chiffrement* (donnée à relire, réversible).

## Auditer : savoir qui a fait quoi

Trois étages complémentaires :

1. **Journal serveur** : \`log_connections = on\`, \`log_disconnections = on\`, et \`log_statement = 'ddl'\` pour tracer les changements de schéma.
2. **pgAudit** (extension) : journal d'audit structuré par classe d'ordres (\`READ\`, \`WRITE\`, \`ROLE\`, \`DDL\`), par base ou par rôle — le standard pour les exigences réglementaires.
3. **Table d'audit applicative** alimentée par triggers pour l'historique métier :

\`\`\`sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  moment TIMESTAMPTZ NOT NULL DEFAULT now(),
  acteur TEXT NOT NULL DEFAULT current_user,
  action TEXT NOT NULL,           -- INSERT / UPDATE / DELETE
  table_cible TEXT NOT NULL,
  ancienne_valeur JSONB,
  nouvelle_valeur JSONB
);
\`\`\`

Un journal d'audit n'a de valeur que **protégé** : rôle d'écriture seule (\`INSERT\` sans \`UPDATE/DELETE\`), export régulier vers un stockage immuable.

> **Check-list de sortie du module** : plus aucun accès via superutilisateur applicatif ; PUBLIC révoqué ; SCRAM + TLS partout ; données sensibles hachées ou chiffrées avec clés externes ; audit activé et testé.`,
      },
    ],
    quiz: {
      title: "Quiz — Sécurité avancée et chiffrement",
      passingScore: 60,
      questions: [
        {
          question: "Quelle commande garantit que les futures tables d'un schéma seront lisibles par un rôle de lecture ?",
          type: "SINGLE_CHOICE",
          options: [
            "GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_lecture;",
            "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_lecture;",
            "GRANT USAGE ON SCHEMA public TO app_lecture;",
            "CREATE POLICY lecture ON public FOR SELECT;",
          ],
          correctAnswer: 1,
          explanation:
            "GRANT ... ON ALL TABLES ne couvre que les tables existantes ; ALTER DEFAULT PRIVILEGES s'applique aux objets créés ensuite.",
        },
        {
          question: "Dans une politique RLS, quel est le rôle de WITH CHECK ?",
          type: "SINGLE_CHOICE",
          options: [
            "Filtrer les lignes visibles en lecture",
            "Valider que les lignes insérées ou modifiées respectent la condition",
            "Chiffrer les lignes concernées",
            "Limiter le nombre de lignes retournées",
          ],
          correctAnswer: 1,
          explanation:
            "USING filtre ce qui est visible ; WITH CHECK contrôle ce qui est écrit — sans lui, un utilisateur pourrait insérer des lignes qu'il ne pourrait plus voir.",
        },
        {
          question: "Quelles pratiques relèvent d'une configuration de sécurité correcte ?",
          type: "MULTIPLE_CHOICE",
          options: [
            "password_encryption = 'scram-sha-256' plutôt que md5",
            "sslmode=verify-full pour les connexions traversant Internet",
            "Stocker la clé de chiffrement pgcrypto dans une table de la base",
            "Révoquer les droits de PUBLIC sur le schéma public",
          ],
          correctAnswer: [0, 1, 3],
          explanation:
            "SCRAM, TLS vérifié et révocation de PUBLIC sont des fondamentaux ; la clé de chiffrement ne doit JAMAIS résider dans la base qu'elle protège.",
        },
        {
          question: "Par défaut, le propriétaire d'une table est soumis aux politiques RLS de cette table.",
          type: "TRUE_FALSE",
          correctAnswer: false,
          explanation:
            "Le propriétaire contourne la RLS par défaut ; il faut FORCE ROW LEVEL SECURITY pour l'y soumettre.",
        },
        {
          question: "Pour stocker des mots de passe, il faut :",
          type: "SINGLE_CHOICE",
          options: [
            "Les chiffrer avec pgp_sym_encrypt pour pouvoir les relire",
            "Les hacher avec un algorithme adaptatif (crypt/gen_salt bf), de façon irréversible",
            "Les stocker en clair dans une colonne protégée par RLS",
            "Les encoder en base64",
          ],
          correctAnswer: 1,
          explanation:
            "Un mot de passe ne doit jamais être récupérable : hachage adaptatif (bcrypt via pgcrypto, ou équivalent applicatif), jamais de chiffrement réversible ni d'encodage.",
        },
      ],
    },
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   PROJETS (F1, F2, F3, transversal parcours)
   ══════════════════════════════════════════════════════════════════════════ */

const PROJET_F1 = {
  title: "Base de données d'un centre de formation",
  context: `## Finalité

Concevoir et réaliser une **base de données relationnelle opérationnelle** permettant de gérer les apprenants, les formations, les sessions et les inscriptions d'un centre de formation. Ce projet constitue la principale preuve de compétence de la formation.

## Scénario fonctionnel

Access Academy souhaite enregistrer ses apprenants, publier plusieurs formations, organiser des sessions datées et inscrire les apprenants à ces sessions. Une formation peut avoir plusieurs sessions ; une session appartient à une seule formation. Un apprenant peut participer à plusieurs sessions et une session peut accueillir plusieurs apprenants. Chaque inscription possède une date, un statut et éventuellement une note finale.

## Requêtes minimales attendues

- Lister les apprenants actifs par ordre alphabétique.
- Afficher les sessions futures d'une formation.
- Compter les inscriptions par session.
- Calculer la moyenne des notes par formation.
- Afficher chaque inscription avec l'apprenant, la formation et la session.
- Lister les formations sans session ; identifier les apprenants sans inscription.
- Modifier le statut d'une inscription ; supprimer une inscription de test de façon contrôlée.
- Exporter la liste des participants d'une session.`,
  objectives: [
    "Analyser un besoin et formaliser des règles de gestion",
    "Modéliser une base relationnelle d'au moins 4 tables",
    "Créer la structure SQL avec clés et contraintes",
    "Écrire un jeu complet de requêtes CRUD, agrégations et jointures",
    "Documenter et présenter un livrable professionnel",
  ],
  deliverables: [
    "Document d'analyse : acteurs, besoins et au moins 8 règles de gestion",
    "Dictionnaire de données complet",
    "Diagramme relationnel comportant au minimum 4 tables",
    "Script SQL de création avec clés primaires, clés étrangères et contraintes",
    "Jeu de données réaliste : 15 apprenants, 5 formations, 8 sessions, 25 inscriptions minimum",
    "Fichier d'au moins 20 requêtes couvrant CRUD, filtres, tris, agrégations et jointures",
    "Export CSV d'au moins deux résultats utiles",
    "Guide d'installation et présentation de démonstration (5 à 8 minutes)",
  ],
  rubric: `### Grille d'évaluation (100 points)

| Domaine | Indicateurs | Points |
| --- | --- | --- |
| Analyse | Besoins compris, règles de gestion pertinentes, cohérence générale | 10 |
| Modélisation | Entités, attributs, cardinalités, clés et normalisation élémentaire | 15 |
| Structure SQL | Types, contraintes, clés primaires et étrangères, exécution sans erreur | 20 |
| Données de test | Volume minimal, réalisme, diversité et cohérence | 10 |
| Requêtes | Couverture fonctionnelle, exactitude, jointures et agrégations | 25 |
| Documentation | Clarté, installation, commentaires et organisation des fichiers | 10 |
| Démonstration | Explication, maîtrise, qualité de la présentation et réponses | 10 |

> Le projet est validé à partir de **60/100**. L'absence de script exécutable, de schéma relationnel ou de démonstration entraîne une demande de correction avant validation.`,
};

const PROJET_F2 = {
  title: "Système documenté PostgreSQL complet",
  context: `## Finalité

Concevoir, mettre en œuvre et **documenter de bout en bout** un système de base de données PostgreSQL professionnel pour une organisation réelle ou réaliste de votre choix (commerce, école, clinique, logistique…). Le projet couvre tout le cycle vu en formation : analyse, modélisation, normalisation, SQL avancé, administration, sécurité et connexion applicative.

## Attentes

Le système doit démontrer votre capacité à raisonner comme un professionnel : chaque choix (type, contrainte, index, vue, rôle) doit être **justifié par écrit**. La base est administrée : rôles distincts (application, lecture seule, administration), sauvegarde/restauration démontrées, protection contre les injections SQL illustrée côté applicatif (requêtes paramétrées via Prisma ou équivalent).

## Périmètre minimal

- 6 tables ou plus, normalisées en 3FN, avec relations 1-N et N-N.
- MCD, MLD et schéma physique cohérents entre eux.
- Vues métier, index justifiés, au moins une transaction multi-étapes.
- Jeu de données réaliste (200 lignes cumulées minimum).`,
  objectives: [
    "Modéliser et normaliser une base complète (MCD → MLD → physique, 3FN)",
    "Écrire du SQL avancé : jointures, sous-requêtes, fonctions de fenêtre, vues",
    "Administrer PostgreSQL : rôles, droits, schémas, sauvegarde et restauration",
    "Sécuriser les accès et prévenir les injections SQL",
    "Connecter la base à une application via Prisma et documenter l'ensemble",
  ],
  deliverables: [
    "Dossier d'analyse : besoins, règles de gestion, glossaire, dictionnaire de données",
    "MCD, MLD et schéma physique (captures + fichiers sources)",
    "Script SQL complet : création, contraintes, index, vues, données de test",
    "Fichier de 25 requêtes minimum, dont fenêtres, sous-requêtes et agrégations",
    "Script des rôles et droits (lecture seule, application, admin) commenté",
    "Preuve de sauvegarde/restauration (pg_dump/pg_restore) avec procédure rédigée",
    "Mini-application ou script Prisma démontrant les requêtes paramétrées",
    "Soutenance : présentation de 10 minutes + démonstration",
  ],
  rubric: `### Grille d'évaluation (100 points)

| Domaine | Indicateurs | Points |
| --- | --- | --- |
| Analyse & modélisation | Règles de gestion, MCD/MLD justes, 3FN respectée | 20 |
| Structure & SQL avancé | Contraintes, vues, index justifiés, requêtes de fenêtre exactes | 25 |
| Administration | Rôles et droits corrects, sauvegarde/restauration démontrées | 20 |
| Sécurité | Moindre privilège, requêtes paramétrées, démonstration anti-injection | 15 |
| Connexion applicative | Prisma opérationnel, transactions, gestion des erreurs | 10 |
| Documentation & soutenance | Clarté, complétude, qualité de la démonstration | 10 |

> Validation à partir de **60/100**. Les livrables d'administration (rôles, sauvegarde) sont éliminatoires s'ils sont absents.`,
};

const PROJET_F3 = {
  title: "Audit de performance d'une base réelle",
  context: `## Finalité

Réaliser l'**audit de performance complet** d'une base PostgreSQL existante (base de votre organisation, base open data volumineuse ou base fournie par l'équipe pédagogique, 5 Go minimum recommandé), puis mettre en œuvre et **mesurer** les corrections.

## Démarche imposée

1. **État des lieux** : configuration mémoire, version, volumétrie, index existants, bloat, statistiques d'activité (pg_stat_statements, pg_stat_user_indexes, cache hit ratio).
2. **Diagnostic** : identifier les 10 requêtes les plus coûteuses, analyser leurs plans (EXPLAIN ANALYZE, BUFFERS), repérer estimations fausses, tris sur disque, index manquants ou inutiles, tables candidates au partitionnement.
3. **Plan d'action hiérarchisé** : chaque recommandation chiffrée (gain attendu, risque, effort).
4. **Mise en œuvre** d'au moins 5 corrections (index, réécritures, statistiques étendues, paramètres mémoire, partitionnement ou archivage).
5. **Mesure avant/après** rigoureuse : mêmes requêtes, mêmes données, résultats présentés en tableau.
6. **Volet fiabilité** : proposer une stratégie de sauvegarde PITR et de supervision adaptée à la base auditée.

## Contraintes

Toute modification est réversible et documentée ; aucune recommandation « au doigt mouillé » : chaque affirmation s'appuie sur une mesure ou une vue statistique citée.`,
  objectives: [
    "Conduire un audit méthodique avec les vues statistiques de PostgreSQL",
    "Interpréter des plans d'exécution réels et en tirer des corrections",
    "Mettre en œuvre index, réécritures et réglages mémoire, et mesurer les gains",
    "Proposer une stratégie de sauvegarde, supervision et sécurité adaptée",
    "Restituer un rapport d'audit professionnel et argumenté",
  ],
  deliverables: [
    "Rapport d'audit (15-25 pages) : état des lieux, diagnostic chiffré, plan d'action hiérarchisé",
    "Annexe technique : plans EXPLAIN ANALYZE avant/après pour chaque correction",
    "Scripts SQL des corrections appliquées (index, statistiques, réécritures), commentés",
    "Tableau de mesures avant/après (temps, buffers, tris disque) pour 5 corrections minimum",
    "Proposition de stratégie PITR + supervision (outils, seuils d'alerte, RPO/RTO)",
    "Soutenance de 15 minutes avec démonstration d'au moins une optimisation en direct",
  ],
  rubric: `### Grille d'évaluation (100 points)

| Domaine | Indicateurs | Points |
| --- | --- | --- |
| État des lieux | Complétude, outils appropriés, volumétrie et configuration documentées | 15 |
| Diagnostic | Requêtes coûteuses identifiées, lecture correcte des plans, causes racines | 25 |
| Corrections | Pertinence technique, réversibilité, qualité des scripts | 20 |
| Mesures | Rigueur avant/après, honnêteté des résultats, tableau clair | 20 |
| Fiabilité | Stratégie PITR/supervision réaliste et dimensionnée | 10 |
| Restitution | Rapport professionnel, soutenance maîtrisée, démonstration | 10 |

> Validation à partir de **60/100**. Un audit sans mesures avant/après n'est pas recevable.`,
};

const PROJET_PARCOURS = {
  title: "Déploiement complet d'une infrastructure de données",
  context: `## Le projet final du parcours Administrateur de bases de données

Vous êtes recruté(e) comme **administrateur de bases de données** par une PME ivoirienne en pleine croissance (e-commerce, microfinance ou plateforme éducative — au choix). Sa base actuelle : un unique serveur PostgreSQL installé « par défaut », sans sauvegardes fiables, sans supervision, avec un seul compte superutilisateur partagé par toute l'équipe, et des lenteurs croissantes aux heures de pointe.

Votre mission : **concevoir, déployer et documenter l'infrastructure de données cible**, en mobilisant l'ensemble des compétences du parcours.

## Périmètre imposé

1. **Schéma et données** : reprendre (ou concevoir) le schéma métier, le normaliser, le migrer proprement (scripts versionnés avec Git).
2. **Sécurité** : rôles de moindre privilège, SCRAM + TLS, révocation de PUBLIC, RLS sur au moins une table multi-utilisateurs, secrets hors de la base.
3. **Performance** : audit initial, indexation justifiée, au moins une table volumineuse partitionnée, mesures avant/après.
4. **Haute disponibilité** : un standby en réplication streaming avec slot, procédure de bascule rédigée ET testée (compte rendu de l'exercice de failover).
5. **Sauvegardes** : PITR opérationnel (base + archivage WAL), une restauration à un instant donné démontrée, RPO/RTO énoncés.
6. **Supervision** : pg_stat_statements, journalisation configurée, tableau des 5 indicateurs suivis avec leurs seuils d'alerte.
7. **Exploitation** : runbook (démarrage, arrêt, bascule, restauration, incidents courants) sous Git, environnement reproductible (scripts ou conteneurs — compétences Linux et Git du parcours).

## Conditions de réalisation

Projet individuel, 4 à 6 semaines, environnement libre (deux machines virtuelles, conteneurs ou cloud). Chaque affirmation du dossier doit être **démontrable en soutenance**.`,
  objectives: [
    "Assembler toutes les compétences du parcours dans un déploiement réaliste de bout en bout",
    "Sécuriser une instance selon le moindre privilège (rôles, TLS, RLS)",
    "Mettre en place réplication, bascule testée, PITR et supervision",
    "Optimiser les performances avec des mesures rigoureuses avant/après",
    "Produire la documentation d'exploitation (runbook) d'un vrai poste de DBA",
  ],
  deliverables: [
    "Dossier d'architecture : schéma cible, choix techniques justifiés, RPO/RTO",
    "Dépôt Git : scripts SQL versionnés, configuration, runbook d'exploitation",
    "Preuves de sécurité : script des rôles, pg_hba commenté, démonstration RLS",
    "Compte rendu de l'exercice de bascule (failover) avec chronométrage",
    "Démonstration PITR : restauration à un instant donné, procédure pas à pas",
    "Rapport de performance : audit initial, corrections, tableau avant/après",
    "Tableau de supervision : indicateurs, seuils, procédure d'alerte",
    "Soutenance finale de 20 minutes devant jury avec démonstrations en direct",
  ],
  rubric: `### Grille d'évaluation (100 points)

| Domaine | Indicateurs | Points |
| --- | --- | --- |
| Architecture & schéma | Cohérence, normalisation, migrations versionnées | 15 |
| Sécurité | Moindre privilège effectif, TLS/SCRAM, RLS démontrée | 15 |
| Haute disponibilité | Réplication opérationnelle, bascule testée et chronométrée | 20 |
| Sauvegardes & PITR | Restauration à un instant donné démontrée, RPO/RTO tenus | 20 |
| Performance | Audit, corrections mesurées, partitionnement pertinent | 15 |
| Exploitation & soutenance | Runbook utilisable, dépôt Git propre, démonstrations maîtrisées | 15 |

> Le projet final est validé à partir de **60/100**. La démonstration de bascule et la restauration PITR sont **éliminatoires** si absentes : un DBA qui ne sait pas restaurer n'est pas certifiable.`,
};

/* ══════════════════════════════════════════════════════════════════════════
   SEED
   ══════════════════════════════════════════════════════════════════════════ */

async function main() {
  console.log("🌱 Seed Access Academy — réveil de Neon…");
  await wakePooler();
  console.log("   Pooler réveillé, écritures via l'URL directe.");

  /* ── 1. Utilisateurs démo ────────────────────────────────────────────── */
  const hash = await bcrypt.hash("DigitalAccess2026!", 12);
  const now = new Date();

  const mkUser = (data: {
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    roles: ("LEARNER" | "INSTRUCTOR" | "ACADEMIC_ADMIN" | "SUPER_ADMIN")[];
    bio?: string;
  }) =>
    prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name, roles: data.roles, bio: data.bio, isActive: true },
      create: {
        email: data.email,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hash,
        roles: data.roles,
        bio: data.bio,
        emailVerified: now,
        isActive: true,
        country: "Côte d'Ivoire",
      },
    });

  const superadmin = await mkUser({
    email: "superadmin@digitalaccess.ci",
    name: "Administrateur DA",
    firstName: "Administrateur",
    lastName: "DA",
    roles: ["SUPER_ADMIN"],
  });
  const pedagogie = await mkUser({
    email: "pedagogie@digitalaccess.ci",
    name: "Direction pédagogique",
    firstName: "Direction",
    lastName: "Pédagogique",
    roles: ["ACADEMIC_ADMIN"],
  });
  const formateur = await mkUser({
    email: "formateur@digitalaccess.ci",
    name: "Koffi N'Guessan",
    firstName: "Koffi",
    lastName: "N'Guessan",
    roles: ["INSTRUCTOR"],
    bio: "Ingénieur bases de données et formateur principal de la filière Données chez Access Academy. Douze ans d'expérience PostgreSQL en production (banque, télécoms, e-commerce) en Côte d'Ivoire et dans la sous-région. Certifié PostgreSQL, passionné par la transmission : « une base bien conçue, c'est une entreprise qui dort tranquille ».",
  });
  const apprenant = await mkUser({
    email: "apprenant@digitalaccess.ci",
    name: "Aya Apprenante",
    firstName: "Aya",
    lastName: "Apprenante",
    roles: ["LEARNER"],
  });
  console.log("✓ 4 utilisateurs démo");

  /* ── 2. Écoles (§51.3) ───────────────────────────────────────────────── */
  const schoolData = [
    {
      slug: "ecole-donnees-ia",
      name: "École des Données et de l'Intelligence artificielle",
      tagline: "Faire parler les données, du premier SELECT aux systèmes intelligents.",
      description:
        "L'École des Données et de l'Intelligence artificielle forme les professionnels qui collectent, structurent, administrent et valorisent les données des organisations. Des fondamentaux des bases de données relationnelles à l'administration avancée de PostgreSQL, en passant par l'analyse et les fondations de l'IA, ses formations privilégient la pratique sur des cas réels ivoiriens et ouest-africains : commerce, finance, santé, éducation. Chaque compétence acquise est démontrée par un projet évalué — parce qu'un professionnel de la donnée se juge sur ce qu'il livre.",
      icon: "database",
      color: "#1E8FE1",
      order: 1,
    },
    {
      slug: "ecole-developpement",
      name: "École du Développement logiciel",
      tagline: "Concevoir, coder et livrer des applications qui tiennent en production.",
      description:
        "L'École du Développement logiciel forme des développeurs complets : algorithmique, langages modernes, bases de données, versionnage, tests et déploiement. Sa pédagogie repose sur la construction progressive de vraies applications — chaque module ajoute une brique fonctionnelle jusqu'au produit final présenté en soutenance. Les formations s'appuient sur les outils réellement utilisés en entreprise (Git, PostgreSQL, frameworks web actuels) et préparent aussi bien à l'emploi salarié qu'au travail en indépendant sur le marché africain et international.",
      icon: "code",
      color: "#5B3FA8",
      order: 2,
    },
    {
      slug: "ecole-cybersecurite",
      name: "École de la Cybersécurité et des Infrastructures",
      tagline: "Protéger les systèmes, fiabiliser les infrastructures, garantir la continuité.",
      description:
        "L'École de la Cybersécurité et des Infrastructures forme les gardiens des systèmes d'information : administration de serveurs, durcissement, sécurité des données et des réseaux, sauvegardes, haute disponibilité et réponse aux incidents. Ses parcours cultivent une double exigence — comprendre l'attaque pour construire la défense, et documenter chaque procédure pour que la sécurité survive aux individus. Les mises en situation (audits, exercices de bascule, restaurations chronométrées) préparent aux responsabilités réelles d'un professionnel des infrastructures.",
      icon: "shield",
      color: "#00BCD4",
      order: 3,
    },
  ];
  const schools: Record<string, string> = {};
  for (const s of schoolData) {
    const rec = await prisma.school.upsert({
      where: { slug: s.slug },
      update: { name: s.name, tagline: s.tagline, description: s.description, icon: s.icon, color: s.color, order: s.order, status: "PUBLISHED" },
      create: { ...s, status: "PUBLISHED" },
    });
    schools[s.slug] = rec.id;
  }
  console.log("✓ 3 écoles");

  /* ── 3. Compétences ──────────────────────────────────────────────────── */
  const skillData = [
    { slug: "sql", name: "SQL", domain: "Données", description: "Écrire des requêtes SQL : CRUD, filtres, agrégations, jointures, sous-requêtes et fonctions de fenêtre." },
    { slug: "modelisation-relationnelle", name: "Modélisation relationnelle", domain: "Données", description: "Analyser un besoin, produire MCD/MLD, normaliser jusqu'à la 3FN." },
    { slug: "postgresql", name: "PostgreSQL", domain: "Données", description: "Exploiter le SGBD PostgreSQL : installation, objets, extensions, spécificités du moteur." },
    { slug: "administration-bdd", name: "Administration de bases de données", domain: "Infrastructures", description: "Rôles et droits, sauvegardes/restaurations, réplication, supervision et maintenance." },
    { slug: "securite-donnees", name: "Sécurité des données", domain: "Sécurité", description: "Moindre privilège, prévention des injections, chiffrement, RLS et audit." },
    { slug: "optimisation-performance", name: "Optimisation des performances", domain: "Données", description: "Plans d'exécution, indexation avancée, statistiques, partitionnement et tuning." },
  ];
  const skills: Record<string, string> = {};
  for (const s of skillData) {
    const rec = await prisma.skill.upsert({
      where: { slug: s.slug },
      update: { name: s.name, domain: s.domain, description: s.description },
      create: s,
    });
    skills[s.slug] = rec.id;
  }
  console.log("✓ 6 compétences");

  /* ── 4. Formations ───────────────────────────────────────────────────── */

  // Reconstruit le curriculum d'une formation (idempotence par reconstruction).
  async function resetCourseContent(courseId: string) {
    await prisma.module.deleteMany({ where: { courseId } }); // cascade leçons + progress
    await prisma.assessment.deleteMany({ where: { courseId } }); // cascade questions + tentatives
    await prisma.project.deleteMany({ where: { courseId } });
  }

  async function upsertCourse(data: Prisma.CourseCreateInput & { slug: string }) {
    const { slug, ...rest } = data;
    return prisma.course.upsert({
      where: { slug },
      update: rest as Prisma.CourseUpdateInput,
      create: { slug, ...rest },
    });
  }

  /* — F1 : Fondamentaux des bases de données et SQL — */
  const course1 = await upsertCourse({
    slug: "fondamentaux-bases-donnees-sql",
    title: "Fondamentaux des bases de données et SQL",
    subtitle: "Assistant données, futur analyste ou administrateur de bases de données",
    description:
      "Sans aucun prérequis en programmation, apprenez à raisonner « données ». Vous découvrez le rôle d'un SGBD, le modèle relationnel (tables, clés, relations), puis vous écrivez du SQL pour créer, consulter, modifier, filtrer, agréger et relier des données avec PostgreSQL. Chaque module combine un cours illustré, des travaux pratiques guidés et un quiz noté. La formation se conclut par un projet certifiant : concevoir la base de données d'un centre de formation.",
    objectives: [
      "Expliquer le rôle d'une base de données et d'un SGBD",
      "Identifier tables, colonnes, lignes, clés et relations",
      "Modéliser une base relationnelle simple",
      "Créer une base et ses tables avec SQL",
      "Réaliser les opérations CRUD (INSERT, SELECT, UPDATE, DELETE)",
      "Filtrer, trier, regrouper et agréger les données",
      "Combiner des données de plusieurs tables avec les jointures",
      "Importer et exporter des données au format CSV",
    ],
    targetAudience: [
      "Débutants sans expérience en programmation",
      "Étudiants et professionnels en reconversion vers les métiers de la donnée",
      "Gestionnaires souhaitant exploiter eux-mêmes leurs données",
    ],
    prerequisitesText: [
      "Savoir utiliser un ordinateur et un navigateur web",
      "Savoir créer et organiser des fichiers et des dossiers",
      "Aucune connaissance préalable en programmation ou en SQL",
    ],
    tools: ["PostgreSQL", "pgAdmin", "DBeaver", "dbdiagram.io", "Fichiers CSV"],
    level: "BEGINNER",
    durationHours: 40,
    price: 38000,
    certificateTitle: "Certificat Access Academy — Fondamentaux des bases de données et SQL",
    unlockMode: "FREE",
    featured: true,
    status: "PUBLISHED",
    publishedAt: now,
  });
  await resetCourseContent(course1.id);

  let f1Lessons = 0;
  let f1Questions = 0;
  for (const [mi, m] of f1.modules.entries()) {
    const mod = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: m.title,
        description: m.durationMinutes ? `Durée estimée : ${Math.round(m.durationMinutes / 60)} h.` : null,
        objectives: m.objectives,
        order: mi + 1,
        durationMinutes: m.durationMinutes,
        status: "PUBLISHED",
      },
    });
    await prisma.lesson.createMany({
      data: [
        {
          moduleId: mod.id,
          title: "Cours",
          lessonType: "TEXT",
          content: m.cours,
          durationMinutes: 45,
          order: 1,
          isPreview: mi === 0,
          isRequired: true,
          status: "PUBLISHED",
        },
        {
          moduleId: mod.id,
          title: "Travaux pratiques",
          lessonType: "WORKSHOP",
          content: m.pratique,
          durationMinutes: 60,
          order: 2,
          isRequired: true,
          status: "PUBLISHED",
        },
      ],
    });
    f1Lessons += 2;
    await prisma.assessment.create({
      data: {
        courseId: course1.id,
        moduleId: mod.id,
        title: m.quiz.title,
        description: "Quiz de validation du module (2 tentatives autorisées).",
        type: "QUIZ",
        passingScore: m.quiz.passingScore,
        attemptsAllowed: 2,
        isRequired: true,
        order: mi + 1,
        status: "PUBLISHED",
        questions: {
          create: m.quiz.questions.map((q, qi) => ({
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            points: 1,
            order: qi + 1,
          })),
        },
      },
    });
    f1Questions += m.quiz.questions.length;
  }
  await prisma.project.create({
    data: { courseId: course1.id, ...PROJET_F1, minScore: 60, isRequired: true, order: 1, status: "PUBLISHED" },
  });
  console.log(`✓ F1 « ${course1.title} » — ${f1.modules.length} modules, ${f1Lessons} leçons, ${f1Questions} questions, 1 projet`);

  /* — F2 : Conception, administration et exploitation — */
  const course2 = await upsertCourse({
    slug: "conception-administration-bases-sql",
    title: "Conception, administration et exploitation des bases de données SQL",
    subtitle: f2.path.targetJob,
    description: f2.path.longDescription,
    objectives: f2.path.objectives,
    targetAudience: [
      "Titulaires des fondamentaux SQL souhaitant passer au niveau professionnel",
      "Développeurs voulant maîtriser la conception et l'administration PostgreSQL",
      "Techniciens visant un poste de gestionnaire de bases de données",
    ],
    prerequisitesText: f2.path.prerequisites,
    tools: f2.path.tools,
    level: "INTERMEDIATE",
    durationHours: 70,
    price: 55000,
    certificateTitle: f2.path.certificateTitle,
    unlockMode: "FREE",
    featured: true,
    status: "PUBLISHED",
    publishedAt: now,
  });
  await resetCourseContent(course2.id);

  const F2_TYPE_MAP: Record<F2Lesson["type"], "TEXT" | "WORKSHOP" | "VIDEO"> = {
    TEXT: "TEXT",
    EXERCISE: "WORKSHOP",
    RESOURCE: "TEXT",
    VIDEO: "VIDEO",
  };
  const isPlaceholder = (m: F2Module) =>
    m.lessons.length <= 1 && m.lessons.every((l) => l.content.includes("Contenu à compléter") || l.content.includes("n'a pas pu être isolé"));

  let f2Modules = 0;
  let f2LessonsCount = 0;
  let f2Questions = 0;
  for (const m of f2.modules) {
    if (isPlaceholder(m)) continue; // stubs « Projet » / « Évaluation » couverts par l'entité Project
    f2Modules++;
    const mod = await prisma.module.create({
      data: {
        courseId: course2.id,
        title: m.title,
        description: m.summary ?? null,
        objectives: m.objectives,
        order: f2Modules,
        durationMinutes: m.estimatedDuration,
        status: "PUBLISHED",
      },
    });
    await prisma.lesson.createMany({
      data: m.lessons.map((l, li) => ({
        moduleId: mod.id,
        title: l.title,
        lessonType: F2_TYPE_MAP[l.type],
        content: l.content,
        durationMinutes: l.type === "EXERCISE" ? 50 : 35,
        order: li + 1,
        isPreview: f2Modules === 1 && li === 0,
        isRequired: true,
        status: "PUBLISHED",
      })),
    });
    f2LessonsCount += m.lessons.length;
    if (m.quiz) {
      await prisma.assessment.create({
        data: {
          courseId: course2.id,
          moduleId: mod.id,
          title: m.quiz.title,
          description: "Quiz de validation du module (2 tentatives autorisées).",
          type: "QUIZ",
          passingScore: m.quiz.passingScore,
          attemptsAllowed: 2,
          isRequired: true,
          order: f2Modules,
          status: "PUBLISHED",
          questions: {
            create: m.quiz.questions.map((q, qi) => ({
              type: q.type,
              question: q.question,
              options: q.options,
              correctAnswer: f2CorrectAnswer(q),
              explanation: q.explanation ?? null,
              points: 1,
              order: qi + 1,
            })),
          },
        },
      });
      f2Questions += m.quiz.questions.length;
    }
  }
  await prisma.project.create({
    data: { courseId: course2.id, ...PROJET_F2, minScore: 60, isRequired: true, order: 1, status: "PUBLISHED" },
  });
  console.log(`✓ F2 « ${course2.title} » — ${f2Modules} modules, ${f2LessonsCount} leçons, ${f2Questions} questions, 1 projet`);

  /* — F3 : Architecture, performance et administration avancée — */
  const course3 = await upsertCourse({
    slug: "architecture-performance-bases-donnees",
    title: "Architecture, performance et administration avancée des bases de données",
    subtitle: "Administrateur de bases de données senior / ingénieur données",
    description:
      "La formation qui fait passer du « ça fonctionne » au « ça tient en production ». Vous plongez dans les entrailles de PostgreSQL — processus, mémoire, MVCC, WAL — pour comprendre puis maîtriser ce qui fait la vitesse et la fiabilité d'une base : indexation avancée (B-tree, GIN, BRIN), lecture des plans d'exécution, partitionnement des tables volumineuses, réplication et bascule, sauvegardes PITR, supervision outillée et sécurité de niveau production (RLS, chiffrement, audit). Chaque module s'appuie sur des manipulations réelles et se conclut par un quiz exigeant ; le projet final est un audit de performance complet d'une base réelle.",
    objectives: [
      "Expliquer l'architecture interne de PostgreSQL : processus, mémoire, WAL, MVCC",
      "Concevoir une stratégie d'indexation avancée (B-tree, GIN, BRIN, index partiels et couvrants)",
      "Diagnostiquer et optimiser des requêtes avec EXPLAIN ANALYZE et les statistiques",
      "Partitionner les tables volumineuses et industrialiser leur cycle de vie",
      "Mettre en place réplication en streaming, slots et procédure de bascule",
      "Construire une stratégie de sauvegarde PITR et la démontrer par une restauration",
      "Superviser une instance et régler mémoire et connexions pour la production",
      "Sécuriser au niveau production : moindre privilège, RLS, TLS, chiffrement, audit",
    ],
    targetAudience: [
      "Administrateurs et gestionnaires de bases de données confirmés",
      "Développeurs backend seniors responsables de la donnée en production",
      "Ingénieurs infrastructure et DevOps en charge de PostgreSQL",
    ],
    prerequisitesText: [
      "Maîtriser le SQL avancé : jointures, sous-requêtes, fonctions de fenêtre",
      "Avoir administré une base PostgreSQL : rôles, droits, sauvegardes simples",
      "Être à l'aise avec un terminal Linux",
      "Avoir validé la formation « Conception, administration et exploitation des bases de données SQL » ou niveau équivalent",
    ],
    tools: ["PostgreSQL 16", "psql", "pgAdmin", "pg_stat_statements", "pgBackRest", "PgBouncer", "pgBadger", "Linux"],
    level: "ADVANCED",
    durationHours: 60,
    price: 75000,
    certificateTitle: "Certificat Access Academy — Architecture, performance et administration avancée des bases de données",
    unlockMode: "FREE",
    featured: true,
    status: "PUBLISHED",
    publishedAt: now,
  });
  await resetCourseContent(course3.id);

  let f3Lessons = 0;
  let f3Questions = 0;
  for (const [mi, m] of f3Modules.entries()) {
    const mod = await prisma.module.create({
      data: {
        courseId: course3.id,
        title: m.title,
        description: m.description,
        objectives: m.objectives,
        order: mi + 1,
        durationMinutes: m.durationMinutes,
        status: "PUBLISHED",
      },
    });
    await prisma.lesson.createMany({
      data: m.lessons.map((l, li) => ({
        moduleId: mod.id,
        title: l.title,
        lessonType: "TEXT" as const,
        content: l.content,
        durationMinutes: l.durationMinutes,
        order: li + 1,
        isPreview: mi === 0 && li === 0,
        isRequired: true,
        status: "PUBLISHED",
      })),
    });
    f3Lessons += m.lessons.length;
    await prisma.assessment.create({
      data: {
        courseId: course3.id,
        moduleId: mod.id,
        title: m.quiz.title,
        description: "Quiz de validation du module (2 tentatives autorisées).",
        type: "QUIZ",
        passingScore: m.quiz.passingScore,
        attemptsAllowed: 2,
        isRequired: true,
        order: mi + 1,
        status: "PUBLISHED",
        questions: {
          create: m.quiz.questions.map((q, qi) => ({
            type: q.type,
            question: q.question,
            options: q.type === "TRUE_FALSE" ? TF_OPTS : q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: 1,
            order: qi + 1,
          })),
        },
      },
    });
    f3Questions += m.quiz.questions.length;
  }
  await prisma.project.create({
    data: { courseId: course3.id, ...PROJET_F3, minScore: 60, isRequired: true, order: 1, status: "PUBLISHED" },
  });
  console.log(`✓ F3 « ${course3.title} » — ${f3Modules.length} modules, ${f3Lessons} leçons, ${f3Questions} questions, 1 projet`);

  /* — Formations complémentaires (DRAFT, squelettes) — */
  async function seedDraftCourse(input: {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    objectives: string[];
    tools: string[];
    moduleTitle: string;
    lessons: { title: string; content: string }[];
  }) {
    const c = await upsertCourse({
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      objectives: input.objectives,
      prerequisitesText: ["Savoir utiliser un ordinateur", "Notions de ligne de commande bienvenues"],
      tools: input.tools,
      level: "BEGINNER",
      durationHours: 20,
      price: 15000,
      status: "DRAFT",
    });
    await resetCourseContent(c.id);
    const mod = await prisma.module.create({
      data: { courseId: c.id, title: input.moduleTitle, order: 1, status: "DRAFT" },
    });
    await prisma.lesson.createMany({
      data: input.lessons.map((l, li) => ({
        moduleId: mod.id,
        title: l.title,
        lessonType: "TEXT" as const,
        content: l.content,
        order: li + 1,
        status: "DRAFT",
      })),
    });
    return c;
  }

  const courseLinux = await seedDraftCourse({
    slug: "linux-essentiels",
    title: "Linux pour l'administration",
    subtitle: "Administrateur système junior",
    description:
      "Les fondamentaux Linux indispensables à tout administrateur de bases de données : navigation, fichiers et permissions, processus, services, journaux et scripts shell de base. Formation complémentaire du parcours Administrateur de bases de données. *Contenu détaillé en cours de production.*",
    objectives: [
      "Naviguer et manipuler fichiers et répertoires en ligne de commande",
      "Gérer permissions, utilisateurs et processus",
      "Consulter les journaux système et gérer les services",
    ],
    tools: ["Linux (Ubuntu Server)", "Bash", "systemd"],
    moduleTitle: "Module 1 — Prise en main de la ligne de commande",
    lessons: [
      {
        title: "Se repérer : terminal, arborescence et navigation",
        content:
          "## Le terminal, l'outil de travail de l'administrateur\n\nCette leçon présente le shell, l'arborescence Linux (`/etc`, `/var`, `/home`) et les commandes de navigation (`pwd`, `ls`, `cd`).\n\n```bash\npwd\nls -lah /var/log\ncd /etc\n```\n\n*Contenu détaillé en cours de production — publication prochaine.*",
      },
      {
        title: "Fichiers et permissions : lire, écrire, protéger",
        content:
          "## Manipuler et protéger les fichiers\n\nCette leçon couvre `cp`, `mv`, `rm`, `mkdir`, la lecture (`cat`, `less`, `tail -f`) et le modèle de permissions (`chmod`, `chown`).\n\n```bash\nchmod 640 /etc/app/config.ini\nchown postgres:postgres /var/lib/postgresql\n```\n\n*Contenu détaillé en cours de production — publication prochaine.*",
      },
    ],
  });

  const courseGit = await seedDraftCourse({
    slug: "git-essentiels",
    title: "Git et versionnage",
    subtitle: "Tout professionnel technique",
    description:
      "Versionner son travail comme un professionnel : dépôts, commits, branches, fusion et collaboration sur GitHub. Indispensable pour versionner scripts SQL, configurations et runbooks. Formation complémentaire du parcours Administrateur de bases de données. *Contenu détaillé en cours de production.*",
    objectives: [
      "Créer un dépôt et construire un historique de commits propre",
      "Travailler en branches et fusionner sans peur",
      "Collaborer via GitHub : remotes, push, pull, pull requests",
    ],
    tools: ["Git", "GitHub"],
    moduleTitle: "Module 1 — Premiers pas avec Git",
    lessons: [
      {
        title: "Initialiser un dépôt et faire ses premiers commits",
        content:
          "## Pourquoi versionner ?\n\nCette leçon présente l'intérêt du versionnage (historique, retour arrière, collaboration) et les premières commandes.\n\n```bash\ngit init\ngit add scripts/creation_tables.sql\ngit commit -m \"Ajout du script de création des tables\"\ngit log --oneline\n```\n\n*Contenu détaillé en cours de production — publication prochaine.*",
      },
      {
        title: "Branches et fusion : travailler sans casser",
        content:
          "## Isoler son travail dans des branches\n\nCette leçon couvre la création de branches, la bascule et la fusion.\n\n```bash\ngit switch -c migration-v2\ngit merge migration-v2\n```\n\n*Contenu détaillé en cours de production — publication prochaine.*",
      },
    ],
  });
  console.log("✓ 2 formations complémentaires (DRAFT) : Linux, Git");

  /* ── 5. Prérequis structurés, compétences, instructeur ───────────────── */
  const prereqPairs = [
    { courseId: course2.id, requiresCourseId: course1.id },
    { courseId: course3.id, requiresCourseId: course2.id },
  ];
  for (const p of prereqPairs) {
    await prisma.coursePrerequisite.upsert({
      where: { courseId_requiresCourseId: p },
      update: {},
      create: p,
    });
  }

  const courseSkills: { courseId: string; skillSlug: string; targetLevel: "DISCOVERY" | "BEGINNER" | "OPERATIONAL" | "ADVANCED" | "EXPERT"; isPrimary: boolean }[] = [
    // F1 — découverte / bases
    { courseId: course1.id, skillSlug: "sql", targetLevel: "BEGINNER", isPrimary: true },
    { courseId: course1.id, skillSlug: "modelisation-relationnelle", targetLevel: "BEGINNER", isPrimary: true },
    { courseId: course1.id, skillSlug: "postgresql", targetLevel: "DISCOVERY", isPrimary: false },
    // F2 — niveau opérationnel
    { courseId: course2.id, skillSlug: "sql", targetLevel: "OPERATIONAL", isPrimary: true },
    { courseId: course2.id, skillSlug: "modelisation-relationnelle", targetLevel: "OPERATIONAL", isPrimary: true },
    { courseId: course2.id, skillSlug: "postgresql", targetLevel: "OPERATIONAL", isPrimary: false },
    { courseId: course2.id, skillSlug: "administration-bdd", targetLevel: "BEGINNER", isPrimary: false },
    { courseId: course2.id, skillSlug: "securite-donnees", targetLevel: "BEGINNER", isPrimary: false },
    // F3 — niveau avancé/expert
    { courseId: course3.id, skillSlug: "postgresql", targetLevel: "EXPERT", isPrimary: true },
    { courseId: course3.id, skillSlug: "administration-bdd", targetLevel: "ADVANCED", isPrimary: true },
    { courseId: course3.id, skillSlug: "optimisation-performance", targetLevel: "ADVANCED", isPrimary: true },
    { courseId: course3.id, skillSlug: "securite-donnees", targetLevel: "ADVANCED", isPrimary: false },
    { courseId: course3.id, skillSlug: "sql", targetLevel: "ADVANCED", isPrimary: false },
  ];
  for (const cs of courseSkills) {
    await prisma.courseSkill.upsert({
      where: { courseId_skillId: { courseId: cs.courseId, skillId: skills[cs.skillSlug] } },
      update: { targetLevel: cs.targetLevel, isPrimary: cs.isPrimary },
      create: { courseId: cs.courseId, skillId: skills[cs.skillSlug], targetLevel: cs.targetLevel, isPrimary: cs.isPrimary },
    });
  }

  for (const [i, courseId] of [course1.id, course2.id, course3.id].entries()) {
    await prisma.courseInstructor.upsert({
      where: { courseId_userId: { courseId, userId: formateur.id } },
      update: { roleLabel: "Formateur principal" },
      create: { courseId, userId: formateur.id, roleLabel: "Formateur principal", order: i },
    });
  }
  console.log("✓ Prérequis structurés (F1→F2→F3), compétences, instructeur");

  /* ── 6. Parcours « Administrateur de bases de données » ─────────────── */
  const PATH_SLUG = "administrateur-bases-donnees";
  const pathScalars = {
    title: "Administrateur de bases de données",
    targetJob: "Administrateur de bases de données (DBA)",
    description:
      "Le parcours métier qui forme, pas à pas, un **administrateur de bases de données opérationnel** : des fondamentaux du modèle relationnel et du SQL jusqu'à l'architecture interne de PostgreSQL, la haute disponibilité, les sauvegardes PITR et la sécurité de production. Trois formations cœur s'enchaînent par niveau (débutant → intermédiaire → avancé), complétées par les outils du quotidien (Linux, Git) et couronnées par un projet final transversal : le déploiement complet d'une infrastructure de données, démontré en soutenance devant jury. Chaque formation validée reste acquise définitivement — si vous avez déjà validé une brique, elle est reconnue et déduite du prix du parcours.",
    missions: [
      "Concevoir et faire évoluer les schémas de données de l'organisation",
      "Garantir la disponibilité, les sauvegardes et la restauration des bases",
      "Optimiser les performances : index, requêtes, partitionnement",
      "Sécuriser les accès et protéger les données sensibles",
      "Superviser les instances et anticiper les incidents",
      "Documenter l'exploitation et accompagner les équipes de développement",
    ],
    outcomes: [
      "Certification métier reconnue Access Academy",
      "Trois certificats de formation (fondamentaux, conception/administration, avancé)",
      "Un portefeuille de projets démontrables : bases conçues, audit de performance, infrastructure déployée",
      "Un runbook d'exploitation professionnel versionné sous Git",
      "Les réflexes de production : bascule testée, restauration démontrée, sécurité par défaut",
    ],
    entryLevel: "BEGINNER" as const,
    exitLevel: "ADVANCED" as const,
    duration: "9 mois",
    rhythm: "8 à 10 h / semaine",
    price: 150000,
    certificationTitle: "Certification métier — Administrateur de bases de données Access Academy",
    featured: true,
    status: "PUBLISHED" as const,
  };
  const existingPath = await prisma.careerPath.findUnique({ where: { slug: PATH_SLUG }, select: { id: true } });
  const path = existingPath
    ? await prisma.careerPath.update({ where: { id: existingPath.id }, data: pathScalars })
    : await prisma.careerPath.create({ data: { slug: PATH_SLUG, ...pathScalars } });

  // Reconstruire phases, composition et projet transversal
  await prisma.careerPathCourse.deleteMany({ where: { careerPathId: path.id } });
  await prisma.careerPathPhase.deleteMany({ where: { careerPathId: path.id } });
  await prisma.project.deleteMany({ where: { careerPathId: path.id } });

  const phaseData = [
    { title: "Fondations", description: "Comprendre la donnée, le modèle relationnel et les bases du SQL — le socle sur lequel tout le métier repose.", order: 1 },
    { title: "Compétences principales", description: "Concevoir, normaliser, administrer et sécuriser des bases PostgreSQL professionnelles.", order: 2 },
    { title: "Spécialisation", description: "Entrer dans le moteur : architecture interne, performance, haute disponibilité, PITR et sécurité de production.", order: 3 },
    { title: "Professionnalisation", description: "S'outiller comme un professionnel : Linux pour l'administration et versionnage Git des scripts et procédures.", order: 4 },
    { title: "Projet final", description: "Déployer une infrastructure de données complète et la défendre en soutenance devant jury.", order: 5 },
  ];
  const phases: string[] = [];
  for (const ph of phaseData) {
    const rec = await prisma.careerPathPhase.create({ data: { careerPathId: path.id, ...ph } });
    phases.push(rec.id);
  }

  const pathCourses = [
    { courseId: course1.id, phaseId: phases[0], position: 1, isRequired: true, prerequisiteCourseId: null as string | null },
    { courseId: course2.id, phaseId: phases[1], position: 2, isRequired: true, prerequisiteCourseId: course1.id },
    { courseId: course3.id, phaseId: phases[2], position: 3, isRequired: true, prerequisiteCourseId: course2.id },
    { courseId: courseLinux.id, phaseId: phases[3], position: 4, isRequired: false, prerequisiteCourseId: null },
    { courseId: courseGit.id, phaseId: phases[3], position: 5, isRequired: false, prerequisiteCourseId: null },
  ];
  for (const pc of pathCourses) {
    await prisma.careerPathCourse.create({ data: { careerPathId: path.id, ...pc } });
  }

  await prisma.project.create({
    data: { careerPathId: path.id, ...PROJET_PARCOURS, minScore: 60, isRequired: true, order: 1, status: "PUBLISHED" },
  });
  console.log("✓ Parcours « Administrateur de bases de données » — 5 phases, 5 formations, projet transversal");

  /* ── 7. Jonctions écoles ─────────────────────────────────────────────── */
  const schoolCourseData = [
    { schoolId: schools["ecole-donnees-ia"], courseId: course1.id, isPrimary: true, isFeatured: true, position: 1 },
    { schoolId: schools["ecole-donnees-ia"], courseId: course2.id, isPrimary: true, isFeatured: false, position: 2 },
    { schoolId: schools["ecole-donnees-ia"], courseId: course3.id, isPrimary: true, isFeatured: false, position: 3 },
    { schoolId: schools["ecole-developpement"], courseId: course1.id, isPrimary: false, isFeatured: false, position: 1 },
    { schoolId: schools["ecole-cybersecurite"], courseId: course3.id, isPrimary: false, isFeatured: false, position: 1 },
  ];
  for (const sc of schoolCourseData) {
    await prisma.schoolCourse.upsert({
      where: { schoolId_courseId: { schoolId: sc.schoolId, courseId: sc.courseId } },
      update: { isPrimary: sc.isPrimary, isFeatured: sc.isFeatured, position: sc.position },
      create: sc,
    });
  }
  const schoolPathData = [
    { schoolId: schools["ecole-donnees-ia"], careerPathId: path.id, isPrimary: true, position: 1 },
    { schoolId: schools["ecole-cybersecurite"], careerPathId: path.id, isPrimary: false, position: 1 },
  ];
  for (const sp of schoolPathData) {
    await prisma.schoolCareerPath.upsert({
      where: { schoolId_careerPathId: { schoolId: sp.schoolId, careerPathId: sp.careerPathId } },
      update: { isPrimary: sp.isPrimary, position: sp.position },
      create: sp,
    });
  }
  console.log("✓ Jonctions écoles (formations réutilisées, jamais dupliquées)");

  /* ── 8. Démo : inscription, progression, tentative, avis, coupon ─────── */
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: apprenant.id, courseId: course1.id } },
    update: { status: "ACTIVE", origin: "DIRECT", accessType: "FREE" },
    create: {
      userId: apprenant.id,
      courseId: course1.id,
      status: "ACTIVE",
      origin: "DIRECT",
      accessType: "FREE",
      startedAt: now,
      progress: 10,
    },
  });

  const firstModule = await prisma.module.findFirstOrThrow({
    where: { courseId: course1.id },
    orderBy: { order: "asc" },
    include: { lessons: { orderBy: { order: "asc" } }, assessments: { orderBy: { order: "asc" } } },
  });
  for (const lesson of firstModule.lessons.slice(0, 2)) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: apprenant.id, lessonId: lesson.id } },
      update: {},
      create: { userId: apprenant.id, lessonId: lesson.id, enrollmentId: enrollment.id },
    });
  }
  const firstQuiz = firstModule.assessments[0];
  if (firstQuiz) {
    await prisma.assessmentAttempt.deleteMany({ where: { userId: apprenant.id, assessmentId: firstQuiz.id } });
    await prisma.assessmentAttempt.create({
      data: {
        assessmentId: firstQuiz.id,
        userId: apprenant.id,
        attemptNumber: 1,
        score: 80,
        passed: true,
        status: "PASSED",
        submittedAt: now,
        gradedAt: now,
      },
    });
  }

  await prisma.review.upsert({
    where: { userId_courseId: { userId: apprenant.id, courseId: course1.id } },
    update: { rating: 5, comment: "Formation très claire, exemples concrets.", status: "APPROVED" },
    create: {
      userId: apprenant.id,
      courseId: course1.id,
      rating: 5,
      comment: "Formation très claire, exemples concrets.",
      status: "APPROVED",
    },
  });

  await prisma.coupon.upsert({
    where: { code: "BIENVENUE10" },
    update: { discountType: "PERCENT", value: 10, active: true },
    create: { code: "BIENVENUE10", discountType: "PERCENT", value: 10, active: true },
  });
  console.log("✓ Démo : inscription Aya + progression + quiz réussi 80 % + avis 5★ + coupon BIENVENUE10");

  /* ── 8b. Cohortes, événements & annonces (§23, §24) ──────────────────── */
  const _day = 86400000;
  const _at = (d: number) => new Date(now.getTime() + d * _day);

  // Cohorte GRATUITE accompagnée sur « Fondamentaux SQL »
  const cohortFreeData = {
    name: "Cohorte SQL Fondamentaux — Rentrée",
    type: "GUIDED" as const,
    status: "OPEN" as const,
    courseId: course1.id,
    careerPathId: null as string | null,
    startDate: _at(7),
    endDate: _at(45),
    enrollmentDeadline: _at(5),
    capacity: 30,
    price: 0,
    rhythm: "6 h / semaine",
    description:
      "Une cohorte accompagnée pour maîtriser les fondamentaux SQL en groupe : sessions live hebdomadaires, entraide et formateur dédié.",
    rules: "- Assiduité aux sessions en direct\n- Rendu des exercices hebdomadaires\n- Bienveillance et entraide",
  };
  const cohortFree = await prisma.cohort.upsert({
    where: { slug: "cohorte-sql-fondamentaux" },
    update: cohortFreeData,
    create: { slug: "cohorte-sql-fondamentaux", ...cohortFreeData },
  });

  // Cohorte PAYANTE intensive sur le parcours DBA
  const cohortPaidData = {
    name: "Cohorte intensive — Administrateur BDD",
    type: "INTENSIVE" as const,
    status: "OPEN" as const,
    courseId: null as string | null,
    careerPathId: path.id,
    startDate: _at(14),
    endDate: _at(200),
    enrollmentDeadline: _at(10),
    capacity: 20,
    price: 180000,
    rhythm: "12 h / semaine",
    description:
      "Un accompagnement intensif vers le métier d'administrateur de bases de données, en cohorte, avec mentorat et soutenance finale.",
    rules: "- Engagement de 12 h/semaine\n- Participation aux revues de projet\n- Soutenance finale obligatoire",
  };
  const cohortPaid = await prisma.cohort.upsert({
    where: { slug: "cohorte-dba-intensive" },
    update: cohortPaidData,
    create: { slug: "cohorte-dba-intensive", ...cohortPaidData },
  });

  // Encadrants des deux cohortes
  for (const c of [cohortFree, cohortPaid]) {
    await prisma.cohortInstructor.upsert({
      where: { cohortId_userId: { cohortId: c.id, userId: formateur.id } },
      update: { roleLabel: "Formateur principal" },
      create: { cohortId: c.id, userId: formateur.id, roleLabel: "Formateur principal" },
    });
  }

  // Aya, membre de la cohorte gratuite (déjà inscrite à la formation course1)
  await prisma.cohortMember.upsert({
    where: { cohortId_userId: { cohortId: cohortFree.id, userId: apprenant.id } },
    update: { status: "ACTIVE" },
    create: { cohortId: cohortFree.id, userId: apprenant.id, status: "ACTIVE" },
  });

  // Événements : 1 session de cohorte à venir, 1 webinaire public à venir, 1 atelier passé (replay)
  const sessionStart = _at(8);
  const eventsData = [
    {
      slug: "session-live-sql-semaine-1",
      title: "Session live — Semaine 1 : le modèle relationnel",
      type: "VIRTUAL_CLASS" as const,
      audience: "COHORT" as const,
      status: "PUBLISHED" as const,
      provider: "GOOGLE_MEET" as const,
      meetingUrl: "https://meet.google.com/demo-access-academy",
      startAt: sessionStart,
      endAt: new Date(sessionStart.getTime() + 2 * 3600000),
      capacity: null as number | null,
      replayUrl: null as string | null,
      summary: null as string | null,
      resources: undefined as unknown,
      speakerName: null as string | null,
      cohortId: cohortFree.id,
      courseId: course1.id,
      hostId: formateur.id,
      description:
        "Première session en direct de la cohorte : tour de table, rappel du modèle relationnel et premiers SELECT commentés.",
    },
    {
      slug: "webinaire-decouverte-donnees",
      title: "Webinaire — Découvrir les métiers de la donnée",
      type: "WEBINAR" as const,
      audience: "PUBLIC" as const,
      status: "PUBLISHED" as const,
      provider: "ZOOM" as const,
      meetingUrl: "https://zoom.us/j/demo-access-academy",
      startAt: _at(3),
      endAt: null as Date | null,
      capacity: 200,
      replayUrl: null as string | null,
      summary: null as string | null,
      resources: undefined as unknown,
      speakerName: "Koffi N'Guessan",
      cohortId: null as string | null,
      courseId: null as string | null,
      hostId: formateur.id,
      description:
        "Un webinaire gratuit et ouvert à tous pour explorer les métiers de la donnée et de l'IA en Côte d'Ivoire : débouchés, compétences et parcours conseillés.",
    },
    {
      slug: "atelier-sql-replay",
      title: "Atelier — Optimiser ses requêtes SQL (replay)",
      type: "WORKSHOP" as const,
      audience: "PUBLIC" as const,
      status: "PUBLISHED" as const,
      provider: "OTHER" as const,
      meetingUrl: null as string | null,
      startAt: _at(-10),
      endAt: null as Date | null,
      capacity: null as number | null,
      replayUrl: "https://www.youtube.com/watch?v=demo",
      summary:
        "Récapitulatif de l'atelier : index, plans d'exécution et bonnes pratiques d'optimisation. Le replay et les diapositives sont disponibles ci-dessous.",
      resources: [{ title: "Diapositives de l'atelier", url: "https://example.com/slides.pdf", kind: "PDF" }] as unknown,
      speakerName: "Koffi N'Guessan",
      cohortId: null as string | null,
      courseId: null as string | null,
      hostId: formateur.id,
      description: "Atelier pratique sur l'optimisation des requêtes SQL — désormais disponible en replay pour tous.",
    },
  ];
  const eventRecs: Record<string, { id: string }> = {};
  for (const ev of eventsData) {
    const { slug, resources, ...rest } = ev;
    const data = { ...rest, ...(resources !== undefined ? { resources: resources as object } : {}) };
    const rec = await prisma.event.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    eventRecs[slug] = rec;
  }

  // Inscriptions d'Aya : au webinaire (à venir) + à l'atelier passé (présence)
  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId: eventRecs["webinaire-decouverte-donnees"].id, userId: apprenant.id } },
    update: {},
    create: { eventId: eventRecs["webinaire-decouverte-donnees"].id, userId: apprenant.id },
  });
  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId: eventRecs["atelier-sql-replay"].id, userId: apprenant.id } },
    update: { attended: true, attendedAt: _at(-10) },
    create: { eventId: eventRecs["atelier-sql-replay"].id, userId: apprenant.id, attended: true, attendedAt: _at(-10) },
  });

  // Annonces (idempotent : on repart de zéro pour ces cibles)
  await prisma.announcement.deleteMany({
    where: { OR: [{ cohortId: cohortFree.id }, { cohortId: cohortPaid.id }, { courseId: course1.id }] },
  });
  await prisma.announcement.create({
    data: {
      cohortId: cohortFree.id,
      authorId: formateur.id,
      title: "Bienvenue dans la cohorte 🎉",
      body: "Ravi de vous accueillir ! La **première session live** a lieu la semaine prochaine. Pensez à préparer votre environnement PostgreSQL avant de nous rejoindre.",
      pinned: true,
    },
  });
  await prisma.announcement.create({
    data: {
      courseId: course1.id,
      authorId: formateur.id,
      title: "Nouvelle ressource ajoutée",
      body: "Un aide-mémoire des principales commandes SQL a été ajouté aux ressources de la formation. Bon apprentissage !",
      pinned: false,
    },
  });
  console.log("✓ Cohortes (1 gratuite + 1 payante), 3 événements, inscriptions + annonces de démo");

  /* ── 8c. Communauté & modération (§25, §5.1) ─────────────────────────── */
  const demoLesson = firstModule.lessons[0];
  await prisma.discussion.deleteMany({ where: { courseId: course1.id, title: { startsWith: "[DEMO]" } } });
  if (demoLesson) await prisma.lessonComment.deleteMany({ where: { lessonId: demoLesson.id, body: { startsWith: "[DEMO]" } } });

  const demoDisc = await prisma.discussion.create({
    data: {
      courseId: course1.id,
      authorId: apprenant.id,
      title: "[DEMO] Comment bien démarrer avec SQL ?",
      body: "Bonjour à toutes et tous 👋 Je débute avec **SQL** et je me demande par quel type de requête commencer pour prendre de bonnes habitudes. Des conseils ?",
      solved: true,
      follows: { create: { userId: apprenant.id } },
      replies: {
        create: {
          authorId: formateur.id,
          body: "Excellente question ! Commencez par des `SELECT` simples sur une seule table, puis ajoutez `WHERE` et `ORDER BY`. La **lisibilité** avant la performance au début.",
          isSolution: true,
        },
      },
    },
  });
  await prisma.report.deleteMany({ where: { targetType: "DISCUSSION", targetId: demoDisc.id } });
  await prisma.report.create({
    data: {
      reporterId: formateur.id,
      targetType: "DISCUSSION",
      targetId: demoDisc.id,
      reason: "[DEMO] Vérification de la file de modération.",
      status: "PENDING",
    },
  });
  if (demoLesson) {
    const demoComment = await prisma.lessonComment.create({
      data: { lessonId: demoLesson.id, courseId: course1.id, authorId: apprenant.id, body: "[DEMO] Petit doute sur cette notion — quelqu'un peut reformuler l'exemple ?" },
    });
    await prisma.lessonComment.create({
      data: { lessonId: demoLesson.id, courseId: course1.id, authorId: formateur.id, parentId: demoComment.id, body: "[DEMO] Bien sûr : imagine une table `clients` et on filtre ceux d'Abidjan avec `WHERE ville = 'Abidjan'`." },
    });
  }
  console.log("✓ Communauté : discussion résolue + réponse, commentaires de leçon, signalement démo");

  // Empêcher « variable non utilisée » sur les comptes admin (référencés à dessein)
  void superadmin;
  void pedagogie;

  /* ── 9. Comptages de vérification ────────────────────────────────────── */
  const counts = {
    ecoles: await prisma.school.count(),
    formations: await prisma.course.count(),
    formationsPubliees: await prisma.course.count({ where: { status: "PUBLISHED" } }),
    parcours: await prisma.careerPath.count(),
    phases: await prisma.careerPathPhase.count(),
    modules: await prisma.module.count(),
    lecons: await prisma.lesson.count(),
    evaluations: await prisma.assessment.count(),
    questions: await prisma.question.count(),
    projets: await prisma.project.count(),
    competences: await prisma.skill.count(),
    courseSkills: await prisma.courseSkill.count(),
    prerequis: await prisma.coursePrerequisite.count(),
    jonctionsEcoleFormation: await prisma.schoolCourse.count(),
    jonctionsParcoursFormation: await prisma.careerPathCourse.count(),
    jonctionsEcoleParcours: await prisma.schoolCareerPath.count(),
    instructeurs: await prisma.courseInstructor.count(),
    utilisateurs: await prisma.user.count(),
    inscriptions: await prisma.enrollment.count(),
    progressionsLecon: await prisma.lessonProgress.count(),
    tentatives: await prisma.assessmentAttempt.count(),
    avis: await prisma.review.count(),
    coupons: await prisma.coupon.count(),
    cohortes: await prisma.cohort.count(),
    membresCohorte: await prisma.cohortMember.count(),
    evenements: await prisma.event.count(),
    inscriptionsEvenement: await prisma.eventRegistration.count(),
    annonces: await prisma.announcement.count(),
    discussions: await prisma.discussion.count(),
    reponsesForum: await prisma.discussionReply.count(),
    commentairesLecon: await prisma.lessonComment.count(),
    signalements: await prisma.report.count(),
  };
  console.log("\n📊 COMPTES FINAUX :", JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed échoué :", e);
  await prisma.$disconnect();
  process.exit(1);
});

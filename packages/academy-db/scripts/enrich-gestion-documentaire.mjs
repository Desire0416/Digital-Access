// Déploie les 3 devoirs et les 5 ressources téléchargeables de la formation
// « Gestion documentaire et organisation des fichiers ».
// Idempotent : reconstruit devoirs + ressources de CETTE formation à chaque exécution.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { put } from "@vercel/blob";
import { makeZip } from "./lib/minizip.mjs";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const SLUG = "gestion-documentaire-et-organisation-des-fichiers";
const PREFIX = "ressources/gestion-documentaire";

/* Le .env contient DEUX jetons Blob ; les visuels du site vivent dans le second
   store (celui que charge réellement l'application). On s'aligne dessus. */
const env = readFileSync("../../.env", "utf8");
const tokens = [...env.matchAll(/^BLOB_READ_WRITE_TOKEN=(.*)$/gm)].map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
const BLOB_TOKEN = tokens[tokens.length - 1];
if (!BLOB_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN introuvable dans .env");

const prisma = new PrismaClient({ datasourceUrl: process.env.ACADEMY_DATABASE_URL });
async function wake() {
  for (let i = 0; i < 20; i++) {
    try { await prisma.$queryRawUnsafe("SELECT 1"); return; } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
}

const content = JSON.parse(readFileSync("scripts/content-gestion-documentaire.json", "utf8"));
const csv = (k) => content.csv.find((f) => f.key === k).content;
const guide = (k) => content.guides.find((f) => f.key === k).content;

/* CSV pour Excel francophone : BOM UTF-8 (accents) + fins de ligne CRLF. */
const forExcel = (s) => "﻿" + s.replace(/\r?\n/g, "\r\n").trimEnd() + "\r\n";

const LISEZMOI = `ARBORESCENCE TYPE — ACCESS ACADEMY
Formation « Gestion documentaire et organisation des fichiers »

COMMENT UTILISER CE MODELE
1. Decompressez ce dossier a l'endroit ou vous voulez ranger vos documents
   (par exemple : Documents, ou la racine de votre Google Drive / OneDrive).
2. Renommez le dossier principal avec le nom de votre structure.
3. Adaptez les categories a VOTRE activite : supprimez celles qui ne vous
   servent pas, ajoutez les votres. Un dossier inutile est un dossier nuisible.
4. Remplacez les dossiers marques « EXEMPLE-a-renommer » par vos vrais clients
   et vos vrais projets.

LES REGLES A NE PAS OUBLIER
- 3 a 4 niveaux de profondeur au maximum.
- Les numeros en prefixe (01, 02, 03...) forcent un ordre stable : ne les retirez pas.
- Aucun dossier « Divers », « Autres » ou « Temp ». Si un fichier n'a pas de place,
  c'est qu'il manque une categorie, pas un fourre-tout.
- Pas d'espaces ni d'accents dans les noms de dossiers.
- Nommez vos fichiers : AAAA-MM-JJ_TYPE_Description_Version.extension
  Exemple : 2026-03-15_DEV_Konan-Freres_v01.pdf

Bonne organisation !
`;

/* Le lecteur n'affiche QUE `lesson.resources` — une ressource rattachée au cours
   resterait invisible. Chaque fichier est donc rattaché à la ou les leçons qui
   l'utilisent, repérées par « M<module>L<leçon> ». */
const FILES = [
  {
    name: "arborescence-type.zip",
    title: "Arborescence type — dossiers prêts à l'emploi (ZIP)",
    kind: "ZIP",
    contentType: "application/zip",
    lessons: ["M2L1", "M5L2"],
    body: () => {
      const dirs = guide("arborescence-liste")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      const root = "ARBORESCENCE-TYPE-A-RENOMMER/";
      const entries = [{ name: root, dir: true }];
      for (const d of dirs) entries.push({ name: root + d, dir: true });
      entries.push({ name: root + "LISEZ-MOI.txt", data: Buffer.from(LISEZMOI, "utf8") });
      return { buf: makeZip(entries), extra: `${dirs.length} dossiers` };
    },
  },
  {
    name: "aide-memoire-nomenclature.md",
    lessons: ["M2L2", "M5L2"],
    title: "Aide-mémoire — convention de nommage des fichiers",
    kind: "TEMPLATE",
    contentType: "text/markdown; charset=utf-8",
    body: () => ({ buf: Buffer.from(guide("aide-memoire-nomenclature"), "utf8") }),
  },
  {
    name: "grille-audit-documentaire.csv",
    lessons: ["M1L4"],
    title: "Grille d'audit documentaire (tableur)",
    kind: "SHEET",
    contentType: "text/csv; charset=utf-8",
    body: () => ({ buf: Buffer.from(forExcel(csv("grille-audit")), "utf8") }),
  },
  {
    name: "calendrier-conservation-documents.csv",
    lessons: ["M4L4"],
    title: "Calendrier de conservation des documents (tableur)",
    kind: "SHEET",
    contentType: "text/csv; charset=utf-8",
    body: () => ({ buf: Buffer.from(forExcel(csv("calendrier-conservation")), "utf8") }),
  },
  {
    name: "checklist-sauvegarde-3-2-1.csv",
    lessons: ["M4L2"],
    title: "Checklist de sauvegarde 3-2-1 (tableur)",
    kind: "SHEET",
    contentType: "text/csv; charset=utf-8",
    body: () => ({ buf: Buffer.from(forExcel(csv("checklist-3-2-1")), "utf8") }),
  },
];

async function main() {
  await wake();
  const course = await prisma.course.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      modules: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, lessons: { orderBy: { order: "asc" }, select: { id: true, order: true } } },
      },
    },
  });
  if (!course) throw new Error("Formation introuvable");
  const moduleByOrder = new Map(course.modules.map((m) => [m.order, m.id]));
  const lessonByKey = new Map();
  for (const m of course.modules) for (const l of m.lessons) lessonByKey.set(`M${m.order}L${l.order}`, l.id);

  /* ── 1) Devoirs (ASSIGNMENT) ─────────────────────────────────────────── */
  await prisma.assessment.deleteMany({ where: { courseId: course.id, type: "ASSIGNMENT" } });
  const devoirs = [];
  for (const a of content.assignments) {
    const moduleId = moduleByOrder.get(a.moduleOrder);
    if (!moduleId) { console.warn("Module introuvable:", a.moduleOrder); continue; }
    await prisma.assessment.create({
      data: {
        courseId: course.id,
        moduleId,
        title: a.title,
        description: a.description,
        type: "ASSIGNMENT",
        passingScore: 70,
        attemptsAllowed: 0,
        weight: 2,
        isRequired: true,
        order: 100 + a.moduleOrder,
        status: "PUBLISHED",
      },
    });
    devoirs.push(`M${a.moduleOrder} · ${a.title}`);
  }

  /* ── 2) Ressources téléchargeables, rattachées aux leçons ────────────── */
  const lessonIds = [...lessonByKey.values()];
  await prisma.resource.deleteMany({ where: { OR: [{ courseId: course.id }, { lessonId: { in: lessonIds } }] } });
  const uploaded = [];
  const perLesson = new Map();
  for (const f of FILES) {
    const { buf, extra } = f.body();
    const res = await put(`${PREFIX}/${f.name}`, buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN,
      contentType: f.contentType,
    });
    for (const key of f.lessons) {
      const lessonId = lessonByKey.get(key);
      if (!lessonId) { console.warn("Leçon introuvable :", key); continue; }
      const order = perLesson.get(key) ?? 0;
      perLesson.set(key, order + 1);
      await prisma.resource.create({ data: { lessonId, title: f.title, kind: f.kind, url: res.url, order } });
    }
    uploaded.push(`${f.name} — ${(buf.length / 1024).toFixed(1)} Ko${extra ? ` (${extra})` : ""} → ${f.lessons.join(", ")}`);
  }

  console.log("=== DEVOIRS CRÉÉS ===");
  devoirs.forEach((d) => console.log("  •", d));
  console.log("\n=== RESSOURCES EN LIGNE ===");
  uploaded.forEach((u) => console.log("  •", u));
  const total = await prisma.resource.count({ where: { lessonId: { in: lessonIds } } });
  console.log(`\nressources de leçon : ${total} | orphelines (cours) : ${await prisma.resource.count({ where: { courseId: course.id } })}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

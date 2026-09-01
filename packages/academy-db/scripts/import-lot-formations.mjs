// Importe un LOT de formations : fiches, modules, leçons (avec blocs interactifs),
// quiz, devoirs et ressources CSV téléchargeables.
// Idempotent : reconstruit intégralement le curriculum des formations visées.
//   node --env-file=../../.env scripts/import-lot-formations.mjs <fichier.json> [--publier]
// Refuse l'import si UN SEUL bloc interactif contient du JSON invalide.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { put } from "@vercel/blob";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const PUBLIER = process.argv.includes("--publier");
const SRC = process.argv.find((a) => a.endsWith(".json"));
if (!SRC) { console.error("Usage : node scripts/import-lot-formations.mjs <fichier.json> [--publier]"); process.exit(1); }
const PREFIX = "ressources/formations";

/* Le .env contient deux jetons Blob ; l'application sert depuis le second. */
const env = readFileSync("../../.env", "utf8");
const tokens = [...env.matchAll(/^BLOB_READ_WRITE_TOKEN=(.*)$/gm)].map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
const BLOB_TOKEN = tokens[tokens.length - 1];

const prisma = new PrismaClient({ datasourceUrl: process.env.ACADEMY_DATABASE_URL });
async function wake() {
  for (let i = 0; i < 20; i++) {
    try { await prisma.$queryRawUnsafe("SELECT 1"); return; } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
}

const data = JSON.parse(readFileSync(SRC, "utf8"));
const BLOCS = new Set(["da-etapes", "da-quiz", "da-comparatif", "da-checklist", "da-onglets"]);

/* ── Contrôle : TOUS les blocs da-* doivent contenir du JSON valide ──────────
   Un bloc invalide ne s'afficherait pas côté apprenant : on refuse d'importer. */
function verifierBlocs() {
  const erreurs = [];
  let total = 0;
  const parLot = {};
  for (const lot of data.ecrits) {
    for (const m of lot.modules ?? []) {
      for (const l of m.lessons ?? []) {
        const re = /```(da-[a-z]+)\n([\s\S]*?)```/g;
        let match;
        while ((match = re.exec(l.content || "")) !== null) {
          const [, lang, body] = match;
          total += 1;
          parLot[lang] = (parLot[lang] || 0) + 1;
          if (!BLOCS.has(lang)) { erreurs.push(`${lot.slug} M${m.order} « ${l.title} » : bloc inconnu ${lang}`); continue; }
          try { JSON.parse(body); } catch (e) {
            erreurs.push(`${lot.slug} M${m.order} « ${l.title} » : ${lang} JSON invalide (${e.message.slice(0, 60)})`);
          }
        }
      }
    }
  }
  return { total, parLot, erreurs };
}

const LESSON_TYPES = new Set(["TEXT", "WORKSHOP", "LAB", "CASE_STUDY"]);
const forExcel = (s) => "﻿" + s.replace(/\r?\n/g, "\r\n").trimEnd() + "\r\n";

async function main() {
  await wake();

  const ctrl = verifierBlocs();
  console.log(`Blocs interactifs : ${ctrl.total}`, JSON.stringify(ctrl.parLot));
  if (ctrl.erreurs.length) {
    console.error(`\n❌ ${ctrl.erreurs.length} bloc(s) invalide(s) — import annulé :`);
    ctrl.erreurs.slice(0, 20).forEach((e) => console.error("   -", e));
    process.exit(1);
  }
  console.log("✅ tous les blocs sont valides\n");

  // Regroupe les modules écrits par formation.
  const parCours = new Map();
  for (const lot of data.ecrits) {
    if (!parCours.has(lot.slug)) parCours.set(lot.slug, []);
    parCours.get(lot.slug).push(...(lot.modules ?? []));
  }

  const rapport = [];
  for (const fiche of data.fiches) {
    const course = await prisma.course.findUnique({ where: { slug: fiche.slug }, select: { id: true, title: true } });
    if (!course) { console.warn("Formation introuvable :", fiche.slug); continue; }

    // 1) Fiche commerciale.
    await prisma.course.update({
      where: { id: course.id },
      data: {
        subtitle: fiche.subtitle.slice(0, 240),
        description: fiche.description,
        objectives: fiche.objectives,
        targetAudience: fiche.targetAudience,
        prerequisitesText: fiche.prerequisitesText,
        tools: fiche.tools,
        unlockMode: "SEQUENTIAL",
        ...(PUBLIER ? { status: "PUBLISHED", publishedAt: new Date() } : {}),
      },
    });

    // 2) Curriculum reconstruit à neuf.
    await prisma.module.deleteMany({ where: { courseId: course.id } });
    await prisma.assessment.deleteMany({ where: { courseId: course.id } });

    const modules = (parCours.get(fiche.slug) ?? []).sort((a, b) => a.order - b.order);
    const lessonIdByKey = new Map(); // "M<order>L<index>" -> lessonId
    let nLessons = 0, nQ = 0, premierApercu = false;

    for (const m of modules) {
      const mod = await prisma.module.create({
        data: {
          courseId: course.id, title: `Module ${m.order} — ${m.title}`, description: m.description,
          objectives: m.objectives ?? [], order: m.order, status: "PUBLISHED",
        },
        select: { id: true },
      });

      let li = 0;
      for (const l of m.lessons ?? []) {
        li += 1;
        const apercu = !premierApercu;
        premierApercu = true;
        const lesson = await prisma.lesson.create({
          data: {
            moduleId: mod.id, title: l.title,
            lessonType: LESSON_TYPES.has(l.type) ? l.type : "TEXT",
            content: l.content, durationMinutes: l.durationMinutes ?? null,
            order: li, isPreview: apercu, isRequired: true, status: "PUBLISHED",
          },
          select: { id: true },
        });
        lessonIdByKey.set(`M${m.order}L${li}`, lesson.id);
        nLessons += 1;
      }

      // Quiz du module.
      const quiz = await prisma.assessment.create({
        data: {
          courseId: course.id, moduleId: mod.id, title: `Quiz — Module ${m.order} : ${m.title}`,
          type: "QUIZ", passingScore: 70, attemptsAllowed: 0, weight: 1,
          isRequired: true, order: m.order, status: "PUBLISHED",
        },
        select: { id: true },
      });
      let qo = 0;
      for (const q of m.quiz?.questions ?? []) {
        qo += 1;
        await prisma.question.create({
          data: {
            assessmentId: quiz.id, type: "SINGLE_CHOICE", question: q.question,
            options: q.options, correctAnswer: q.bonne, explanation: q.explication,
            points: 1, order: qo,
          },
        });
        nQ += 1;
      }
    }

    // 3) Devoirs.
    const devoirs = (data.evals?.devoirs ?? []).filter((d) => d.slug === fiche.slug);
    for (const d of devoirs) {
      const mod = await prisma.module.findFirst({
        where: { courseId: course.id, order: d.moduleOrder }, select: { id: true },
      });
      if (!mod) continue;
      await prisma.assessment.create({
        data: {
          courseId: course.id, moduleId: mod.id, title: d.title, description: d.description,
          type: "ASSIGNMENT", passingScore: 70, attemptsAllowed: 0, weight: 2,
          isRequired: true, order: 100 + d.moduleOrder, status: "PUBLISHED",
        },
      });
    }

    // 4) Ressources CSV, rattachées à la leçon concernée (le lecteur n'affiche
    //    que lesson.resources : une ressource de cours resterait invisible).
    const ress = (data.evals?.ressources ?? []).filter((r) => r.slug === fiche.slug);
    let nRes = 0;
    for (const r of ress) {
      const lessonId = lessonIdByKey.get(`M${r.moduleOrder}L${r.lessonIndex}`);
      if (!lessonId) { console.warn("Leçon cible introuvable pour", r.filename); continue; }
      const blob = await put(`${PREFIX}/${fiche.slug}/${r.filename}`, Buffer.from(forExcel(r.csv), "utf8"), {
        access: "public", addRandomSuffix: false, allowOverwrite: true,
        token: BLOB_TOKEN, contentType: "text/csv; charset=utf-8",
      });
      const n = await prisma.resource.count({ where: { lessonId } });
      await prisma.resource.create({
        data: { lessonId, title: r.title, kind: "SHEET", url: blob.url, order: n },
      });
      nRes += 1;
    }

    const chars = modules.reduce((a, m) => a + (m.lessons ?? []).reduce((b, l) => b + (l.content || "").length, 0), 0);
    rapport.push({
      formation: course.title, modules: modules.length, lecons: nLessons,
      caracteres: `${Math.round(chars / 1000)}k`, questions: nQ, devoirs: devoirs.length, ressources: nRes,
    });
  }

  console.log(PUBLIER ? "=== IMPORTÉ ET PUBLIÉ ===" : "=== IMPORTÉ (brouillon) ===");
  console.table(rapport);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });

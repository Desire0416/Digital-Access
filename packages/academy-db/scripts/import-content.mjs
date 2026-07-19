// Importe le contenu généré d'un lot de formations dans la base dédiée Academy :
// fiche + modules → leçons (markdown) → quiz notés. Idempotent (reconstruit le
// curriculum des formations concernées). Publie les formations.
//   node --env-file=../../.env scripts/import-content.mjs prisma/content/wave2-formations.json
// (le chemin du JSON est relatif à la racine du package ; défaut = lot pilote)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const DIRECT = process.env.ACADEMY_DATABASE_URL_UNPOOLED || process.env.ACADEMY_DATABASE_URL;
const POOLED = process.env.ACADEMY_DATABASE_URL;
if (!DIRECT) {
  console.error("❌ ACADEMY_DATABASE_URL(_UNPOOLED) manquante (charger la racine .env).");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const rel = process.argv[2] || "prisma/content/pilot-formations.json";
const formations = JSON.parse(readFileSync(join(__dirname, "..", rel), "utf8"));

const prisma = new PrismaClient({ datasourceUrl: DIRECT });

async function wake() {
  const p = new PrismaClient({ datasourceUrl: POOLED });
  for (let i = 0; i < 20; i++) {
    try { await p.$queryRawUnsafe("SELECT 1"); break; } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  await p.$disconnect();
}

const LESSON_TYPES = new Set(["TEXT", "CASE_STUDY", "WORKSHOP", "LAB", "VIDEO", "PDF", "AUDIO", "PRESENTATION", "INTERACTIVE", "DEMO", "EXTERNAL_LINK", "VIRTUAL_CLASS"]);

/** Encode correctAnswer selon le type (SINGLE=index, MULTIPLE=index[], TRUE_FALSE=bool), ou null si invalide. */
function encodeQuestion(q) {
  const base = { type: q.type, question: String(q.question || "").trim(), explanation: q.explanation ? String(q.explanation) : null, points: Math.min(3, Math.max(1, q.points || 1)) };
  if (!base.question) return null;
  if (q.type === "SINGLE_CHOICE") {
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    if (options.length < 2 || typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= options.length) return null;
    return { ...base, options, correctAnswer: q.correctIndex };
  }
  if (q.type === "MULTIPLE_CHOICE") {
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    const idx = Array.isArray(q.correctIndexes) ? q.correctIndexes.filter((i) => typeof i === "number" && i >= 0 && i < options.length) : [];
    if (options.length < 2 || idx.length < 1) return null;
    return { ...base, options, correctAnswer: [...new Set(idx)].sort((a, b) => a - b) };
  }
  if (q.type === "TRUE_FALSE") {
    if (typeof q.correctTrue !== "boolean") return null;
    return { ...base, options: ["Vrai", "Faux"], correctAnswer: q.correctTrue };
  }
  return null;
}

async function importFormation(f) {
  const course = await prisma.course.findUnique({ where: { slug: f.slug }, select: { id: true, title: true } });
  if (!course) return { slug: f.slug, skipped: "introuvable" };

  await prisma.module.deleteMany({ where: { courseId: course.id } }); // cascade leçons/assessments/questions
  await prisma.assessment.deleteMany({ where: { courseId: course.id } });

  const fiche = f.fiche || {};
  await prisma.course.update({
    where: { id: course.id },
    data: {
      ...(fiche.subtitle ? { subtitle: String(fiche.subtitle).slice(0, 240) } : {}),
      ...(fiche.description ? { description: String(fiche.description) } : {}),
      ...(Array.isArray(fiche.objectives) ? { objectives: fiche.objectives.map(String) } : {}),
      ...(Array.isArray(fiche.targetAudience) ? { targetAudience: fiche.targetAudience.map(String) } : {}),
      ...(Array.isArray(fiche.prerequisitesText) ? { prerequisitesText: fiche.prerequisitesText.map(String) } : {}),
      ...(Array.isArray(fiche.tools) ? { tools: fiche.tools.map(String) } : {}),
      unlockMode: "SEQUENTIAL",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  let nLessons = 0, nQuiz = 0, nQuestions = 0, firstPreviewSet = false, mOrder = 0;
  for (const mod of f.modules || []) {
    mOrder += 1;
    const createdModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: String(mod.title).slice(0, 200),
        description: mod.description ? String(mod.description) : null,
        objectives: Array.isArray(mod.objectives) ? mod.objectives.map(String) : [],
        order: mOrder,
        status: "PUBLISHED",
      },
    });
    let lOrder = 0;
    for (const les of mod.lessons || []) {
      lOrder += 1;
      const type = LESSON_TYPES.has(les.type) ? les.type : "TEXT";
      const isPreview = !firstPreviewSet;
      if (isPreview) firstPreviewSet = true;
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: String(les.title).slice(0, 200),
          lessonType: type,
          content: les.content ? String(les.content) : null,
          durationMinutes: typeof les.durationMinutes === "number" ? les.durationMinutes : null,
          order: lOrder,
          isPreview,
          isRequired: true,
          status: "PUBLISHED",
        },
      });
      nLessons += 1;
    }
    const quiz = mod.quiz;
    if (quiz && Array.isArray(quiz.questions)) {
      const encoded = quiz.questions.map(encodeQuestion).filter(Boolean);
      if (encoded.length) {
        const assessment = await prisma.assessment.create({
          data: {
            courseId: course.id,
            moduleId: createdModule.id,
            title: String(quiz.title || `Quiz — ${mod.title}`).slice(0, 200),
            type: "QUIZ",
            passingScore: 60,
            attemptsAllowed: 0,
            weight: 1,
            isRequired: true,
            order: mOrder,
            status: "PUBLISHED",
          },
        });
        let qOrder = 0;
        for (const q of encoded) {
          qOrder += 1;
          await prisma.question.create({
            data: { assessmentId: assessment.id, type: q.type, question: q.question, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation, points: q.points, order: qOrder },
          });
          nQuestions += 1;
        }
        nQuiz += 1;
      }
    }
  }
  return { slug: f.slug, title: course.title, modules: (f.modules || []).length, lessons: nLessons, quiz: nQuiz, questions: nQuestions };
}

await wake();
const report = [];
for (const f of formations) {
  try { report.push(await importFormation(f)); }
  catch (e) { report.push({ slug: f.slug, error: e.message }); }
}
console.log(`=== IMPORT TERMINÉ (${rel}) ===`);
report.forEach((r) => console.log(JSON.stringify(r)));
await prisma.$disconnect();

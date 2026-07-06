/**
 * Seed additif — Catalogue No-Code & IA (20 formations, 8 catégories).
 * Additif et idempotent : ne purge QUE ses 20 cours (par slug) ; les cours
 * existants et les catégories déjà présentes ne sont pas modifiés.
 *
 * Contenu (leçons markdown + quiz) généré depuis le document catalogue,
 * assemblé dans `nocode-courses.json`. Lancer :
 *   npx tsx packages/db/prisma/seed-nocode.ts
 */
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { PrismaClient, type ChapterType, type CourseLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Charge le .env de la racine du monorepo, quel que soit le CWD.
config({ path: path.resolve(__dirname, "../../../.env") });

function addParams(u: string | undefined, params: Record<string, string>): string | undefined {
  if (!u) return u;
  const add: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (!new RegExp(`[?&]${k}=`).test(u)) add.push(`${k}=${v}`);
  }
  if (!add.length) return u;
  return u + (u.includes("?") ? "&" : "?") + add.join("&");
}

// Réveil via le POOLER — seul capable de réveiller un compute Neon en veille (autosuspend).
const wake = new PrismaClient({
  datasourceUrl: addParams(process.env.DATABASE_URL, { connect_timeout: "30" }),
});
// Écritures via connexion DIRECTE, un seul lien sérialisé : connection_limit=1 est
// honoré en direct (pas sur le pooler pgBouncer) → aucune contention de pool (P2024).
const prisma = new PrismaClient({
  datasourceUrl: addParams(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL, {
    connect_timeout: "30",
    connection_limit: "1",
    pool_timeout: "30",
  }),
});

/* Vidéos de démonstration (réutilisées en attendant les vraies vidéos, comme le seed principal). */
const V = [
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://www.youtube.com/watch?v=Sklc_fQBmcs",
];

/* ── 8 catégories du catalogue (create-only : n'écrase pas une catégorie existante) ── */
const CATEGORIES = [
  { slug: "sites-web-sans-code", name: "Créer des sites web sans code", icon: "globe", color: "#2B5CC6", description: "Lancez des sites web professionnels sans écrire une ligne de code." },
  { slug: "applications-sans-code", name: "Créer des applications sans code", icon: "smartphone", color: "#5B3FA8", description: "Construisez de vraies applications web et mobiles en no-code." },
  { slug: "e-commerce-boutiques", name: "E-commerce & boutiques en ligne", icon: "shopping-bag", color: "#059669", description: "Créez et gérez votre boutique en ligne, paiements Mobile Money inclus." },
  { slug: "ia-automatisation", name: "Intelligence Artificielle & automatisation", icon: "sparkles", color: "#7C3AED", description: "Exploitez l'IA générative et automatisez votre activité sans code." },
  { slug: "design-creation-visuelle", name: "Design & création visuelle", icon: "palette", color: "#DB2777", description: "Concevez des visuels et des interfaces d'un niveau professionnel." },
  { slug: "marketing-digital", name: "Marketing digital", icon: "megaphone", color: "#00BCD4", description: "Attirez et convertissez des clients en ligne." },
  { slug: "productivite-organisation", name: "Productivité & organisation", icon: "list-checks", color: "#F59E0B", description: "Organisez votre travail, vos projets et gagnez en efficacité." },
  { slug: "securite-vie-numerique", name: "Sécurité & vie numérique", icon: "shield", color: "#1E8FE1", description: "Protégez vos comptes, vos données et votre vie numérique." },
];

/* ── Forme des données générées ── */
interface GenQuestion { question: string; options: string[]; correctAnswers: number[]; explanation: string }
interface GenChapter {
  title: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  isPreview: boolean;
  videoDurationSec: number;
  content: string;
  quiz?: { passingScore?: number; questions: GenQuestion[] } | null;
}
interface GenCourse {
  meta: {
    slug: string; title: string; categorySlug: string;
    level: CourseLevel; accessModel: "FREE" | "PAID" | "FREEMIUM";
    price: number; durationMinutes: number;
  };
  data: {
    slug: string; subtitle: string; objectives: string[];
    description: string; prerequisites: string[]; freemiumNote?: string;
    modules: { title: string; chapters: GenChapter[] }[];
  };
}

const coursesData: GenCourse[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "nocode-courses.json"), "utf-8"),
);

/** Neon peut être en veille (autosuspend) — on réveille la base via le pooler. */
async function connectWithRetry(tries = 12) {
  for (let i = 1; i <= tries; i++) {
    try {
      await wake.$queryRaw`SELECT 1`;
      if (i > 1) console.log(`  ↳ base réveillée (tentative ${i}).`);
      return;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e).split("\n")[0];
      console.log(`  … connexion ${i}/${tries} échouée (${msg}) — nouvel essai dans 4 s…`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw new Error("Base de données injoignable après plusieurs tentatives (Neon en pause ?).");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant (vérifiez le .env racine).");
  }
  console.log(`▶ Seed No-Code : ${coursesData.length} formations, ${CATEGORIES.length} catégories.`);
  await connectWithRetry();

  /* 1. Catégories (create-only — ne touche pas aux existantes) */
  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {}, // ne pas écraser une catégorie déjà présente (ex : marketing-digital)
      create: { name: c.name, slug: c.slug, icon: c.icon, color: c.color, description: c.description },
    });
    categoryIds[c.slug] = cat.id;
  }
  console.log("  ↳ catégories prêtes.");

  /* 2. Instructeur officiel « Access Academy » (compte de contenu, non destiné au login) */
  const instructor = await prisma.user.upsert({
    where: { email: "academy@digitalaccess.ci" },
    update: { name: "Access Academy" },
    create: {
      name: "Access Academy",
      email: "academy@digitalaccess.ci",
      password: await bcrypt.hash(randomUUID(), 12),
      roles: ["INSTRUCTOR"],
      bio: "Compte officiel des formations produites par Access Academy — Digital Access.",
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log("  ↳ instructeur « Access Academy » prêt.");

  /* 3. Purge ciblée des 20 cours (par slug) — certificats d'abord (FK Restrict) */
  const slugs = coursesData.map((c) => c.meta.slug);
  await prisma.certificate.deleteMany({ where: { course: { slug: { in: slugs } } } });
  const purged = await prisma.course.deleteMany({ where: { slug: { in: slugs } } });
  if (purged.count > 0) console.log(`  ↳ ${purged.count} ancien(s) cours homonyme(s) purgé(s).`);

  /* 4. Création des cours + modules + chapitres + quiz */
  let created = 0;
  const courseIds: string[] = [];
  for (const { meta, data } of coursesData) {
    const catId = categoryIds[meta.categorySlug];
    if (!catId) {
      console.warn(`  ⚠ catégorie inconnue pour ${meta.slug} : ${meta.categorySlug} — ignoré.`);
      continue;
    }
    const description = data.freemiumNote
      ? `${data.description}\n\n${data.freemiumNote}`
      : data.description;

    let videoIdx = 0;
    const course = await prisma.course.create({
      data: {
        title: meta.title,
        slug: meta.slug,
        subtitle: data.subtitle,
        description,
        price: meta.price,
        isFree: meta.accessModel === "FREE",
        level: meta.level,
        status: "PUBLISHED",
        rating: 0,
        ratingCount: 0,
        enrollmentCount: 0,
        durationMinutes: meta.durationMinutes,
        objectives: data.objectives,
        prerequisites: data.prerequisites,
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: catId,
        modules: {
          create: data.modules.map((m, mi) => ({
            title: m.title,
            position: mi + 1,
            chapters: {
              create: m.chapters.map((ch, ci) => {
                const isQuiz = ch.type === "QUIZ";
                const isVideo = ch.type === "VIDEO";
                return {
                  title: ch.title,
                  type: ch.type as ChapterType,
                  position: ci + 1,
                  isPreview: ch.isPreview ?? false,
                  content: ch.content && ch.content.trim() ? ch.content : null,
                  videoUrl: isVideo ? V[videoIdx++ % V.length] : null,
                  videoDuration: isVideo ? ch.videoDurationSec || 0 : 0,
                  ...(isQuiz && ch.quiz
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
                };
              }),
            },
          })),
        },
      },
      select: { id: true },
    });

    courseIds.push(course.id);
    created++;
    console.log(`  ✓ ${meta.title}`);
  }

  /* 5. Salons de chat (S11) — en une seule requête groupée */
  if (courseIds.length) {
    await prisma.chatRoom.createMany({ data: courseIds.map((id) => ({ courseId: id })) });
    console.log(`  ↳ ${courseIds.length} salons de chat créés.`);
  }

  console.log(`\n✅ ${created}/${coursesData.length} formations créées et publiées.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed No-Code échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    await wake.$disconnect().catch(() => {});
  });

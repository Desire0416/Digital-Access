"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, Prisma } from "@da/db/client";
import { realUser } from "@da/auth/guards";
import { DRAFT_LEVELS, DRAFT_LESSON_TYPES, DRAFT_QUESTION_TYPES } from "./import/types";

/* ══════════════════════════════════════════════════════════════════════════
   Création d'une formation (CareerPath complet) à partir d'un brouillon
   d'import revu par l'admin. Sécurité : revérifie le VRAI admin (realUser,
   jamais l'identité impersonée). Validation Zod : le brouillon vient du client,
   il n'est jamais fait confiance tel quel. Création atomique via un create
   imbriqué (parcours → modules → leçons → quiz → questions). Ne remplace jamais
   une formation existante : le slug est rendu unique.
   ══════════════════════════════════════════════════════════════════════════ */

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];

async function requireAdminUser() {
  const me = await realUser();
  if (!me) return null;
  return me.roles.some((r) => ADMIN_ROLES.includes(r)) ? me : null;
}

export type ImportResult =
  | { ok: true; slug: string; careerPathId: string; counts: { modules: number; lessons: number; quizzes: number; questions: number } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ── Schéma de validation du brouillon ──────────────────────────────────── */
const questionSchema = z
  .object({
    question: z.string().trim().min(3).max(500),
    type: z.enum(DRAFT_QUESTION_TYPES as [string, ...string[]]),
    options: z.array(z.string().trim().max(300)).max(6).default([]),
    correctIndexes: z.array(z.coerce.number().int().min(0).max(20)).default([]),
    explanation: z.string().trim().max(500).optional().or(z.literal("")),
  })
  // Garantit une question TOUJOURS répondable et correctement corrigée (le player
  // ne note que par indices ; une réponse hors plage rendrait la question insoluble).
  .superRefine((q, ctx) => {
    if (q.type === "TRUE_FALSE") {
      if (q.correctIndexes.length !== 1 || (q.correctIndexes[0] !== 0 && q.correctIndexes[0] !== 1))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["correctIndexes"], message: "Vrai/Faux : la bonne réponse doit être Vrai (0) ou Faux (1)." });
      return;
    }
    if (q.options.length < 2)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Au moins 2 options sont requises." });
    if (q.correctIndexes.length === 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["correctIndexes"], message: "Indiquez au moins une bonne réponse." });
    if (q.correctIndexes.some((i) => i >= q.options.length))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["correctIndexes"], message: "Un indice de bonne réponse dépasse le nombre d'options." });
    if (q.type === "SINGLE_CHOICE" && q.correctIndexes.length > 1)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["correctIndexes"], message: "Choix unique : une seule bonne réponse." });
  });
const quizSchema = z.object({
  title: z.string().trim().max(200).default("Quiz de validation"),
  passingScore: z.coerce.number().int().min(0).max(100).default(60),
  questions: z.array(questionSchema).max(20).default([]),
});
const lessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(DRAFT_LESSON_TYPES as [string, ...string[]]),
  content: z.string().trim().min(1).max(20_000),
  estimatedDuration: z.coerce.number().int().min(0).max(1000).nullable().optional(),
});
const moduleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(400).optional().or(z.literal("")),
  objectives: z.array(z.string().trim().max(300)).max(12).default([]),
  estimatedDuration: z.coerce.number().int().min(0).max(10_000).nullable().optional(),
  lessons: z.array(lessonSchema).min(1).max(15),
  quiz: quizSchema.nullable().optional(),
});
const slugField = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (kebab-case).").max(70);
const draftSchema = z.object({
  path: z.object({
    title: z.string().trim().min(3).max(160),
    slug: slugField,
    level: z.enum(DRAFT_LEVELS as [string, ...string[]]),
    targetJob: z.string().trim().max(160).default(""),
    shortDescription: z.string().trim().min(3).max(500),
    longDescription: z.string().trim().max(2000).default(""),
    duration: z.string().trim().max(60).default(""),
    estimatedHours: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
    price: z.coerce.number().int().min(0).max(100_000_000).default(0),
    prerequisites: z.array(z.string().trim().max(300)).max(12).default([]),
    objectives: z.array(z.string().trim().max(300)).max(15).default([]),
    outcomes: z.array(z.string().trim().max(300)).max(12).default([]),
    tools: z.array(z.string().trim().max(80)).max(20).default([]),
    certificateTitle: z.string().trim().max(200).default(""),
    schoolSlug: slugField,
    schoolName: z.string().trim().min(2).max(120),
    featured: z.boolean().default(false),
    publish: z.boolean().default(false),
  }),
  modules: z.array(moduleSchema).min(1).max(30),
});

/* ── Encodage de la bonne réponse selon le type (cf. submitQuiz) ─────────── */
function encodeAnswer(type: string, correctIndexes: number[], optionCount: number): Prisma.InputJsonValue {
  const bound = type === "TRUE_FALSE" ? 2 : optionCount;
  const valid = correctIndexes.filter((n) => n >= 0 && n < Math.max(bound, 2));
  // Défense en profondeur : le schéma Zod garantit déjà une bonne réponse valide.
  // On refuse d'inventer silencieusement une clé (jamais de « option 0 » par défaut).
  if (valid.length === 0) throw new Error("Question sans bonne réponse valide.");
  if (type === "TRUE_FALSE") return valid[0] === 0; // true = Vrai
  if (type === "MULTIPLE_CHOICE") return [...new Set(valid)];
  return valid[0]; // SINGLE_CHOICE
}

const DEFAULT_MINUTES: Record<string, number> = { TEXT: 25, EXERCISE: 40, RESOURCE: 15, VIDEO: 12 };

async function uniqueCareerPathSlug(base: string): Promise<string> {
  let slug = base || "formation";
  let i = 2;
  // Boucle bornée : évite d'écraser une formation existante.
  while (await prisma.careerPath.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${i++}`;
    if (i > 50) { slug = `${base}-${randomUUID().slice(0, 6)}`; break; }
  }
  return slug;
}

export async function createFormationFromImport(input: unknown): Promise<ImportResult> {
  const admin = await requireAdminUser();
  if (!admin) return { ok: false, error: "Action réservée à l'administration." };

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors };
  }
  const d = parsed.data;

  try {
    // École rattachée de façon ATOMIQUE (connectOrCreate) : réutilise l'existante
    // par slug, sinon la crée DANS la même écriture que le parcours — aucune école
    // orpheline si la création échoue.
    const schoolCount = await prisma.school.count();
    const schoolInput = {
      connectOrCreate: {
        where: { slug: d.path.schoolSlug },
        create: {
          name: d.path.schoolName,
          slug: d.path.schoolSlug,
          shortDescription: d.path.schoolName,
          icon: "graduation-cap",
          color: "#5b3fa8",
          order: 50 + schoolCount,
          status: "PUBLISHED" as const,
        },
      },
    };

    const status = d.path.publish ? "PUBLISHED" : "DRAFT";
    const prefix = randomUUID().slice(0, 8); // préfixe unique pour les slugs de leçons

    let lessonCount = 0;
    let quizCount = 0;
    let questionCount = 0;

    const modulesCreate: Prisma.ModuleCreateWithoutCareerPathInput[] = d.modules.map((m, mi) => {
      const lessons: Prisma.LessonCreateWithoutModuleInput[] = m.lessons.map((l, li) => {
        lessonCount += 1;
        return {
          title: l.title,
          slug: `${prefix}-${mi}-${li}`,
          content: l.content,
          lessonType: l.type as never,
          estimatedDuration: l.estimatedDuration ?? DEFAULT_MINUTES[l.type] ?? 20,
          order: li,
          isPreview: mi === 0 && li === 0, // 1re leçon du 1er module = aperçu gratuit
          status: "PUBLISHED",
        };
      });

      if (m.quiz && m.quiz.questions.length > 0) {
        quizCount += 1;
        questionCount += m.quiz.questions.length;
        lessonCount += 1;
        lessons.push({
          title: "Quiz de validation",
          slug: `${prefix}-${mi}-q`,
          content: "Validez vos acquis de ce module.",
          lessonType: "QUIZ" as never,
          estimatedDuration: 10,
          order: m.lessons.length,
          status: "PUBLISHED",
          quizzes: {
            create: [
              {
                title: m.quiz.title || `Quiz — ${m.title}`,
                description: "Quiz de validation du module.",
                passingScore: m.quiz.passingScore,
                attemptsAllowed: 2,
                status: "PUBLISHED",
                questions: {
                  create: m.quiz.questions.map((q, qi) => {
                    const options = q.type === "TRUE_FALSE" ? ["Vrai", "Faux"] : q.options;
                    return {
                      question: q.question,
                      type: q.type as never,
                      options: options as unknown as Prisma.InputJsonValue,
                      correctAnswer: encodeAnswer(q.type, q.correctIndexes, options.length),
                      explanation: q.explanation ? String(q.explanation) : null,
                      points: 1,
                      order: qi,
                    };
                  }),
                },
              },
            ],
          },
        });
      }

      return {
        title: m.title,
        description: m.summary ? String(m.summary) : null,
        order: mi,
        objectives: m.objectives,
        estimatedDuration: m.estimatedDuration ?? null,
        status: "PUBLISHED",
        lessons: { create: lessons },
      };
    });

    let slug = await uniqueCareerPathSlug(d.path.slug);
    let created: { id: string; slug: string } | null = null;
    // Retry borné : si le slug est raflé par un import concurrent (TOCTOU), on en
    // régénère un et on rejoue — jamais d'écrasement, jamais d'échec spurieux.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        created = await prisma.careerPath.create({
          data: {
            school: schoolInput,
            title: d.path.title,
            slug,
            shortDescription: d.path.shortDescription,
            longDescription: d.path.longDescription || null,
            targetJob: d.path.targetJob || "Professionnel du numérique",
            level: d.path.level as never,
            duration: d.path.duration || null,
            estimatedHours: d.path.estimatedHours ?? null,
            price: d.path.price,
            prerequisites: d.path.prerequisites,
            objectives: d.path.objectives,
            outcomes: d.path.outcomes,
            tools: d.path.tools,
            certificateTitle: d.path.certificateTitle || null,
            featured: d.path.featured,
            status: status as never,
            modules: { create: modulesCreate },
          },
          select: { id: true, slug: true },
        });
        break;
      } catch (e) {
        const conflict = typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
        if (conflict && attempt < 3) {
          slug = `${d.path.slug}-${randomUUID().slice(0, 6)}`;
          continue;
        }
        throw e;
      }
    }
    if (!created) throw new Error("Création du parcours impossible après plusieurs tentatives.");

    revalidatePath("/admin/import-formation");
    revalidatePath("/admin/parcours");
    revalidatePath("/career-paths");
    revalidatePath(`/career-paths/${created.slug}`);

    return {
      ok: true,
      slug: created.slug,
      careerPathId: created.id,
      counts: { modules: d.modules.length, lessons: lessonCount, quizzes: quizCount, questions: questionCount },
    };
  } catch (e) {
    console.error("[academy] createFormationFromImport:", e);
    return { ok: false, error: "Impossible de créer la formation. Réessayez." };
  }
}

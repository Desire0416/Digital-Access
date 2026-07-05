"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { currentUser, hasRole } from "@da/auth/guards";

/* ────────────────────────────── Helpers ────────────────────────────────────── */

type Session = { id: string; isAdmin: boolean; isInstructor: boolean };

async function requireStudio(): Promise<Session | null> {
  const user = await currentUser();
  if (!user) return null;
  const isAdmin = hasRole(user, "ADMIN", "SUPER_ADMIN");
  const isInstructor = hasRole(user, "INSTRUCTOR") || isAdmin;
  if (!isInstructor) return null;
  return { id: user.id, isAdmin, isInstructor };
}

async function requireAdmin(): Promise<Session | null> {
  const user = await currentUser();
  if (!user || !hasRole(user, "ADMIN", "SUPER_ADMIN")) return null;
  return { id: user.id, isAdmin: true, isInstructor: true };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // supprime les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "cours";
  let slug = root;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.course.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

/** Vérifie que l'utilisateur possède le cours (ou est admin). Renvoie {id, slug, status} ou null. */
async function ownedCourse(session: Session, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, slug: true, status: true, instructorId: true },
  });
  if (!course) return null;
  if (course.instructorId !== session.id && !session.isAdmin) return null;
  return course;
}

/** Vérifie la propriété via un moduleId. */
async function ownedModule(session: Session, moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, course: { select: { instructorId: true, slug: true } } },
  });
  if (!mod) return null;
  if (mod.course.instructorId !== session.id && !session.isAdmin) return null;
  return { id: mod.id, courseId: mod.courseId, courseSlug: mod.course.slug };
}

/** Vérifie la propriété via un chapterId. */
async function ownedChapter(session: Session, chapterId: string) {
  const ch = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      moduleId: true,
      module: { select: { courseId: true, course: { select: { instructorId: true, slug: true } } } },
    },
  });
  if (!ch) return null;
  if (ch.module.course.instructorId !== session.id && !session.isAdmin) return null;
  return { id: ch.id, moduleId: ch.moduleId, courseId: ch.module.courseId, courseSlug: ch.module.course.slug };
}

function revalidateCourse(id: string, slug?: string) {
  revalidatePath("/studio");
  revalidatePath(`/studio/courses/${id}/edit`);
  if (slug) {
    revalidatePath(`/courses/${slug}`);
    revalidatePath("/courses");
  }
}

export type Result<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const DENIED = { ok: false as const, error: "Action non autorisée." };

/* ─────────────────────────── Création de cours ─────────────────────────────── */

const createSchema = z.object({
  title: z.string().trim().min(4, "Le titre doit contenir au moins 4 caractères.").max(120),
  subtitle: z.string().trim().max(160).optional().default(""),
  categoryId: z.string().min(1, "Choisissez une catégorie."),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

export async function createCourse(
  input: z.input<typeof createSchema>,
): Promise<Result<{ courseId: string }>> {
  const session = await requireStudio();
  if (!session) return DENIED;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors };
  }
  const d = parsed.data;

  try {
    const category = await prisma.category.findUnique({
      where: { id: d.categoryId },
      select: { id: true },
    });
    if (!category) return { ok: false, error: "Catégorie introuvable." };

    const slug = await uniqueSlug(d.title);
    const course = await prisma.course.create({
      data: {
        title: d.title,
        slug,
        subtitle: d.subtitle || null,
        description: "",
        level: d.level,
        language: "fr",
        status: "DRAFT",
        price: 0,
        isFree: true,
        instructorId: session.id,
        categoryId: d.categoryId,
        modules: {
          create: [{ title: "Introduction", position: 1 }],
        },
      },
      select: { id: true },
    });
    revalidatePath("/studio");
    return { ok: true, courseId: course.id };
  } catch (err) {
    console.error("[studio] createCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────────────── Infos générales ──────────────────────────────── */

const infoSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(4).max(120),
  subtitle: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(6000).optional().default(""),
  categoryId: z.string().min(1),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  language: z.string().max(20).optional().default("fr"),
  isFree: z.boolean(),
  price: z.number().int().min(0).max(10_000_000),
  coverImage: z.string().max(500).optional().nullable(),
  objectives: z.array(z.string().trim().max(200)).max(12).optional().default([]),
  prerequisites: z.array(z.string().trim().max(200)).max(12).optional().default([]),
});

export async function updateCourseInfo(
  input: z.input<typeof infoSchema>,
): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const course = await ownedCourse(session, d.courseId);
  if (!course) return DENIED;

  try {
    await prisma.course.update({
      where: { id: d.courseId },
      data: {
        title: d.title,
        subtitle: d.subtitle || null,
        description: d.description,
        categoryId: d.categoryId,
        level: d.level,
        language: d.language || "fr",
        isFree: d.isFree,
        price: d.isFree ? 0 : d.price,
        coverImage: d.coverImage || null,
        objectives: (d.objectives ?? []).filter(Boolean),
        prerequisites: (d.prerequisites ?? []).filter(Boolean),
      },
    });
    revalidateCourse(d.courseId, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] updateCourseInfo:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function deleteCourse(courseId: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const course = await ownedCourse(session, courseId);
  if (!course) return DENIED;
  try {
    await prisma.course.update({ where: { id: courseId }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
    revalidatePath("/studio");
    return { ok: true };
  } catch (err) {
    console.error("[studio] deleteCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────────────────── Modules ───────────────────────────────────── */

export async function createModule(courseId: string, title: string): Promise<Result<{ moduleId: string }>> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const course = await ownedCourse(session, courseId);
  if (!course) return DENIED;
  const clean = z.string().trim().min(1).max(120).safeParse(title);
  if (!clean.success) return { ok: false, error: "Titre de module invalide." };

  try {
    const max = await prisma.module.aggregate({ where: { courseId }, _max: { position: true } });
    const mod = await prisma.module.create({
      data: { courseId, title: clean.data, position: (max._max.position ?? 0) + 1 },
      select: { id: true },
    });
    revalidateCourse(courseId, course.slug);
    return { ok: true, moduleId: mod.id };
  } catch (err) {
    console.error("[studio] createModule:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function updateModule(moduleId: string, title: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedModule(session, moduleId);
  if (!owned) return DENIED;
  const clean = z.string().trim().min(1).max(120).safeParse(title);
  if (!clean.success) return { ok: false, error: "Titre invalide." };
  try {
    await prisma.module.update({ where: { id: moduleId }, data: { title: clean.data } });
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] updateModule:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function deleteModule(moduleId: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedModule(session, moduleId);
  if (!owned) return DENIED;
  try {
    await prisma.module.delete({ where: { id: moduleId } });
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] deleteModule:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function reorderModules(courseId: string, orderedIds: string[]): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const course = await ownedCourse(session, courseId);
  if (!course) return DENIED;
  try {
    const mods = await prisma.module.findMany({ where: { courseId }, select: { id: true } });
    const owned = new Set(mods.map((m) => m.id));
    if (!orderedIds.every((id) => owned.has(id)) || orderedIds.length !== owned.size) {
      return { ok: false, error: "Liste de modules invalide." };
    }
    await prisma.$transaction(
      orderedIds.map((id, i) =>
        prisma.module.update({ where: { id }, data: { position: i + 1 } }),
      ),
    );
    revalidateCourse(courseId, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] reorderModules:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────────────────── Chapitres ─────────────────────────────────── */

const chapterSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  type: z.enum(["VIDEO", "TEXT", "QUIZ", "EXERCISE", "ASSIGNMENT"]),
  content: z.string().max(50_000).optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
  videoDuration: z.number().int().min(0).max(100_000).optional().default(0),
  isPreview: z.boolean().optional().default(false),
  resources: z
    .array(z.object({ label: z.string().trim().max(120), url: z.string().trim().max(500) }))
    .max(12)
    .optional()
    .default([]),
});

export async function createChapter(
  moduleId: string,
  type: "VIDEO" | "TEXT" | "QUIZ" | "EXERCISE" | "ASSIGNMENT" = "VIDEO",
): Promise<Result<{ chapterId: string }>> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedModule(session, moduleId);
  if (!owned) return DENIED;
  try {
    const max = await prisma.chapter.aggregate({ where: { moduleId }, _max: { position: true } });
    const labels: Record<string, string> = {
      VIDEO: "Nouvelle vidéo",
      TEXT: "Nouveau chapitre",
      QUIZ: "Nouveau quiz",
      EXERCISE: "Nouvel exercice",
      ASSIGNMENT: "Nouveau projet",
    };
    const chapter = await prisma.chapter.create({
      data: {
        moduleId,
        title: labels[type] ?? "Nouveau chapitre",
        type,
        position: (max._max.position ?? 0) + 1,
        resources: [],
        ...(type === "QUIZ" ? { quiz: { create: { passingScore: 70 } } } : {}),
      },
      select: { id: true },
    });
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true, chapterId: chapter.id };
  } catch (err) {
    console.error("[studio] createChapter:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function updateChapter(input: z.input<typeof chapterSchema>): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données de chapitre invalides." };
  const d = parsed.data;
  const owned = await ownedChapter(session, d.chapterId);
  if (!owned) return DENIED;
  try {
    await prisma.chapter.update({
      where: { id: d.chapterId },
      data: {
        title: d.title,
        type: d.type,
        content: d.content || null,
        videoUrl: d.videoUrl || null,
        videoDuration: d.videoDuration ?? 0,
        isPreview: d.isPreview ?? false,
        resources: (d.resources ?? []).filter((r) => r.label && r.url),
      },
    });
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] updateChapter:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function deleteChapter(chapterId: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedChapter(session, chapterId);
  if (!owned) return DENIED;
  try {
    await prisma.chapter.delete({ where: { id: chapterId } });
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] deleteChapter:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function reorderChapters(moduleId: string, orderedIds: string[]): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedModule(session, moduleId);
  if (!owned) return DENIED;
  try {
    const chapters = await prisma.chapter.findMany({ where: { moduleId }, select: { id: true } });
    const set = new Set(chapters.map((c) => c.id));
    if (!orderedIds.every((id) => set.has(id)) || orderedIds.length !== set.size) {
      return { ok: false, error: "Liste de chapitres invalide." };
    }
    await prisma.$transaction(
      orderedIds.map((id, i) => prisma.chapter.update({ where: { id }, data: { position: i + 1 } })),
    );
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] reorderChapters:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ──────────────────────────────── Quiz ─────────────────────────────────────── */

const quizSchema = z.object({
  chapterId: z.string().min(1),
  passingScore: z.number().int().min(1).max(100),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(500),
        options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
        correctAnswers: z.array(z.number().int().min(0)).min(1),
        explanation: z.string().trim().max(600).optional().default(""),
      }),
    )
    .min(1, "Ajoutez au moins une question.")
    .max(30),
});

export async function saveQuiz(input: z.input<typeof quizSchema>): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Quiz invalide." };
  }
  const d = parsed.data;
  // Validation métier : chaque bonne réponse doit être un index d'option valide.
  for (const q of d.questions) {
    if (q.correctAnswers.some((i) => i >= q.options.length)) {
      return { ok: false, error: "Une bonne réponse pointe vers une option inexistante." };
    }
  }
  const owned = await ownedChapter(session, d.chapterId);
  if (!owned) return DENIED;

  try {
    const existing = await prisma.quiz.findUnique({
      where: { chapterId: d.chapterId },
      select: { id: true },
    });
    const quizId =
      existing?.id ??
      (await prisma.quiz.create({ data: { chapterId: d.chapterId, passingScore: d.passingScore }, select: { id: true } })).id;

    await prisma.$transaction([
      prisma.quiz.update({ where: { id: quizId }, data: { passingScore: d.passingScore } }),
      prisma.quizQuestion.deleteMany({ where: { quizId } }),
      prisma.quizQuestion.createMany({
        data: d.questions.map((q, i) => ({
          quizId,
          question: q.question,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation || null,
          position: i + 1,
        })),
      }),
      // Un chapitre portant un quiz est de type QUIZ.
      prisma.chapter.update({ where: { id: d.chapterId }, data: { type: "QUIZ" } }),
    ]);
    revalidateCourse(owned.courseId, owned.courseSlug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] saveQuiz:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────────── Workflow de publication ───────────────────────────── */

function estimateDuration(chapters: { type: string; videoDuration: number }[]): number {
  let seconds = 0;
  for (const c of chapters) {
    if (c.type === "VIDEO") seconds += c.videoDuration || 300;
    else if (c.type === "QUIZ") seconds += 300;
    else seconds += 480; // texte / exercice / projet
  }
  return Math.max(1, Math.round(seconds / 60));
}

export async function submitForReview(courseId: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const course = await ownedCourse(session, courseId);
  if (!course) return DENIED;
  if (course.status !== "DRAFT") {
    return { ok: false, error: "Seul un brouillon peut être soumis à validation." };
  }

  try {
    const full = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        modules: { select: { chapters: { select: { id: true } } } },
      },
    });
    const chapterCount = full?.modules.reduce((n, m) => n + m.chapters.length, 0) ?? 0;
    if (!full || full.title.trim().length < 4 || full.description.trim().length < 30) {
      return { ok: false, error: "Complétez le titre et une description (30 caractères min.) avant de soumettre." };
    }
    if (chapterCount < 1) {
      return { ok: false, error: "Ajoutez au moins un chapitre avant de soumettre." };
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { status: "REVIEW", reviewNote: null },
    });

    // Notifier les admins.
    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] }, deletedAt: null },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "SYSTEM" as const,
          title: "Cours à valider",
          message: `« ${full.title} » a été soumis pour publication.`,
          link: "/admin/courses",
        })),
      });
    }
    revalidateCourse(courseId, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] submitForReview:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function approveCourse(courseId: string): Promise<Result> {
  const session = await requireAdmin();
  if (!session) return DENIED;
  try {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        instructorId: true,
        modules: { select: { chapters: { select: { type: true, videoDuration: true } } } },
      },
    });
    if (!course || (course.status !== "REVIEW" && course.status !== "DRAFT")) {
      return { ok: false, error: "Ce cours ne peut pas être publié." };
    }
    const chapters = course.modules.flatMap((m) => m.chapters);
    await prisma.$transaction([
      prisma.course.update({
        where: { id: courseId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          reviewNote: null,
          durationMinutes: estimateDuration(chapters),
        },
      }),
      prisma.notification.create({
        data: {
          userId: course.instructorId,
          type: "SYSTEM",
          title: "Cours publié 🎉",
          message: `Votre cours « ${course.title} » est maintenant en ligne.`,
          link: `/courses/${course.slug}`,
        },
      }),
    ]);
    revalidatePath("/admin/courses");
    revalidateCourse(courseId, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] approveCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

const rejectSchema = z.object({ courseId: z.string().min(1), reason: z.string().trim().max(400).optional() });

export async function rejectCourse(input: { courseId: string; reason?: string }): Promise<Result> {
  const session = await requireAdmin();
  if (!session) return DENIED;
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  try {
    const course = await prisma.course.findFirst({
      where: { id: parsed.data.courseId, deletedAt: null },
      select: { id: true, slug: true, title: true, status: true, instructorId: true },
    });
    if (!course || course.status !== "REVIEW") {
      return { ok: false, error: "Ce cours n'est pas en attente de validation." };
    }
    await prisma.$transaction([
      prisma.course.update({
        where: { id: course.id },
        data: { status: "DRAFT", reviewNote: parsed.data.reason ?? null },
      }),
      prisma.notification.create({
        data: {
          userId: course.instructorId,
          type: "SYSTEM",
          title: "Cours à revoir",
          message: `« ${course.title} » nécessite des modifications avant publication.${parsed.data.reason ? ` Motif : ${parsed.data.reason}` : ""}`,
          link: `/studio/courses/${course.id}/edit`,
        },
      }),
    ]);
    revalidatePath("/admin/courses");
    revalidateCourse(course.id, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] rejectCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

export async function unpublishCourse(courseId: string): Promise<Result> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const course = await ownedCourse(session, courseId);
  if (!course) return DENIED;
  try {
    await prisma.course.update({ where: { id: courseId }, data: { status: "DRAFT" } });
    revalidatePath("/admin/courses");
    revalidateCourse(courseId, course.slug);
    return { ok: true };
  } catch (err) {
    console.error("[studio] unpublishCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

/* ─────────────────────────── Duplication (AC99) ────────────────────────────── */

export async function duplicateCourse(courseId: string): Promise<Result<{ courseId: string }>> {
  const session = await requireStudio();
  if (!session) return DENIED;
  const owned = await ownedCourse(session, courseId);
  if (!owned) return DENIED;
  try {
    const src = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true, subtitle: true, description: true, coverImage: true, price: true,
        isFree: true, level: true, language: true, categoryId: true, objectives: true,
        prerequisites: true,
        modules: {
          orderBy: { position: "asc" },
          select: {
            title: true, position: true,
            chapters: {
              orderBy: { position: "asc" },
              select: {
                title: true, type: true, content: true, videoUrl: true, videoDuration: true,
                isPreview: true, position: true, resources: true,
                quiz: {
                  select: {
                    passingScore: true, maxAttempts: true,
                    questions: {
                      orderBy: { position: "asc" },
                      select: { question: true, options: true, correctAnswers: true, explanation: true, position: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!src) return { ok: false, error: "Cours introuvable." };

    const slug = await uniqueSlug(`${src.title} copie`);
    const copy = await prisma.course.create({
      data: {
        title: `${src.title} (copie)`,
        slug,
        subtitle: src.subtitle,
        description: src.description,
        coverImage: src.coverImage,
        price: src.price,
        isFree: src.isFree,
        level: src.level,
        language: src.language,
        status: "DRAFT",
        categoryId: src.categoryId,
        objectives: src.objectives,
        prerequisites: src.prerequisites,
        instructorId: session.id,
        modules: {
          create: src.modules.map((m) => ({
            title: m.title,
            position: m.position,
            chapters: {
              create: m.chapters.map((c) => ({
                title: c.title,
                type: c.type,
                content: c.content,
                videoUrl: c.videoUrl,
                videoDuration: c.videoDuration,
                isPreview: c.isPreview,
                position: c.position,
                resources: c.resources ?? [],
                ...(c.quiz
                  ? {
                      quiz: {
                        create: {
                          passingScore: c.quiz.passingScore,
                          maxAttempts: c.quiz.maxAttempts,
                          questions: {
                            create: c.quiz.questions.map((q) => ({
                              question: q.question,
                              options: q.options,
                              correctAnswers: q.correctAnswers,
                              explanation: q.explanation,
                              position: q.position,
                            })),
                          },
                        },
                      },
                    }
                  : {}),
              })),
            },
          })),
        },
      },
      select: { id: true },
    });
    revalidatePath("/studio");
    return { ok: true, courseId: copy.id };
  } catch (err) {
    console.error("[studio] duplicateCourse:", err);
    return { ok: false, error: "Une erreur est survenue." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { onCourseCompleted } from "./certificates";
import { createNotification } from "./notifications";

/* ────────────────────────────── Helpers ────────────────────────────────────── */

/** Jour UTC (yyyy-mm-dd) d'une date. */
function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Met à jour streak + XP + lastActiveAt de l'utilisateur. */
async function awardActivity(userId: string, xpGained: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastActiveAt: true },
  });
  if (!user) return;

  const now = new Date();
  const today = utcDay(now);
  const last = user.lastActiveAt ? utcDay(user.lastActiveAt) : null;
  const yesterday = utcDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const streak =
    last === today ? user.streak : last === yesterday ? user.streak + 1 : 1;

  await prisma.user.update({
    where: { id: userId },
    data: { streak, lastActiveAt: now, xp: { increment: xpGained } },
  });
}

/** Recalcule le pourcentage de progression d'une inscription. */
async function recomputeProgress(enrollmentId: string): Promise<number> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      courseId: true,
      progresses: { where: { completed: true }, select: { id: true } },
    },
  });
  if (!enrollment) return 0;

  const totalChapters = await prisma.chapter.count({
    where: { module: { courseId: enrollment.courseId } },
  });
  const pct =
    totalChapters === 0
      ? 0
      : Math.round((enrollment.progresses.length / totalChapters) * 100);

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: pct,
      completedAt: pct >= 100 ? new Date() : null,
    },
  });
  return pct;
}

/** Retrouve l'inscription de l'utilisateur pour le cours contenant ce chapitre. */
async function enrollmentForChapter(userId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, module: { select: { courseId: true, course: { select: { slug: true } } } } },
  });
  if (!chapter) return null;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: chapter.module.courseId } },
    select: { id: true },
  });
  return enrollment
    ? {
        enrollmentId: enrollment.id,
        courseId: chapter.module.courseId,
        courseSlug: chapter.module.course.slug,
      }
    : null;
}

function revalidateCourse(slug: string): void {
  revalidatePath(`/courses/${slug}`, "layout");
  revalidatePath("/dashboard");
}

/* ─────────────────────────── Inscription à un cours ────────────────────────── */

export type EnrollResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; reason?: "auth" | "paid" | "unknown" };

export async function enrollInCourse(courseSlug: string): Promise<EnrollResult> {
  const parsed = z.string().min(1).safeParse(courseSlug);
  if (!parsed.success) return { ok: false, error: "Cours introuvable." };

  const user = await currentUser();
  if (!user) {
    return {
      ok: false,
      error: "Connectez-vous pour vous inscrire à ce cours.",
      reason: "auth",
    };
  }

  try {
    const course = await prisma.course.findFirst({
      where: { slug: parsed.data, status: "PUBLISHED", deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        isFree: true,
        price: true,
        modules: {
          orderBy: { position: "asc" },
          take: 1,
          select: {
            chapters: { orderBy: { position: "asc" }, take: 1, select: { id: true } },
          },
        },
      },
    });
    if (!course) return { ok: false, error: "Cours introuvable." };

    if (!course.isFree && course.price > 0) {
      // Paiement Mobile Money : Sprint 7.
      return {
        ok: false,
        error:
          "Le paiement Mobile Money arrive très bientôt. En attendant, découvrez les chapitres en aperçu gratuit.",
        reason: "paid",
      };
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.enrollment.create({
        data: { userId: user.id, courseId: course.id },
      });
      await prisma.course.update({
        where: { id: course.id },
        data: { enrollmentCount: { increment: 1 } },
      });
      await createNotification({
        userId: user.id,
        type: "COURSE_ENROLLED",
        title: "Inscription confirmée 🎉",
        message: `Vous êtes inscrit au cours « ${course.title} ». Bon apprentissage !`,
        link: `/courses/${course.slug}`,
        data: { courseSlug: course.slug, courseTitle: course.title },
      });
    }

    const firstChapterId = course.modules[0]?.chapters[0]?.id;
    revalidateCourse(course.slug);
    return {
      ok: true,
      redirect: firstChapterId
        ? `/courses/${course.slug}/learn/${firstChapterId}`
        : `/courses/${course.slug}`,
    };
  } catch (err) {
    console.error("[academy] enrollInCourse:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez.", reason: "unknown" };
  }
}

/* ───────────────────────── Complétion d'un chapitre ────────────────────────── */

export type CompleteResult =
  | {
      ok: true;
      courseProgress: number;
      xpGained: number;
      streak: number;
      certificateCode?: string;
    }
  | { ok: false; error: string };

export async function markChapterComplete(chapterId: string): Promise<CompleteResult> {
  const parsed = z.string().min(1).safeParse(chapterId);
  if (!parsed.success) return { ok: false, error: "Chapitre invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };

  try {
    const ctx = await enrollmentForChapter(user.id, parsed.data);
    if (!ctx) return { ok: false, error: "Vous n'êtes pas inscrit à ce cours." };

    const existing = await prisma.progress.findUnique({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: ctx.enrollmentId,
          chapterId: parsed.data,
        },
      },
      select: { completed: true },
    });
    const alreadyDone = existing?.completed ?? false;

    await prisma.progress.upsert({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: ctx.enrollmentId,
          chapterId: parsed.data,
        },
      },
      update: { completed: true, completedAt: new Date() },
      create: {
        enrollmentId: ctx.enrollmentId,
        chapterId: parsed.data,
        completed: true,
        completedAt: new Date(),
      },
    });

    const courseProgress = await recomputeProgress(ctx.enrollmentId);
    const xpGained = alreadyDone ? 0 : 10;
    if (!alreadyDone) await awardActivity(user.id, xpGained);

    // Cours terminé → émission (idempotente) du certificat.
    let certificateCode: string | undefined;
    if (courseProgress >= 100) {
      const issued = await onCourseCompleted(user.id, ctx.courseId);
      if (issued) certificateCode = issued.code;
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { streak: true },
    });

    revalidateCourse(ctx.courseSlug);
    return {
      ok: true,
      courseProgress,
      xpGained,
      streak: refreshed?.streak ?? 0,
      certificateCode,
    };
  } catch (err) {
    console.error("[academy] markChapterComplete:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ────────────────────────────── Soumission de quiz ─────────────────────────── */

const submitQuizSchema = z.object({
  chapterId: z.string().min(1),
  /** answers[i] = indices sélectionnés pour la question i (ordre par position) */
  answers: z.array(z.array(z.number().int().min(0))),
});

export type QuizSubmitResult =
  | {
      ok: true;
      score: number; // %
      passed: boolean;
      correctCount: number;
      total: number;
      courseProgress: number;
      xpGained: number;
      certificateCode?: string;
    }
  | { ok: false; error: string };

export async function submitQuiz(input: {
  chapterId: string;
  answers: number[][];
}): Promise<QuizSubmitResult> {
  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Réponses invalides." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };

  try {
    const ctx = await enrollmentForChapter(user.id, parsed.data.chapterId);
    if (!ctx) return { ok: false, error: "Vous n'êtes pas inscrit à ce cours." };

    const quiz = await prisma.quiz.findUnique({
      where: { chapterId: parsed.data.chapterId },
      select: {
        passingScore: true,
        questions: {
          orderBy: { position: "asc" },
          select: { correctAnswers: true },
        },
      },
    });
    if (!quiz) return { ok: false, error: "Quiz introuvable." };

    // Notation autoritaire côté serveur.
    const total = quiz.questions.length;
    let correctCount = 0;
    quiz.questions.forEach((q, i) => {
      const given = [...(parsed.data.answers[i] ?? [])].sort((a, b) => a - b);
      const expected = [...q.correctAnswers].sort((a, b) => a - b);
      if (
        given.length === expected.length &&
        given.every((v, j) => v === expected[j])
      ) {
        correctCount++;
      }
    });
    const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const passed = score >= quiz.passingScore;

    const existing = await prisma.progress.findUnique({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: ctx.enrollmentId,
          chapterId: parsed.data.chapterId,
        },
      },
      select: { completed: true, quizScore: true },
    });
    const bestScore = Math.max(score, existing?.quizScore ?? 0);
    const wasCompleted = existing?.completed ?? false;
    const nowCompleted = wasCompleted || passed;

    await prisma.progress.upsert({
      where: {
        enrollmentId_chapterId: {
          enrollmentId: ctx.enrollmentId,
          chapterId: parsed.data.chapterId,
        },
      },
      update: {
        quizScore: bestScore,
        ...(nowCompleted && !wasCompleted
          ? { completed: true, completedAt: new Date() }
          : {}),
      },
      create: {
        enrollmentId: ctx.enrollmentId,
        chapterId: parsed.data.chapterId,
        quizScore: bestScore,
        completed: passed,
        completedAt: passed ? new Date() : null,
      },
    });

    const courseProgress = await recomputeProgress(ctx.enrollmentId);
    const xpGained = passed && !wasCompleted ? 25 : 0;
    if (xpGained > 0) await awardActivity(user.id, xpGained);

    // Cours terminé (le quiz était le dernier chapitre) → certificat.
    let certificateCode: string | undefined;
    if (courseProgress >= 100) {
      const issued = await onCourseCompleted(user.id, ctx.courseId);
      if (issued) certificateCode = issued.code;
    }

    revalidateCourse(ctx.courseSlug);
    return {
      ok: true,
      score,
      passed,
      correctCount,
      total,
      courseProgress,
      xpGained,
      certificateCode,
    };
  } catch (err) {
    console.error("[academy] submitQuiz:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

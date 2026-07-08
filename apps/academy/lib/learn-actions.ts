"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { createNotification } from "./notifications";
import { issueCertificateIfEligible } from "./certificates";
import type { QuizSubmissionResult } from "./learn-types";

/* ══════════════════════════════════════════════════════════════════════════
   Mutations de l'espace apprenant. Sécurité niveau ligne : chaque action lit
   l'apprenant courant et n'agit que sur ses propres données. Le scoring des
   quiz est fait ENTIÈREMENT côté serveur (les bonnes réponses ne transitent
   jamais par le client avant soumission).
   ══════════════════════════════════════════════════════════════════════════ */

export type LearnResult =
  | { ok: true; [k: string]: unknown }
  | { ok: false; error: string };

/* ─── Inscription (gratuite pour l'instant ; le paiement arrive en phase 7) ── */

export async function enrollInPath(slug: string): Promise<LearnResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté pour vous inscrire." };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre email avant de vous inscrire." };

  try {
    const path = await prisma.careerPath.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          take: 1,
          select: { lessons: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" }, take: 1, select: { id: true } } },
        },
      },
    });
    if (!path) return { ok: false, error: "Parcours introuvable." };

    const existing = await prisma.enrollment.findFirst({
      where: { learnerId: user.id, careerPathId: path.id },
      select: { id: true },
    });

    // Upsert atomique : la contrainte @@unique(learnerId, careerPathId) évite tout
    // doublon en cas de double-clic / requêtes concurrentes.
    await prisma.enrollment.upsert({
      where: { learnerId_careerPathId: { learnerId: user.id, careerPathId: path.id } },
      update: {},
      create: { learnerId: user.id, careerPathId: path.id, status: "ACTIVE", accessType: "FREE", progress: 0 },
    });

    if (!existing) {
      await createNotification({
        userId: user.id,
        type: "COURSE_ENROLLED",
        title: "Inscription confirmée",
        message: `Vous êtes inscrit au parcours « ${path.title} ». Bon apprentissage !`,
        link: `/apprendre/${slug}`,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mes-cours");
    const firstLessonId = path.modules[0]?.lessons[0]?.id ?? null;
    return { ok: true, slug, firstLessonId, alreadyEnrolled: Boolean(existing) };
  } catch (e) {
    console.error("[academy] enrollInPath:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ─── Complétion d'une leçon (recalcule la progression de l'inscription) ───── */

/**
 * Marque une leçon terminée pour un apprenant inscrit et recalcule le % du parcours.
 * Renvoie null si l'apprenant n'est pas inscrit au parcours de la leçon.
 */
async function completeLesson(
  userId: string,
  lessonId: string,
): Promise<{ progress: number; courseCompleted: boolean; courseTitle: string; slug: string } | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { careerPath: { select: { id: true, slug: true, title: true } } } } },
  });
  const path = lesson?.module.careerPath;
  if (!path) return null;

  const enrollment = await prisma.enrollment.findFirst({
    where: { learnerId: userId, careerPathId: path.id },
    select: { id: true, status: true },
  });
  if (!enrollment) return null;

  await prisma.lessonProgress.upsert({
    where: { learnerId_lessonId: { learnerId: userId, lessonId } },
    update: {},
    create: { learnerId: userId, lessonId, enrollmentId: enrollment.id },
  });

  // Recalcul de la progression = leçons terminées / total du parcours.
  const modules = await prisma.module.findMany({
    where: { careerPathId: path.id, status: "PUBLISHED" },
    select: { lessons: { where: { status: "PUBLISHED" }, select: { id: true } } },
  });
  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const total = allLessonIds.length || 1;
  const completedCount = await prisma.lessonProgress.count({
    where: { learnerId: userId, lessonId: { in: allLessonIds } },
  });
  const progress = Math.min(100, Math.round((completedCount / total) * 100));
  const courseCompleted = progress >= 100;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress,
      ...(courseCompleted && enrollment.status !== "COMPLETED"
        ? { status: "COMPLETED", completedAt: new Date() }
        : {}),
    },
  });

  if (courseCompleted && enrollment.status !== "COMPLETED") {
    await createNotification({
      userId,
      type: "PROGRESS_MILESTONE",
      title: "Parcours terminé 🎉",
      message: `Bravo, vous avez terminé « ${path.title} ». Votre certificat sera disponible après validation de vos projets.`,
      link: "/dashboard/certificats",
    });
  }
  // Le certificat s'émet quand TOUTES les exigences sont réunies (leçons + projets) ;
  // c'est peut-être la complétion des leçons qui débloque le dernier verrou.
  if (courseCompleted) await issueCertificateIfEligible(userId, path.id);

  return { progress, courseCompleted, courseTitle: path.title, slug: path.slug };
}

export async function markLessonComplete(lessonId: string): Promise<LearnResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  try {
    const res = await completeLesson(user.id, lessonId);
    if (!res) return { ok: false, error: "Inscrivez-vous au parcours pour suivre votre progression." };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mes-cours");
    return { ok: true, progress: res.progress, courseCompleted: res.courseCompleted };
  } catch (e) {
    console.error("[academy] markLessonComplete:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ─── Soumission de quiz (scoring 100 % serveur) ───────────────────────────── */

/** Indices attendus pour une question, normalisés depuis correctAnswer (Json). */
function expectedIndexes(type: string, correctAnswer: unknown): number[] {
  if (type === "MULTIPLE_CHOICE") {
    return Array.isArray(correctAnswer) ? correctAnswer.map((n) => Number(n)) : [];
  }
  if (type === "TRUE_FALSE") {
    if (typeof correctAnswer === "boolean") return [correctAnswer ? 0 : 1]; // 0 = Vrai, 1 = Faux
    return [Number(correctAnswer)];
  }
  // SINGLE_CHOICE
  return [Number(correctAnswer)];
}

/** Indices choisis par l'apprenant, normalisés. */
function chosenIndexes(answer: unknown): number[] {
  if (Array.isArray(answer)) return answer.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  if (typeof answer === "number") return [answer];
  if (typeof answer === "boolean") return [answer ? 0 : 1];
  return [];
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export async function submitQuiz(
  quizId: string,
  answers: Record<string, number | number[] | boolean>,
): Promise<{ ok: true; result: QuizSubmissionResult } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };
  // Borne la charge utile (anti-abus : answers est persisté).
  if (!quizId || typeof quizId !== "string" || Object.keys(answers).length > 200) {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        passingScore: true,
        lessonId: true,
        attemptsAllowed: true,
        lesson: { select: { isPreview: true, module: { select: { careerPath: { select: { id: true } } } } } },
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, type: true, correctAnswer: true, explanation: true, points: true },
        },
      },
    });
    if (!quiz || quiz.questions.length === 0) return { ok: false, error: "Quiz introuvable." };

    // Contrôle d'accès : la correction (et donc les bonnes réponses) n'est
    // renvoyée qu'aux inscrits — ou si la leçon est en accès libre (preview).
    const careerPathId = quiz.lesson?.module.careerPath?.id ?? null;
    if (careerPathId) {
      const canAccess =
        Boolean(quiz.lesson?.isPreview) ||
        Boolean(
          await prisma.enrollment.findFirst({
            where: { learnerId: user.id, careerPathId },
            select: { id: true },
          }),
        );
      if (!canAccess) return { ok: false, error: "Inscrivez-vous au parcours pour passer ce quiz." };
    }

    // Limite de tentatives (0 = illimité).
    if (quiz.attemptsAllowed > 0) {
      const used = await prisma.quizAttempt.count({ where: { quizId: quiz.id, learnerId: user.id } });
      if (used >= quiz.attemptsAllowed) {
        return { ok: false, error: "Vous avez atteint le nombre maximal de tentatives pour ce quiz." };
      }
    }

    let awarded = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const perQuestion: QuizSubmissionResult["perQuestion"] = [];

    for (const q of quiz.questions) {
      const expected = expectedIndexes(q.type, q.correctAnswer);
      const chosen = chosenIndexes(answers[q.id]);
      const isCorrect = sameSet(expected, chosen);
      totalPoints += q.points;
      if (isCorrect) {
        awarded += q.points;
        correctCount += 1;
      }
      perQuestion.push({
        questionId: q.id,
        correct: isCorrect,
        correctAnswer: expected,
        explanation: q.explanation,
      });
    }

    const score = Math.round((awarded / (totalPoints || 1)) * 100);
    const passed = score >= quiz.passingScore;

    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        learnerId: user.id,
        score,
        passed,
        answers: answers as never,
        completedAt: new Date(),
      },
    });

    // Un quiz réussi rattaché à une leçon valide la leçon.
    if (passed && quiz.lessonId) {
      const res = await completeLesson(user.id, quiz.lessonId);
      if (res) {
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/mes-cours");
      }
    }

    return {
      ok: true,
      result: { score, passed, correctCount, total: quiz.questions.length, perQuestion },
    };
  } catch (e) {
    console.error("[academy] submitQuiz:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

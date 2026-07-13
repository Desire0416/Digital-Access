"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, type EnrollmentStatus } from "@da/academy-db/client";
import { currentUser, currentUserFresh, hasRole, isAdmin, type SessionUser } from "./guards";
import { ACQUIRED_STATUSES, computeCareerPathPricing } from "./pricing";
import { issueCourseCertificate, issueCareerPathCertificate } from "./certification";
import { createNotification } from "./notify";
import { getPrerequisiteStatus, unmetPrerequisitesMessage } from "./prerequisites";

/* ══════════════════════════════════════════════════════════════════════════
   Actions apprenant — inscriptions, progression, quiz, projets (cahier §16-19).
   INVARIANTS :
   · Une formation acquise n'est JAMAIS ré-inscrite ni facturée (règles 40.4-40.6).
   · Le scoring des quiz est 100 % côté serveur ; les bonnes réponses ne sont
     révélées qu'APRÈS soumission.
   · La progression est calculée sur les activités OBLIGATOIRES (règle 40.10) :
     leçons isRequired + évaluations isRequired réussies + projets isRequired
     approuvés. À 100 % → COMPLETED + certificat (certification.ts).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type EnrollResult =
  | { ok: true; already?: boolean }
  | { ok: false; error?: string; redirect?: string };

/* ─── Recalcul de progression (règle 40.10) ────────────────────────────────── */

async function recalcCourseProgress(
  userId: string,
  courseId: string,
): Promise<{ progress: number; completed: boolean; certificateIssued: boolean }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true, startedAt: true },
  });
  if (!enrollment || !ACQUIRED.includes(enrollment.status)) {
    return { progress: 0, completed: false, certificateIssued: false };
  }

  const [requiredLessons, requiredAssessments, requiredProjects] = await Promise.all([
    prisma.lesson.findMany({
      where: { isRequired: true, status: "PUBLISHED", module: { courseId, status: "PUBLISHED" } },
      select: { id: true },
    }),
    prisma.assessment.findMany({ where: { courseId, isRequired: true, status: "PUBLISHED" }, select: { id: true } }),
    prisma.project.findMany({ where: { courseId, isRequired: true, status: "PUBLISHED" }, select: { id: true } }),
  ]);

  const [doneLessons, passedAssessments, approvedProjects] = await Promise.all([
    requiredLessons.length
      ? prisma.lessonProgress.count({ where: { userId, lessonId: { in: requiredLessons.map((l) => l.id) } } })
      : Promise.resolve(0),
    requiredAssessments.length
      ? prisma.assessmentAttempt.findMany({
          where: { userId, passed: true, assessmentId: { in: requiredAssessments.map((a) => a.id) } },
          select: { assessmentId: true },
          distinct: ["assessmentId"],
        })
      : Promise.resolve([]),
    requiredProjects.length
      ? prisma.submission.findMany({
          where: { userId, status: "APPROVED", projectId: { in: requiredProjects.map((p) => p.id) } },
          select: { projectId: true },
          distinct: ["projectId"],
        })
      : Promise.resolve([]),
  ]);

  const total = requiredLessons.length + requiredAssessments.length + requiredProjects.length;
  const done = doneLessons + passedAssessments.length + approvedProjects.length;
  const progress = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  const completed = total > 0 && done >= total;
  const wasCompleted = enrollment.status === "COMPLETED";

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress,
      startedAt: enrollment.startedAt ?? new Date(),
      ...(completed && !wasCompleted ? { status: "COMPLETED", completedAt: new Date() } : {}),
    },
  });

  let certificateIssued = false;
  if (completed && !wasCompleted) {
    const cert = await issueCourseCertificate(userId, courseId);
    certificateIssued = !!cert;
  }

  // Répercute sur les parcours contenant cette formation où l'apprenant est inscrit.
  const memberships = await prisma.careerPathCourse.findMany({ where: { courseId }, select: { careerPathId: true } });
  const pathIds = [...new Set(memberships.map((m) => m.careerPathId))];
  if (pathIds.length > 0) {
    const myPaths = await prisma.careerPathEnrollment.findMany({
      where: { userId, careerPathId: { in: pathIds }, status: { in: ACQUIRED } },
      select: { careerPathId: true },
    });
    for (const pe of myPaths) await recalcPathProgress(userId, pe.careerPathId);
  }

  return { progress, completed, certificateIssued };
}

async function recalcPathProgress(userId: string, careerPathId: string): Promise<void> {
  const pe = await prisma.careerPathEnrollment.findUnique({
    where: { userId_careerPathId: { userId, careerPathId } },
    select: { id: true, status: true },
  });
  if (!pe || !ACQUIRED.includes(pe.status)) return;

  const [pathCourses, transversalProjects] = await Promise.all([
    prisma.careerPathCourse.findMany({ where: { careerPathId }, select: { courseId: true, isRequired: true } }),
    prisma.project.findMany({ where: { careerPathId, isRequired: true, status: "PUBLISHED" }, select: { id: true } }),
  ]);
  const required = pathCourses.filter((c) => c.isRequired);
  if (required.length === 0) return;

  const [enrollments, approvedTransversal] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, courseId: { in: required.map((c) => c.courseId) } },
      select: { courseId: true, progress: true, status: true },
    }),
    transversalProjects.length
      ? prisma.submission.findMany({
          where: { userId, status: "APPROVED", projectId: { in: transversalProjects.map((p) => p.id) } },
          select: { projectId: true },
          distinct: ["projectId"],
        })
      : Promise.resolve([]),
  ]);

  const byCourse = new Map(enrollments.map((e) => [e.courseId, e]));
  const progressSum = required.reduce((sum, c) => sum + (byCourse.get(c.courseId)?.progress ?? 0), 0);
  const progress = Math.min(100, Math.round(progressSum / required.length));

  const allCoursesCompleted = required.every((c) => byCourse.get(c.courseId)?.status === "COMPLETED");
  const allTransversalApproved = approvedTransversal.length >= transversalProjects.length;
  const pathCompleted = allCoursesCompleted && allTransversalApproved;
  const wasCompleted = pe.status === "COMPLETED";

  await prisma.careerPathEnrollment.update({
    where: { id: pe.id },
    data: {
      progress,
      ...(pathCompleted && !wasCompleted ? { status: "COMPLETED", completedAt: new Date() } : {}),
    },
  });

  if (pathCompleted && !wasCompleted) {
    await issueCareerPathCertificate(userId, careerPathId);
  }
}

/* ─── Inscription à une formation gratuite ─────────────────────────────────── */

export async function enrollFreeCourse(slug: string): Promise<EnrollResult> {
  const parsed = z.string().min(1).safeParse(slug);
  if (!parsed.success) return { ok: false, error: "Formation invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: `/connexion?callbackUrl=${encodeURIComponent(`/formations/${parsed.data}`)}` };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre adresse email pour vous inscrire à une formation." };

  const course = await prisma.course.findUnique({
    where: { slug: parsed.data },
    select: { id: true, title: true, price: true, status: true, slug: true },
  });
  if (!course || course.status !== "PUBLISHED") return { ok: false, error: "Cette formation n'est pas disponible." };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true, status: true },
  });
  // Règle 40.4 : une formation acquise le reste — jamais ré-inscrite ni refacturée.
  if (existing && ACQUIRED.includes(existing.status)) return { ok: true, already: true };

  // Verrou prérequis (§22.1) : bloque l'inscription gratuite ET l'entrée en paiement.
  const prereq = await getPrerequisiteStatus(user.id, course.id);
  if (!prereq.met) return { ok: false, error: unmetPrerequisitesMessage(prereq.unmet) };

  if (course.price > 0) return { ok: false, redirect: `/paiement/formation/${course.slug}` };

  if (existing) {
    await prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", origin: "DIRECT", accessType: "FREE", enrolledAt: new Date() },
    });
  } else {
    await prisma.enrollment.create({
      data: { userId: user.id, courseId: course.id, status: "ACTIVE", origin: "DIRECT", accessType: "FREE" },
    });
  }

  await createNotification({
    userId: user.id,
    type: "ENROLLMENT",
    title: "Inscription confirmée",
    message: `Vous êtes inscrit(e) à « ${course.title} ». Bonne formation !`,
    link: `/apprendre/${course.slug}`,
  });
  revalidatePath(`/formations/${course.slug}`);
  revalidatePath("/espace/formations");
  return { ok: true };
}

/* ─── Inscription à un parcours ────────────────────────────────────────────── */

export async function enrollCareerPath(slug: string): Promise<EnrollResult> {
  const parsed = z.string().min(1).safeParse(slug);
  if (!parsed.success) return { ok: false, error: "Parcours invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, redirect: `/connexion?callbackUrl=${encodeURIComponent(`/parcours-metiers/${parsed.data}`)}` };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre adresse email pour vous inscrire à un parcours." };

  const path = await prisma.careerPath.findUnique({
    where: { slug: parsed.data },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      courses: { select: { courseId: true, isRequired: true } },
    },
  });
  if (!path || path.status !== "PUBLISHED") return { ok: false, error: "Ce parcours n'est pas disponible." };

  const existingPE = await prisma.careerPathEnrollment.findUnique({
    where: { userId_careerPathId: { userId: user.id, careerPathId: path.id } },
    select: { id: true, status: true },
  });
  if (existingPE && ACQUIRED.includes(existingPE.status)) return { ok: true, already: true };

  // Reconnaissance des acquis (§13.7, §27.4) : prix recalculé côté serveur.
  const pricing = await computeCareerPathPricing(path.id, user.id);
  if (pricing.finalPrice > 0) return { ok: false, redirect: `/paiement/parcours/${path.slug}` };

  const requiredIds = path.courses.filter((c) => c.isRequired).map((c) => c.courseId);
  const existingEnrollments = requiredIds.length
    ? await prisma.enrollment.findMany({
        where: { userId: user.id, courseId: { in: requiredIds } },
        select: { id: true, courseId: true, status: true },
      })
    : [];
  const byCourse = new Map(existingEnrollments.map((e) => [e.courseId, e]));

  await prisma.$transaction(async (tx) => {
    if (existingPE) {
      await tx.careerPathEnrollment.update({
        where: { id: existingPE.id },
        data: { status: "ACTIVE", enrolledAt: new Date() },
      });
    } else {
      await tx.careerPathEnrollment.create({
        data: { userId: user.id, careerPathId: path.id, status: "ACTIVE" },
      });
    }
    for (const courseId of requiredIds) {
      const existing = byCourse.get(courseId);
      if (existing && ACQUIRED.includes(existing.status)) continue; // acquis : on n'y touche pas
      if (existing) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", origin: "CAREER_PATH", accessType: "FREE", enrolledAt: new Date() },
        });
      } else {
        await tx.enrollment.create({
          data: { userId: user.id, courseId, status: "ACTIVE", origin: "CAREER_PATH", accessType: "FREE" },
        });
      }
    }
  });

  await recalcPathProgress(user.id, path.id);
  await createNotification({
    userId: user.id,
    type: "PATH",
    title: "Parcours démarré 🚀",
    message: `Vous êtes inscrit(e) au parcours « ${path.title} ».`,
    link: "/espace/parcours",
  });
  revalidatePath(`/parcours-metiers/${path.slug}`);
  revalidatePath("/espace/parcours");
  return { ok: true };
}

/* ─── Favoris (§16.8) ──────────────────────────────────────────────────────── */

const favoriteSchema = z
  .object({ courseId: z.string().min(1).optional(), careerPathId: z.string().min(1).optional() })
  .refine((v) => !!v.courseId !== !!v.careerPathId, { message: "Cible invalide." });

export async function toggleFavorite(
  input: z.infer<typeof favoriteSchema>,
): Promise<{ ok: true; favorited: boolean } | { ok: false; error: string }> {
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cible invalide." };
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const where = parsed.data.courseId
    ? { userId: user.id, courseId: parsed.data.courseId }
    : { userId: user.id, careerPathId: parsed.data.careerPathId };

  const existing = await prisma.favorite.findFirst({ where, select: { id: true } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { ok: true, favorited: false };
  }
  await prisma.favorite.create({
    data: { userId: user.id, courseId: parsed.data.courseId ?? null, careerPathId: parsed.data.careerPathId ?? null },
  });
  return { ok: true, favorited: true };
}

/* ─── Profil (§16.9) ───────────────────────────────────────────────────────── */

const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  avatar: z.string().url().optional().or(z.literal("")),
  objective: z.string().trim().max(200).optional().or(z.literal("")),
  experienceLevel: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function updateProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const d = parsed.data;
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } });
  const firstName = d.firstName ?? current?.firstName ?? null;
  const lastName = d.lastName ?? current?.lastName ?? null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(d.firstName !== undefined ? { firstName: d.firstName } : {}),
      ...(d.lastName !== undefined ? { lastName: d.lastName } : {}),
      ...(firstName && lastName ? { name: `${firstName} ${lastName}` } : {}),
      ...(d.bio !== undefined ? { bio: d.bio || null } : {}),
      ...(d.country !== undefined ? { country: d.country || null } : {}),
      ...(d.phone !== undefined ? { phone: d.phone || null } : {}),
      ...(d.avatar !== undefined ? { avatar: d.avatar || null } : {}),
      ...(d.objective !== undefined ? { objective: d.objective || null } : {}),
      ...(d.experienceLevel !== undefined ? { experienceLevel: d.experienceLevel || null } : {}),
    },
  });
  revalidatePath("/espace/parametres");
  return { ok: true, message: "Profil mis à jour." };
}

/* ─── Changement de mot de passe (§16.9) ───────────────────────────────────── */

const passwordRule = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

const changePasswordSchema = z.object({
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: passwordRule,
});

export async function changePassword(input: z.infer<typeof changePasswordSchema>): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const sessionUser = await currentUser();
  if (!sessionUser) return { ok: false, error: "Veuillez vous connecter." };

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { id: true, password: true } });
  if (!user) return { ok: false, error: "Compte introuvable." };

  // Un compte disposant déjà d'un mot de passe doit prouver l'ancien.
  if (user.password) {
    const current = parsed.data.currentPassword ?? "";
    if (!current) return { ok: false, error: "Veuillez saisir votre mot de passe actuel." };
    const valid = await bcrypt.compare(current, user.password);
    if (!valid) return { ok: false, error: "Mot de passe actuel incorrect." };
    const same = await bcrypt.compare(parsed.data.newPassword, user.password);
    if (same) return { ok: false, error: "Le nouveau mot de passe doit être différent de l'ancien." };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  return { ok: true, message: "Mot de passe mis à jour." };
}

/* ─── Terminer une leçon → recalcul de progression ─────────────────────────── */

export type MarkLessonResult =
  | { ok: true; progress: number; courseCompleted: boolean; certificateIssued: boolean }
  | { ok: false; error: string };

export async function markLessonComplete(lessonId: string): Promise<MarkLessonResult> {
  const parsed = z.string().min(1).safeParse(lessonId);
  if (!parsed.success) return { ok: false, error: "Leçon invalide." };
  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      status: true,
      module: { select: { status: true, courseId: true, course: { select: { unlockMode: true, slug: true } } } },
    },
  });
  if (!lesson || lesson.status !== "PUBLISHED" || lesson.module.status !== "PUBLISHED") {
    return { ok: false, error: "Leçon introuvable." };
  }
  const courseId = lesson.module.courseId;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true, status: true },
  });
  if (!enrollment || !ACQUIRED.includes(enrollment.status)) {
    return { ok: false, error: "Vous n'êtes pas inscrit(e) à cette formation." };
  }

  // Mode séquentiel : impossible de valider une leçon tant qu'une leçon
  // obligatoire précédente n'est pas terminée.
  if (lesson.module.course.unlockMode === "SEQUENTIAL") {
    const modules = await prisma.module.findMany({
      where: { courseId, status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        lessons: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: { id: true, isRequired: true },
        },
      },
    });
    const flat = modules.flatMap((m) => m.lessons);
    const priorRequired = [];
    for (const l of flat) {
      if (l.id === lesson.id) break;
      if (l.isRequired) priorRequired.push(l.id);
    }
    if (priorRequired.length > 0) {
      const doneCount = await prisma.lessonProgress.count({
        where: { userId: user.id, lessonId: { in: priorRequired } },
      });
      if (doneCount < priorRequired.length) {
        return { ok: false, error: "Terminez d'abord les leçons précédentes (progression séquentielle)." };
      }
    }
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    update: {},
    create: { userId: user.id, lessonId: lesson.id, enrollmentId: enrollment.id },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } }).catch(() => {});

  const result = await recalcCourseProgress(user.id, courseId);
  revalidatePath(`/apprendre/${lesson.module.course.slug}/${lesson.id}`);
  return { ok: true, progress: result.progress, courseCompleted: result.completed, certificateIssued: result.certificateIssued };
}

/* ─── Quiz — scoring 100 % serveur ─────────────────────────────────────────── */

// SINGLE=index · MULTIPLE=index[] · TRUE_FALSE=bool · SHORT_ANSWER=string ·
// MATCHING=string[] (leftIndex→TEXTE droit choisi) · ORDERING=string[] (TEXTES dans l'ordre choisi).
const answerValue = z.union([
  z.number().int(),
  z.array(z.number().int()),
  z.boolean(),
  z.string().max(2000),
  z.array(z.string().max(2000)).max(30),
]);
const submitQuizSchema = z.record(z.string(), answerValue);

/** Normalise un texte pour comparer une réponse courte (casse/accents/espaces). */
function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export type QuizCorrection = {
  questionId: string;
  correct: boolean;
  /** Révélé APRÈS soumission uniquement (types à choix : indices). */
  correctAnswer: number | number[] | boolean | null;
  /** Bonne réponse en texte (réponse courte / appariement / ordonnancement). */
  correctText: string | null;
  explanation: string | null;
};

export type SubmitQuizResult =
  | {
      ok: true;
      score: number;
      passed: boolean;
      passingScore: number;
      attemptNumber: number;
      attemptsRemaining: number | null;
      corrections: QuizCorrection[];
      courseProgress: number | null;
      courseCompleted: boolean;
      certificateIssued: boolean;
    }
  | { ok: false; error: string };

export async function submitQuiz(assessmentId: string, answers: unknown): Promise<SubmitQuizResult> {
  const idParsed = z.string().min(1).safeParse(assessmentId);
  const answersParsed = submitQuizSchema.safeParse(answers);
  if (!idParsed.success || !answersParsed.success) return { ok: false, error: "Réponses invalides." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const assessment = await prisma.assessment.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      passingScore: true,
      attemptsAllowed: true,
      isRequired: true,
      courseId: true,
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, type: true, options: true, correctAnswer: true, explanation: true, points: true },
      },
    },
  });
  if (!assessment || assessment.status !== "PUBLISHED") return { ok: false, error: "Évaluation introuvable." };

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: assessment.courseId } },
    select: { status: true },
  });
  if (!enrollment || !ACQUIRED.includes(enrollment.status)) {
    return { ok: false, error: "Vous n'êtes pas inscrit(e) à cette formation." };
  }

  // Garde des tentatives (attemptsAllowed = 0 → illimité).
  const attemptsUsed = await prisma.assessmentAttempt.count({ where: { assessmentId: assessment.id, userId: user.id } });
  if (assessment.attemptsAllowed > 0 && attemptsUsed >= assessment.attemptsAllowed) {
    return { ok: false, error: "Vous avez épuisé toutes vos tentatives pour cette évaluation." };
  }

  // ─── Correction automatique — encodage : SINGLE_CHOICE = index (number),
  //     MULTIPLE_CHOICE = number[], TRUE_FALSE = boolean (true = Vrai). ─────
  const given = answersParsed.data;
  let totalPoints = 0;
  let earnedPoints = 0;
  const corrections: QuizCorrection[] = [];

  for (const q of assessment.questions) {
    const answer = given[q.id];
    let correct = false;
    let revealed: number | number[] | boolean | null = null;
    let correctText: string | null = null;

    switch (q.type) {
      case "SINGLE_CHOICE": {
        const expected = typeof q.correctAnswer === "number" ? q.correctAnswer : null;
        revealed = expected;
        totalPoints += q.points;
        correct = expected !== null && typeof answer === "number" && answer === expected;
        break;
      }
      case "MULTIPLE_CHOICE": {
        const expected = Array.isArray(q.correctAnswer) ? (q.correctAnswer as number[]) : null;
        revealed = expected;
        totalPoints += q.points;
        if (expected && Array.isArray(answer)) {
          const a = [...new Set(answer as number[])].sort((x, y) => x - y);
          const e = [...new Set(expected)].sort((x, y) => x - y);
          correct = a.length === e.length && a.every((v, i) => v === e[i]);
        }
        break;
      }
      case "TRUE_FALSE": {
        const expected = typeof q.correctAnswer === "boolean" ? q.correctAnswer : null;
        revealed = expected;
        totalPoints += q.points;
        correct = expected !== null && typeof answer === "boolean" && answer === expected;
        break;
      }
      case "SHORT_ANSWER": {
        // correctAnswer = string[] (réponses acceptées) ; comparaison normalisée.
        totalPoints += q.points;
        const accepted = Array.isArray(q.correctAnswer)
          ? (q.correctAnswer as unknown[]).filter((v): v is string => typeof v === "string")
          : [];
        const normAccepted = accepted.map(normalizeText);
        correct = typeof answer === "string" && normAccepted.includes(normalizeText(answer));
        correctText = accepted.length ? `Réponse attendue : ${accepted[0]}` : null;
        break;
      }
      case "MATCHING": {
        // options = { left[], right[] } (ordre d'auteur) ; correctAnswer = number[]
        // (leftIndex→rightIndex d'auteur). La colonne droite est MÉLANGÉE à l'affichage
        // (learn-queries) donc le client renvoie le TEXTE choisi — on compare texte à
        // texte contre right[correctAnswer[i]] : aucune fuite par alignement d'index.
        totalPoints += q.points;
        const expected = Array.isArray(q.correctAnswer) ? (q.correctAnswer as number[]) : null;
        const opts =
          q.options && typeof q.options === "object" && !Array.isArray(q.options)
            ? (q.options as { left?: string[]; right?: string[] })
            : null;
        const right = opts?.right ?? [];
        const submitted = Array.isArray(answer) ? answer : [];
        if (
          expected &&
          right.length > 0 &&
          submitted.length === expected.length &&
          expected.every(
            (r, i) =>
              typeof submitted[i] === "string" &&
              typeof right[r] === "string" &&
              normalizeText(submitted[i] as string) === normalizeText(right[r]),
          )
        ) {
          correct = true;
        }
        if (expected && opts?.left && opts.right) {
          correctText =
            "Bonnes associations — " +
            expected.map((r, i) => `${opts.left![i]} ↔ ${opts.right![r]}`).join(" · ");
        }
        break;
      }
      case "ORDERING": {
        // options = items dans l'ORDRE correct (ordre d'auteur). Le client renvoie la
        // suite des TEXTES qu'il a ordonnés ; on compare texte à texte (normalisé) —
        // aucune référence à un index d'origine n'a transité côté client (§5 sécurité).
        totalPoints += q.points;
        const items = Array.isArray(q.options)
          ? (q.options as unknown[]).filter((v): v is string => typeof v === "string")
          : [];
        const submitted = Array.isArray(answer) ? answer : [];
        correct =
          items.length > 0 &&
          submitted.length === items.length &&
          items.every((it, i) => typeof submitted[i] === "string" && normalizeText(submitted[i] as string) === normalizeText(it));
        correctText = items.length ? "Ordre correct : " + items.join(" → ") : null;
        break;
      }
      default:
        // Type inconnu / non auto-notable : exclu du scoring.
        continue;
    }

    if (correct) earnedPoints += q.points;
    corrections.push({ questionId: q.id, correct, correctAnswer: revealed, correctText, explanation: q.explanation });
  }

  const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= assessment.passingScore;
  const attemptNumber = attemptsUsed + 1;

  // On ne dévoile la BONNE réponse (et l'explication) que si l'apprenant a réussi
  // OU s'il n'a plus de tentative — sinon il pourrait échouer volontairement pour
  // lire le corrigé puis refaire le quiz à 100 %. On garde toujours « correct »
  // (savoir quelles questions sont ratées, sans la réponse).
  const isFinalAttempt = assessment.attemptsAllowed > 0 && attemptNumber >= assessment.attemptsAllowed;
  const canReveal = passed || isFinalAttempt;
  const safeCorrections = canReveal
    ? corrections
    : corrections.map((c) => ({ ...c, correctAnswer: null, correctText: null, explanation: null }));

  await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      userId: user.id,
      attemptNumber,
      answers: given,
      score,
      passed,
      status: passed ? "PASSED" : "FAILED",
      submittedAt: new Date(),
      gradedAt: new Date(),
    },
  });

  let courseProgress: number | null = null;
  let courseCompleted = false;
  let certificateIssued = false;
  if (passed && assessment.isRequired) {
    const result = await recalcCourseProgress(user.id, assessment.courseId);
    courseProgress = result.progress;
    courseCompleted = result.completed;
    certificateIssued = result.certificateIssued;
  }

  return {
    ok: true,
    score,
    passed,
    passingScore: assessment.passingScore,
    attemptNumber,
    attemptsRemaining: assessment.attemptsAllowed > 0 ? Math.max(0, assessment.attemptsAllowed - attemptNumber) : null,
    corrections: safeCorrections,
    courseProgress,
    courseCompleted,
    certificateIssued,
  };
}

/* ─── Projets — soumission versionnée (§19.3) ──────────────────────────────── */

const submitProjectSchema = z.object({
  content: z.string().trim().min(10, "Décrivez votre travail (10 caractères minimum)."),
  links: z.array(z.string().url("Lien invalide.")).max(10).optional(),
  files: z.array(z.object({ name: z.string().max(200), url: z.string().url() })).max(10).optional(),
});

export async function submitProject(
  projectId: string,
  input: z.infer<typeof submitProjectSchema>,
): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(projectId);
  const parsed = submitProjectSchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "Projet invalide." };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };

  const project = await prisma.project.findUnique({
    where: { id: idParsed.data },
    select: { id: true, title: true, maxAttempts: true, status: true, courseId: true, careerPathId: true },
  });
  if (!project || project.status !== "PUBLISHED") return { ok: false, error: "Projet introuvable." };

  // Accès : inscription à la formation OU au parcours (projet transversal).
  let hasAccess = false;
  if (project.courseId) {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: project.courseId } },
      select: { status: true },
    });
    hasAccess = !!e && ACQUIRED.includes(e.status);
  } else if (project.careerPathId) {
    const pe = await prisma.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId: user.id, careerPathId: project.careerPathId } },
      select: { status: true },
    });
    hasAccess = !!pe && ACQUIRED.includes(pe.status);
  }
  if (!hasAccess) return { ok: false, error: "Vous n'avez pas accès à ce projet." };

  const previous = await prisma.submission.findMany({
    where: { projectId: project.id, userId: user.id },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true, status: true },
  });
  if (previous.some((s) => s.status === "APPROVED")) return { ok: false, error: "Ce projet est déjà validé. Félicitations !" };
  if (previous.some((s) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW")) {
    return { ok: false, error: "Votre soumission précédente est en cours de correction. Patientez avant d'en déposer une nouvelle." };
  }
  if (project.maxAttempts > 0 && previous.length >= project.maxAttempts) {
    return { ok: false, error: `Nombre maximal de tentatives atteint (${project.maxAttempts}).` };
  }

  await prisma.submission.create({
    data: {
      projectId: project.id,
      userId: user.id,
      attemptNumber: (previous[0]?.attemptNumber ?? 0) + 1,
      content: parsed.data.content,
      links: parsed.data.links ?? [],
      files: parsed.data.files ?? [],
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await createNotification({
    userId: user.id,
    type: "PROJECT",
    title: "Projet soumis",
    message: `Votre livrable pour « ${project.title} » a bien été déposé. Correction en cours.`,
    link: "/espace/projets",
  });
  revalidatePath("/espace/projets");
  return { ok: true, message: "Projet soumis. Vous serez notifié(e) après correction." };
}

/* ─── Correction d'une soumission (admin OU correcteur, règle 40.13) ───────── */

const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "CHANGES_REQUESTED", "REJECTED"]),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().trim().max(5000).optional(),
});

/** Garde : administrateur frais OU rôle GRADER / INSTRUCTOR relu en base. */
async function requireReviewer(): Promise<SessionUser | null> {
  const user = await currentUserFresh();
  if (!user) return null;
  if (isAdmin(user) || hasRole(user, ["GRADER", "INSTRUCTOR"])) return user;
  return null;
}

export async function reviewSubmission(
  submissionId: string,
  input: z.infer<typeof reviewSchema>,
): Promise<ActionResult> {
  const idParsed = z.string().min(1).safeParse(submissionId);
  const parsed = reviewSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Données de correction invalides." };

  const reviewer = await requireReviewer();
  if (!reviewer) return { ok: false, error: "Accès réservé aux correcteurs et administrateurs." };

  const submission = await prisma.submission.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      userId: true,
      status: true,
      project: { select: { id: true, title: true, minScore: true, isRequired: true, courseId: true, careerPathId: true } },
    },
  });
  if (!submission) return { ok: false, error: "Soumission introuvable." };
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
    return { ok: false, error: "Cette soumission a déjà été corrigée." };
  }

  // Cloisonnement : un correcteur/formateur NON-admin ne corrige que les
  // soumissions des formations qu'il encadre (CourseInstructor). L'admin
  // pédagogique n'est pas restreint.
  if (!isAdmin(reviewer)) {
    const proj = submission.project;
    let allowed = false;
    if (proj.courseId) {
      allowed = !!(await prisma.courseInstructor.findFirst({
        where: { courseId: proj.courseId, userId: reviewer.id },
        select: { id: true },
      }));
    } else if (proj.careerPathId) {
      // Projet transversal : autorisé s'il encadre au moins une formation du parcours.
      allowed = !!(await prisma.courseInstructor.findFirst({
        where: { userId: reviewer.id, course: { careerPaths: { some: { careerPathId: proj.careerPathId } } } },
        select: { id: true },
      }));
    }
    if (!allowed) return { ok: false, error: "Vous n'encadrez pas la formation liée à cette soumission." };
  }

  const { decision, score, feedback } = parsed.data;
  // Approuver exige un score qui ATTEINT le minimum du projet (pas de validation
  // sans note, qui délivrerait un certificat sous le seuil).
  if (decision === "APPROVED" && (score === undefined || score < submission.project.minScore)) {
    return { ok: false, error: `Pour approuver, indiquez un score atteignant le minimum requis (${submission.project.minScore}).` };
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: decision,
        score: score ?? null,
        feedback: feedback || null,
        reviewerId: reviewer.id,
        reviewedAt: new Date(),
      },
    }),
    // Règle 40.13 : toute note attribuée/modifiée est auditée.
    prisma.auditLog.create({
      data: {
        actorId: reviewer.id,
        action: "submission.review",
        entity: "Submission",
        entityId: submission.id,
        meta: { decision, score: score ?? null, projectId: submission.project.id, learnerId: submission.userId },
      },
    }),
  ]);

  const labels: Record<typeof decision, { title: string; message: string }> = {
    APPROVED: { title: "Projet validé 🎉", message: `Votre projet « ${submission.project.title} » a été approuvé.` },
    CHANGES_REQUESTED: {
      title: "Modifications demandées",
      message: `Votre projet « ${submission.project.title} » nécessite des ajustements. Consultez le retour du correcteur.`,
    },
    REJECTED: { title: "Projet refusé", message: `Votre projet « ${submission.project.title} » n'a pas été retenu. Consultez le retour du correcteur.` },
  };
  await createNotification({ userId: submission.userId, type: "PROJECT", ...labels[decision], link: "/espace/projets" });

  // Un projet obligatoire approuvé peut compléter la formation ou le parcours.
  if (decision === "APPROVED" && submission.project.isRequired) {
    if (submission.project.courseId) await recalcCourseProgress(submission.userId, submission.project.courseId);
    if (submission.project.careerPathId) await recalcPathProgress(submission.userId, submission.project.careerPathId);
  }

  revalidatePath("/espace/projets");
  return { ok: true, message: "Correction enregistrée." };
}

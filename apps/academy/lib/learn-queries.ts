import "server-only";
import { prisma, type EnrollmentStatus, type QuestionType } from "@da/academy-db/client";
import { ACQUIRED_STATUSES } from "./pricing";
import { getPrerequisiteStatus, type PrerequisiteStatus } from "./prerequisites";

/* ══════════════════════════════════════════════════════════════════════════
   Espace apprenant & lecteur — LECTURES (cahier §16, §17).
   RÈGLE 40.6 : une formation apparaît UNE SEULE fois par apprenant
   (Enrollment @@unique(userId, courseId)), même si elle appartient à
   plusieurs parcours — on affiche alors les parcours liés.
   Sécurité : le contenu d'une leçon n'est JAMAIS renvoyé sans accès
   (inscription ACTIVE/COMPLETED ou leçon isPreview).
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

/* ─── Aide : leçons publiées d'une formation, à plat et ordonnées ──────────── */

interface FlatLesson {
  id: string;
  moduleId: string;
  isRequired: boolean;
  isPreview: boolean;
}

async function getFlatLessons(courseId: string): Promise<FlatLesson[]> {
  const modules = await prisma.module.findMany({
    where: { courseId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, isRequired: true, isPreview: true },
      },
    },
  });
  return modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
}

async function getCompletedLessonIds(userId: string, lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
}

/** Première leçon publiée non terminée (la « prochaine leçon », §16.2). */
function nextLessonId(flat: { id: string }[], completed: Set<string>): string | null {
  return flat.find((l) => !completed.has(l.id))?.id ?? null;
}

/* ─── Tableau de bord (§16.1) ──────────────────────────────────────────────── */

export async function getLearnerDashboard(userId: string) {
  const [enrollments, pathEnrollments, certificates, recentAttempts, pendingSubmissions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: ACQUIRED } },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          select: { id: true, slug: true, title: true, coverImage: true, level: true, durationHours: true },
        },
      },
    }),
    prisma.careerPathEnrollment.findMany({
      where: { userId, status: { in: ACQUIRED } },
      orderBy: { enrolledAt: "desc" },
      include: {
        careerPath: { select: { id: true, slug: true, title: true, targetJob: true, coverImage: true } },
      },
    }),
    prisma.certificate.findMany({
      // Widget « Mes certificats » = crédentials formels ; les badges de
      // compétence ont leur propre section dans /espace/certificats.
      where: { userId, status: "ACTIVE", type: { not: "SKILL_BADGE" } },
      orderBy: { issuedAt: "desc" },
      take: 4,
      select: { id: true, title: true, type: true, number: true, verifyCode: true, issuedAt: true },
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        score: true,
        passed: true,
        startedAt: true,
        assessment: { select: { title: true, course: { select: { title: true, slug: true } } } },
      },
    }),
    prisma.submission.count({ where: { userId, status: { in: ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"] } } }),
  ]);

  // Formation active la plus récente non terminée + sa prochaine leçon (« reprendre »).
  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE") ?? null;
  let resume: { courseSlug: string; courseTitle: string; lessonId: string | null; progress: number } | null = null;
  if (activeEnrollment) {
    const flat = await getFlatLessons(activeEnrollment.courseId);
    const completed = await getCompletedLessonIds(userId, flat.map((l) => l.id));
    resume = {
      courseSlug: activeEnrollment.course.slug,
      courseTitle: activeEnrollment.course.title,
      lessonId: nextLessonId(flat, completed),
      progress: activeEnrollment.progress,
    };
  }

  return {
    enrollments,
    pathEnrollments,
    certificates,
    recentAttempts,
    pendingSubmissions,
    resume,
    stats: {
      activeCourses: enrollments.filter((e) => e.status === "ACTIVE").length,
      completedCourses: enrollments.filter((e) => e.status === "COMPLETED").length,
      certificatesCount: certificates.length,
      activePaths: pathEnrollments.filter((e) => e.status === "ACTIVE").length,
    },
  };
}

export type LearnerDashboard = Awaited<ReturnType<typeof getLearnerDashboard>>;

/* ─── Mes formations (§16.2) — UNE ligne par formation, parcours liés ──────── */

export async function getMyCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { notIn: ["CANCELLED"] } },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }],
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          coverImage: true,
          level: true,
          durationHours: true,
          // Parcours (publiés) auxquels cette formation appartient :
          careerPaths: {
            where: { careerPath: { status: "PUBLISHED" } },
            select: { careerPath: { select: { id: true, slug: true, title: true } } },
          },
        },
      },
    },
  });

  // Parcours liés = parcours contenant la formation ET où l'apprenant est inscrit.
  const myPathIds = new Set(
    (
      await prisma.careerPathEnrollment.findMany({
        where: { userId, status: { in: ACQUIRED } },
        select: { careerPathId: true },
      })
    ).map((p) => p.careerPathId),
  );

  // Crédential de formation déjà obtenu (réussite COURSE ou attestation PARTICIPATION).
  const certs = await prisma.certificate.findMany({
    where: {
      userId,
      type: { in: ["COURSE", "PARTICIPATION"] },
      status: "ACTIVE",
      courseId: { in: enrollments.map((e) => e.courseId) },
    },
    select: { courseId: true, id: true, verifyCode: true },
  });
  const certByCourse = new Map(certs.map((c) => [c.courseId, c]));

  return Promise.all(
    enrollments.map(async (e) => {
      const flat = await getFlatLessons(e.courseId);
      const completed = await getCompletedLessonIds(userId, flat.map((l) => l.id));
      return {
        enrollmentId: e.id,
        status: e.status,
        origin: e.origin,
        accessType: e.accessType,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        course: {
          id: e.course.id,
          slug: e.course.slug,
          title: e.course.title,
          subtitle: e.course.subtitle,
          coverImage: e.course.coverImage,
          level: e.course.level,
          durationHours: e.course.durationHours,
        },
        linkedPaths: e.course.careerPaths
          .filter((cp) => myPathIds.has(cp.careerPath.id))
          .map((cp) => cp.careerPath),
        certificate: certByCourse.get(e.courseId) ?? null,
        nextLessonId: nextLessonId(flat, completed),
      };
    }),
  );
}

export type MyCourseItem = Awaited<ReturnType<typeof getMyCourses>>[number];

/* ─── Mes parcours (§16.3) — progression par phase ─────────────────────────── */

export async function getMyPaths(userId: string) {
  const pathEnrollments = await prisma.careerPathEnrollment.findMany({
    where: { userId, status: { notIn: ["CANCELLED"] } },
    orderBy: { enrolledAt: "desc" },
    include: {
      careerPath: {
        select: {
          id: true,
          slug: true,
          title: true,
          targetJob: true,
          coverImage: true,
          certificationTitle: true,
          phases: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
          courses: {
            orderBy: { position: "asc" },
            select: {
              phaseId: true,
              isRequired: true,
              position: true,
              course: { select: { id: true, slug: true, title: true, coverImage: true, level: true } },
            },
          },
          projects: {
            where: { status: "PUBLISHED", isRequired: true },
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  const allCourseIds = [...new Set(pathEnrollments.flatMap((pe) => pe.careerPath.courses.map((c) => c.course.id)))];
  const myEnrollments = allCourseIds.length
    ? await prisma.enrollment.findMany({
        where: { userId, courseId: { in: allCourseIds } },
        select: { courseId: true, status: true, progress: true },
      })
    : [];
  const enrollByCourse = new Map(myEnrollments.map((e) => [e.courseId, e]));

  const pathCerts = await prisma.certificate.findMany({
    where: { userId, type: "CAREER_PATH", status: "ACTIVE" },
    select: { careerPathId: true, id: true, verifyCode: true },
  });
  const certByPath = new Map(pathCerts.map((c) => [c.careerPathId, c]));

  return pathEnrollments.map((pe) => {
    const withState = pe.careerPath.courses.map((c) => {
      const enr = enrollByCourse.get(c.course.id) ?? null;
      const state: "validee" | "en-cours" | "a-venir" =
        enr?.status === "COMPLETED" ? "validee" : enr && ACQUIRED.includes(enr.status) ? "en-cours" : "a-venir";
      return { ...c, enrollment: enr, state };
    });

    // Phase actuelle = première phase contenant une formation obligatoire non validée.
    const phases = pe.careerPath.phases.map((phase) => {
      const phaseCourses = withState.filter((c) => c.phaseId === phase.id);
      const required = phaseCourses.filter((c) => c.isRequired);
      const done = required.filter((c) => c.state === "validee").length;
      return {
        ...phase,
        courses: phaseCourses,
        requiredCount: required.length,
        completedCount: done,
        completed: required.length > 0 && done === required.length,
      };
    });
    const unphased = withState.filter((c) => c.phaseId === null);
    const currentPhase = phases.find((p) => !p.completed) ?? null;

    return {
      enrollmentId: pe.id,
      status: pe.status,
      progress: pe.progress,
      enrolledAt: pe.enrolledAt,
      completedAt: pe.completedAt,
      careerPath: {
        id: pe.careerPath.id,
        slug: pe.careerPath.slug,
        title: pe.careerPath.title,
        targetJob: pe.careerPath.targetJob,
        coverImage: pe.careerPath.coverImage,
        certificationTitle: pe.careerPath.certificationTitle,
      },
      phases,
      unphasedCourses: unphased,
      currentPhaseId: currentPhase?.id ?? null,
      completedCourses: withState.filter((c) => c.state === "validee").length,
      totalCourses: withState.length,
      transversalProjects: pe.careerPath.projects,
      certificate: certByPath.get(pe.careerPath.id) ?? null,
    };
  });
}

export type MyPathItem = Awaited<ReturnType<typeof getMyPaths>>[number];

/* ─── Mes évaluations (§16.5) ──────────────────────────────────────────────── */

export type MyAssessmentState = "a-faire" | "reussie" | "echouee" | "a-reprendre";

export async function getMyAssessments(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ACQUIRED } },
    select: { courseId: true, course: { select: { slug: true, title: true } } },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  const assessments = await prisma.assessment.findMany({
    where: { courseId: { in: courseIds }, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      passingScore: true,
      attemptsAllowed: true,
      isRequired: true,
      courseId: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId },
        orderBy: { startedAt: "desc" },
        select: { id: true, attemptNumber: true, score: true, passed: true, status: true, startedAt: true },
      },
    },
  });

  const courseBySlug = new Map(enrollments.map((e) => [e.courseId, e.course]));

  return assessments.map((a) => {
    const attemptsUsed = a.attempts.length;
    const bestScore = a.attempts.reduce<number | null>((best, at) => (at.score !== null && (best === null || at.score > best) ? at.score : best), null);
    const passed = a.attempts.some((at) => at.passed === true);
    const exhausted = a.attemptsAllowed > 0 && attemptsUsed >= a.attemptsAllowed;
    const state: MyAssessmentState = passed ? "reussie" : attemptsUsed === 0 ? "a-faire" : exhausted ? "echouee" : "a-reprendre";
    return {
      id: a.id,
      title: a.title,
      type: a.type,
      passingScore: a.passingScore,
      attemptsAllowed: a.attemptsAllowed,
      isRequired: a.isRequired,
      questionsCount: a._count.questions,
      course: courseBySlug.get(a.courseId)!,
      attemptsUsed,
      bestScore,
      state,
      lastAttempt: a.attempts[0] ?? null,
    };
  });
}

/* ─── Mes projets (§16.4) ──────────────────────────────────────────────────── */

export async function getMyProjects(userId: string) {
  const [enrollments, pathEnrollments] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId, status: { in: ACQUIRED } }, select: { courseId: true } }),
    prisma.careerPathEnrollment.findMany({ where: { userId, status: { in: ACQUIRED } }, select: { careerPathId: true } }),
  ]);
  const courseIds = enrollments.map((e) => e.courseId);
  const pathIds = pathEnrollments.map((e) => e.careerPathId);
  if (courseIds.length === 0 && pathIds.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        ...(courseIds.length ? [{ courseId: { in: courseIds } }] : []),
        ...(pathIds.length ? [{ careerPathId: { in: pathIds } }] : []),
      ],
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      context: true,
      deliverables: true,
      minScore: true,
      maxAttempts: true,
      isRequired: true,
      course: { select: { slug: true, title: true } },
      careerPath: { select: { slug: true, title: true } },
      submissions: {
        where: { userId },
        orderBy: { attemptNumber: "desc" },
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          score: true,
          feedback: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  return projects.map((p) => ({
    ...p,
    latestSubmission: p.submissions[0] ?? null,
    attemptsUsed: p.submissions.length,
  }));
}

export type MyProjectItem = Awaited<ReturnType<typeof getMyProjects>>[number];

/**
 * Détail d'un projet pour l'apprenant (§16.4, §19). Renvoie `null` si le projet
 * n'existe pas, n'est pas publié, ou si l'apprenant n'y a pas accès (ni inscrit
 * à la formation, ni au parcours transversal). Inclut TOUTES les soumissions
 * (historique versionné) et l'état de dépôt.
 */
export async function getProjectForLearner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      context: true,
      objectives: true,
      deliverables: true,
      rubric: true,
      minScore: true,
      maxAttempts: true,
      isRequired: true,
      status: true,
      courseId: true,
      careerPathId: true,
      course: { select: { slug: true, title: true } },
      careerPath: { select: { slug: true, title: true } },
      submissions: {
        where: { userId },
        orderBy: { attemptNumber: "desc" },
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          content: true,
          links: true,
          files: true,
          score: true,
          feedback: true,
          submittedAt: true,
          reviewedAt: true,
          isPublic: true,
          createdAt: true,
        },
      },
    },
  });
  if (!project || project.status !== "PUBLISHED") return null;

  // Contrôle d'accès : inscription à la formation OU au parcours.
  let hasAccess = false;
  if (project.courseId) {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: project.courseId } },
      select: { status: true },
    });
    hasAccess = !!e && ACQUIRED.includes(e.status);
  } else if (project.careerPathId) {
    const pe = await prisma.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId, careerPathId: project.careerPathId } },
      select: { status: true },
    });
    hasAccess = !!pe && ACQUIRED.includes(pe.status);
  }
  if (!hasAccess) return null;

  // Normalise les champs JSON en types concrets (évite une inférence non portable).
  const submissions = project.submissions.map((s) => ({
    id: s.id,
    attemptNumber: s.attemptNumber,
    status: s.status,
    content: s.content,
    links: Array.isArray(s.links) ? (s.links.filter((v) => typeof v === "string") as string[]) : [],
    files: Array.isArray(s.files)
      ? (s.files.filter((v): v is { name: string; url: string } => !!v && typeof v === "object" && "url" in (v as object)) as { name: string; url: string }[])
      : [],
    score: s.score,
    feedback: s.feedback,
    submittedAt: s.submittedAt,
    reviewedAt: s.reviewedAt,
    isPublic: s.isPublic,
    createdAt: s.createdAt,
  }));

  const approved = submissions.some((s) => s.status === "APPROVED");
  const awaitingReview = submissions.some((s) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW");
  const attemptsUsed = submissions.length;
  const attemptsExhausted = project.maxAttempts > 0 && attemptsUsed >= project.maxAttempts;
  // On peut déposer si non approuvé, pas déjà en correction, et tentatives non épuisées.
  const canSubmit = !approved && !awaitingReview && !attemptsExhausted;

  return {
    id: project.id,
    title: project.title,
    context: project.context,
    objectives: project.objectives,
    deliverables: project.deliverables,
    rubric: project.rubric,
    minScore: project.minScore,
    maxAttempts: project.maxAttempts,
    isRequired: project.isRequired,
    course: project.course,
    careerPath: project.careerPath,
    submissions,
    latestSubmission: submissions[0] ?? null,
    attemptsUsed,
    approved,
    awaitingReview,
    attemptsExhausted,
    canSubmit,
  };
}

export type LearnerProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectForLearner>>>;
export type LearnerSubmission = LearnerProjectDetail["submissions"][number];

/* ─── Mes certificats (§16.6) & favoris (§16.8) ────────────────────────────── */

export async function getMyCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      number: true,
      verifyCode: true,
      status: true,
      score: true,
      mention: true,
      skills: true,
      issuedAt: true,
      course: { select: { slug: true, title: true, coverImage: true } },
      careerPath: { select: { slug: true, title: true, coverImage: true } },
    },
  });
}

export async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          coverImage: true,
          level: true,
          price: true,
          durationHours: true,
          status: true,
          _count: { select: { modules: true } },
        },
      },
      careerPath: {
        select: {
          id: true,
          slug: true,
          title: true,
          targetJob: true,
          coverImage: true,
          price: true,
          entryLevel: true,
          exitLevel: true,
          status: true,
          _count: { select: { courses: true, projects: true } },
        },
      },
    },
  });
  return favorites.filter((f) => f.course?.status === "PUBLISHED" || f.careerPath?.status === "PUBLISHED");
}

/* ─── Profil de l'apprenant (§16.9) ────────────────────────────────────────── */

export async function getMyProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      country: true,
      phone: true,
      objective: true,
      experienceLevel: true,
      password: true, // seulement pour savoir si un mot de passe existe déjà
      createdAt: true,
    },
  });
}

export type MyProfile = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;

/* ─── État CTA d'une fiche formation pour l'utilisateur courant (§11.3) ────── */

export interface CourseUserState {
  /** Inscription active/terminée : la formation est acquise. */
  enrolled: boolean;
  /** Un paiement Mobile Money est en attente de validation admin. */
  pending: boolean;
  /** État des prérequis structurés (§22.1) pour cet apprenant. */
  prerequisites: PrerequisiteStatus;
}

/**
 * État d'accès d'un utilisateur à une formation, pour choisir le bon CTA de la
 * fiche : inscrit → Continuer, paiement PENDING → bandeau d'attente, sinon le
 * bouton d'inscription (gratuit) ou de paiement selon le prix.
 */
export async function getCourseUserState(courseId: string, userId: string | null): Promise<CourseUserState> {
  if (!userId) {
    return { enrolled: false, pending: false, prerequisites: await getPrerequisiteStatus(null, courseId) };
  }
  const [enrollment, pending, prerequisites] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    }),
    prisma.payment.findFirst({
      where: { userId, courseId, status: "PENDING" },
      select: { id: true },
    }),
    getPrerequisiteStatus(userId, courseId),
  ]);
  return {
    enrolled: !!enrollment && ACQUIRED.includes(enrollment.status),
    pending: !!pending,
    prerequisites,
  };
}

/** IDs des formations acquises (ACTIVE/COMPLETED) — pour marquer « acquise » au catalogue. */
export async function getAcquiredCourseIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.enrollment.findMany({
    where: { userId, status: { in: ACQUIRED } },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}

/* ─── Lecteur (§17) — /apprendre/[courseSlug]/[lessonId] ───────────────────── */

/**
 * Structure du lecteur : modules + leçons + évaluations + progression +
 * verrouillage séquentiel. Règle 40.16 : un apprenant inscrit garde l'accès
 * même si la formation est archivée/suspendue.
 */
export async function getPlayerCourse(slug: string, userId: string | null) {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      unlockMode: true,
      status: true,
      price: true,
      modules: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            select: { id: true, title: true, lessonType: true, durationMinutes: true, isPreview: true, isRequired: true },
          },
          assessments: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            select: { id: true, title: true, type: true, passingScore: true, isRequired: true, attemptsAllowed: true },
          },
        },
      },
      assessments: {
        where: { status: "PUBLISHED", moduleId: null },
        orderBy: { order: "asc" },
        select: { id: true, title: true, type: true, passingScore: true, isRequired: true, attemptsAllowed: true },
      },
      projects: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, title: true, isRequired: true },
      },
    },
  });
  if (!course) return null;

  const enrollment = userId
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { id: true, status: true, progress: true },
      })
    : null;
  const enrolled = !!enrollment && ACQUIRED.includes(enrollment.status);

  // Sans inscription, seule une formation PUBLIÉE est visible (aperçus).
  if (!enrolled && course.status !== "PUBLISHED") return null;

  const flat = course.modules.flatMap((m) => m.lessons);
  const completed = userId ? await getCompletedLessonIds(userId, flat.map((l) => l.id)) : new Set<string>();

  const attemptSummaries = userId
    ? await prisma.assessmentAttempt.findMany({
        where: { userId, assessment: { courseId: course.id } },
        select: { assessmentId: true, passed: true, score: true },
      })
    : [];
  const passedAssessments = new Set(attemptSummaries.filter((a) => a.passed).map((a) => a.assessmentId));
  const attemptsByAssessment = new Map<string, number>();
  for (const a of attemptSummaries) attemptsByAssessment.set(a.assessmentId, (attemptsByAssessment.get(a.assessmentId) ?? 0) + 1);

  // Verrouillage : SEQUENTIAL → une leçon est verrouillée tant qu'une leçon
  // obligatoire précédente n'est pas terminée. Non inscrit → tout sauf aperçus.
  let blockedFromHere = false;
  const lockMap = new Map<string, boolean>();
  for (const lesson of flat) {
    if (!enrolled) {
      lockMap.set(lesson.id, !lesson.isPreview);
      continue;
    }
    if (course.unlockMode === "SEQUENTIAL") {
      lockMap.set(lesson.id, blockedFromHere);
      if (lesson.isRequired && !completed.has(lesson.id)) blockedFromHere = true;
    } else {
      lockMap.set(lesson.id, false);
    }
  }

  const decorateAssessment = (a: { id: string; title: string; type: string; passingScore: number; isRequired: boolean; attemptsAllowed: number }) => ({
    ...a,
    passed: passedAssessments.has(a.id),
    attemptsUsed: attemptsByAssessment.get(a.id) ?? 0,
  });

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    coverImage: course.coverImage,
    unlockMode: course.unlockMode,
    status: course.status,
    price: course.price,
    enrolled,
    enrollment: enrollment && enrolled ? { status: enrollment.status, progress: enrollment.progress } : null,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      durationMinutes: m.durationMinutes,
      lessons: m.lessons.map((l) => ({
        ...l,
        completed: completed.has(l.id),
        locked: lockMap.get(l.id) ?? !enrolled,
      })),
      assessments: m.assessments.map(decorateAssessment),
    })),
    courseAssessments: course.assessments.map(decorateAssessment),
    projects: course.projects,
    nextLessonId: nextLessonId(flat, completed),
  };
}

export type PlayerCourse = NonNullable<Awaited<ReturnType<typeof getPlayerCourse>>>;

/**
 * Contenu d'une leçon. SÉCURITÉ : `content`, `videoUrl` et `externalUrl` sont
 * NULLÉS si l'utilisateur n'a pas accès (ni inscrit ACTIVE/COMPLETED, ni
 * leçon d'aperçu) ou si la leçon est verrouillée (mode séquentiel).
 */
export async function getPlayerLesson(lessonId: string, userId: string | null) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      lessonType: true,
      content: true,
      videoUrl: true,
      externalUrl: true,
      durationMinutes: true,
      isPreview: true,
      isRequired: true,
      status: true,
      resources: { orderBy: { order: "asc" }, select: { id: true, title: true, kind: true, url: true } },
      module: {
        select: {
          id: true,
          title: true,
          status: true,
          course: { select: { id: true, slug: true, title: true, unlockMode: true, status: true } },
        },
      },
    },
  });
  if (!lesson || lesson.status !== "PUBLISHED" || lesson.module.status !== "PUBLISHED") return null;

  const course = lesson.module.course;
  const enrollment = userId
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
        select: { status: true },
      })
    : null;
  const enrolled = !!enrollment && ACQUIRED.includes(enrollment.status);

  // Aperçu public uniquement sur une formation publiée.
  let hasAccess = enrolled || (lesson.isPreview && course.status === "PUBLISHED");
  let locked = false;

  // Verrouillage séquentiel pour l'apprenant inscrit.
  const flat = await getFlatLessons(course.id);
  const completed = userId ? await getCompletedLessonIds(userId, flat.map((l) => l.id)) : new Set<string>();
  if (enrolled && course.unlockMode === "SEQUENTIAL") {
    for (const l of flat) {
      if (l.id === lesson.id) break;
      if (l.isRequired && !completed.has(l.id)) {
        locked = true;
        break;
      }
    }
    if (locked) hasAccess = false;
  }

  const idx = flat.findIndex((l) => l.id === lesson.id);
  return {
    id: lesson.id,
    title: lesson.title,
    lessonType: lesson.lessonType,
    durationMinutes: lesson.durationMinutes,
    isPreview: lesson.isPreview,
    isRequired: lesson.isRequired,
    // Contenu nullé sans accès — il ne quitte jamais le serveur.
    content: hasAccess ? lesson.content : null,
    videoUrl: hasAccess ? lesson.videoUrl : null,
    externalUrl: hasAccess ? lesson.externalUrl : null,
    resources: hasAccess ? lesson.resources : [],
    hasAccess,
    locked,
    enrolled,
    completed: completed.has(lesson.id),
    module: { id: lesson.module.id, title: lesson.module.title },
    course: { id: course.id, slug: course.slug, title: course.title, unlockMode: course.unlockMode },
    prevLessonId: idx > 0 ? flat[idx - 1].id : null,
    nextLessonId: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1].id : null,
  };
}

export type PlayerLesson = NonNullable<Awaited<ReturnType<typeof getPlayerLesson>>>;

/** Question telle qu'envoyée au client : SANS correctAnswer ni explanation. */
export interface TakingQuestion {
  id: string;
  type: QuestionType;
  question: string;
  /** Choix proposés (SINGLE/MULTIPLE_CHOICE). TRUE_FALSE : options implicites [« Vrai », « Faux »]. */
  options: string[] | null;
  /** MATCHING : colonnes à apparier (droite dans l'ordre d'auteur ; l'appariement correct N'est PAS envoyé). */
  matching: { left: string[]; right: string[] } | null;
  /** ORDERING : items MÉLANGÉS avec leur index d'origine (l'ordre correct N'est PAS envoyé). */
  ordering: { id: number; text: string }[] | null;
  points: number;
  order: number;
}

/**
 * Évaluation à passer : questions SANS `correctAnswer` ni `explanation` —
 * les bonnes réponses ne partent JAMAIS au client avant soumission.
 */
export async function getAssessmentForTaking(assessmentId: string, userId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      passingScore: true,
      attemptsAllowed: true,
      durationMinutes: true,
      shuffleQuestions: true,
      isRequired: true,
      status: true,
      courseId: true,
      course: { select: { slug: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, type: true, question: true, options: true, points: true, order: true },
        // ⚠️ jamais correctAnswer / explanation ici
      },
    },
  });
  if (!assessment || assessment.status !== "PUBLISHED") return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: assessment.courseId } },
    select: { status: true },
  });
  if (!enrollment || !ACQUIRED.includes(enrollment.status)) return null;

  const attemptsUsed = await prisma.assessmentAttempt.count({ where: { assessmentId, userId } });
  const plainQuestions: TakingQuestion[] = assessment.questions.map((q) => {
    const opts = q.options;
    let options: string[] | null = null;
    let matching: { left: string[]; right: string[] } | null = null;
    let ordering: { id: number; text: string }[] | null = null;

    if (q.type === "MATCHING" && opts && typeof opts === "object" && !Array.isArray(opts)) {
      const o = opts as { left?: unknown; right?: unknown };
      const left = Array.isArray(o.left) ? (o.left.filter((x) => typeof x === "string") as string[]) : [];
      const right = Array.isArray(o.right) ? (o.right.filter((x) => typeof x === "string") as string[]) : [];
      // On MÉLANGE la colonne de droite : sinon l'alignement gauche[i] ↔ droite[i]
      // révèle la bonne réponse quand correctAnswer est l'identité (cas d'auteur par
      // défaut). La réponse du client est le TEXTE choisi, comparé serveur (§5 sécurité).
      matching = { left, right: [...right].sort(() => Math.random() - 0.5) };
    } else if (q.type === "ORDERING" && Array.isArray(opts)) {
      // Items MÉLANGÉS. `id` = position D'AFFICHAGE (après mélange), jamais l'index
      // d'auteur : l'ordre correct ne peut donc pas se déduire du payload (§5 sécurité).
      // La réponse renvoyée par le client est la suite des TEXTES (comparée serveur).
      const items = (opts as unknown[]).filter((x): x is string => typeof x === "string");
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      ordering = shuffled.map((text, id) => ({ id, text }));
    } else if (Array.isArray(opts)) {
      options = (opts as unknown[]).filter((x): x is string => typeof x === "string");
    }

    return { id: q.id, type: q.type, question: q.question, options, matching, ordering, points: q.points, order: q.order };
  });
  const questions = assessment.shuffleQuestions ? plainQuestions.sort(() => Math.random() - 0.5) : plainQuestions;

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    passingScore: assessment.passingScore,
    attemptsAllowed: assessment.attemptsAllowed,
    durationMinutes: assessment.durationMinutes,
    isRequired: assessment.isRequired,
    course: assessment.course,
    questions,
    attemptsUsed,
    attemptsRemaining: assessment.attemptsAllowed > 0 ? Math.max(0, assessment.attemptsAllowed - attemptsUsed) : null,
  };
}

export type AssessmentForTaking = NonNullable<Awaited<ReturnType<typeof getAssessmentForTaking>>>;

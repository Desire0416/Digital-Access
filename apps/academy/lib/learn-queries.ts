import { prisma } from "@da/db/client";
import type { Level } from "./types";
import type {
  PlayerCourse,
  PlayerLesson,
  ModuleOutline,
  QuizForRunner,
  DashboardData,
  EnrolledCourseCard,
  MyBadge,
  MyCertificate,
  MyPortfolioItem,
  SkillPassportEntry,
  OpportunityCard,
} from "./learn-types";

/* ══════════════════════════════════════════════════════════════════════════
   Couche de lecture de l'espace apprenant. Le player cible les PARCOURS MÉTIERS.
   Sécurité niveau ligne : chaque requête filtre par l'identifiant de l'apprenant.
   Jamais de bonne réponse de quiz renvoyée au client (voir mapQuizForRunner).
   ══════════════════════════════════════════════════════════════════════════ */

function optionsOf(raw: unknown, type: string): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o));
  if (type === "TRUE_FALSE") return ["Vrai", "Faux"];
  return [];
}

/** Ordre à plat des leçons d'un parcours (module.order puis lesson.order). */
async function courseLessonOrder(careerPathId: string): Promise<string[]> {
  const modules = await prisma.module.findMany({
    where: { careerPathId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { lessons: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" }, select: { id: true } } },
  });
  return modules.flatMap((m) => m.lessons.map((l) => l.id));
}

/** Programme complet d'un parcours + état d'inscription/progression de l'apprenant. */
export async function getCourseForPlayer(slug: string, userId?: string): Promise<PlayerCourse | null> {
  try {
    const path = await prisma.careerPath.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        targetJob: true,
        level: true,
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                lessonType: true,
                estimatedDuration: true,
                isPreview: true,
                _count: { select: { quizzes: true } },
              },
            },
          },
        },
      },
    });
    if (!path) return null;

    const lessonIds = path.modules.flatMap((m) => m.lessons.map((l) => l.id));

    const [enrollment, completedRows] = await Promise.all([
      userId
        ? prisma.enrollment.findFirst({
            where: { learnerId: userId, careerPathId: path.id },
            select: { status: true, progress: true },
          })
        : Promise.resolve(null),
      userId && lessonIds.length
        ? prisma.lessonProgress.findMany({
            where: { learnerId: userId, lessonId: { in: lessonIds } },
            select: { lessonId: true },
          })
        : Promise.resolve([] as { lessonId: string }[]),
    ]);

    const completed = new Set(completedRows.map((r) => r.lessonId));
    const enrolled = Boolean(enrollment);

    const modules: ModuleOutline[] = path.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        lessonType: l.lessonType,
        estimatedDuration: l.estimatedDuration,
        isPreview: l.isPreview,
        hasQuiz: l._count.quizzes > 0,
        completed: completed.has(l.id),
      })),
    }));

    const firstLessonId = lessonIds[0] ?? null;
    const resumeLessonId = lessonIds.find((id) => !completed.has(id)) ?? firstLessonId;

    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      targetJob: path.targetJob,
      level: path.level as Level,
      enrolled,
      enrollmentStatus: enrollment?.status ?? null,
      // Progression dérivée des complétions réelles (cache enrollment.progress ignoré).
      progress:
        enrollment?.status === "COMPLETED"
          ? 100
          : lessonIds.length
            ? Math.round((completed.size / lessonIds.length) * 100)
            : (enrollment?.progress ?? 0),
      modules,
      totalLessons: lessonIds.length,
      completedLessons: completed.size,
      firstLessonId,
      resumeLessonId,
    };
  } catch {
    return null;
  }
}

/** État d'inscription léger pour la page détail d'un parcours (CTA). */
export async function getPathEnrollmentState(
  slug: string,
  userId?: string,
): Promise<{ enrolled: boolean; status: string | null; progress: number; firstLessonId: string | null; resumeLessonId: string | null }> {
  try {
    const path = await prisma.careerPath.findUnique({
      where: { slug },
      select: {
        id: true,
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: { lessons: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" }, select: { id: true } } },
        },
      },
    });
    if (!path) return { enrolled: false, status: null, progress: 0, firstLessonId: null, resumeLessonId: null };
    const ids = path.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const firstLessonId = ids[0] ?? null;
    if (!userId) return { enrolled: false, status: null, progress: 0, firstLessonId, resumeLessonId: firstLessonId };

    const [enr, completedRows] = await Promise.all([
      prisma.enrollment.findFirst({
        where: { learnerId: userId, careerPathId: path.id },
        select: { status: true, progress: true },
      }),
      prisma.lessonProgress.findMany({ where: { learnerId: userId, lessonId: { in: ids } }, select: { lessonId: true } }),
    ]);
    const completed = new Set(completedRows.map((r) => r.lessonId));
    const resumeLessonId = ids.find((id) => !completed.has(id)) ?? firstLessonId;
    return { enrolled: Boolean(enr), status: enr?.status ?? null, progress: enr?.progress ?? 0, firstLessonId, resumeLessonId };
  } catch {
    return { enrolled: false, status: null, progress: 0, firstLessonId: null, resumeLessonId: null };
  }
}

function mapQuizForRunner(quiz: {
  id: string;
  title: string;
  passingScore: number;
  attemptsAllowed: number;
  questions: { id: string; question: string; type: string; options: unknown; points: number }[];
}): QuizForRunner {
  return {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    attemptsAllowed: quiz.attemptsAllowed,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: (q.type as QuizForRunner["questions"][number]["type"]) ?? "SINGLE_CHOICE",
      options: optionsOf(q.options, q.type),
      points: q.points,
    })),
  };
}

/** Leçon détaillée pour le player (contenu, quiz sans réponses, navigation, accès). */
export async function getPlayerLesson(lessonId: string, userId?: string): Promise<PlayerLesson | null> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        lessonType: true,
        content: true,
        videoUrl: true,
        estimatedDuration: true,
        isPreview: true,
        status: true,
        module: {
          select: {
            title: true,
            careerPath: { select: { id: true, slug: true, title: true, targetJob: true } },
          },
        },
        quizzes: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            passingScore: true,
            attemptsAllowed: true,
            questions: {
              orderBy: { order: "asc" },
              select: { id: true, question: true, type: true, options: true, points: true },
            },
          },
        },
      },
    });
    // Player réservé aux parcours métiers ; jamais de leçon non publiée.
    if (!lesson || !lesson.module.careerPath || lesson.status !== "PUBLISHED") return null;
    const path = lesson.module.careerPath;

    const [enrollment, completedRow, order] = await Promise.all([
      userId
        ? prisma.enrollment.findFirst({
            where: { learnerId: userId, careerPathId: path.id },
            select: { id: true },
          })
        : Promise.resolve(null),
      userId
        ? prisma.lessonProgress.findUnique({
            where: { learnerId_lessonId: { learnerId: userId, lessonId } },
            select: { id: true },
          })
        : Promise.resolve(null),
      courseLessonOrder(path.id),
    ]);

    const enrolled = Boolean(enrollment);
    const canAccess = enrolled || lesson.isPreview;
    const idx = order.indexOf(lessonId);

    return {
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lessonType,
      // Le contenu protégé n'est JAMAIS renvoyé au client si la leçon n'est pas
      // accessible (ni dans le HTML SSR, ni dans le payload RSC).
      content: canAccess ? lesson.content : null,
      videoUrl: canAccess ? lesson.videoUrl : null,
      estimatedDuration: lesson.estimatedDuration,
      isPreview: lesson.isPreview,
      completed: Boolean(completedRow),
      canAccess,
      course: { slug: path.slug, title: path.title, targetJob: path.targetJob },
      moduleTitle: lesson.module.title,
      quiz: canAccess && lesson.quizzes[0] ? mapQuizForRunner(lesson.quizzes[0]) : null,
      prevLessonId: idx > 0 ? order[idx - 1] : null,
      nextLessonId: idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null,
      positionLabel: idx >= 0 ? `Leçon ${idx + 1} / ${order.length}` : "",
    };
  } catch {
    return null;
  }
}

/* ─── Tableau de bord ──────────────────────────────────────────────────────── */

async function buildEnrolledCards(
  userId: string,
  enrollments: {
    id: string;
    status: string;
    progress: number;
    careerPath: {
      id: string;
      slug: string;
      title: string;
      targetJob: string;
      level: string;
      coverImage: string | null;
    } | null;
  }[],
): Promise<EnrolledCourseCard[]> {
  const paths = enrollments.map((e) => e.careerPath).filter(Boolean) as NonNullable<
    (typeof enrollments)[number]["careerPath"]
  >[];
  if (!paths.length) return [];

  // Ordre des leçons de chaque parcours + complétions de l'apprenant, en batch.
  const [orders, completedRows] = await Promise.all([
    Promise.all(paths.map((p) => courseLessonOrder(p.id).then((ids) => [p.id, ids] as const))),
    prisma.lessonProgress.findMany({ where: { learnerId: userId }, select: { lessonId: true } }),
  ]);
  const orderByPath = new Map(orders);
  const completed = new Set(completedRows.map((r) => r.lessonId));

  return enrollments
    .filter((e) => e.careerPath)
    .map((e) => {
      const p = e.careerPath!;
      const ids = orderByPath.get(p.id) ?? [];
      const completedLessons = ids.filter((id) => completed.has(id)).length;
      const resumeLessonId = ids.find((id) => !completed.has(id)) ?? ids[0] ?? null;
      // Progression dérivée des complétions réelles (le champ dénormalisé
      // enrollment.progress n'est qu'un cache, potentiellement obsolète).
      const progress =
        e.status === "COMPLETED" ? 100 : ids.length ? Math.round((completedLessons / ids.length) * 100) : e.progress;
      return {
        enrollmentId: e.id,
        slug: p.slug,
        title: p.title,
        targetJob: p.targetJob,
        level: p.level as Level,
        coverImage: p.coverImage,
        status: e.status,
        progress,
        totalLessons: ids.length,
        completedLessons,
        resumeLessonId,
      };
    });
}

export async function getLearnerDashboard(userId: string): Promise<DashboardData | null> {
  try {
    const [user, enrollments, lessonsCompleted, badgeCount, certCount, recent] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, emailVerified: true } }),
      prisma.enrollment.findMany({
        where: { learnerId: userId, careerPathId: { not: null } },
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          status: true,
          progress: true,
          careerPath: {
            select: { id: true, slug: true, title: true, targetJob: true, level: true, coverImage: true },
          },
        },
      }),
      prisma.lessonProgress.count({ where: { learnerId: userId } }),
      prisma.learnerBadge.count({ where: { learnerId: userId } }),
      prisma.certificate.count({ where: { learnerId: userId } }),
      prisma.learnerBadge.findMany({
        where: { learnerId: userId },
        orderBy: { issuedAt: "desc" },
        take: 4,
        select: {
          issuedAt: true,
          badge: { select: { id: true, name: true, description: true, category: true, icon: true } },
        },
      }),
    ]);
    if (!user) return null;

    const cards = await buildEnrolledCards(userId, enrollments);
    const inProgress = cards.filter((c) => c.status !== "COMPLETED");
    const done = cards.filter((c) => c.status === "COMPLETED");

    // Prochaine leçon à reprendre : parcours en cours le plus récent avec une leçon restante.
    let nextUp: DashboardData["nextUp"] = null;
    const resumeCard = inProgress.find((c) => c.resumeLessonId);
    if (resumeCard?.resumeLessonId) {
      const l = await prisma.lesson.findUnique({
        where: { id: resumeCard.resumeLessonId },
        select: { id: true, title: true },
      });
      if (l) {
        nextUp = { slug: resumeCard.slug, courseTitle: resumeCard.title, lessonId: l.id, lessonTitle: l.title };
      }
    }

    return {
      name: user.name,
      emailVerified: Boolean(user.emailVerified),
      stats: {
        enrolled: cards.length,
        completed: done.length,
        lessonsCompleted,
        badges: badgeCount,
        certificates: certCount,
      },
      inProgress,
      completed: done,
      nextUp,
      recentBadges: recent.map((r) => ({
        id: r.badge.id,
        name: r.badge.name,
        description: r.badge.description,
        category: r.badge.category,
        icon: r.badge.icon,
        issuedAt: r.issuedAt.toISOString(),
        earned: true,
      })),
    };
  } catch {
    return null;
  }
}

export async function getMyEnrollments(userId: string): Promise<EnrolledCourseCard[]> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { learnerId: userId, careerPathId: { not: null } },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        status: true,
        progress: true,
        careerPath: {
          select: { id: true, slug: true, title: true, targetJob: true, level: true, coverImage: true },
        },
      },
    });
    return buildEnrolledCards(userId, enrollments);
  } catch {
    return [];
  }
}

/** Badges : ceux obtenus (earned) puis une sélection de badges à débloquer. */
export async function getMyBadges(userId: string): Promise<MyBadge[]> {
  try {
    const [earned, published] = await Promise.all([
      prisma.learnerBadge.findMany({
        where: { learnerId: userId },
        orderBy: { issuedAt: "desc" },
        select: {
          issuedAt: true,
          badge: { select: { id: true, name: true, description: true, category: true, icon: true } },
        },
      }),
      prisma.badge.findMany({
        where: { status: "PUBLISHED" },
        take: 24,
        select: { id: true, name: true, description: true, category: true, icon: true },
      }),
    ]);
    const earnedIds = new Set(earned.map((e) => e.badge.id));
    const earnedCards: MyBadge[] = earned.map((e) => ({
      id: e.badge.id,
      name: e.badge.name,
      description: e.badge.description,
      category: e.badge.category,
      icon: e.badge.icon,
      issuedAt: e.issuedAt.toISOString(),
      earned: true,
    }));
    const lockedCards: MyBadge[] = published
      .filter((b) => !earnedIds.has(b.id))
      .map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        category: b.category,
        icon: b.icon,
        issuedAt: null,
        earned: false,
      }));
    return [...earnedCards, ...lockedCards];
  } catch {
    return [];
  }
}

export async function getMyCertificates(userId: string): Promise<MyCertificate[]> {
  try {
    const rows = await prisma.certificate.findMany({
      where: { learnerId: userId },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        title: true,
        certificateType: true,
        certificateNumber: true,
        mention: true,
        finalScore: true,
        verificationUrl: true,
        issuedAt: true,
        skillsValidated: true,
      },
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      certificateType: c.certificateType,
      certificateNumber: c.certificateNumber,
      mention: c.mention,
      finalScore: c.finalScore,
      verificationUrl: c.verificationUrl,
      issuedAt: c.issuedAt.toISOString(),
      skillsValidated: c.skillsValidated,
    }));
  } catch {
    return [];
  }
}

export async function getMyPortfolio(userId: string): Promise<MyPortfolioItem[]> {
  try {
    const rows = await prisma.portfolioItem.findMany({
      where: { learnerId: userId },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        toolsUsed: true,
        skillsUsed: true,
        images: true,
        demoUrl: true,
        sourceUrl: true,
        visibility: true,
        createdAt: true,
      },
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      toolsUsed: p.toolsUsed,
      skillsUsed: p.skillsUsed,
      images: p.images,
      demoUrl: p.demoUrl,
      sourceUrl: p.sourceUrl,
      visibility: p.visibility,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Passeport de compétences : compétences des parcours suivis + validation par certificat. */
export async function getSkillsPassport(userId: string): Promise<SkillPassportEntry[]> {
  try {
    const [enrollments, certificates] = await Promise.all([
      prisma.enrollment.findMany({
        where: { learnerId: userId, careerPathId: { not: null } },
        select: {
          careerPath: {
            select: {
              title: true,
              skills: { select: { skill: { select: { slug: true, name: true, category: true } } } },
            },
          },
        },
      }),
      prisma.certificate.findMany({ where: { learnerId: userId }, select: { skillsValidated: true } }),
    ]);

    const validatedNames = new Set(certificates.flatMap((c) => c.skillsValidated.map((s) => s.toLowerCase())));
    const bySlug = new Map<string, SkillPassportEntry>();
    for (const e of enrollments) {
      const p = e.careerPath;
      if (!p) continue;
      for (const cs of p.skills) {
        const s = cs.skill;
        const entry = bySlug.get(s.slug);
        if (entry) {
          if (!entry.fromPaths.includes(p.title)) entry.fromPaths.push(p.title);
        } else {
          bySlug.set(s.slug, {
            slug: s.slug,
            name: s.name,
            category: s.category,
            fromPaths: [p.title],
            validated: validatedNames.has(s.name.toLowerCase()),
          });
        }
      }
    }
    return [...bySlug.values()].sort((a, b) => Number(b.validated) - Number(a.validated) || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** Opportunités publiées, triées par recouvrement avec les compétences de l'apprenant. */
export async function getRecommendedOpportunities(userId: string): Promise<OpportunityCard[]> {
  try {
    const [enrollments, opportunities] = await Promise.all([
      prisma.enrollment.findMany({
        where: { learnerId: userId, careerPathId: { not: null } },
        select: { careerPath: { select: { skills: { select: { skill: { select: { name: true } } } } } } },
      }),
      prisma.opportunity.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          type: true,
          location: true,
          remote: true,
          requiredSkills: true,
          company: { select: { name: true } },
        },
      }),
    ]);

    const mySkills = new Set(
      enrollments.flatMap((e) => e.careerPath?.skills.map((s) => s.skill.name.toLowerCase()) ?? []),
    );

    return opportunities
      .map((o) => {
        const req = o.requiredSkills.map((s) => s.toLowerCase());
        const matched = req.filter((s) => mySkills.has(s)).length;
        const matchScore = req.length ? Math.round((matched / req.length) * 100) : 0;
        return {
          id: o.id,
          title: o.title,
          type: o.type,
          companyName: o.company.name,
          location: o.location,
          remote: o.remote,
          requiredSkills: o.requiredSkills,
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch {
    return [];
  }
}

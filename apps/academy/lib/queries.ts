import { prisma } from "@da/db/client";
import type {
  CategoryItem,
  CourseCardData,
  CourseDetailData,
  DashboardData,
  EnrollmentInfo,
  PlayerChapter,
  PlayerData,
  QuizData,
} from "./types";

/* ─────────────────────────── Sélections partagées ─────────────────────────── */

const courseCardSelect = {
  id: true,
  title: true,
  slug: true,
  subtitle: true,
  coverImage: true,
  price: true,
  isFree: true,
  level: true,
  rating: true,
  ratingCount: true,
  enrollmentCount: true,
  durationMinutes: true,
  category: { select: { name: true, slug: true, color: true, icon: true } },
  instructor: { select: { name: true, avatar: true } },
  modules: { select: { _count: { select: { chapters: true } } } },
} as const;

type CourseCardRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  coverImage: string | null;
  price: number;
  isFree: boolean;
  level: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  durationMinutes: number;
  category: { name: string; slug: string; color: string | null; icon: string | null };
  instructor: { name: string; avatar: string | null };
  modules: { _count: { chapters: number } }[];
};

function toCard(row: CourseCardRow): CourseCardData {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    coverImage: row.coverImage,
    price: row.price,
    isFree: row.isFree,
    level: row.level as CourseCardData["level"],
    rating: row.rating,
    ratingCount: row.ratingCount,
    enrollmentCount: row.enrollmentCount,
    durationMinutes: row.durationMinutes,
    chapterCount: row.modules.reduce((n, m) => n + m._count.chapters, 0),
    category: row.category,
    instructor: row.instructor,
  };
}

/* ─────────────────────────────── Catalogue ─────────────────────────────────── */

export async function getCategories(): Promise<CategoryItem[]> {
  const cats = await prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
      _count: { select: { courses: { where: { status: "PUBLISHED", deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    courseCount: c._count.courses,
  }));
}

export interface CourseFilters {
  q?: string;
  category?: string; // slug
  level?: string; // BEGINNER | INTERMEDIATE | ADVANCED
  price?: "free" | "paid";
  sort?: "popular" | "recent" | "rating";
}

export async function getCourses(filters: CourseFilters = {}): Promise<CourseCardData[]> {
  const { q, category, level, price, sort } = filters;
  const rows = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(category ? { category: { slug: category } } : {}),
      ...(level && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)
        ? { level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" }
        : {}),
      ...(price === "free" ? { isFree: true } : price === "paid" ? { isFree: false } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { subtitle: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: courseCardSelect,
    orderBy:
      sort === "recent"
        ? { publishedAt: "desc" }
        : sort === "rating"
          ? { rating: "desc" }
          : { enrollmentCount: "desc" },
    take: 60,
  });
  return rows.map(toCard);
}

export async function getFeaturedCourses(limit = 4): Promise<CourseCardData[]> {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: courseCardSelect,
    orderBy: { enrollmentCount: "desc" },
    take: limit,
  });
  return rows.map(toCard);
}

/* ─────────────────────────── Détail d'un cours ─────────────────────────────── */

export async function getCourseDetail(slug: string): Promise<CourseDetailData | null> {
  const row = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: {
      ...courseCardSelect,
      description: true,
      objectives: true,
      prerequisites: true,
      language: true,
      publishedAt: true,
      instructor: { select: { name: true, avatar: true, bio: true } },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          chapters: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              position: true,
              isPreview: true,
              videoDuration: true,
            },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, avatar: true } },
        },
      },
    },
  });
  if (!row) return null;

  const chapterCount = row.modules.reduce((n, m) => n + m.chapters.length, 0);
  return {
    ...toCard({ ...row, modules: row.modules.map((m) => ({ _count: { chapters: m.chapters.length } })) }),
    chapterCount,
    description: row.description,
    objectives: row.objectives,
    prerequisites: row.prerequisites,
    language: row.language,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    instructorBio: row.instructor.bio,
    modules: row.modules.map((m) => ({
      id: m.id,
      title: m.title,
      position: m.position,
      chapters: m.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type as CourseDetailData["modules"][number]["chapters"][number]["type"],
        position: c.position,
        isPreview: c.isPreview,
        videoDuration: c.videoDuration,
      })),
    })),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    })),
  };
}

/* ─────────────────────────── Inscription (lecture) ─────────────────────────── */

export async function getUserEnrollment(
  userId: string,
  courseId: string,
): Promise<EnrollmentInfo | null> {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: {
      id: true,
      progress: true,
      completedAt: true,
      progresses: { select: { chapterId: true, completed: true, quizScore: true } },
    },
  });
  if (!e) return null;
  const quizScores: Record<string, number> = {};
  for (const p of e.progresses) {
    if (p.quizScore != null) quizScores[p.chapterId] = p.quizScore;
  }
  return {
    id: e.id,
    progress: e.progress,
    completedAt: e.completedAt?.toISOString() ?? null,
    completedChapterIds: e.progresses.filter((p) => p.completed).map((p) => p.chapterId),
    quizScores,
  };
}

/* ─────────────────────────────── Player ────────────────────────────────────── */

export async function getPlayerData(
  userId: string | null,
  slug: string,
  isAdmin = false,
): Promise<PlayerData | null> {
  const course = await prisma.course.findFirst({
    // On ne filtre pas sur PUBLISHED : un instructeur/admin peut prévisualiser
    // son propre brouillon. Le contrôle d'accès est fait juste après.
    where: { slug, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      isFree: true,
      status: true,
      instructorId: true,
      instructor: { select: { name: true, avatar: true } },
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          chapters: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              position: true,
              isPreview: true,
              videoDuration: true,
              content: true,
              videoUrl: true,
              resources: true,
              quiz: {
                select: {
                  id: true,
                  passingScore: true,
                  maxAttempts: true,
                  timeLimit: true,
                  questions: {
                    orderBy: { position: "asc" },
                    select: {
                      id: true,
                      question: true,
                      options: true,
                      correctAnswers: true,
                      explanation: true,
                      position: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!course) return null;

  // Propriétaire du cours ou admin → accès complet (prévisualisation studio).
  const isPrivileged = isAdmin || (userId !== null && course.instructorId === userId);
  // Un cours non publié n'est visible que par un utilisateur privilégié.
  if (course.status !== "PUBLISHED" && !isPrivileged) return null;

  const enrollment = userId ? await getUserEnrollment(userId, course.id) : null;
  const hasAccess = Boolean(enrollment) || isPrivileged;

  const mapQuiz = (q: NonNullable<
    (typeof course.modules)[number]["chapters"][number]["quiz"]
  > | null): QuizData | null =>
    q
      ? {
          id: q.id,
          passingScore: q.passingScore,
          maxAttempts: q.maxAttempts,
          timeLimit: q.timeLimit,
          questions: q.questions.map((question) => ({
            id: question.id,
            question: question.question,
            options: question.options,
            correctAnswers: question.correctAnswers,
            explanation: question.explanation,
            position: question.position,
            multiple: question.correctAnswers.length > 1,
          })),
        }
      : null;

  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    position: m.position,
    chapters: m.chapters.map((c): PlayerChapter => {
      const unlocked = hasAccess || c.isPreview;
      return {
        id: c.id,
        title: c.title,
        type: c.type as PlayerChapter["type"],
        position: c.position,
        isPreview: c.isPreview,
        videoDuration: c.videoDuration,
        content: unlocked ? c.content : null,
        videoUrl: unlocked ? c.videoUrl : null,
        resources: unlocked
          ? ((c.resources as { label: string; url: string }[] | null) ?? [])
          : [],
        quiz: unlocked ? mapQuiz(c.quiz) : null,
        locked: !unlocked,
      };
    }),
  }));

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      isFree: course.isFree,
      instructor: course.instructor,
    },
    modules,
    flatChapters: modules.flatMap((m) => m.chapters),
    enrollment,
  };
}

/* ───────────────────────── Dashboard apprenant ─────────────────────────────── */

export async function getDashboard(userId: string): Promise<DashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, streak: true, xp: true },
  });
  if (!user) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      progress: true,
      completedAt: true,
      createdAt: true,
      course: { select: courseCardSelect },
      progresses: { select: { chapterId: true, completed: true } },
    },
  });

  // Reprise de lecture : premier chapitre non complété, dans l'ordre pédagogique.
  const courseIds = enrollments.map((e) => e.course.id);
  const chapterOrder = await prisma.module.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { position: "asc" },
    select: {
      courseId: true,
      chapters: { orderBy: { position: "asc" }, select: { id: true, videoDuration: true } },
    },
  });
  const orderedByCourse = new Map<string, { id: string; videoDuration: number }[]>();
  for (const m of chapterOrder) {
    const arr = orderedByCourse.get(m.courseId) ?? [];
    arr.push(...m.chapters);
    orderedByCourse.set(m.courseId, arr);
  }

  let chaptersCompleted = 0;
  let minutesLearned = 0;

  const dashEnrollments = enrollments.map((e) => {
    const completedIds = new Set(
      e.progresses.filter((p) => p.completed).map((p) => p.chapterId),
    );
    chaptersCompleted += completedIds.size;
    const ordered = orderedByCourse.get(e.course.id) ?? [];
    for (const ch of ordered) {
      if (completedIds.has(ch.id)) minutesLearned += Math.round(ch.videoDuration / 60) || 8;
    }
    const next = ordered.find((ch) => !completedIds.has(ch.id));
    return {
      course: toCard(e.course),
      progress: e.progress,
      completedAt: e.completedAt?.toISOString() ?? null,
      enrolledAt: e.createdAt.toISOString(),
      nextChapterId: next?.id ?? null,
      completedChapters: completedIds.size,
    };
  });

  return {
    user,
    enrollments: dashEnrollments,
    stats: {
      inProgress: dashEnrollments.filter((e) => !e.completedAt).length,
      completed: dashEnrollments.filter((e) => Boolean(e.completedAt)).length,
      chaptersCompleted,
      minutesLearned,
    },
  };
}

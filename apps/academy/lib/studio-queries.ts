import { prisma } from "@da/db/client";
import type {
  InstructorDashboard,
  StudioCourseEdit,
  StudioCourseListItem,
  AdminCourseItem,
} from "./studio-types";

/* ─────────────────────────── Dashboard instructeur ─────────────────────────── */

export async function getInstructorDashboard(
  userId: string,
): Promise<InstructorDashboard> {
  const courses = await prisma.course.findMany({
    where: { instructorId: userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverImage: true,
      level: true,
      price: true,
      isFree: true,
      rating: true,
      ratingCount: true,
      enrollmentCount: true,
      reviewNote: true,
      updatedAt: true,
      category: { select: { name: true } },
      modules: { select: { _count: { select: { chapters: true } } } },
    },
  });

  const list: StudioCourseListItem[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status as StudioCourseListItem["status"],
    coverImage: c.coverImage,
    level: c.level as StudioCourseListItem["level"],
    price: c.price,
    isFree: c.isFree,
    category: c.category.name,
    enrollmentCount: c.enrollmentCount,
    rating: c.rating,
    ratingCount: c.ratingCount,
    chapterCount: c.modules.reduce((n, m) => n + m._count.chapters, 0),
    reviewNote: c.reviewNote,
    updatedAt: c.updatedAt.toISOString(),
  }));

  const published = list.filter((c) => c.status === "PUBLISHED");
  const rated = published.filter((c) => c.ratingCount > 0);

  // Revenus : paiements COURSE COMPLETED sur les cours de l'instructeur.
  const courseIds = list.map((c) => c.id);
  const revenueAgg =
    courseIds.length > 0
      ? await prisma.payment.aggregate({
          where: { type: "COURSE", status: "COMPLETED", courseId: { in: courseIds } },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } };

  return {
    stats: {
      totalCourses: list.length,
      published: published.length,
      inReview: list.filter((c) => c.status === "REVIEW").length,
      drafts: list.filter((c) => c.status === "DRAFT").length,
      totalStudents: published.reduce((n, c) => n + c.enrollmentCount, 0),
      avgRating:
        rated.length > 0
          ? Math.round((rated.reduce((s, c) => s + c.rating, 0) / rated.length) * 10) / 10
          : 0,
      revenue: revenueAgg._sum.amount ?? 0,
    },
    courses: list,
  };
}

/* ─────────────────────── Cours à éditer (propriété vérifiée) ────────────────── */

export async function getCourseForEdit(
  userId: string,
  courseId: string,
  isAdmin: boolean,
): Promise<StudioCourseEdit | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      description: true,
      coverImage: true,
      price: true,
      isFree: true,
      level: true,
      language: true,
      status: true,
      categoryId: true,
      objectives: true,
      prerequisites: true,
      reviewNote: true,
      instructorId: true,
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
              content: true,
              videoUrl: true,
              videoDuration: true,
              isPreview: true,
              position: true,
              resources: true,
              quiz: {
                select: {
                  id: true,
                  passingScore: true,
                  maxAttempts: true,
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
  // Contrôle de propriété : seul le propriétaire ou un admin peut éditer.
  if (course.instructorId !== userId && !isAdmin) return null;

  const chapterCount = course.modules.reduce((n, m) => n + m.chapters.length, 0);

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle,
    description: course.description,
    coverImage: course.coverImage,
    price: course.price,
    isFree: course.isFree,
    level: course.level as StudioCourseEdit["level"],
    language: course.language,
    status: course.status as StudioCourseEdit["status"],
    categoryId: course.categoryId,
    objectives: course.objectives,
    prerequisites: course.prerequisites,
    reviewNote: course.reviewNote,
    chapterCount,
    isAdmin,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      position: m.position,
      chapters: m.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type as StudioCourseEdit["modules"][number]["chapters"][number]["type"],
        content: c.content,
        videoUrl: c.videoUrl,
        videoDuration: c.videoDuration,
        isPreview: c.isPreview,
        position: c.position,
        resources: (c.resources as { label: string; url: string }[] | null) ?? [],
        quiz: c.quiz
          ? {
              id: c.quiz.id,
              passingScore: c.quiz.passingScore,
              maxAttempts: c.quiz.maxAttempts,
              questions: c.quiz.questions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswers: q.correctAnswers,
                explanation: q.explanation,
                position: q.position,
              })),
            }
          : null,
      })),
    })),
  };
}

/* ─────────────────────────── File de validation (admin) ────────────────────── */

function toAdminItem(c: {
  id: string;
  title: string;
  slug: string;
  status: string;
  level: string;
  price: number;
  isFree: boolean;
  updatedAt: Date;
  reviewNote: string | null;
  enrollmentCount: number;
  category: { name: string };
  instructor: { name: string; email: string; avatar: string | null };
  modules: { _count: { chapters: number } }[];
}): AdminCourseItem {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status as AdminCourseItem["status"],
    level: c.level as AdminCourseItem["level"],
    category: c.category.name,
    price: c.price,
    isFree: c.isFree,
    chapterCount: c.modules.reduce((n, m) => n + m._count.chapters, 0),
    enrollmentCount: c.enrollmentCount,
    instructor: c.instructor,
    submittedAt: c.updatedAt.toISOString(),
    reviewNote: c.reviewNote,
  };
}

export async function getAdminCourses(): Promise<{
  review: AdminCourseItem[];
  published: AdminCourseItem[];
}> {
  const select = {
    id: true,
    title: true,
    slug: true,
    status: true,
    level: true,
    price: true,
    isFree: true,
    updatedAt: true,
    reviewNote: true,
    enrollmentCount: true,
    category: { select: { name: true } },
    instructor: { select: { name: true, email: true, avatar: true } },
    modules: { select: { _count: { select: { chapters: true } } } },
  } as const;

  const [review, published] = await Promise.all([
    prisma.course.findMany({
      where: { status: "REVIEW", deletedAt: null },
      orderBy: { updatedAt: "asc" },
      select,
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select,
    }),
  ]);

  return { review: review.map(toAdminItem), published: published.map(toAdminItem) };
}

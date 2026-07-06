import { prisma } from "@da/db/client";
import type { CourseLevel, CourseStatus } from "@/lib/studio-types";

/* ══════════════════════════════════════════════════════════════════════════
   Requête locale à la page « Cours » de l'admin Academy.
   getAdminCourses() (studio-queries) ne renvoie QUE les cours en validation et
   publiés — cette page doit gérer TOUS les cours (brouillons compris). On lit
   donc directement la base, en lecture seule, sans toucher à studio-queries.ts.
   ══════════════════════════════════════════════════════════════════════════ */

/** Cours enrichi pour la gestion admin (toutes statuts confondus). */
export interface AdminManagedCourse {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  level: CourseLevel;
  coverImage: string | null;
  category: string;
  categorySlug: string;
  price: number;
  isFree: boolean;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  chapterCount: number;
  reviewNote: string | null;
  instructorId: string;
  instructor: { name: string; email: string; avatar: string | null };
  updatedAt: string; // ISO
}

/** Instructeur assignable (rôle INSTRUCTOR, compte actif). */
export interface InstructorOption {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  courseCount: number;
}

export interface AdminCoursesData {
  courses: AdminManagedCourse[];
  counts: {
    total: number;
    published: number;
    review: number;
    draft: number;
  };
}

/**
 * Charge l'ensemble des cours non supprimés pour la gestion admin.
 * Les compteurs KPI portent sur la totalité (avant tout filtre searchParams),
 * afin que les cartes cliquables reflètent le vrai volume par statut.
 */
export async function getAdminManagedCourses(): Promise<AdminCoursesData> {
  const rows = await prisma.course.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      level: true,
      coverImage: true,
      price: true,
      isFree: true,
      rating: true,
      ratingCount: true,
      enrollmentCount: true,
      reviewNote: true,
      updatedAt: true,
      instructorId: true,
      category: { select: { name: true, slug: true } },
      instructor: { select: { name: true, email: true, avatar: true } },
      modules: { select: { _count: { select: { chapters: true } } } },
    },
  });

  const courses: AdminManagedCourse[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status as CourseStatus,
    level: c.level as CourseLevel,
    coverImage: c.coverImage,
    category: c.category.name,
    categorySlug: c.category.slug,
    price: c.price,
    isFree: c.isFree,
    rating: c.rating,
    ratingCount: c.ratingCount,
    enrollmentCount: c.enrollmentCount,
    chapterCount: c.modules.reduce((n, m) => n + m._count.chapters, 0),
    reviewNote: c.reviewNote,
    instructorId: c.instructorId,
    instructor: c.instructor,
    updatedAt: c.updatedAt.toISOString(),
  }));

  return {
    courses,
    counts: {
      total: courses.length,
      published: courses.filter((c) => c.status === "PUBLISHED").length,
      review: courses.filter((c) => c.status === "REVIEW").length,
      draft: courses.filter((c) => c.status === "DRAFT").length,
    },
  };
}

/** Liste des instructeurs assignables (rôle INSTRUCTOR, non supprimés). */
export async function getInstructors(): Promise<InstructorOption[]> {
  const rows = await prisma.user.findMany({
    where: { roles: { has: "INSTRUCTOR" }, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: { select: { coursesCreated: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    courseCount: u._count.coursesCreated,
  }));
}

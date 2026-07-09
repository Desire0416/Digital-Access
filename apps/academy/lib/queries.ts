import { prisma } from "@da/db/client";
import type {
  SchoolCard,
  SchoolDetail,
  CareerPathCard,
  CareerPathDetail,
  ShortCourseCard,
  AcademyStats,
  Level,
} from "./types";

/* ══════════════════════════════════════════════════════════════════════════
   Couche de données publique de Digital Access Academy (refonte 2026).
   École → Parcours métier → Module → Leçon. Requêtes protégées (try/catch →
   valeur vide) pour rester résiliente si la base est momentanément injoignable.
   ══════════════════════════════════════════════════════════════════════════ */

function mapPathCard(p: {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  targetJob: string;
  level: string;
  duration: string | null;
  price: number;
  coverImage: string | null;
  featured: boolean;
  school: { name: string; slug: string };
  _count: { modules: number; projects: number };
}): CareerPathCard {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    targetJob: p.targetJob,
    level: p.level as Level,
    duration: p.duration,
    price: p.price,
    coverImage: p.coverImage,
    featured: p.featured,
    schoolName: p.school.name,
    schoolSlug: p.school.slug,
    moduleCount: p._count.modules,
    projectCount: p._count.projects,
  };
}

const pathCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  targetJob: true,
  level: true,
  duration: true,
  price: true,
  coverImage: true,
  featured: true,
  school: { select: { name: true, slug: true } },
  _count: { select: { modules: true, projects: true } },
} as const;

function mapShortCard(c: {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  level: string;
  duration: string | null;
  price: number;
  courseType: string | null;
  coverImage: string | null;
  school: { name: string; slug: string };
}): ShortCourseCard {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    level: c.level as Level,
    duration: c.duration,
    price: c.price,
    courseType: c.courseType,
    coverImage: c.coverImage,
    schoolName: c.school.name,
    schoolSlug: c.school.slug,
  };
}

const shortCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  level: true,
  duration: true,
  price: true,
  courseType: true,
  coverImage: true,
  school: { select: { name: true, slug: true } },
} as const;

/** Toutes les écoles publiées, avec leurs compteurs. */
export async function getSchools(): Promise<SchoolCard[]> {
  try {
    const rows = await prisma.school.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        icon: true,
        color: true,
        _count: { select: { careerPaths: true, shortCourses: true } },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      icon: s.icon,
      color: s.color,
      careerPathCount: s._count.careerPaths,
      shortCourseCount: s._count.shortCourses,
    }));
  } catch {
    return [];
  }
}

/** Une école + ses parcours et formations courtes publiés. */
export async function getSchool(slug: string): Promise<SchoolDetail | null> {
  try {
    const s = await prisma.school.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        longDescription: true,
        icon: true,
        color: true,
        _count: { select: { careerPaths: true, shortCourses: true } },
        careerPaths: {
          where: { status: "PUBLISHED" },
          orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
          select: pathCardSelect,
        },
        shortCourses: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "asc" },
          select: shortCardSelect,
        },
      },
    });
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      longDescription: s.longDescription,
      icon: s.icon,
      color: s.color,
      careerPathCount: s._count.careerPaths,
      shortCourseCount: s._count.shortCourses,
      careerPaths: s.careerPaths.map(mapPathCard),
      shortCourses: s.shortCourses.map(mapShortCard),
    };
  } catch {
    return null;
  }
}

export interface CatalogueFilters {
  schoolSlug?: string;
  level?: string;
  search?: string;
  price?: "free" | "paid";
  sort?: "recent" | "price-asc" | "price-desc" | "az";
}

const VALID_LEVELS = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);

function catalogueWhere(f: CatalogueFilters) {
  const search = f.search?.trim();
  const level = f.level && VALID_LEVELS.has(f.level) ? f.level : undefined;
  return {
    status: "PUBLISHED" as const,
    ...(f.schoolSlug ? { school: { slug: f.schoolSlug } } : {}),
    ...(level ? { level: level as never } : {}),
    ...(f.price === "free" ? { price: { lte: 0 } } : f.price === "paid" ? { price: { gt: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { shortDescription: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

/** Tri du catalogue (par défaut : vedettes puis ancienneté). */
function catalogueOrderBy(sort?: string) {
  switch (sort) {
    case "price-asc": return [{ price: "asc" as const }];
    case "price-desc": return [{ price: "desc" as const }];
    case "az": return [{ title: "asc" as const }];
    case "recent": return [{ createdAt: "desc" as const }];
    default: return [{ featured: "desc" as const }, { createdAt: "asc" as const }];
  }
}

/** Parcours métiers publiés, filtres optionnels (école, niveau, recherche). */
export async function getCareerPaths(filters: CatalogueFilters = {}): Promise<CareerPathCard[]> {
  try {
    const search = filters.search?.trim();
    const rows = await prisma.careerPath.findMany({
      where: {
        ...catalogueWhere(filters),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { shortDescription: { contains: search, mode: "insensitive" as const } },
                { targetJob: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: catalogueOrderBy(filters.sort),
      select: pathCardSelect,
    });
    return rows.map(mapPathCard);
  } catch {
    return [];
  }
}

export async function getFeaturedCareerPaths(limit = 6): Promise<CareerPathCard[]> {
  try {
    const rows = await prisma.careerPath.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: pathCardSelect,
    });
    return rows.map(mapPathCard);
  } catch {
    return [];
  }
}

/** Un parcours métier détaillé (programme, compétences, projets). */
export async function getCareerPath(slug: string): Promise<CareerPathDetail | null> {
  try {
    const p = await prisma.careerPath.findUnique({
      where: { slug },
      select: {
        ...pathCardSelect,
        longDescription: true,
        estimatedHours: true,
        prerequisites: true,
        objectives: true,
        outcomes: true,
        tools: true,
        certificateTitle: true,
        skills: {
          select: { skill: { select: { name: true, slug: true, category: true } } },
        },
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, lessonType: true, estimatedDuration: true },
            },
          },
        },
        projects: {
          orderBy: { createdAt: "asc" },
          select: { id: true, title: true, slug: true, projectType: true, level: true },
        },
      },
    });
    if (!p) return null;
    return {
      ...mapPathCard(p),
      longDescription: p.longDescription,
      estimatedHours: p.estimatedHours,
      prerequisites: p.prerequisites,
      objectives: p.objectives,
      outcomes: p.outcomes,
      tools: p.tools,
      certificateTitle: p.certificateTitle,
      skills: p.skills.map((s) => s.skill),
      modules: p.modules,
      projects: p.projects.map((pr) => ({ ...pr, level: pr.level as Level })),
    };
  } catch {
    return null;
  }
}

/** Formations courtes publiées, filtres optionnels (école, niveau, recherche). */
export async function getShortCourses(filters: CatalogueFilters = {}): Promise<ShortCourseCard[]> {
  try {
    const rows = await prisma.shortCourse.findMany({
      where: catalogueWhere(filters),
      orderBy: catalogueOrderBy(filters.sort),
      select: shortCardSelect,
    });
    return rows.map(mapShortCard);
  } catch {
    return [];
  }
}

/** Formations courtes mises en avant (pour la page d'accueil). */
export async function getFeaturedShortCourses(limit = 4): Promise<ShortCourseCard[]> {
  try {
    const rows = await prisma.shortCourse.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: shortCardSelect,
    });
    return rows.map(mapShortCard);
  } catch {
    return [];
  }
}

/** Une formation courte détaillée. */
export async function getShortCourse(slug: string) {
  try {
    const c = await prisma.shortCourse.findUnique({
      where: { slug },
      select: {
        ...shortCardSelect,
        longDescription: true,
        objectives: true,
        prerequisites: true,
      },
    });
    if (!c) return null;
    return { ...mapShortCard(c), longDescription: c.longDescription, objectives: c.objectives, prerequisites: c.prerequisites };
  } catch {
    return null;
  }
}

/** Compteurs pour la page d'accueil (résilient). */
export async function getAcademyStats(): Promise<AcademyStats> {
  try {
    const [schools, careerPaths, shortCourses, projects, badges] = await Promise.all([
      prisma.school.count({ where: { status: "PUBLISHED" } }),
      prisma.careerPath.count({ where: { status: "PUBLISHED" } }),
      prisma.shortCourse.count({ where: { status: "PUBLISHED" } }),
      prisma.professionalProject.count(),
      prisma.badge.count(),
    ]);
    return { schools, careerPaths, shortCourses, projects, badges };
  } catch {
    return { schools: 0, careerPaths: 0, shortCourses: 0, projects: 0, badges: 0 };
  }
}

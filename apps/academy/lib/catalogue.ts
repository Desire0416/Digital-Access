import "server-only";
import { prisma, type CourseLevel, type Prisma } from "@da/academy-db/client";
import { ACQUIRED_STATUSES, computeCareerPathPricing, type CareerPathPricing } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Catalogue public — lectures seules (cahier §9 accueil, §10 formations,
   §11 fiche formation, §13 parcours, §14 écoles, §32 recherche).
   PRINCIPE : la formation est unique et RÉUTILISÉE via les jonctions
   SchoolCourse / CareerPathCourse / SchoolCareerPath — jamais dupliquée.
   Aucune donnée sensible (correctAnswer) ne sort d'ici.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED = [...ACQUIRED_STATUSES];

function averageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}

/* ─── Sélections réutilisables ──────────────────────────────────────────────── */

const courseCardSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  level: true,
  durationHours: true,
  price: true,
  coverImage: true,
  featured: true,
  certificateTitle: true,
  publishedAt: true,
  modules: { where: { status: "PUBLISHED" as const }, select: { id: true } },
  projects: { where: { status: "PUBLISHED" as const }, select: { id: true } },
  schools: {
    where: { isPrimary: true },
    select: { school: { select: { name: true, slug: true, color: true, icon: true } } },
    take: 1,
  },
  reviews: { where: { status: "APPROVED" as const }, select: { rating: true } },
  _count: { select: { enrollments: { where: { status: { in: ACQUIRED } } } } },
} satisfies Prisma.CourseSelect;

type CourseCardRow = Prisma.CourseGetPayload<{ select: typeof courseCardSelect }>;

export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  level: CourseLevel;
  durationHours: number | null;
  price: number;
  coverImage: string | null;
  featured: boolean;
  hasCertificate: boolean;
  hasProject: boolean;
  modulesCount: number;
  primarySchool: { name: string; slug: string; color: string; icon: string } | null;
  rating: number | null;
  reviewsCount: number;
  enrolledCount: number;
  publishedAt: Date | null;
}

function toCourseCard(c: CourseCardRow): CourseCard {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    level: c.level,
    durationHours: c.durationHours,
    price: c.price,
    coverImage: c.coverImage,
    featured: c.featured,
    hasCertificate: true, // toute formation validée délivre un certificat (§20.2)
    hasProject: c.projects.length > 0,
    modulesCount: c.modules.length,
    primarySchool: c.schools[0]?.school ?? null,
    rating: averageRating(c.reviews),
    reviewsCount: c.reviews.length,
    enrolledCount: c._count.enrollments,
    publishedAt: c.publishedAt,
  };
}

const careerPathCardSelect = {
  id: true,
  slug: true,
  title: true,
  targetJob: true,
  duration: true,
  rhythm: true,
  entryLevel: true,
  exitLevel: true,
  price: true,
  coverImage: true,
  featured: true,
  certificationTitle: true,
  outcomes: true,
  schools: {
    where: { isPrimary: true },
    select: { school: { select: { name: true, slug: true, color: true, icon: true } } },
    take: 1,
  },
  courses: { select: { id: true } },
  projects: { where: { status: "PUBLISHED" as const }, select: { id: true } },
  _count: { select: { enrollments: { where: { status: { in: ACQUIRED } } } } },
} satisfies Prisma.CareerPathSelect;

type CareerPathCardRow = Prisma.CareerPathGetPayload<{ select: typeof careerPathCardSelect }>;

export interface CareerPathCard {
  id: string;
  slug: string;
  title: string;
  targetJob: string;
  duration: string | null;
  rhythm: string | null;
  entryLevel: CourseLevel;
  exitLevel: CourseLevel;
  price: number;
  coverImage: string | null;
  featured: boolean;
  certificationTitle: string | null;
  outcomes: string[];
  primarySchool: { name: string; slug: string; color: string; icon: string } | null;
  coursesCount: number;
  projectsCount: number;
  enrolledCount: number;
}

function toCareerPathCard(p: CareerPathCardRow): CareerPathCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    targetJob: p.targetJob,
    duration: p.duration,
    rhythm: p.rhythm,
    entryLevel: p.entryLevel,
    exitLevel: p.exitLevel,
    price: p.price,
    coverImage: p.coverImage,
    featured: p.featured,
    certificationTitle: p.certificationTitle,
    outcomes: p.outcomes,
    primarySchool: p.schools[0]?.school ?? null,
    coursesCount: p.courses.length,
    projectsCount: p.projects.length,
    enrolledCount: p._count.enrollments,
  };
}

/* ─── Accueil (§9) ─────────────────────────────────────────────────────────── */

export async function getHomeData() {
  const [featuredPathsRaw, popularCoursesRaw, schoolsRaw, learnersCount, certificatesCount] = await Promise.all([
    prisma.careerPath.findMany({
      where: { status: "PUBLISHED", featured: true },
      select: careerPathCardSelect,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: courseCardSelect,
      orderBy: [{ featured: "desc" }, { enrollments: { _count: "desc" } }],
      take: 8,
    }),
    prisma.school.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        icon: true,
        color: true,
        coverImage: true,
        _count: { select: { courses: true, careerPaths: true } },
      },
    }),
    prisma.user.count({ where: { roles: { has: "LEARNER" } } }),
    prisma.certificate.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    featuredPaths: featuredPathsRaw.map(toCareerPathCard),
    popularCourses: popularCoursesRaw.map(toCourseCard),
    schools: schoolsRaw.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      tagline: s.tagline,
      description: s.description,
      icon: s.icon,
      color: s.color,
      coverImage: s.coverImage,
      coursesCount: s._count.courses,
      careerPathsCount: s._count.careerPaths,
    })),
    stats: { learnersCount, certificatesCount },
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

/* ─── Catalogue des formations (§10) ───────────────────────────────────────── */

export type CourseSort = "recent" | "popular" | "rating" | "price-asc" | "price-desc" | "title";

export interface CourseFilters {
  q?: string;
  schoolSlug?: string;
  level?: CourseLevel;
  price?: "free" | "paid";
  sort?: CourseSort;
}

export async function getCourses(filters: CourseFilters = {}): Promise<CourseCard[]> {
  const where: Prisma.CourseWhereInput = { status: "PUBLISHED" };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }
  if (filters.schoolSlug) where.schools = { some: { school: { slug: filters.schoolSlug } } };
  if (filters.level) where.level = filters.level;
  if (filters.price === "free") where.price = 0;
  if (filters.price === "paid") where.price = { gt: 0 };

  let orderBy: Prisma.CourseOrderByWithRelationInput[] = [{ featured: "desc" }, { publishedAt: "desc" }];
  switch (filters.sort) {
    case "popular":
      orderBy = [{ enrollments: { _count: "desc" } }];
      break;
    case "price-asc":
      orderBy = [{ price: "asc" }];
      break;
    case "price-desc":
      orderBy = [{ price: "desc" }];
      break;
    case "title":
      orderBy = [{ title: "asc" }];
      break;
    case "recent":
      orderBy = [{ publishedAt: "desc" }];
      break;
  }

  const rows = await prisma.course.findMany({ where, select: courseCardSelect, orderBy });
  const cards = rows.map(toCourseCard);
  if (filters.sort === "rating") cards.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return cards;
}

/* ─── Fiche formation (§11) ────────────────────────────────────────────────── */

export async function getCourseDetail(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      objectives: true,
      targetAudience: true,
      prerequisitesText: true,
      tools: true,
      level: true,
      language: true,
      durationHours: true,
      price: true,
      coverImage: true,
      promoVideoUrl: true,
      certificateTitle: true,
      unlockMode: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      modules: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          objectives: true,
          durationMinutes: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            select: { id: true, title: true, lessonType: true, durationMinutes: true, isPreview: true },
          },
        },
      },
      // Évaluations : JAMAIS de questions ni de correctAnswer côté public.
      assessments: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          passingScore: true,
          durationMinutes: true,
          attemptsAllowed: true,
          isRequired: true,
          _count: { select: { questions: true } },
        },
      },
      projects: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, title: true, context: true, objectives: true, deliverables: true, isRequired: true, minScore: true },
      },
      resources: { where: { lessonId: null }, orderBy: { order: "asc" }, select: { id: true, title: true, kind: true, url: true } },
      skills: {
        orderBy: { isPrimary: "desc" },
        select: { targetLevel: true, isPrimary: true, skill: { select: { name: true, slug: true, domain: true } } },
      },
      instructors: {
        orderBy: { order: "asc" },
        select: { roleLabel: true, user: { select: { id: true, name: true, avatar: true, bio: true } } },
      },
      schools: {
        orderBy: { isPrimary: "desc" },
        select: { isPrimary: true, school: { select: { name: true, slug: true, color: true, icon: true } } },
      },
      careerPaths: {
        where: { careerPath: { status: "PUBLISHED" } },
        select: {
          isRequired: true,
          careerPath: { select: { title: true, slug: true, targetJob: true, coverImage: true } },
        },
      },
      requires: {
        // Publiés seulement : cohérent avec le verrou et le badge « acquise »
        // (getPrerequisiteStatus ne compte que les prérequis PUBLIÉS §22.1).
        where: { requiresCourse: { status: "PUBLISHED" } },
        select: { requiresCourse: { select: { title: true, slug: true, level: true } } },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true, avatar: true } } },
      },
      _count: { select: { enrollments: { where: { status: { in: ACQUIRED } } } } },
    },
  });

  if (!course || course.status !== "PUBLISHED") return null;

  const lessonsCount = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  return {
    ...course,
    lessonsCount,
    enrolledCount: course._count.enrollments,
    rating: averageRating(course.reviews),
    reviewsCount: course.reviews.length,
  };
}

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>;

/* ─── Parcours métiers (§13) ───────────────────────────────────────────────── */

export interface CareerPathFilters {
  q?: string;
  schoolSlug?: string;
  entryLevel?: CourseLevel;
}

export async function getCareerPaths(filters: CareerPathFilters = {}): Promise<CareerPathCard[]> {
  const where: Prisma.CareerPathWhereInput = { status: "PUBLISHED" };
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { targetJob: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.schoolSlug) where.schools = { some: { school: { slug: filters.schoolSlug } } };
  if (filters.entryLevel) where.entryLevel = filters.entryLevel;

  const rows = await prisma.careerPath.findMany({
    where,
    select: careerPathCardSelect,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toCareerPathCard);
}

/**
 * Fiche parcours (§13.4) avec reconnaissance des acquis (§13.7) :
 * pour un utilisateur connecté, chaque formation du parcours est marquée
 * « acquise » (Enrollment ACTIVE/COMPLETED) et le prix est recalculé.
 */
export async function getCareerPathDetail(slug: string, userId?: string | null) {
  const path = await prisma.careerPath.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      targetJob: true,
      description: true,
      missions: true,
      outcomes: true,
      entryLevel: true,
      exitLevel: true,
      duration: true,
      rhythm: true,
      price: true,
      certificationTitle: true,
      coverImage: true,
      status: true,
      phases: { orderBy: { order: "asc" }, select: { id: true, title: true, description: true, order: true } },
      courses: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          isRequired: true,
          phaseId: true,
          prerequisiteCourseId: true,
          creditValue: true,
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              subtitle: true,
              level: true,
              durationHours: true,
              price: true,
              coverImage: true,
              status: true,
              modules: { where: { status: "PUBLISHED" }, select: { id: true } },
            },
          },
        },
      },
      schools: {
        orderBy: { isPrimary: "desc" },
        select: { isPrimary: true, school: { select: { name: true, slug: true, color: true, icon: true } } },
      },
      projects: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, title: true, context: true, objectives: true, deliverables: true, isRequired: true },
      },
      _count: { select: { enrollments: { where: { status: { in: ACQUIRED } } } } },
    },
  });

  if (!path || path.status !== "PUBLISHED") return null;

  // Reconnaissance des acquis pour l'utilisateur connecté.
  let acquiredMap = new Map<string, { status: string; progress: number }>();
  let pathEnrollment: { status: string; progress: number } | null = null;
  let pricing: CareerPathPricing = { fullPrice: path.price, deduction: 0, finalPrice: path.price, acquiredCourses: [] };

  if (userId) {
    const courseIds = path.courses.map((c) => c.course.id);
    const [enrollments, pe, computed] = await Promise.all([
      courseIds.length
        ? prisma.enrollment.findMany({
            where: { userId, courseId: { in: courseIds }, status: { in: ACQUIRED } },
            select: { courseId: true, status: true, progress: true },
          })
        : Promise.resolve([]),
      prisma.careerPathEnrollment.findUnique({
        where: { userId_careerPathId: { userId, careerPathId: path.id } },
        select: { status: true, progress: true },
      }),
      computeCareerPathPricing(path.id, userId),
    ]);
    acquiredMap = new Map(enrollments.map((e) => [e.courseId, { status: e.status, progress: e.progress }]));
    pathEnrollment = pe;
    pricing = computed;
  }

  return {
    ...path,
    enrolledCount: path._count.enrollments,
    pathEnrollment,
    pricing,
    courses: path.courses.map((c) => ({
      ...c,
      acquired: acquiredMap.has(c.course.id),
      enrollment: acquiredMap.get(c.course.id) ?? null,
      modulesCount: c.course.modules.length,
    })),
  };
}

export type CareerPathDetail = NonNullable<Awaited<ReturnType<typeof getCareerPathDetail>>>;

/* ─── Écoles (§14) ─────────────────────────────────────────────────────────── */

export async function getSchools() {
  const schools = await prisma.school.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      description: true,
      icon: true,
      color: true,
      coverImage: true,
      _count: { select: { courses: true, careerPaths: true } },
      // Métiers préparés (§14.2) : targetJob des parcours rattachés publiés.
      careerPaths: {
        where: { careerPath: { status: "PUBLISHED" } },
        select: { careerPath: { select: { targetJob: true } } },
      },
    },
  });
  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    tagline: s.tagline,
    description: s.description,
    icon: s.icon,
    color: s.color,
    coverImage: s.coverImage,
    coursesCount: s._count.courses,
    careerPathsCount: s._count.careerPaths,
    jobs: [...new Set(s.careerPaths.map((p) => p.careerPath.targetJob))],
  }));
}

export type SchoolListItem = Awaited<ReturnType<typeof getSchools>>[number];

/** Fiche école (§14.3) : formations et parcours rattachés PAR JONCTION — jamais dupliqués. */
export async function getSchoolDetail(slug: string) {
  const school = await prisma.school.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      description: true,
      icon: true,
      color: true,
      coverImage: true,
      status: true,
      courses: {
        where: { course: { status: "PUBLISHED" } },
        orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
        select: { isPrimary: true, isFeatured: true, course: { select: courseCardSelect } },
      },
      careerPaths: {
        where: { careerPath: { status: "PUBLISHED" } },
        orderBy: { position: "asc" },
        select: { isPrimary: true, careerPath: { select: careerPathCardSelect } },
      },
    },
  });

  if (!school || school.status !== "PUBLISHED") return null;

  // Rattachements multiples (§14.4-14.5) : une formation peut appartenir à
  // plusieurs écoles. On calcule, sans dupliquer, les AUTRES écoles où chaque
  // formation est également proposée (« également proposée dans… »).
  const courseIds = school.courses.map((c) => c.course.id);
  const memberships = courseIds.length
    ? await prisma.schoolCourse.findMany({
        where: { courseId: { in: courseIds }, schoolId: { not: school.id }, school: { status: "PUBLISHED" } },
        select: { courseId: true, school: { select: { name: true, slug: true } } },
      })
    : [];
  const otherSchoolsByCourse = new Map<string, { name: string; slug: string }[]>();
  for (const m of memberships) {
    const list = otherSchoolsByCourse.get(m.courseId) ?? [];
    list.push(m.school);
    otherSchoolsByCourse.set(m.courseId, list);
  }

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    tagline: school.tagline,
    description: school.description,
    icon: school.icon,
    color: school.color,
    coverImage: school.coverImage,
    jobs: [...new Set(school.careerPaths.map((p) => p.careerPath.targetJob))],
    courses: school.courses.map((c) => ({
      ...toCourseCard(c.course),
      isFeatured: c.isFeatured,
      otherSchools: otherSchoolsByCourse.get(c.course.id) ?? [],
    })),
    careerPaths: school.careerPaths.map((p) => toCareerPathCard(p.careerPath)),
  };
}

export type SchoolDetail = NonNullable<Awaited<ReturnType<typeof getSchoolDetail>>>;

/* ─── Recherche globale (§32) ──────────────────────────────────────────────── */

export interface SearchResult {
  type: "formation" | "parcours" | "ecole";
  title: string;
  subtitle: string | null;
  href: string;
  image: string | null;
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  const query = q.trim();
  if (query.length < 2) return [];

  const [courses, paths, schools] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { subtitle: { contains: query, mode: "insensitive" } },
          // Trouvé aussi par le nom d'une compétence enseignée (§32).
          { skills: { some: { skill: { name: { contains: query, mode: "insensitive" } } } } },
        ],
      },
      select: { title: true, subtitle: true, slug: true, coverImage: true },
      take: 8,
    }),
    prisma.careerPath.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { targetJob: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { title: true, targetJob: true, slug: true, coverImage: true },
      take: 5,
    }),
    prisma.school.findMany({
      where: { status: "PUBLISHED", name: { contains: query, mode: "insensitive" } },
      select: { name: true, tagline: true, slug: true, coverImage: true },
      take: 3,
    }),
  ]);

  return [
    ...courses.map<SearchResult>((c) => ({
      type: "formation",
      title: c.title,
      subtitle: c.subtitle,
      href: `/formations/${c.slug}`,
      image: c.coverImage,
    })),
    ...paths.map<SearchResult>((p) => ({
      type: "parcours",
      title: p.title,
      subtitle: p.targetJob,
      href: `/parcours-metiers/${p.slug}`,
      image: p.coverImage,
    })),
    ...schools.map<SearchResult>((s) => ({
      type: "ecole",
      title: s.name,
      subtitle: s.tagline,
      href: `/ecoles/${s.slug}`,
      image: s.coverImage,
    })),
  ];
}

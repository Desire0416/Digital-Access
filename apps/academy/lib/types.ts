/**
 * Types de vue de Digital Access Academy (refonte 2026).
 * Contrat entre la couche de données (lib/queries.ts) et les pages/composants.
 * Aligné sur le schéma Prisma (packages/db) sans le coupler.
 */

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export interface SchoolCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  icon: string | null;
  color: string | null;
  image: string | null;
  careerPathCount: number;
  shortCourseCount: number;
}

/** Carte projet professionnel (page publique /projets). */
export interface ProjectCard {
  id: string;
  title: string;
  slug: string;
  projectType: string;
  level: Level;
  context: string | null;
  mission: string | null;
  estimatedDuration: number | null;
  schoolName: string | null;
  schoolSlug: string | null;
  careerPathTitle: string | null;
  careerPathSlug: string | null;
}

export interface SchoolDetail extends SchoolCard {
  longDescription: string | null;
  careerPaths: CareerPathCard[];
  shortCourses: ShortCourseCard[];
}

export interface CareerPathCard {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  targetJob: string;
  level: Level;
  duration: string | null;
  price: number;
  coverImage: string | null;
  featured: boolean;
  schoolName: string;
  schoolSlug: string;
  moduleCount: number;
  projectCount: number;
}

export interface CareerPathDetail extends CareerPathCard {
  longDescription: string | null;
  estimatedHours: number | null;
  prerequisites: string[];
  objectives: string[];
  outcomes: string[];
  tools: string[];
  certificateTitle: string | null;
  skills: { name: string; slug: string; category: string }[];
  modules: {
    id: string;
    title: string;
    description: string | null;
    lessons: { id: string; title: string; lessonType: string; estimatedDuration: number | null }[];
  }[];
  projects: { id: string; title: string; slug: string; projectType: string; level: Level }[];
}

export interface ShortCourseCard {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  level: Level;
  duration: string | null;
  price: number;
  courseType: string | null;
  coverImage: string | null;
  schoolName: string;
  schoolSlug: string;
}

export interface AcademyStats {
  schools: number;
  careerPaths: number;
  shortCourses: number;
  projects: number;
  badges: number;
}

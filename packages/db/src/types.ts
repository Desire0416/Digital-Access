/**
 * Types de domaine légers pour les données de démonstration (mock) et
 * les vues publiques. Alignés sur le schéma Prisma mais découplés du client
 * généré, afin que les apps s'exécutent sans base de données provisionnée.
 */

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
  featured: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  client: string;
  type: string;
  category: string;
  url?: string;
  coverImage?: string;
  images: string[];
  technologies: string[];
  featured: boolean;
  year: number;
  testimonial?: string;
}

export interface BlogPostPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: { name: string; avatar?: string; role?: string };
  readMinutes: number;
  publishedAt: string; // ISO
}

export interface CategoryPreview {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  courseCount: number;
}

export interface CoursePreview {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  coverImage?: string;
  price: number; // FCFA
  isFree: boolean;
  level: CourseLevel;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  durationMinutes: number;
  category: string;
  categorySlug: string;
  instructor: { name: string; avatar?: string };
}

export interface Stat {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

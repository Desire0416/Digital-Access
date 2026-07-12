"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Clock,
  Layers,
  Star,
  Award,
  FolderKanban,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Route,
  BookOpen,
  Briefcase,
  Code2,
  Database,
  BarChart3,
  Palette,
  Megaphone,
  ShieldCheck,
  Cpu,
  Globe,
  PenTool,
  LineChart,
} from "lucide-react";
import { cn, Badge } from "@da/ui";
import { formatFCFA, LEVEL_LABEL } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Cartes du catalogue Access Academy — CourseCard (§10.5), CareerPathCard
   (§13.3), SchoolCard (§14.2). Entièrement cliquables, hover élévation DA,
   prêtes pour un rendu en cascade (variants hidden/show du design system).
   ══════════════════════════════════════════════════════════════════════════ */

/** Variants compatibles avec StaggerGroup de @da/ui (hidden/show). */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const hoverProps = {
  whileHover: { y: -6, scale: 1.02, boxShadow: "0 22px 48px -12px rgba(43,58,140,0.28)" },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 300, damping: 22 },
} as const;

/** Motif dégradé DA de repli quand aucune image de couverture n'existe. */
function GradientCover({ seed, children }: { seed: string; children?: React.ReactNode }) {
  // Variation déterministe de l'angle selon le titre pour éviter l'uniformité.
  const hash = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 115 + (hash % 50);
  return (
    <div
      className="relative h-full w-full"
      style={{
        background: `linear-gradient(${angle}deg, #5b3fa8 0%, #2b5cc6 38%, #1e8fe1 70%, #00bcd4 100%)`,
      }}
      aria-hidden
    >
      {/* Cercles géométriques signature */}
      <span className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/20" />
      <span className="absolute -right-2 -top-4 h-16 w-16 rounded-full border border-white/25" />
      <span className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/[0.07]" />
      <span className="absolute inset-0 bg-grid opacity-30" />
      {children}
    </div>
  );
}

function levelBadgeLabel(level: string): string {
  return LEVEL_LABEL[level] ?? level;
}

/* ════════════════════════════ CourseCard (§10.5) ═══════════════════════ */

export interface CourseCardData {
  slug: string;
  title: string;
  /** Résumé court (subtitle) */
  subtitle?: string | null;
  coverImage?: string | null;
  level: string; // CourseLevel
  price: number; // FCFA — 0 = gratuit
  durationHours?: number | null;
  moduleCount: number;
  /** Note moyenne 1..5 (null si aucun avis) */
  rating?: number | null;
  reviewCount?: number;
  /** La formation délivre un certificat */
  hasCertificate?: boolean;
  /** La formation comporte un projet pratique */
  hasProject?: boolean;
  /** École de rattachement principal */
  schoolName?: string | null;
  /** Déjà acquise par l'utilisateur (Enrollment ACTIVE/COMPLETED) */
  acquired?: boolean;
}

export function CourseCard({ course, className }: { course: CourseCardData; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      variants={cardVariants}
      {...(reduce ? {} : hoverProps)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary",
        className,
      )}
    >
      <Link
        href={`/formations/${course.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`Formation : ${course.title}`}
      />

      {/* ── Cover ── */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {course.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImage}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" aria-hidden />
          </>
        ) : (
          <GradientCover seed={course.title}>
            <span className="absolute bottom-3 left-4 right-4 line-clamp-2 font-display text-lg font-bold leading-snug text-white/90">
              {course.title}
            </span>
          </GradientCover>
        )}

        {/* Badges sur l'image */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="gradient">{levelBadgeLabel(course.level)}</Badge>
          {course.acquired && (
            <Badge className="bg-success text-white">
              <BadgeCheck size={12} aria-hidden />
              Acquise
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {course.hasCertificate && (
            <Badge className="bg-white/90 text-navy backdrop-blur-sm">
              <Award size={12} className="text-brand-violet" aria-hidden />
              Certificat
            </Badge>
          )}
          {course.hasProject && (
            <Badge className="bg-white/90 text-navy backdrop-blur-sm">
              <FolderKanban size={12} className="text-brand-blue-vif" aria-hidden />
              Projet
            </Badge>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-1 flex-col p-5">
        {course.schoolName && (
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
            <GraduationCap size={13} aria-hidden />
            {course.schoolName}
          </p>
        )}
        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">{course.subtitle}</p>
        )}

        {/* Méta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
          {course.durationHours != null && course.durationHours > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden />
              {course.durationHours} h
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Layers size={13} aria-hidden />
            {course.moduleCount} module{course.moduleCount > 1 ? "s" : ""}
          </span>
          {course.rating != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-navy">
              <Star size={13} className="fill-warning text-warning" aria-hidden />
              {course.rating.toFixed(1)}
              {course.reviewCount != null && course.reviewCount > 0 && (
                <span className="font-normal text-text-muted">({course.reviewCount})</span>
              )}
            </span>
          )}
        </div>

        {/* Pied : prix + flèche */}
        <div className="mt-auto flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span
            className={cn(
              "font-display text-base font-bold",
              course.price === 0 ? "text-success" : "text-navy",
            )}
          >
            {course.price === 0 ? "Gratuit" : formatFCFA(course.price)}
          </span>
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-navy/[0.05] text-navy transition-all duration-300 group-hover:bg-gradient-da group-hover:text-white"
            aria-hidden
          >
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════ CareerPathCard (§13.3) ════════════════════════ */

export interface CareerPathCardData {
  slug: string;
  title: string;
  /** Métier visé */
  targetJob: string;
  coverImage?: string | null;
  /** École de rattachement principal */
  schoolName?: string | null;
  /** Durée libellée, ex. « 9 mois » */
  duration?: string | null;
  courseCount: number;
  projectCount: number;
  entryLevel: string; // CourseLevel
  exitLevel: string; // CourseLevel
  certificationTitle?: string | null;
  /** Prix plein en FCFA (avant déduction des acquis) */
  price: number;
}

export function CareerPathCard({ path, className }: { path: CareerPathCardData; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      variants={cardVariants}
      {...(reduce ? {} : hoverProps)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary",
        className,
      )}
    >
      <Link
        href={`/parcours-metiers/${path.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`Parcours métier : ${path.title}`}
      />

      {/* ── Bandeau sombre « métier » ── */}
      <div className="relative overflow-hidden bg-surface-dark-card p-5">
        {path.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={path.coverImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-surface-dark-card via-surface-dark-card/80 to-transparent" aria-hidden />
          </>
        ) : (
          <>
            <span className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-gradient-da opacity-25 blur-2xl" aria-hidden />
            <span className="absolute -bottom-8 right-8 h-20 w-20 rounded-full border border-white/10" aria-hidden />
          </>
        )}
        <div className="relative">
          <Badge variant="gradient" className="mb-3">
            <Route size={12} aria-hidden />
            Parcours métier
          </Badge>
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-brand-cyan">
            {path.title}
          </h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-white/70">
            <Briefcase size={13} className="text-brand-cyan" aria-hidden />
            {path.targetJob}
          </p>
          {path.schoolName && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/50">
              <GraduationCap size={12} aria-hidden />
              {path.schoolName}
            </p>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-1 flex-col p-5">
        {/* Compteurs */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-secondary px-2 py-2.5">
            <p className="font-display text-base font-bold text-navy">{path.courseCount}</p>
            <p className="text-[11px] text-text-secondary">
              formation{path.courseCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-lg bg-surface-secondary px-2 py-2.5">
            <p className="font-display text-base font-bold text-navy">{path.projectCount}</p>
            <p className="text-[11px] text-text-secondary">projet{path.projectCount > 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg bg-surface-secondary px-2 py-2.5">
            <p className="font-display text-base font-bold text-navy">{path.duration ?? "—"}</p>
            <p className="text-[11px] text-text-secondary">durée</p>
          </div>
        </div>

        {/* Niveaux entrée → sortie */}
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-navy/[0.06] px-2.5 py-1 text-navy">{levelBadgeLabel(path.entryLevel)}</span>
          <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-navy/[0.08]" aria-hidden>
            <span className="absolute inset-y-0 left-0 w-full bg-gradient-da opacity-70" />
          </span>
          <span className="rounded-full bg-gradient-da px-2.5 py-1 text-white">{levelBadgeLabel(path.exitLevel)}</span>
        </div>

        {path.certificationTitle && (
          <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-text-secondary">
            <Award size={13} className="mt-0.5 shrink-0 text-brand-violet" aria-hidden />
            <span className="line-clamp-1">{path.certificationTitle}</span>
          </p>
        )}

        {/* Pied : prix + flèche */}
        <div className="mt-auto flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <div>
            <span
              className={cn(
                "font-display text-base font-bold",
                path.price === 0 ? "text-success" : "text-navy",
              )}
            >
              {path.price === 0 ? "Gratuit" : formatFCFA(path.price)}
            </span>
            {path.price > 0 && (
              <span className="block text-[11px] text-text-muted">acquis déduits à l&apos;inscription</span>
            )}
          </div>
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-navy/[0.05] text-navy transition-all duration-300 group-hover:bg-gradient-da group-hover:text-white"
            aria-hidden
          >
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ═════════════════════════ SchoolCard (§14.2) ══════════════════════════ */

const SCHOOL_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  "graduation-cap": GraduationCap,
  code: Code2,
  database: Database,
  "bar-chart": BarChart3,
  "line-chart": LineChart,
  palette: Palette,
  "pen-tool": PenTool,
  megaphone: Megaphone,
  shield: ShieldCheck,
  cpu: Cpu,
  globe: Globe,
  briefcase: Briefcase,
  book: BookOpen,
};

export interface SchoolCardData {
  slug: string;
  name: string;
  tagline?: string | null;
  description: string;
  /** Couleur d'identité (hex), ex. "#5b3fa8" */
  color: string;
  /** Slug d'icône (voir SCHOOL_ICONS ; repli graduation-cap) */
  icon: string;
  coverImage?: string | null;
  courseCount: number;
  pathCount: number;
  /** Métiers préparés (targetJob des parcours rattachés) */
  jobs: string[];
}

export function SchoolCard({ school, className }: { school: SchoolCardData; className?: string }) {
  const reduce = useReducedMotion();
  const Icon = SCHOOL_ICONS[school.icon] ?? GraduationCap;

  return (
    <motion.article
      variants={cardVariants}
      {...(reduce ? {} : hoverProps)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary p-6",
        className,
      )}
    >
      <Link href={`/ecoles/${school.slug}`} className="absolute inset-0 z-10" aria-label={`École : ${school.name}`} />

      {/* Halo couleur d'identité */}
      <span
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-[0.09] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]"
        style={{ backgroundColor: school.color }}
        aria-hidden
      />

      {/* Identité */}
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-brand"
          style={{ background: `linear-gradient(135deg, ${school.color}, ${school.color}cc)` }}
          aria-hidden
        >
          <Icon size={26} />
        </span>
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-navy/[0.05] text-navy transition-all duration-300 group-hover:bg-gradient-da group-hover:text-white"
          aria-hidden
        >
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
        {school.name}
      </h3>
      {school.tagline && <p className="mt-0.5 text-sm font-medium" style={{ color: school.color }}>{school.tagline}</p>}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{school.description}</p>

      {/* Compteurs */}
      <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-navy">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={14} className="text-brand-blue-vif" aria-hidden />
          {school.courseCount} formation{school.courseCount > 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Route size={14} className="text-brand-violet" aria-hidden />
          {school.pathCount} parcours
        </span>
      </div>

      {/* Métiers préparés */}
      {school.jobs.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-navy/[0.06] pt-4">
          {school.jobs.slice(0, 3).map((job) => (
            <Badge key={job} variant="soft">
              {job}
            </Badge>
          ))}
          {school.jobs.length > 3 && <Badge variant="outline">+{school.jobs.length - 3}</Badge>}
        </div>
      )}
    </motion.article>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen, FolderKanban, Clock, Target } from "lucide-react";
import { Badge, formatFCFA, cn } from "@da/ui";
import { Icon } from "./Icon";
import {
  LEVEL_LABEL,
  type SchoolCard,
  type CareerPathCard,
  type ShortCourseCard,
  type ProjectCard,
} from "@/lib/types";

/* Cartes présentationnelles (Server Components, survol en CSS) — écoles,
   parcours métiers, formations courtes et projets de Digital Access Academy. */

function priceLabel(price: number): string {
  return price <= 0 ? "Gratuit" : formatFCFA(price);
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  EXERCISE: "Exercice",
  MINI_PROJECT: "Mini-projet",
  PROFESSIONAL_MISSION: "Mission pro",
  FINAL_PROJECT: "Projet final",
  CLIENT_PROJECT: "Projet client",
  COLLABORATIVE_PROJECT: "Projet collaboratif",
};

export function SchoolCardView({ school }: { school: SchoolCard }) {
  const color = school.color ?? "#2B5CC6";
  return (
    <Link
      href={`/schools/${school.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-vif/30 hover:shadow-xl"
    >
      {school.image && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={school.image}
            alt={school.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent" />
          <span
            className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-xl text-white shadow"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <Icon name={school.icon ?? "graduation-cap"} size={20} />
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {!school.image && (
          <span
            className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <Icon name={school.icon ?? "graduation-cap"} size={24} />
          </span>
        )}
        <h3 className={cn("font-display text-lg font-bold leading-tight text-navy", !school.image && "mt-4")}>
          {school.name}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-text-secondary">
          {school.shortDescription}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FolderKanban size={14} />
            {school.careerPathCount} parcours
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={14} />
            {school.shortCourseCount} formations
          </span>
        </div>
      </div>
      <span className="absolute right-4 top-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}

export function CareerPathCardView({ path }: { path: CareerPathCard }) {
  return (
    <Link
      href={`/career-paths/${path.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary transition-all duration-300 hover:-translate-y-1 hover:border-brand-violet/30 hover:shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-da">
        {path.coverImage ? (
          <Image
            src={path.coverImage}
            alt={path.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-grid opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/90 text-navy backdrop-blur">{path.schoolName}</Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {path.targetJob}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-tight text-white">
            {path.title}
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">
          {path.shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-muted">
          <span className="rounded-full bg-navy/[0.05] px-2 py-0.5">{LEVEL_LABEL[path.level]}</span>
          {path.duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              {path.duration}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={13} />
            {path.moduleCount} modules
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FolderKanban size={13} />
            {path.projectCount} projets
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="font-display text-base font-bold text-navy">{priceLabel(path.price)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal">
            Voir le parcours
            <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ShortCourseCardView({ course }: { course: ShortCourseCard }) {
  return (
    <Link
      href={`/short-courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-vif/30 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-da">
        {course.coverImage ? (
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-grid opacity-20" />
            <span className="absolute inset-0 grid place-items-center text-white/90">
              <BookOpen size={30} />
            </span>
          </>
        )}
        <div className="absolute left-3 top-3">
          <Badge className="bg-white/90 text-navy backdrop-blur">{course.schoolName}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-text-muted">
          <span>{LEVEL_LABEL[course.level]}</span>
          {course.duration && <span>{course.duration}</span>}
        </div>
        <h3 className="mt-2 font-display text-base font-bold leading-tight text-navy">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">
          {course.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-navy/[0.06] pt-3">
          <span className="font-display text-sm font-bold text-navy">{priceLabel(course.price)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal">
            Voir
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCardView({ project }: { project: ProjectCard }) {
  const href = project.careerPathSlug
    ? `/career-paths/${project.careerPathSlug}`
    : project.schoolSlug
      ? `/schools/${project.schoolSlug}`
      : null;
  const cls =
    "group flex h-full flex-col rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-violet/30 hover:shadow-xl";
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
          <Target size={20} />
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{PROJECT_TYPE_LABEL[project.projectType] ?? project.projectType}</Badge>
          <span className="text-xs font-semibold text-text-muted">{LEVEL_LABEL[project.level]}</span>
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold leading-tight text-navy">{project.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-text-secondary">
        {project.mission ?? project.context ?? "Un projet professionnel concret pour prouver vos compétences."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-navy/[0.06] pt-4 text-xs font-semibold text-text-muted">
        {project.schoolName && (
          <span className="inline-flex items-center gap-1.5">
            <FolderKanban size={13} />
            {project.schoolName}
          </span>
        )}
        {project.estimatedDuration != null && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {project.estimatedDuration} h
          </span>
        )}
        {href && (
          <span className="ml-auto inline-flex items-center gap-1 text-brand-blue-royal">
            {project.careerPathTitle ? "Voir le parcours" : "Découvrir"}
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        )}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

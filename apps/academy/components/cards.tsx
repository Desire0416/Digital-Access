import Link from "next/link";
import { ArrowUpRight, BookOpen, FolderKanban, Clock } from "lucide-react";
import { Badge, formatFCFA } from "@da/ui";
import { Icon } from "./Icon";
import { LEVEL_LABEL, type SchoolCard, type CareerPathCard, type ShortCourseCard } from "@/lib/types";

/* Cartes présentationnelles (Server Components, survol en CSS) — écoles,
   parcours métiers et formations courtes de Digital Access Academy. */

function priceLabel(price: number): string {
  return price <= 0 ? "Gratuit" : formatFCFA(price);
}

export function SchoolCardView({ school }: { school: SchoolCard }) {
  const color = school.color ?? "#2B5CC6";
  return (
    <Link
      href={`/schools/${school.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-vif/30 hover:shadow-xl"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        <Icon name={school.icon ?? "graduation-cap"} size={24} />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold leading-tight text-navy">
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
      <span className="absolute right-5 top-6 text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
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
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/90 text-navy backdrop-blur">{path.schoolName}</Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
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
      className="group flex flex-col rounded-2xl border border-navy/[0.08] bg-surface-primary p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-vif/30 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="soft">{course.schoolName}</Badge>
        <span className="text-xs font-semibold text-text-muted">{LEVEL_LABEL[course.level]}</span>
      </div>
      <h3 className="mt-3 font-display text-base font-bold leading-tight text-navy">
        {course.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">
        {course.shortDescription}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-navy/[0.06] pt-3">
        <span className="font-display text-sm font-bold text-navy">{priceLabel(course.price)}</span>
        {course.duration && <span className="text-xs text-text-muted">{course.duration}</span>}
      </div>
    </Link>
  );
}

import * as React from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { cn } from "@da/ui";
import { LEVEL_LABEL } from "@/lib/types";
import type { EnrolledCourseCard } from "@/lib/learn-types";

/* ══════════════════════════════════════════════════════════════════════════
   Primitives présentation de l'espace apprenant (server components, sans état).
   Partagées par le tableau de bord et ses sous-pages pour un langage visuel unifié.
   ══════════════════════════════════════════════════════════════════════════ */

export function DashboardHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-royal">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  icon,
  label,
  value,
  accent = "from-brand-violet to-brand-cyan",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-brand", accent)}>
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-navy/[0.08]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function CourseProgressCard({ card }: { card: EnrolledCourseCard }) {
  const done = card.status === "COMPLETED";
  const target = card.resumeLessonId
    ? `/apprendre/${card.slug}/${card.resumeLessonId}`
    : `/career-paths/${card.slug}`;
  return (
    <div className="group flex flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-blue-royal">{card.targetJob}</p>
          <h3 className="mt-1 font-display text-base font-bold leading-snug text-navy">{card.title}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
          {LEVEL_LABEL[card.level]}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-text-secondary">
            {card.completedLessons} / {card.totalLessons} leçons
          </span>
          <span className="font-bold text-navy">{card.progress}%</span>
        </div>
        <ProgressBar value={card.progress} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            done ? "bg-success/10 text-success" : "bg-brand-blue-vif/10 text-brand-blue-royal",
          )}
        >
          {done ? "Terminé" : "En cours"}
        </span>
        <Link
          href={target}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors group-hover:text-brand-violet"
        >
          {done ? "Revoir" : "Continuer"} <PlayCircle size={16} />
        </Link>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
        {icon}
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-text-secondary">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
        >
          {action.label} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, ImageIcon, Signal, Star, Tag, Users } from "lucide-react";
import { Avatar, formatPrice, formatDate, cn } from "@da/ui";
import { StatusPill, COURSE_STATUS, COURSE_LEVEL } from "@/components/admin/ui";
import type { AdminManagedCourse, InstructorOption } from "./queries";
import { CourseActionsMenu } from "./CourseActionsMenu";

/* ══════════════════════════════════════════════════════════════════════════
   Carte de gestion d'un cours (admin). Couverture, catégorie, statut, niveau,
   inscrits, prix + menu d'actions. Le variant "review" met en avant la file
   d'attente de validation (bordure ambrée + filet dégradé).
   ══════════════════════════════════════════════════════════════════════════ */

export function CourseAdminCard({
  course,
  instructors,
  highlight = false,
}: {
  course: AdminManagedCourse;
  instructors: InstructorOption[];
  highlight?: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const status = COURSE_STATUS[course.status] ?? { label: course.status, tone: "slate" as const };

  return (
    <motion.article
      layout
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface-primary transition-shadow hover:shadow-lg",
        highlight ? "border-warning/40" : "border-navy/[0.07]",
      )}
    >
      {highlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1 bg-gradient-da"
        />
      )}

      {/* Couverture */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-secondary">
        {course.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-violet/[0.12] to-brand-cyan/[0.12]">
            <ImageIcon size={28} className="text-navy/20" />
          </div>
        )}

        {/* Badge catégorie */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface-primary/90 px-2.5 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
          <Tag size={12} className="text-brand-blue-royal" />
          {course.category}
        </span>

        {/* Pastille de statut */}
        <span className="absolute right-3 top-3">
          <StatusPill label={status.label} tone={status.tone} />
        </span>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 font-display text-base font-bold leading-snug text-navy">
            {course.title}
          </h3>
          <CourseActionsMenu course={course} instructors={instructors} onError={setError} />
        </div>

        {/* Instructeur */}
        <div className="mt-3 flex items-center gap-2">
          <Avatar
            name={course.instructor.name}
            src={course.instructor.avatar ?? undefined}
            className="h-6 w-6 shrink-0"
          />
          <p className="min-w-0 truncate text-xs text-text-secondary">
            {course.instructor.name}
          </p>
        </div>

        {/* Méta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Signal size={13} className="text-brand-blue-royal" />
            {COURSE_LEVEL[course.level] ?? course.level}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={13} className="text-brand-blue-royal" />
            {course.chapterCount} chap.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} className="text-brand-blue-royal" />
            {course.enrollmentCount} inscrit{course.enrollmentCount > 1 ? "s" : ""}
          </span>
          {course.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} className="fill-warning text-warning" />
              {course.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Note de renvoi éventuelle (cours en validation renvoyé) */}
        {course.status === "REVIEW" && course.reviewNote && (
          <p className="mt-3 rounded-lg bg-warning/[0.08] px-3 py-2 text-xs text-[#B45309]">
            Note précédente : {course.reviewNote}
          </p>
        )}

        {/* Pied : prix + date */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-3.5">
          <span className="font-display text-base font-extrabold text-navy">
            {formatPrice(course.price, course.isFree)}
          </span>
          <span className="text-xs text-text-muted">
            Modifié le {formatDate(course.updatedAt)}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    </motion.article>
  );
}

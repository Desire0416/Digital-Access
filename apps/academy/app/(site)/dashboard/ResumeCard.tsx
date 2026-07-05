"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import { Badge, Monogram, buttonClasses, formatDuration } from "@da/ui";
import { levelLabel } from "@/lib/site";
import type { DashboardEnrollment } from "@/lib/types";

/** Grande card horizontale « Reprendre l'apprentissage » — cover dégradé + progression animée. */
export function ResumeCard({ enrollment }: { enrollment: DashboardEnrollment }) {
  const { course } = enrollment;
  const href = enrollment.nextChapterId
    ? `/courses/${course.slug}/learn/${enrollment.nextChapterId}`
    : `/courses/${course.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-brand-lg sm:flex-row"
    >
      {/* Couverture dégradée signature */}
      <Link
        href={href}
        aria-label={`Reprendre « ${course.title} »`}
        className="relative block min-h-[170px] shrink-0 overflow-hidden bg-gradient-to-br from-brand-violet via-brand-blue-royal to-brand-cyan sm:min-h-full sm:w-60 lg:w-72"
      >
        <span aria-hidden className="absolute inset-0 bg-dots opacity-25" />
        <Monogram
          variant="white"
          size={120}
          aria-hidden
          className="absolute -bottom-6 -right-3 opacity-15"
        />
        <span className="absolute inset-0 grid place-items-center">
          <PlayCircle
            size={58}
            className="text-white/90 transition-transform duration-300 group-hover:scale-110"
          />
        </span>
        <Badge className="absolute left-4 top-4 bg-white/90 text-navy backdrop-blur">
          {course.category.name}
        </Badge>
      </Link>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{levelLabel(course.level)}</Badge>
          {course.isFree && <Badge variant="success">Gratuit</Badge>}
        </div>

        <h3 className="mt-3 font-display text-xl font-bold leading-snug text-navy sm:text-2xl">
          <Link href={href} className="transition-colors hover:text-brand-blue-royal">
            {course.title}
          </Link>
        </h3>
        {course.subtitle && (
          <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">
            {course.subtitle}
          </p>
        )}

        {/* Progression */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-secondary">
              {enrollment.completedChapters}/{course.chapterCount} chapitres
              terminés
            </span>
            <span className="font-display font-extrabold text-navy">
              {enrollment.progress}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${enrollment.progress}%` }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 }}
              className="h-full rounded-full bg-gradient-da"
            />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
          <span className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={13} aria-hidden />
              {formatDuration(course.durationMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={13} aria-hidden />
              {course.chapterCount} chapitres
            </span>
          </span>
          <Link
            href={href}
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <PlayCircle size={17} aria-hidden />
            Reprendre
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

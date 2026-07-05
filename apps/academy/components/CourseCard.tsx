"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Users, PlayCircle, BookOpen, CheckCircle2 } from "lucide-react";
import {
  Badge,
  StarRating,
  GradientText,
  Monogram,
  formatPrice,
  formatDuration,
  cn,
} from "@da/ui";
import { levelLabel } from "@/lib/site";
import type { CourseCardData } from "@/lib/types";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
  "from-primary to-brand-violet",
];

export interface CourseCardProps {
  course: CourseCardData;
  index?: number;
  /** 0–100 : affiche la barre de progression intégrée (cards « mes cours ») */
  progress?: number;
  /** cible du lien — détail du cours par défaut */
  href?: string;
  className?: string;
}

/** Card de cours signature Academy : overlay gradient, badge catégorie, progression intégrée, hover 3D. */
export function CourseCard({
  course,
  index = 0,
  progress,
  href,
  className,
}: CourseCardProps) {
  const completed = progress != null && progress >= 100;
  return (
    <Link href={href ?? `/courses/${course.slug}`} className={cn("group block h-full", className)}>
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary transition-shadow group-hover:shadow-brand-lg"
      >
        {/* Couverture */}
        <div
          className={`relative aspect-video overflow-hidden bg-gradient-to-br ${covers[index % covers.length]}`}
        >
          <div className="absolute inset-0 bg-dots opacity-25" />
          <Monogram
            variant="white"
            size={96}
            className="absolute -bottom-4 -right-2 opacity-15"
          />
          <div className="absolute inset-0 grid place-items-center">
            <PlayCircle
              size={52}
              className="text-white/90 transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <Badge className="absolute left-3 top-3 bg-white/90 text-navy backdrop-blur">
            {course.category.name}
          </Badge>
          {course.isFree && (
            <Badge className="absolute right-3 top-3 bg-success text-white">
              Gratuit
            </Badge>
          )}
          {completed && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-bold text-white">
              <CheckCircle2 size={13} /> Terminé
            </span>
          )}
        </div>

        {/* Corps */}
        <div className="flex flex-1 flex-col p-5">
          <span className="text-xs font-semibold text-brand-blue-royal">
            {levelLabel(course.level)}
          </span>
          <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-navy">
            {course.title}
          </h3>
          {course.subtitle && (
            <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
              {course.subtitle}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={13} /> {formatDuration(course.durationMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={13} /> {course.chapterCount} chapitres
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} /> {course.enrollmentCount}
            </span>
          </div>

          {/* Barre de progression intégrée */}
          {progress != null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">Progression</span>
                <span className="font-bold text-navy">{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.08]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="h-full rounded-full bg-gradient-da"
                />
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="mt-4 flex items-center justify-between border-t border-navy/[0.06] pt-4">
              <div className="flex items-center gap-1.5">
                <StarRating rating={course.rating} size={14} />
                <span className="text-xs font-medium text-text-secondary">
                  {course.rating.toFixed(1)} ({course.ratingCount})
                </span>
              </div>
              <span className="font-display text-lg font-extrabold">
                {course.isFree ? (
                  <span className="text-success">Gratuit</span>
                ) : (
                  <GradientText>{formatPrice(course.price)}</GradientText>
                )}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

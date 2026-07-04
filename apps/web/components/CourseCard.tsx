"use client";

import { motion } from "framer-motion";
import { Clock, Users, PlayCircle } from "lucide-react";
import { Badge, StarRating, GradientText, Monogram, formatPrice, formatDuration } from "@da/ui";
import type { CoursePreview } from "@da/db";

const levelLabel: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
];

export function CourseCard({
  course,
  index = 0,
}: {
  course: CoursePreview;
  index?: number;
}) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary"
    >
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
            size={54}
            className="text-white/90 transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-white/90 text-navy backdrop-blur">
            {course.category}
          </Badge>
        </div>
        {course.isFree && (
          <Badge variant="success" className="absolute right-3 top-3 bg-success text-white">
            Gratuit
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="font-semibold text-brand-blue-royal">
            {levelLabel[course.level]}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug text-navy">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
          {course.subtitle}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {formatDuration(course.durationMinutes)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} /> {course.enrollmentCount}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <div className="flex items-center gap-1.5">
            <StarRating rating={course.rating} size={14} />
            <span className="text-xs font-medium text-text-secondary">
              {course.rating.toFixed(1)}
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
    </motion.article>
  );
}

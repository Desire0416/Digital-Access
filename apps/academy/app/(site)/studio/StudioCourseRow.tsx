"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Copy,
  Hourglass,
  Layers,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  Badge,
  Monogram,
  buttonClasses,
  cn,
  formatPrice,
} from "@da/ui";
import type { BadgeVariant } from "@da/ui";
import type { StudioCourseListItem, CourseStatus, CourseLevel } from "@/lib/studio-types";
import { deleteCourse, duplicateCourse } from "@/lib/studio-actions";

const statusMeta: Record<CourseStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Brouillon", variant: "default" },
  REVIEW: { label: "En validation", variant: "warning" },
  PUBLISHED: { label: "Publié", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "outline" },
};

const levelLabel: Record<CourseLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export function StudioCourseRow({ course }: { course: StudioCourseListItem }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const status = statusMeta[course.status];

  // Fermeture du menu au clic extérieur / touche Échap.
  React.useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function handleDuplicate() {
    setError(null);
    setMenuOpen(false);
    startTransition(async () => {
      const res = await duplicateCourse(course.id);
      if (!res.ok) setError(res.error);
      else router.push(`/studio/courses/${res.courseId}/edit`);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCourse(course.id);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <motion.article
      layout
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-brand-lg sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Miniature dégradée */}
        <Link
          href={`/studio/courses/${course.id}/edit`}
          className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:aspect-square sm:w-28"
        >
          {course.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImage}
              alt={`Miniature du cours ${course.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-da">
              <div aria-hidden className="absolute inset-0 bg-dots opacity-20" />
              <Monogram size={34} variant="white" className="relative" />
            </div>
          )}
        </Link>

        {/* Contenu principal */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>
              {course.status === "REVIEW" && <Hourglass size={12} />}
              {status.label}
            </Badge>
            <span className="text-xs font-medium text-text-muted">
              {course.category}
            </span>
            <span aria-hidden className="text-text-muted/50">·</span>
            <span className="text-xs font-medium text-text-muted">
              {levelLabel[course.level]}
            </span>
          </div>

          <Link href={`/studio/courses/${course.id}/edit`} className="mt-1.5 block">
            <h3 className="truncate font-display text-lg font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
              {course.title}
            </h3>
          </Link>

          {/* Méta-données */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Layers size={14} className="text-text-muted" />
              {course.chapterCount} chapitre{course.chapterCount > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-text-muted" />
              {course.enrollmentCount} inscrit{course.enrollmentCount > 1 ? "s" : ""}
            </span>
            {course.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} className="text-warning" fill="currentColor" />
                {course.rating.toFixed(1)}
                <span className="text-text-muted">({course.ratingCount})</span>
              </span>
            )}
            <span className="font-display font-bold text-navy">
              {formatPrice(course.price, course.isFree)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end lg:flex-row lg:items-center">
          <Link
            href={`/studio/courses/${course.id}/edit`}
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <Pencil size={15} />
            Éditer
          </Link>

          {/* Menu contextuel */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={pending}
              aria-label="Plus d'actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-lg border border-navy/10 text-text-secondary transition-colors hover:bg-navy/[0.04] hover:text-navy disabled:opacity-50"
            >
              <MoreVertical size={17} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-navy/10 bg-surface-primary p-1.5 shadow-brand-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy transition-colors hover:bg-brand-blue-vif/[0.08]"
                  >
                    <Copy size={15} className="text-brand-blue-royal" />
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirming(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error/[0.08]"
                  >
                    <Trash2 size={15} />
                    Supprimer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mention "en attente de validation" */}
      {course.status === "REVIEW" && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-warning/[0.08] px-3.5 py-2.5 text-xs font-medium text-[#B45309]">
          <Hourglass size={14} className="shrink-0" />
          En attente de validation par l&apos;équipe Academy — vous serez notifié
          dès qu&apos;une décision est prise.
        </p>
      )}

      {/* Alerte de refus (reviewNote présent hors REVIEW) */}
      {course.reviewNote && course.status !== "REVIEW" && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-error/[0.06] px-3.5 py-2.5 text-xs text-error">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">À revoir :</span> {course.reviewNote}
          </span>
        </p>
      )}

      {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

      {/* Overlay de confirmation de suppression */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-surface-primary/85 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm text-center"
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-error/10 text-error">
                <Trash2 size={20} />
              </span>
              <h4 className="mt-3 font-display text-base font-bold text-navy">
                Supprimer ce cours&nbsp;?
              </h4>
              <p className="mt-1 text-sm text-text-secondary">
                « {course.title} » sera archivé. Cette action retire le cours de
                votre studio.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className={cn(
                    buttonClasses({ variant: "secondary", size: "sm" }),
                    "bg-error hover:bg-error/90",
                  )}
                >
                  {pending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  <X size={15} />
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

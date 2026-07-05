"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  Eye,
  EyeOff,
  Layers,
  MessageSquareWarning,
  Signal,
  Tag,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Textarea,
  buttonClasses,
  cn,
  formatPrice,
  formatDate,
} from "@da/ui";
import { levelLabel } from "@/lib/site";
import { approveCourse, rejectCourse, unpublishCourse } from "@/lib/studio-actions";
import type { AdminCourseItem } from "@/lib/studio-types";

/** Carte de validation d'un cours soumis par un instructeur (file de review). */
export function CourseReviewCard({ course }: { course: AdminCourseItem }) {
  const router = useRouter();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveCourse(course.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectCourse({
        courseId: course.id,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <motion.article
      layout
      className="group relative overflow-hidden rounded-2xl border border-warning/30 bg-surface-primary p-5 sm:p-6"
    >
      {/* Filet dégradé signature à gauche */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-da"
      />

      {/* En-tête : instructeur + statut */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={course.instructor.name} src={course.instructor.avatar ?? undefined} />
          <div>
            <p className="text-sm font-bold text-navy">{course.instructor.name}</p>
            <p className="text-xs text-text-secondary">{course.instructor.email}</p>
          </div>
        </div>
        <Badge variant="warning">En validation</Badge>
      </div>

      {/* Titre du cours */}
      <h3 className="mt-4 font-display text-lg font-bold leading-snug text-navy">
        {course.title}
      </h3>

      {/* Méta : catégorie, niveau, prix, chapitres */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <Tag size={14} className="text-brand-blue-royal" />
          {course.category}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Signal size={14} className="text-brand-blue-royal" />
          {levelLabel(course.level)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={14} className="text-brand-blue-royal" />
          {course.chapterCount} chapitre{course.chapterCount > 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-navy">
          <Layers size={14} className="text-brand-blue-royal" />
          {formatPrice(course.price, course.isFree)}
        </span>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Soumis le {formatDate(course.submittedAt)}
      </p>

      {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

      {/* Actions */}
      <div className="mt-5 border-t border-navy/[0.07] pt-5">
        <AnimatePresence mode="wait">
          {rejecting ? (
            <motion.div
              key="reject"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy">
                <MessageSquareWarning size={15} className="text-warning" />
                Motif du renvoi (transmis à l&apos;instructeur)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : la description est trop courte, ajoutez au moins un chapitre vidéo, précisez les prérequis…"
                className="min-h-20 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReject}
                  loading={pending}
                  className="bg-error hover:bg-error/90"
                >
                  <X size={15} /> Confirmer le renvoi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRejecting(false)}
                  disabled={pending}
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2"
            >
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                loading={pending}
              >
                <BadgeCheck size={16} />
                Approuver — publier le cours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejecting(true)}
                disabled={pending}
              >
                <X size={15} />
                Renvoyer
              </Button>
              <Link
                href={`/studio/courses/${course.id}/edit`}
                className={cn(
                  buttonClasses({ variant: "ghost", size: "sm" }),
                  pending && "pointer-events-none opacity-50",
                )}
              >
                <Eye size={15} />
                Prévisualiser
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

/** Carte compacte d'un cours publié — historique + dépublication. */
export function PublishedCourseCard({ course }: { course: AdminCourseItem }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleUnpublish() {
    if (
      !window.confirm(
        `Dépublier « ${course.title} » ? Le cours repassera en brouillon et ne sera plus visible au catalogue. Les inscriptions existantes sont conservées.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await unpublishCourse(course.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <motion.article
      layout
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary px-5 py-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={course.instructor.name}
          src={course.instructor.avatar ?? undefined}
          className="h-9 w-9"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy">{course.title}</p>
          <p className="truncate text-xs text-text-secondary">
            {course.instructor.name} · {course.category}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="success">Publié</Badge>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <Users size={14} className="text-brand-blue-royal" />
          {course.enrollmentCount} inscrit{course.enrollmentCount > 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnpublish}
          loading={pending}
          className="text-error hover:bg-error/10 hover:text-error"
        >
          <EyeOff size={15} />
          Dépublier
        </Button>
      </div>

      {error && (
        <p className="w-full text-right text-xs font-medium text-error">{error}</p>
      )}
    </motion.article>
  );
}

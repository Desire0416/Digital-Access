"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X,
  Rocket,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Undo2,
  CircleDot,
} from "lucide-react";
import { Button, Badge, Textarea, buttonClasses, cn } from "@da/ui";
import {
  submitForReview,
  approveCourse,
  rejectCourse,
  unpublishCourse,
} from "@/lib/studio-actions";
import type { StudioCourseEdit } from "@/lib/studio-types";
import { MiniHeading, InlineMessage } from "./shared";

interface Props {
  course: StudioCourseEdit;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  detail: string;
}

export function PublishPanel({ course }: Props) {
  const router = useRouter();
  const [busy, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const chapterCount = course.modules.reduce((n, m) => n + m.chapters.length, 0);

  const checklist: ChecklistItem[] = [
    {
      label: "Titre renseigné",
      done: course.title.trim().length >= 4,
      detail: "Au moins 4 caractères.",
    },
    {
      label: "Description complète",
      done: course.description.trim().length >= 30,
      detail: "Au moins 30 caractères.",
    },
    {
      label: "Au moins un chapitre",
      done: chapterCount >= 1,
      detail: "Ajoutez du contenu dans l'onglet Programme.",
    },
  ];
  const ready = checklist.every((c) => c.done);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Une erreur est survenue.");
      else {
        setRejecting(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <MiniHeading>Publication</MiniHeading>

      {/* Motif de refus précédent */}
      {course.reviewNote && course.status !== "PUBLISHED" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 rounded-2xl border border-warning/40 bg-warning/[0.06] p-4"
        >
          <AlertTriangle size={20} className="mt-0.5 flex-none text-warning" aria-hidden />
          <div>
            <p className="text-sm font-bold text-navy">Modifications demandées</p>
            <p className="mt-1 text-sm text-text-secondary">{course.reviewNote}</p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/[0.05] px-4 py-2.5">
          <InlineMessage tone="error">{error}</InlineMessage>
        </div>
      )}

      {/* ── DRAFT ─────────────────────────────────────────────────────────── */}
      {course.status === "DRAFT" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                <Rocket size={19} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-navy">Prêt à publier ?</h3>
                <p className="text-sm text-text-secondary">
                  Vérifiez ces éléments avant de soumettre à validation.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5",
                    item.done
                      ? "border-success/25 bg-success/[0.04]"
                      : "border-navy/[0.08] bg-surface-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full",
                      item.done ? "bg-success text-white" : "bg-navy/10 text-text-muted",
                    )}
                  >
                    {item.done ? (
                      <Check size={13} strokeWidth={3} aria-hidden />
                    ) : (
                      <CircleDot size={12} aria-hidden />
                    )}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        item.done ? "text-navy" : "text-text-secondary",
                      )}
                    >
                      {item.label}
                    </span>
                    {!item.done && (
                      <span className="block text-xs text-text-muted">{item.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => run(() => submitForReview(course.id))}
                loading={busy}
                disabled={!ready}
                className="w-full"
              >
                <Rocket size={16} aria-hidden /> Soumettre à validation
              </Button>
              {!ready && (
                <p className="mt-2 text-center text-xs text-text-muted">
                  Complétez les éléments manquants pour activer la soumission.
                </p>
              )}
            </div>
          </div>

          {course.isAdmin && ready && (
            <AdminActions
              busy={busy}
              rejecting={rejecting}
              reason={reason}
              setReason={setReason}
              setRejecting={setRejecting}
              onApprove={() => run(() => approveCourse(course.id))}
              onReject={() =>
                run(() => rejectCourse({ courseId: course.id, reason: reason.trim() || undefined }))
              }
              note="En tant qu'administrateur, vous pouvez publier directement ce brouillon."
            />
          )}
        </div>
      )}

      {/* ── REVIEW ────────────────────────────────────────────────────────── */}
      {course.status === "REVIEW" && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-surface-primary p-6 text-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-warning/20 blur-3xl"
            />
            <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warning/15 text-warning">
              <Clock size={26} aria-hidden />
            </span>
            <h3 className="relative mt-4 font-display text-lg font-bold text-navy">
              En attente de validation
            </h3>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-text-secondary">
              Votre cours a été soumis. Un administrateur va l'examiner et vous serez notifié
              de sa décision. Vous pouvez continuer à le modifier en attendant.
            </p>
            <div className="relative mt-4 flex justify-center">
              <Badge variant="warning">
                <Clock size={12} aria-hidden /> En validation
              </Badge>
            </div>
          </div>

          {course.isAdmin && (
            <AdminActions
              busy={busy}
              rejecting={rejecting}
              reason={reason}
              setReason={setReason}
              setRejecting={setRejecting}
              onApprove={() => run(() => approveCourse(course.id))}
              onReject={() =>
                run(() => rejectCourse({ courseId: course.id, reason: reason.trim() || undefined }))
              }
              note="Ce cours attend votre décision d'administrateur."
            />
          )}
        </div>
      )}

      {/* ── PUBLISHED ─────────────────────────────────────────────────────── */}
      {course.status === "PUBLISHED" && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-success/30 bg-surface-primary p-6 text-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-success/20 blur-3xl"
            />
            <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <ShieldCheck size={26} aria-hidden />
            </span>
            <h3 className="relative mt-4 font-display text-lg font-bold text-navy">
              Cours en ligne
            </h3>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-text-secondary">
              Votre cours est publié et visible dans le catalogue. Les apprenants peuvent
              s'y inscrire dès maintenant.
            </p>
            <div className="relative mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href={`/courses/${course.slug}`}
                className={buttonClasses({ variant: "outline", size: "sm" })}
              >
                <ExternalLink size={15} aria-hidden /> Voir la fiche publique
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => run(() => unpublishCourse(course.id))}
                loading={busy}
              >
                <Undo2 size={15} aria-hidden /> Dépublier
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-text-muted">
            Dépublier repasse le cours en brouillon — les inscriptions existantes sont conservées.
          </p>
        </div>
      )}

      {/* ── ARCHIVED ──────────────────────────────────────────────────────── */}
      {course.status === "ARCHIVED" && (
        <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 text-center">
          <p className="font-semibold text-navy">Ce cours est archivé.</p>
          <p className="mt-1 text-sm text-text-secondary">
            Il n'est plus visible dans le catalogue.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Bloc d'actions administrateur ─────────────────────── */

function AdminActions({
  busy,
  rejecting,
  reason,
  setReason,
  setRejecting,
  onApprove,
  onReject,
  note,
}: {
  busy: boolean;
  rejecting: boolean;
  reason: string;
  setReason: (v: string) => void;
  setRejecting: (v: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.03] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-navy">
        <ShieldCheck size={16} className="text-accent" aria-hidden /> Espace administrateur
      </p>
      <p className="mt-1 text-xs text-text-secondary">{note}</p>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          {rejecting ? (
            <motion.div
              key="reject"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif du refus (transmis à l'instructeur) — ex : audio inaudible au chapitre 3…"
                className="min-h-20 text-sm"
                maxLength={400}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onReject}
                  loading={busy}
                  className="bg-error hover:bg-error/90"
                >
                  <ShieldX size={15} aria-hidden /> Confirmer le refus
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRejecting(false)} disabled={busy}>
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
              <Button variant="primary" size="sm" onClick={onApprove} loading={busy}>
                <ShieldCheck size={16} aria-hidden /> Approuver et publier
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRejecting(true)} disabled={busy}>
                <X size={15} aria-hidden /> Refuser
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ThumbsUp,
  CornerDownRight,
  Flag,
  Pin,
  PinOff,
  Trash2,
  Loader2,
  Send,
  X,
  CheckCircle2,
} from "lucide-react";
import { Avatar, cn } from "@da/ui";
import { Markdown } from "@/components/Markdown";
import {
  postLessonComment,
  deleteLessonComment,
  setLessonCommentPinned,
  reportLessonComment,
  toggleLessonCommentReaction,
} from "@/lib/lesson-comment-actions";
import type { CommentNode } from "@/lib/lesson-comments";

/* ══════════════════════════════════════════════════════════════════════════
   CommentItem (§7.3) — une carte de commentaire (racine OU réponse) pour le
   fil de discussion d'une leçon. Toutes les mutations passent par les actions
   serveur (autorisation revérifiée côté serveur) ; ici on gère seulement le
   feedback optimiste raisonnable + `router.refresh()` au succès.
   Le corps est rendu par <Markdown> (markdown sûr), jamais en HTML brut.
   ══════════════════════════════════════════════════════════════════════════ */

const BODY_MAX = 4000;

/** Heure relative en français, sans dépendance externe (aligné sur NotificationBell). */
function relativeTime(value: string | Date): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - then.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

/* ─── Éditeur de commentaire réutilisable (racine + réponse) ─────────────────── */

export interface CommentComposerProps {
  lessonId: string;
  /** Présent → publie une réponse rattachée à ce commentaire. */
  parentId?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  /** Variante resserrée pour les mini-formulaires de réponse. */
  compact?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}

export function CommentComposer({
  lessonId,
  parentId,
  placeholder = "Partagez une question ou un retour… (markdown pris en charge)",
  submitLabel = "Publier",
  autoFocus = false,
  compact = false,
  onDone,
  onCancel,
}: CommentComposerProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = body.trim();
    if (trimmed.length < 1) {
      setError("Le commentaire ne peut pas être vide.");
      return;
    }
    startTransition(async () => {
      const res = await postLessonComment(lessonId, { body: trimmed, parentId });
      if (res.ok) {
        setBody("");
        onDone?.();
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Publication impossible.");
      }
    });
  }

  const canSubmit = body.trim().length >= 1 && !pending;

  return (
    <form onSubmit={submit} className={cn("group/composer", compact && "mt-2")}>
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-surface-primary transition-colors",
          "border-navy/12 focus-within:border-brand-blue-royal/50",
        )}
      >
        <label htmlFor={`comment-body-${parentId ?? "root"}`} className="sr-only">
          {parentId ? "Votre réponse" : "Votre commentaire"}
        </label>
        <textarea
          id={`comment-body-${parentId ?? "root"}`}
          ref={ref}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
          rows={compact ? 2 : 3}
          maxLength={BODY_MAX}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-navy outline-none placeholder:text-text-muted"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/[0.06] bg-surface-secondary/50 px-3 py-2">
          <span className="text-[11px] text-text-muted">
            {body.trim().length}/{BODY_MAX}
          </span>
          <div className="flex items-center gap-1.5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy disabled:opacity-60"
              >
                <X size={13} aria-hidden />
                Annuler
              </button>
            )}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {pending ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <Send size={13} aria-hidden />
              )}
              {submitLabel}
            </motion.button>
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
    </form>
  );
}

/* ─── Carte d'un commentaire ─────────────────────────────────────────────────── */

export interface CommentItemProps {
  comment: CommentNode;
  lessonId: string;
  /** L'utilisateur courant peut poster (email vérifié + accès) → autorise « Répondre ». */
  canPost: boolean;
  /** L'utilisateur courant est modérateur (admin/formateur) → autorise « Épingler ». */
  isModerator: boolean;
  /** 0 = racine, 1 = réponse (compacte). */
  depth?: 0 | 1;
}

export function CommentItem({ comment, lessonId, canPost, isModerator, depth = 0 }: CommentItemProps) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [replying, setReplying] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [error, setError] = React.useState("");
  const [reported, setReported] = React.useState(false);

  // Réaction : état optimiste réconcilié sur la réponse serveur (compteur autoritatif).
  const [reacted, setReacted] = React.useState(comment.reacted);
  const [count, setCount] = React.useState(comment.reactionCount);
  React.useEffect(() => {
    setReacted(comment.reacted);
    setCount(comment.reactionCount);
  }, [comment.reacted, comment.reactionCount]);

  const [reactPending, startReact] = React.useTransition();
  const [actionPending, startAction] = React.useTransition();

  const authorName = comment.author?.name?.trim() || "Membre";
  const avatar = comment.author?.avatar ?? undefined;
  const isReply = depth > 0;

  function toggleReaction() {
    setError("");
    // Optimiste : bascule immédiatement, réconcilie avec la réponse serveur.
    const nextReacted = !reacted;
    setReacted(nextReacted);
    setCount((c) => Math.max(0, c + (nextReacted ? 1 : -1)));
    startReact(async () => {
      const res = await toggleLessonCommentReaction(comment.id);
      if (res.ok) {
        setReacted(res.reacted);
        setCount(res.count);
      } else {
        // Revient à l'état des props en cas d'échec.
        setReacted(comment.reacted);
        setCount(comment.reactionCount);
        setError(res.error);
      }
    });
  }

  function togglePin() {
    setError("");
    startAction(async () => {
      const res = await setLessonCommentPinned(comment.id, !comment.pinned);
      if (res.ok) router.refresh();
      else if (res.redirect) router.push(res.redirect);
      else setError(res.error ?? "Action impossible.");
    });
  }

  function report() {
    const reason = typeof window !== "undefined" ? window.prompt("Motif du signalement :") : null;
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed.length < 1) {
      setError("Le motif du signalement est requis.");
      return;
    }
    setError("");
    startAction(async () => {
      const res = await reportLessonComment(comment.id, trimmed);
      if (res.ok) {
        setReported(true);
        setTimeout(() => setReported(false), 3200);
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Signalement impossible.");
      }
    });
  }

  function remove() {
    setError("");
    startAction(async () => {
      const res = await deleteLessonComment(comment.id);
      if (res.ok) {
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Suppression impossible.");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <motion.article
      id={`commentaire-${comment.id}`}
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-surface-primary p-3.5 sm:p-4",
        comment.pinned
          ? "border-brand-violet/25 bg-brand-violet/[0.03]"
          : "border-navy/[0.08]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          name={authorName}
          src={avatar}
          className={cn("shrink-0", isReply ? "h-8 w-8 text-xs" : "h-9 w-9 text-[0.8rem]")}
        />

        <div className="min-w-0 flex-1">
          {/* En-tête : auteur · épinglé · date */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-display text-sm font-semibold text-navy">{authorName}</span>
            {comment.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/[0.1] px-2 py-0.5 text-[10px] font-semibold text-brand-violet">
                <Pin size={10} className="fill-brand-violet/30" aria-hidden />
                Épinglé
              </span>
            )}
            <span className="text-xs text-text-muted">{relativeTime(comment.createdAt)}</span>
          </div>

          {/* Corps markdown */}
          <div className="mt-1.5">
            <Markdown className="prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2">
              {comment.body}
            </Markdown>
          </div>

          {/* Barre d'actions */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={toggleReaction}
              disabled={reactPending}
              aria-pressed={reacted}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-70",
                reacted
                  ? "bg-brand-blue-vif/[0.1] text-brand-blue-royal"
                  : "text-text-secondary hover:bg-navy/[0.05] hover:text-navy",
              )}
            >
              <ThumbsUp size={13} aria-hidden className={reacted ? "fill-brand-blue-royal/25" : ""} />
              <span aria-label={`${count} réaction${count > 1 ? "s" : ""}`}>{count > 0 ? count : "J'aime"}</span>
            </button>

            {canPost && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                aria-expanded={replying}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy"
              >
                <CornerDownRight size={13} aria-hidden />
                Répondre
              </button>
            )}

            {isModerator && (
              <button
                type="button"
                onClick={togglePin}
                disabled={actionPending}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-brand-violet/[0.08] hover:text-brand-violet disabled:opacity-60"
              >
                {comment.pinned ? <PinOff size={13} aria-hidden /> : <Pin size={13} aria-hidden />}
                {comment.pinned ? "Désépingler" : "Épingler"}
              </button>
            )}

            <button
              type="button"
              onClick={report}
              disabled={actionPending || reported}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-70",
                reported
                  ? "text-success"
                  : "text-text-secondary hover:bg-warning/[0.1] hover:text-warning",
              )}
            >
              {reported ? <CheckCircle2 size={13} aria-hidden /> : <Flag size={13} aria-hidden />}
              {reported ? "Signalé" : "Signaler"}
            </button>

            {comment.canDelete &&
              (confirmingDelete ? (
                <span className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={actionPending}
                    className="inline-flex items-center gap-1 rounded-full bg-error px-2.5 py-1 text-xs font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    {actionPending && <Loader2 size={11} className="animate-spin" aria-hidden />}
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={actionPending}
                    className="rounded-full px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-navy/[0.05]"
                  >
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-error/[0.08] hover:text-error"
                >
                  <Trash2 size={13} aria-hidden />
                  Supprimer
                </button>
              ))}
          </div>

          {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}

          {/* Mini-formulaire de réponse */}
          <AnimatePresence initial={false}>
            {replying && (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <CommentComposer
                  lessonId={lessonId}
                  parentId={comment.id}
                  compact
                  autoFocus
                  placeholder={`Répondre à ${authorName}…`}
                  submitLabel="Répondre"
                  onDone={() => setReplying(false)}
                  onCancel={() => setReplying(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

export default CommentItem;

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Megaphone, Pin, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@da/ui";
import { postCohortAnnouncement, deleteAnnouncement } from "@/lib/announcement-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Publier / supprimer une annonce de cohorte (cahier §25) — UI cliente réservée
   aux formateurs de la cohorte et aux administrateurs (autorisation revérifiée
   côté serveur dans les actions). Le corps est du markdown, rendu par <Markdown>
   à l'affichage — ici on borne simplement la saisie.
   ══════════════════════════════════════════════════════════════════════════ */

const TITLE_MAX = 140;
const BODY_MAX = 4000;

export function AnnouncementComposer({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pinned, setPinned] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await postCohortAnnouncement(cohortId, {
        title: title.trim(),
        body: body.trim(),
        pinned,
      });
      if (res.ok) {
        setTitle("");
        setBody("");
        setPinned(false);
        setDone(true);
        setTimeout(() => setDone(false), 2600);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const canSubmit = title.trim().length >= 3 && body.trim().length >= 1 && !pending;

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary"
    >
      <div className="flex items-center gap-2.5 border-b border-navy/[0.06] bg-surface-secondary/60 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white" aria-hidden>
          <Megaphone size={16} />
        </span>
        <div>
          <p className="font-display text-sm font-bold text-navy">Publier une annonce</p>
          <span className="mt-0.5 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
        </div>
      </div>

      <div className="space-y-3.5 p-4">
        <div>
          <label htmlFor="annc-title" className="sr-only">
            Titre de l'annonce
          </label>
          <input
            id="annc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Titre de l'annonce"
            maxLength={TITLE_MAX}
            className="w-full rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm font-semibold text-navy outline-none transition-colors placeholder:font-normal placeholder:text-text-muted focus:border-brand-blue-royal/50"
          />
        </div>

        <div>
          <label htmlFor="annc-body" className="sr-only">
            Message
          </label>
          <textarea
            id="annc-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
            rows={4}
            placeholder="Votre message… (markdown pris en charge : **gras**, listes, liens)"
            maxLength={BODY_MAX}
            className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
          />
          <p className="mt-1 text-right text-xs text-text-muted">
            {body.trim().length}/{BODY_MAX}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPinned((v) => !v)}
            aria-pressed={pinned}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              pinned
                ? "border-transparent bg-brand-violet/[0.1] text-brand-violet"
                : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
            )}
          >
            <Pin size={13} aria-hidden className={pinned ? "fill-brand-violet/30" : ""} />
            {pinned ? "Épinglée" : "Épingler"}
          </button>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {done && (
                <motion.span
                  initial={reduce ? false : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-success"
                >
                  <CheckCircle2 size={14} aria-hidden />
                  Publiée
                </motion.span>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
              Publier
            </button>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-error">{error}</p>}
      </div>
    </form>
  );
}

/* ─── Suppression d'une annonce (réservée formateur / admin) ────────────────── */

export function AnnouncementDeleteButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function remove() {
    setError("");
    startTransition(async () => {
      const res = await deleteAnnouncement(announcementId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-error px-2.5 py-1 text-[11px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          {pending && <Loader2 size={11} className="animate-spin" aria-hidden />}
          Supprimer
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-navy/[0.05]"
        >
          Annuler
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Supprimer l'annonce"
        title="Supprimer l'annonce"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error"
      >
        <Trash2 size={14} aria-hidden />
      </button>
      {error && <span className="text-[11px] font-medium text-error">{error}</span>}
    </>
  );
}

export default AnnouncementComposer;

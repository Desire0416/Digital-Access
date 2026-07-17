"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageSquarePlus, Loader2, X } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { createDiscussion } from "@/lib/community-actions";
import type { CommunityContext } from "@/lib/community";

/* ══════════════════════════════════════════════════════════════════════════
   Lancer une discussion dans un espace communautaire (§25.1) — UI cliente.
   Le corps est du markdown (rendu côté lecture par <Markdown>) ; ici on borne
   la saisie. Les pièces jointes ne sont que des images Vercel Blob (max 4),
   revérifiées côté serveur. Au succès → redirection vers la discussion créée.
   ══════════════════════════════════════════════════════════════════════════ */

const TITLE_MAX = 160;
const BODY_MAX = 8000;
const MAX_ATTACH = 4;

type Attachment = { url: string; name: string };

function fileNameFromUrl(url: string): string {
  try {
    const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
    return (base || "piece-jointe").slice(0, 160);
  } catch {
    return "piece-jointe";
  }
}

export function DiscussionComposer({ ctx }: { ctx: CommunityContext }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  const canSubmit = title.trim().length >= 3 && body.trim().length >= 1 && !pending;

  function reset() {
    setTitle("");
    setBody("");
    setAttachments([]);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createDiscussion({
        ...ctx,
        title: title.trim(),
        body: body.trim(),
        attachments: attachments.length ? attachments : undefined,
      });
      if (res.ok && res.id) {
        reset();
        setOpen(false);
        router.push(`/espace/communaute/sujet/${res.id}`);
      } else if (!res.ok && res.redirect) {
        router.push(res.redirect);
      } else if (!res.ok) {
        setError(res.error ?? "Une erreur est survenue.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95"
      >
        <MessageSquarePlus size={16} aria-hidden />
        Nouvelle discussion
      </button>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary"
    >
      <div className="flex items-center justify-between gap-2.5 border-b border-navy/[0.06] bg-surface-secondary/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white" aria-hidden>
            <MessageSquarePlus size={16} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-navy">Lancer une discussion</p>
            <span className="mt-0.5 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          aria-label="Fermer"
          className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="space-y-3.5 p-4">
        <div>
          <label htmlFor="disc-title" className="sr-only">
            Titre de la discussion
          </label>
          <input
            id="disc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Titre de votre discussion"
            maxLength={TITLE_MAX}
            className="w-full rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm font-semibold text-navy outline-none transition-colors placeholder:font-normal placeholder:text-text-muted focus:border-brand-blue-royal/50"
          />
        </div>

        <div>
          <label htmlFor="disc-body" className="sr-only">
            Message
          </label>
          <textarea
            id="disc-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
            rows={5}
            placeholder="Développez votre question ou votre sujet… (markdown pris en charge : **gras**, listes, liens, code)"
            maxLength={BODY_MAX}
            className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm leading-relaxed text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
          />
          <p className="mt-1 text-right text-xs text-text-muted">
            {body.trim().length}/{BODY_MAX}
          </p>
        </div>

        {/* Pièces jointes (images) */}
        <div className="space-y-2.5">
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {attachments.map((a) => (
                <div
                  key={a.url}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-navy/[0.08]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.url !== a.url))}
                    aria-label={`Retirer ${a.name}`}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-navy/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={13} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachments.length < MAX_ATTACH && (
            <ImageUpload
              variant="dropzone"
              value={null}
              aspect="5 / 2"
              rounded="rounded-xl"
              folder="community"
              hint={`Image jointe — ${MAX_ATTACH - attachments.length} restante(s), 5 Mo max`}
              onChange={(url) => {
                if (!url) return;
                setAttachments((prev) =>
                  prev.length < MAX_ATTACH ? [...prev, { url, name: fileNameFromUrl(url) }] : prev,
                );
              }}
              className="max-w-sm"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
            Publier la discussion
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-error"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  );
}

export default DiscussionComposer;

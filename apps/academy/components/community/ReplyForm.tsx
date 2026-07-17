"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { createReply } from "@/lib/community-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Répondre à une discussion (§25.2) — UI cliente. `parentId` permet de répondre
   sous une réponse (fil imbriqué). Corps markdown borné ; pièces jointes = images
   Vercel Blob (max 4), revérifiées côté serveur. Reset + rafraîchissement au
   succès (le fil est re-rendu par le composant serveur).
   ══════════════════════════════════════════════════════════════════════════ */

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

export function ReplyForm({
  discussionId,
  parentId,
  onDone,
  autoFocus = false,
  placeholder = "Écrire une réponse… (markdown pris en charge)",
}: {
  discussionId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [body, setBody] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [showAttach, setShowAttach] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  const canSubmit = body.trim().length >= 1 && !pending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createReply(discussionId, {
        body: body.trim(),
        parentId,
        attachments: attachments.length ? attachments : undefined,
      });
      if (res.ok) {
        setBody("");
        setAttachments([]);
        setShowAttach(false);
        onDone?.();
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-3.5">
      <label htmlFor={`reply-${parentId ?? "root"}-${discussionId}`} className="sr-only">
        Votre réponse
      </label>
      <textarea
        id={`reply-${parentId ?? "root"}-${discussionId}`}
        value={body}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
        rows={parentId ? 3 : 4}
        placeholder={placeholder}
        maxLength={BODY_MAX}
        className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm leading-relaxed text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
      />

      {/* Pièces jointes */}
      {attachments.length > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

      {showAttach && attachments.length < MAX_ATTACH && (
        <div className="mt-2.5">
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
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowAttach((v) => !v)}
          aria-pressed={showAttach}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            showAttach
              ? "border-transparent bg-brand-blue-vif/[0.1] text-brand-blue-royal"
              : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
          )}
        >
          <Paperclip size={13} aria-hidden />
          Joindre une image
        </button>

        <div className="flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="rounded-xl px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
            Répondre
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm font-medium text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

export default ReplyForm;

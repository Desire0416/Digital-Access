"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, PenLine, AlertCircle } from "lucide-react";
import {
  Field,
  Input,
  Textarea,
  buttonClasses,
  cn,
} from "@da/ui";
import { createForumTopic } from "@/lib/community-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Modal de création de sujet — accessible (Échap + clic extérieur + focus),
   champs titre / contenu (markdown) / catégorie / tags.
   ══════════════════════════════════════════════════════════════════════════ */

export function NewTopicDialog({
  slug,
  open,
  onClose,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [tags, setTags] = React.useState("");

  // Fermeture Échap + focus initial + verrou du scroll de fond.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => titleRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Réinitialise les champs à la fermeture.
  React.useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    startTransition(async () => {
      const res = await createForumTopic(slug, {
        title,
        content,
        category: category.trim() || null,
        tags: parsedTags,
      });
      if (res.ok) {
        onClose();
        router.push(`/courses/${slug}/forum/${res.topicId}`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-topic-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Fond */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
          />

          {/* Panneau */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
          >
            {/* En-tête */}
            <div className="relative flex items-center justify-between gap-3 border-b border-navy/[0.07] px-5 py-4 sm:px-6">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-da" />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-da text-white shadow-brand">
                  <PenLine size={18} />
                </span>
                <div>
                  <h2 id="new-topic-title" className="font-display text-lg font-bold tracking-tight text-navy">
                    Nouveau sujet
                  </h2>
                  <p className="text-xs text-text-muted">Partagez votre question avec la communauté</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                <Field label="Titre" htmlFor="topic-title" required>
                  <Input
                    id="topic-title"
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex. Comment centrer une div avec Flexbox ?"
                    maxLength={160}
                  />
                </Field>

                <Field
                  label="Votre message"
                  htmlFor="topic-content"
                  hint="Le markdown est pris en charge (gras, listes, ```code```)."
                  required
                >
                  <Textarea
                    id="topic-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Décrivez votre question ou votre idée en détail…"
                    rows={6}
                    maxLength={8000}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Catégorie" htmlFor="topic-category" hint="Optionnel">
                    <Input
                      id="topic-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ex. CSS, Débogage…"
                      maxLength={40}
                    />
                  </Field>
                  <Field label="Tags" htmlFor="topic-tags" hint="Séparés par des virgules">
                    <Input
                      id="topic-tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="flexbox, layout, css"
                    />
                  </Field>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/[0.06] px-3.5 py-2.5 text-sm font-medium text-error">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Pied */}
              <div className="flex items-center justify-end gap-3 border-t border-navy/[0.07] bg-surface-secondary/50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={buttonClasses({ variant: "ghost", size: "md" })}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(buttonClasses({ variant: "primary", size: "md" }))}
                >
                  {pending ? "Publication…" : "Publier le sujet"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

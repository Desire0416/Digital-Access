"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, X } from "lucide-react";
import { createCourse } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Création rapide d'une formation par le formateur (§29.2). Un champ « titre »
   → createCourse crée la formation en brouillon et rattache le formateur comme
   propriétaire (CourseInstructor) ; on redirige vers son éditeur. Modale brandée.
   ══════════════════════════════════════════════════════════════════════════ */

export function CreateCourseButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
    }
  }, [open]);

  function submit() {
    if (value.trim().length < 3) {
      setError("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    startTransition(async () => {
      const res = await createCourse(value.trim());
      if (res.ok) {
        setOpen(false);
        router.push(`/formateur/formations/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
      >
        <Plus size={16} aria-hidden />
        Créer une formation
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !pending && setOpen(false)}
                  className="fixed inset-0 z-[60] bg-navy/50 backdrop-blur-sm"
                />
                <div className="fixed inset-0 z-[61] grid place-items-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.18 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Créer une formation"
                    className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-primary shadow-2xl"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-navy/[0.07] bg-surface-secondary/60 px-5 py-4">
                      <p className="font-display text-base font-bold text-navy">Créer une formation</p>
                      <button
                        type="button"
                        onClick={() => !pending && setOpen(false)}
                        aria-label="Fermer"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>
                    <div className="p-5">
                      <label htmlFor="new-course-title" className="mb-1.5 block text-sm font-semibold text-navy">
                        Intitulé de la formation
                      </label>
                      <input
                        id="new-course-title"
                        autoFocus
                        value={value}
                        onChange={(e) => {
                          setValue(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submit();
                        }}
                        placeholder="Ex. Fondamentaux du SQL"
                        className="h-11 w-full rounded-lg border border-navy/10 bg-surface-primary px-3.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
                      />
                      {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
                      <p className="mt-2 text-xs text-text-muted">
                        La formation est créée en brouillon. Vous compléterez sa fiche et son programme à l&apos;étape
                        suivante, puis la soumettrez à validation.
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-navy/[0.07] px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={pending}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] disabled:opacity-60"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={submit}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                      >
                        {pending && <Loader2 size={14} className="animate-spin" aria-hidden />}
                        Créer
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, School, AlertCircle } from "lucide-react";
import { Button, Input, Textarea, Field } from "@da/ui";
import { createSchool } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Bouton « Nouvelle école » + modale de création (nom, description courte,
   icône, couleur). Rendu en portail, fermeture Échap/clic extérieur.
   ══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_ICON = "graduation-cap";
const DEFAULT_COLOR = "#5B3FA8";

export function SchoolCreateForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [icon, setIcon] = React.useState(DEFAULT_ICON);
  const [color, setColor] = React.useState(DEFAULT_COLOR);

  React.useEffect(() => setMounted(true), []);

  const reset = () => {
    setName("");
    setShortDescription("");
    setIcon(DEFAULT_ICON);
    setColor(DEFAULT_COLOR);
    setError(null);
  };

  const close = React.useCallback(() => {
    if (pending) return;
    setOpen(false);
  }, [pending]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSchool({ name, shortDescription, icon, color });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Plus size={16} />
        Nouvelle école
      </Button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm"
                onMouseDown={close}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  onMouseDown={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Créer une école"
                  className="my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 border-b border-navy/[0.06] bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-da text-white">
                        <School size={20} />
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-bold text-navy">Nouvelle école</h2>
                        <p className="text-xs text-text-secondary">Un nouveau pôle thématique du catalogue.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      disabled={pending}
                      aria-label="Fermer"
                      className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Formulaire */}
                  <form onSubmit={submit} className="space-y-5 px-6 py-6">
                    <Field label="Nom de l'école" htmlFor="school-name" required>
                      <Input
                        id="school-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="École du Développement Web"
                        autoFocus
                        maxLength={120}
                      />
                    </Field>

                    <Field label="Description courte" htmlFor="school-desc" required hint="Une phrase de présentation affichée dans le catalogue.">
                      <Textarea
                        id="school-desc"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Formez-vous aux métiers du web, du front-end au back-end."
                        maxLength={300}
                        className="min-h-20"
                      />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Icône" htmlFor="school-icon" hint="Nom d'icône (ex. code, palette…).">
                        <Input
                          id="school-icon"
                          value={icon}
                          onChange={(e) => setIcon(e.target.value)}
                          placeholder="graduation-cap"
                          maxLength={40}
                          className="font-mono"
                        />
                      </Field>

                      <Field label="Couleur" htmlFor="school-color">
                        <div className="flex items-center gap-2.5">
                          <input
                            id="school-color"
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_COLOR}
                            onChange={(e) => setColor(e.target.value)}
                            aria-label="Sélecteur de couleur"
                            className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-navy/15 bg-surface-primary p-1"
                          />
                          <Input
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#5B3FA8"
                            maxLength={20}
                            className="font-mono uppercase"
                          />
                        </div>
                      </Field>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/[0.06] px-3.5 py-2.5 text-sm text-error">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                        Annuler
                      </Button>
                      <Button type="submit" size="sm" loading={pending}>
                        Créer l'école
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

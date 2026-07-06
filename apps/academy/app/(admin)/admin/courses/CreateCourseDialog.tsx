"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";
import { Button, Field, Input } from "@da/ui";
import type { CategoryItem } from "@/lib/types";
import type { CourseLevel } from "@/lib/studio-types";
import { createCourse } from "@/lib/studio-actions";
import { Select } from "@/components/Select";

/* ══════════════════════════════════════════════════════════════════════════
   Dialogue de création rapide d'un cours depuis l'admin. Crée un brouillon
   (createCourse) puis redirige vers l'éditeur /studio/courses/[id]/edit.
   ══════════════════════════════════════════════════════════════════════════ */

const LEVELS: { value: CourseLevel; label: string; hint: string }[] = [
  { value: "BEGINNER", label: "Débutant", hint: "Aucun prérequis" },
  { value: "INTERMEDIATE", label: "Intermédiaire", hint: "Bases acquises" },
  { value: "ADVANCED", label: "Avancé", hint: "Public expert" },
];

export function CreateCourseDialog({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [level, setLevel] = React.useState<CourseLevel>("BEGINNER");

  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();
  const titleRef = React.useRef<HTMLInputElement>(null);

  const reset = React.useCallback(() => {
    setTitle("");
    setSubtitle("");
    setCategoryId("");
    setLevel("BEGINNER");
    setError(null);
    setFieldErrors({});
  }, []);

  const close = React.useCallback(() => {
    if (pending) return;
    setOpen(false);
  }, [pending]);

  // Focus initial + verrou de scroll + fermeture Échap.
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const categoryOptions = React.useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await createCourse({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        categoryId,
        level,
      });
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      router.push(`/studio/courses/${res.courseId}/edit`);
    });
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-da px-4 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <Plus size={18} strokeWidth={2.5} />
        Créer un cours
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            />

            {/* Panneau */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-new-course-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border border-navy/10 bg-surface-primary shadow-2xl sm:rounded-2xl"
            >
              {/* Filet dégradé signature */}
              <div aria-hidden className="h-1 w-full bg-gradient-da" />

              {/* En-tête */}
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h2
                      id="admin-new-course-title"
                      className="font-display text-xl font-bold text-navy"
                    >
                      Nouveau cours
                    </h2>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      Un brouillon est créé et vous êtes redirigé vers
                      l&apos;éditeur — tout reste modifiable ensuite.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  aria-label="Fermer"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5">
                <div className="space-y-4">
                  <Field
                    label="Titre du cours"
                    htmlFor="admin-course-title"
                    required
                    error={fieldErrors.title}
                    hint="Clair et accrocheur — ex. « Maîtriser React de zéro »."
                  >
                    <Input
                      id="admin-course-title"
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre de la formation"
                      maxLength={120}
                      error={!!fieldErrors.title}
                    />
                  </Field>

                  <Field
                    label="Sous-titre"
                    htmlFor="admin-course-subtitle"
                    hint="Optionnel — une phrase qui résume la promesse du cours."
                  >
                    <Input
                      id="admin-course-subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ce que l'apprenant saura faire à la fin"
                      maxLength={160}
                    />
                  </Field>

                  <Field
                    label="Catégorie"
                    htmlFor="admin-course-category"
                    required
                    error={fieldErrors.categoryId}
                  >
                    <Select
                      value={categoryId || null}
                      onChange={setCategoryId}
                      options={categoryOptions}
                      placeholder="Choisissez une catégorie"
                      ariaLabel="Catégorie du cours"
                      buttonClassName="py-3"
                    />
                  </Field>

                  {/* Niveau — pills */}
                  <div>
                    <span className="mb-1.5 block text-sm font-semibold text-navy">
                      Niveau
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {LEVELS.map((l) => {
                        const active = level === l.value;
                        return (
                          <button
                            key={l.value}
                            type="button"
                            onClick={() => setLevel(l.value)}
                            aria-pressed={active}
                            className={
                              active
                                ? "relative rounded-xl border border-transparent bg-gradient-da px-3 py-2.5 text-left text-white shadow-sm transition-all"
                                : "relative rounded-xl border border-navy/15 bg-surface-primary px-3 py-2.5 text-left text-navy transition-all hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]"
                            }
                          >
                            <span className="block text-sm font-bold">{l.label}</span>
                            <span
                              className={
                                active
                                  ? "mt-0.5 block text-[11px] leading-tight text-white/80"
                                  : "mt-0.5 block text-[11px] leading-tight text-text-muted"
                              }
                            >
                              {l.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Erreur globale */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      role="alert"
                      className="mt-4 overflow-hidden rounded-lg bg-error/[0.06] px-3.5 py-2.5 text-sm font-medium text-error"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={close} disabled={pending}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" loading={pending}>
                    <Sparkles size={17} />
                    Créer et éditer
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

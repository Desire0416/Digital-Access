"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";
import { Button, Field, Input, cn } from "@da/ui";
import type { CategoryItem } from "@/lib/types";
import type { CourseLevel } from "@/lib/studio-types";
import { createCourse } from "@/lib/studio-actions";

const levels: { value: CourseLevel; label: string; hint: string }[] = [
  { value: "BEGINNER", label: "Débutant", hint: "Aucun prérequis" },
  { value: "INTERMEDIATE", label: "Intermédiaire", hint: "Bases acquises" },
  { value: "ADVANCED", label: "Avancé", hint: "Public expert" },
];

export function NewCourseDialog({ categories }: { categories: CategoryItem[] }) {
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
      <Button
        variant="primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Plus size={18} />
        Créer un cours
      </Button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
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
              aria-labelledby="new-course-title"
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 24 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, y: 24 }
              }
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border border-navy/10 bg-surface-primary shadow-brand-lg sm:rounded-2xl"
            >
              {/* Filet dégradé signature */}
              <div aria-hidden className="h-1 w-full bg-gradient-da" />

              {/* En-tête */}
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <h2
                      id="new-course-title"
                      className="font-display text-xl font-bold text-navy"
                    >
                      Nouveau cours
                    </h2>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      Quelques infos pour démarrer — tout reste modifiable
                      ensuite.
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
                    htmlFor="course-title"
                    required
                    error={fieldErrors.title}
                    hint="Clair et accrocheur — ex. « Maîtriser React de zéro »."
                  >
                    <Input
                      id="course-title"
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre de votre formation"
                      maxLength={120}
                      error={!!fieldErrors.title}
                    />
                  </Field>

                  <Field
                    label="Sous-titre"
                    htmlFor="course-subtitle"
                    hint="Optionnel — une phrase qui résume la promesse du cours."
                  >
                    <Input
                      id="course-subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ce que l'apprenant saura faire à la fin"
                      maxLength={160}
                    />
                  </Field>

                  <Field
                    label="Catégorie"
                    htmlFor="course-category"
                    required
                    error={fieldErrors.categoryId}
                  >
                    <div className="relative">
                      <select
                        id="course-category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        aria-invalid={!!fieldErrors.categoryId}
                        className={cn(
                          "w-full appearance-none rounded-lg border bg-surface-primary px-3.5 py-2.5 pr-10 text-sm text-navy outline-none transition-colors",
                          "focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/30",
                          fieldErrors.categoryId
                            ? "border-error/60"
                            : "border-navy/15",
                        )}
                      >
                        <option value="" disabled>
                          Choisissez une catégorie
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Field>

                  {/* Niveau — pills */}
                  <div>
                    <span className="mb-1.5 block text-sm font-semibold text-navy">
                      Niveau
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {levels.map((l) => {
                        const active = level === l.value;
                        return (
                          <button
                            key={l.value}
                            type="button"
                            onClick={() => setLevel(l.value)}
                            aria-pressed={active}
                            className={cn(
                              "relative rounded-xl border px-3 py-2.5 text-left transition-all",
                              active
                                ? "border-transparent bg-gradient-da text-white shadow-brand"
                                : "border-navy/15 bg-surface-primary text-navy hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]",
                            )}
                          >
                            <span className="block text-sm font-bold">
                              {l.label}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 block text-[11px] leading-tight",
                                active ? "text-white/80" : "text-text-muted",
                              )}
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
                      className="mt-4 overflow-hidden rounded-lg bg-error/[0.06] px-3.5 py-2.5 text-sm font-medium text-error"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={close}
                    disabled={pending}
                  >
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

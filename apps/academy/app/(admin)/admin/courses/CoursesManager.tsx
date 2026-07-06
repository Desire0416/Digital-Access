"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Hourglass, LibraryBig, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import { Select, type SelectOption } from "@/components/Select";
import type { AdminManagedCourse } from "./queries";
import { CourseAdminCard } from "./CourseAdminCard";

/* ══════════════════════════════════════════════════════════════════════════
   Orchestrateur client de la liste des cours : recherche (debounce → URL),
   filtres statut / catégorie / niveau via <Select>, file de validation mise en
   avant, puis grille brandée du reste. Les données arrivent déjà filtrées côté
   serveur ; ce composant pilote uniquement l'URL et l'affichage.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les statuts" },
  { value: "PUBLISHED", label: "Publiés", dotColor: "#059669" },
  { value: "REVIEW", label: "En validation", dotColor: "#f59e0b" },
  { value: "DRAFT", label: "Brouillons", dotColor: "#9ca3af" },
  { value: "ARCHIVED", label: "Archivés", dotColor: "#9ca3af" },
];

const LEVEL_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les niveaux" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function CoursesManager({
  courses,
  categories,
  filters,
}: {
  courses: AdminManagedCourse[];
  categories: { slug: string; name: string }[];
  filters: { q: string; status: string; category: string; level: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const [q, setQ] = React.useState(filters.q);
  const firstRender = React.useRef(true);

  const categoryOptions = React.useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Toutes les catégories" },
      ...categories.map((c) => ({ value: c.slug, label: c.name })),
    ],
    [categories],
  );

  // Pousse une valeur de filtre dans l'URL (searchParams), sans scroll.
  const pushParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `/admin/courses?${qs}` : "/admin/courses", { scroll: false });
    },
    [router, searchParams],
  );

  // Recherche : debounce 300 ms → URL.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if (q !== filters.q) pushParam("q", q.trim());
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Resynchronise le champ si l'URL change (ex. reset).
  React.useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  const hasActiveFilter =
    !!filters.q || !!filters.status || !!filters.category || !!filters.level;

  function resetAll() {
    setQ("");
    router.replace("/admin/courses", { scroll: false });
  }

  // Segmentation : file de validation en tête, reste ensuite.
  const reviewQueue = courses.filter((c) => c.status === "REVIEW");
  const rest = courses.filter((c) => c.status !== "REVIEW");
  // Quand on filtre explicitement sur un statut, pas de double section.
  const splitQueue = !filters.status;

  return (
    <div>
      {/* ── Barre de recherche + filtres ─────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par titre ou instructeur…"
            aria-label="Rechercher un cours par titre ou instructeur"
            className="h-11 w-full rounded-xl border border-navy/[0.1] bg-surface-primary pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/25"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
          <Select
            value={filters.status || ""}
            onChange={(v) => pushParam("status", v)}
            options={STATUS_OPTIONS}
            placeholder="Statut"
            ariaLabel="Filtrer par statut"
            className="lg:w-44"
          />
          <Select
            value={filters.category || ""}
            onChange={(v) => pushParam("category", v)}
            options={categoryOptions}
            placeholder="Catégorie"
            ariaLabel="Filtrer par catégorie"
            className="lg:w-48"
          />
          <Select
            value={filters.level || ""}
            onChange={(v) => pushParam("level", v)}
            options={LEVEL_OPTIONS}
            placeholder="Niveau"
            ariaLabel="Filtrer par niveau"
            className="lg:w-44"
          />
        </div>
      </div>

      {/* Bandeau filtres actifs */}
      <AnimatePresence>
        {hasActiveFilter && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <SlidersHorizontal size={14} className="text-brand-blue-royal" />
              <span className="font-medium">
                {courses.length} cours correspondant{courses.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.09]"
              >
                <X size={12} />
                Réinitialiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {courses.length === 0 ? (
        <EmptyState
          icon={<LibraryBig size={22} />}
          title={hasActiveFilter ? "Aucun cours ne correspond" : "Aucun cours"}
          description={
            hasActiveFilter
              ? "Aucun cours ne correspond à ces critères. Élargissez la recherche ou réinitialisez les filtres."
              : "Aucun cours n'existe encore. Créez le premier avec le bouton « Créer un cours »."
          }
        >
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-navy/[0.12] bg-surface-primary px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <X size={15} />
              Réinitialiser les filtres
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          {/* ── File de validation (mise en avant) ────────────────────────── */}
          {splitQueue && reviewQueue.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-bold text-navy">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning/15 text-[#B45309]">
                  <Hourglass size={16} />
                </span>
                En attente de validation
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-[#B45309]">
                  {reviewQueue.length}
                </span>
              </h2>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {reviewQueue.map((c) => (
                  <motion.div key={c.id} variants={item}>
                    <CourseAdminCard course={c} highlight />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* ── Tous les cours ───────────────────────────────────────────── */}
          {(splitQueue ? rest : courses).length > 0 && (
            <section>
              {splitQueue && reviewQueue.length > 0 && (
                <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-bold text-navy">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-blue-royal/10 text-brand-blue-royal">
                    <LibraryBig size={16} />
                  </span>
                  Tous les cours
                </h2>
              )}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {(splitQueue ? rest : courses).map((c) => (
                  <motion.div key={c.id} variants={item}>
                    <CourseAdminCard course={c} highlight={c.status === "REVIEW"} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

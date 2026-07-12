"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@da/ui";
import { Select } from "@/components/Select";

/* ══════════════════════════════════════════════════════════════════════════
   Barre de filtres du catalogue de parcours métiers (cahier §13.2). Pilote
   l'URL : recherche debouncée (métier / titre), école, niveau d'entrée.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SchoolOption {
  slug: string;
  name: string;
}

const ENTRY_OPTIONS = [
  { value: "", label: "Tous les niveaux d'entrée" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "EXPERT", label: "Expert" },
];

export function PathFilters({
  schools,
  resultCount,
}: {
  schools: SchoolOption[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(currentQ);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setQuery(currentQ);
  }, [currentQ]);

  const pushParams = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setParam = React.useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [pushParams],
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value.trim()), 320);
  };

  const schoolOptions = React.useMemo(
    () => [{ value: "", label: "Toutes les écoles" }, ...schools.map((s) => ({ value: s.slug, label: s.name }))],
    [schools],
  );

  const level = searchParams.get("level") ?? "";
  const school = searchParams.get("ecole") ?? "";
  const hasFilters = Boolean(currentQ || level || school);

  const reset = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-navy/[0.07] bg-surface-primary/85 px-4 py-4 backdrop-blur-xl sm:top-[68px] sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:shadow-[0_10px_30px_-18px_rgba(43,58,140,0.35)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher un métier, un parcours…"
            aria-label="Rechercher un parcours métier"
            className="h-11 w-full rounded-xl border border-navy/[0.1] bg-surface-primary pl-10 pr-4 text-sm font-medium text-navy placeholder:text-text-muted transition-colors hover:border-navy/20 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:flex lg:items-center">
          <Select
            value={school}
            onChange={(v) => setParam("ecole", v)}
            options={schoolOptions}
            ariaLabel="Filtrer par école"
            className="lg:w-52"
          />
          <Select
            value={level}
            onChange={(v) => setParam("level", v)}
            options={ENTRY_OPTIONS}
            ariaLabel="Filtrer par niveau d'entrée"
            className="lg:w-56"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <p className="inline-flex items-center gap-2 font-medium text-text-secondary">
          <SlidersHorizontal size={14} className="text-brand-blue-royal" aria-hidden />
          <span className="font-display font-bold text-navy">{resultCount}</span>
          parcours
          {hasFilters && <span className="text-text-muted">· filtres actifs</span>}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/10",
            )}
          >
            <X size={13} aria-hidden />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@da/ui";

const LEVELS = [
  { value: "", label: "Tous niveaux" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "EXPERT", label: "Expert" },
];

interface SchoolOption {
  slug: string;
  name: string;
}

/**
 * Barre de filtres du catalogue (école, niveau, recherche), pilotée par l'URL.
 * La recherche est débouncée ; les autres filtres s'appliquent immédiatement.
 */
export function CatalogueFilters({
  schools,
  basePath,
}: {
  schools: SchoolOption[];
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const school = params.get("school") ?? "";
  const level = params.get("level") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = React.useState(q);

  // Reflète les changements d'URL externes (navigation, reset).
  React.useEffect(() => {
    setSearch(q);
  }, [q]);

  const push = React.useCallback(
    (next: { school?: string; level?: string; q?: string }) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) sp.set(key, value);
        else sp.delete(key);
      }
      const qs = sp.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [params, router, basePath],
  );

  // Débounce de la recherche.
  React.useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => push({ q: search }), 350);
    return () => clearTimeout(t);
  }, [search, q, push]);

  const hasFilters = Boolean(school || level || q);

  return (
    <div className="flex flex-col gap-4">
      {/* Recherche + niveau */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un parcours, une compétence, un métier…"
            className="h-12 w-full rounded-xl border border-navy/12 bg-surface-primary pl-11 pr-4 text-sm text-navy transition-colors placeholder:text-text-muted focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          />
        </div>
        <div className="relative">
          <select
            value={level}
            onChange={(e) => push({ level: e.target.value })}
            aria-label="Niveau"
            className="h-12 w-full appearance-none rounded-xl border border-navy/12 bg-surface-primary pl-4 pr-10 text-sm font-medium text-navy focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20 sm:w-52"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Écoles (chips) */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={!school} onClick={() => push({ school: "" })}>Toutes les écoles</FilterChip>
        {schools.map((s) => (
          <FilterChip key={s.slug} active={school === s.slug} onClick={() => push({ school: s.slug })}>
            {s.name.replace(/^École\s+(d'|de l'|de la |des |du |de )/i, "")}
          </FilterChip>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(basePath, { scroll: false })}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/[0.06]"
          >
            <X size={13} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-gradient-da text-white shadow-brand"
          : "border border-navy/10 bg-surface-primary text-navy hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
      )}
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@da/ui";

interface SchoolOption {
  slug: string;
  name: string;
}

const LEVELS = [
  { value: "", label: "Tous niveaux" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
  { value: "EXPERT", label: "Expert" },
];
const PRICES = [
  { value: "", label: "Tous les prix" },
  { value: "free", label: "Gratuit" },
  { value: "paid", label: "Payant" },
];
const SORTS = [
  { value: "", label: "Pertinence" },
  { value: "recent", label: "Plus récents" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "az", label: "Alphabétique" },
];

function shortSchool(name: string) {
  return name.replace(/^École\s+(d'|de l'|de la |des |du |de )/i, "");
}

/**
 * Filtre catalogue avancé, piloté par l'URL. Barre latérale STICKY sur desktop
 * (reste visible pendant le défilement des résultats) ; tiroir sur mobile.
 */
export function AdvancedCatalogueFilters({
  schools,
  basePath,
  total,
  itemLabel,
}: {
  schools: SchoolOption[];
  basePath: string;
  total: number;
  itemLabel: string; // « parcours » | « formations »
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [drawer, setDrawer] = React.useState(false);

  const school = params.get("school") ?? "";
  const level = params.get("level") ?? "";
  const price = params.get("price") ?? "";
  const sort = params.get("sort") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = React.useState(q);

  React.useEffect(() => setSearch(q), [q]);

  const push = React.useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      const qs = sp.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [params, router, basePath],
  );

  React.useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => push({ q: search }), 350);
    return () => clearTimeout(t);
  }, [search, q, push]);

  const activeCount = [school, level, price, q].filter(Boolean).length;
  const reset = () => {
    setSearch("");
    router.replace(basePath, { scroll: false });
  };

  const body = (
    <div className="flex flex-col gap-6">
      {/* Recherche */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-muted">Recherche</label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mot-clé, métier, outil…"
            className="h-11 w-full rounded-xl border border-navy/12 bg-surface-primary pl-10 pr-3 text-sm text-navy placeholder:text-text-muted focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          />
        </div>
      </div>

      {/* Tri */}
      <FilterGroup label="Trier par">
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => push({ sort: e.target.value })}
            className="h-11 w-full appearance-none rounded-xl border border-navy/12 bg-surface-primary pl-3.5 pr-9 text-sm font-medium text-navy focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </FilterGroup>

      {/* École */}
      <FilterGroup label="École">
        <div className="flex flex-col gap-1">
          <RadioPill active={!school} onClick={() => push({ school: "" })}>Toutes les écoles</RadioPill>
          {schools.map((s) => (
            <RadioPill key={s.slug} active={school === s.slug} onClick={() => push({ school: s.slug })}>
              {shortSchool(s.name)}
            </RadioPill>
          ))}
        </div>
      </FilterGroup>

      {/* Niveau */}
      <FilterGroup label="Niveau">
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => (
            <ChipPill key={l.value} active={level === l.value} onClick={() => push({ level: l.value })}>{l.label}</ChipPill>
          ))}
        </div>
      </FilterGroup>

      {/* Prix */}
      <FilterGroup label="Prix">
        <div className="flex flex-wrap gap-1.5">
          {PRICES.map((p) => (
            <ChipPill key={p.value} active={price === p.value} onClick={() => push({ price: p.value })}>{p.label}</ChipPill>
          ))}
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/12 px-3 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06]"
        >
          <RotateCcw size={14} /> Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop — sticky */}
      <aside className="hidden lg:block">
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-2xl border border-navy/[0.08] bg-surface-secondary/40 p-5">
          <div className="mb-5 flex items-center gap-2 border-b border-navy/[0.06] pb-4">
            <SlidersHorizontal size={17} className="text-brand-blue-royal" />
            <h2 className="font-display text-sm font-bold text-navy">Filtrer</h2>
            <span className="ml-auto rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">{total}</span>
          </div>
          {body}
        </div>
      </aside>

      {/* Mobile — barre + tiroir */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex w-full items-center justify-between rounded-xl border border-navy/12 bg-surface-primary px-4 py-3 text-sm font-semibold text-navy"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-blue-royal" /> Filtrer & trier
            {activeCount > 0 && <span className="rounded-full bg-gradient-da px-2 py-0.5 text-[11px] font-bold text-white">{activeCount}</span>}
          </span>
          <span className="text-text-muted">{total} résultat{total > 1 ? "s" : ""}</span>
        </button>

        <AnimatePresence>
          {drawer && (
            <>
              <motion.button
                type="button"
                aria-label="Fermer"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDrawer(false)}
                className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 38 }}
                className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-surface-primary shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-navy/[0.06] px-5 py-4">
                  <h2 className="font-display text-base font-bold text-navy">Filtrer & trier</h2>
                  <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-navy/[0.06]" aria-label="Fermer"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">{body}</div>
                <div className="border-t border-navy/[0.06] p-4">
                  <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    className="w-full rounded-xl bg-gradient-da py-3 text-sm font-semibold text-white shadow-brand"
                  >
                    Voir {total} {itemLabel}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function RadioPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        active ? "bg-brand-blue-vif/10 text-brand-blue-royal" : "text-navy hover:bg-navy/[0.04]",
      )}
    >
      <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", active ? "border-brand-blue-vif" : "border-navy/25")}>
        {active && <span className="h-2 w-2 rounded-full bg-brand-blue-vif" />}
      </span>
      {children}
    </button>
  );
}

function ChipPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-gradient-da text-white shadow-brand" : "border border-navy/12 bg-surface-primary text-navy hover:border-brand-blue-vif/40",
      )}
    >
      {children}
    </button>
  );
}

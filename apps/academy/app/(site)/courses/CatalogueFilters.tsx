"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { Input, cn } from "@da/ui";
import { Icon } from "@/components/Icon";
import { levelLabel } from "@/lib/site";
import type { CategoryItem } from "@/lib/types";

/* ─────────────────────────────── Constantes ────────────────────────────────── */

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

const PRICES = [
  { value: "free", label: "Gratuit" },
  { value: "paid", label: "Payant" },
] as const;

const SORTS = [
  { value: "popular", label: "Populaire" },
  { value: "recent", label: "Récent" },
  { value: "rating", label: "Mieux notés" },
] as const;

/** Masque la scrollbar des rangées défilantes (mobile) sans casser le scroll. */
const scrollRow =
  "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ────────────────────────────────── Pill ───────────────────────────────────── */

interface PillProps {
  active: boolean;
  onClick: () => void;
  /** id partagé par groupe : l'indicateur dégradé glisse d'une pill à l'autre */
  layoutId: string;
  children: React.ReactNode;
  /** chip bordée (catégories) vs segment compact (niveau/prix) */
  chip?: boolean;
}

function Pill({ active, onClick, layoutId, children, chip = false }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative shrink-0 select-none whitespace-nowrap rounded-full font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/60",
        chip
          ? cn(
              "border px-4 py-2 text-sm",
              active
                ? "border-transparent text-white"
                : "border-navy/10 bg-surface-primary text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
            )
          : cn(
              "px-3.5 py-1.5 text-xs",
              active ? "text-white" : "text-text-secondary hover:text-navy",
            ),
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-da shadow-brand"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}

/* ─────────────────────────── Barre de filtres ──────────────────────────────── */

export interface CatalogueFiltersProps {
  categories: CategoryItem[];
  /** Nombre de résultats affichés (compteur temps réel) */
  total: number;
}

/**
 * Filtres du catalogue — l'URL est la source de vérité (partageable, back/forward OK).
 * Recherche debouncée 300 ms, pills animées (indicateur dégradé glissant),
 * rangées défilantes horizontalement sur mobile.
 */
export function CatalogueFilters({ categories, total }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  /* État actif — lu depuis l'URL */
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const level = searchParams.get("level") ?? "";
  const price = searchParams.get("price") ?? "";
  const sort = searchParams.get("sort") ?? "popular";

  const [search, setSearch] = React.useState(q);
  /** Dernière valeur `q` poussée par ce composant — évite d'écraser la frappe en cours */
  const lastPushed = React.useRef(q);
  /** Paramètres en attente de commit — permet d'empiler plusieurs filtres
   *  cliqués rapidement (réseau lent) sans qu'un replace n'écrase l'autre. */
  const pendingParams = React.useRef<URLSearchParams | null>(null);

  /* À chaque commit de navigation, l'URL redevient la source de vérité */
  React.useEffect(() => {
    pendingParams.current = null;
  }, [searchParams]);

  /** Met à jour l'URL en conservant les autres filtres (null/"" ⇒ suppression). */
  const apply = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params =
        pendingParams.current ?? new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      pendingParams.current = params;
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  /* Sync externe (navigation back/forward) — sans écraser la frappe en cours */
  React.useEffect(() => {
    if (q !== lastPushed.current) {
      lastPushed.current = q;
      setSearch(q);
    }
  }, [q]);

  /* Recherche debouncée : 300 ms après la dernière frappe */
  React.useEffect(() => {
    const next = search.trim();
    if (next === lastPushed.current) return;
    if (next === q) {
      lastPushed.current = q;
      return;
    }
    const timer = setTimeout(() => {
      lastPushed.current = next;
      apply({ q: next || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q, apply]);

  const activeCount = [q, category, level, price].filter(Boolean).length;

  const reset = React.useCallback(() => {
    lastPushed.current = "";
    pendingParams.current = new URLSearchParams();
    setSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 sm:p-5">
      {/* Ligne 1 — recherche + tri */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            type="text"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une formation, un sujet, un outil…"
            aria-label="Rechercher une formation"
            className="h-12 pl-11 pr-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="relative md:w-52">
          <ArrowUpDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <select
            value={SORTS.some((s) => s.value === sort) ? sort : "popular"}
            onChange={(e) =>
              apply({ sort: e.target.value === "popular" ? null : e.target.value })
            }
            aria-label="Trier les formations"
            className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-navy/15 bg-surface-primary pl-11 pr-9 text-sm font-medium text-navy transition-all duration-200 focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      {/* Ligne 2 — catégories (défilement horizontal mobile) */}
      <div className={cn("-mx-4 mt-4 px-4 pb-1 sm:-mx-5 sm:px-5", scrollRow)}>
        <div className="flex w-max items-center gap-2">
          <Pill
            chip
            layoutId="catalogue-pill-categorie"
            active={!category}
            onClick={() => apply({ category: null })}
          >
            Toutes
          </Pill>
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <Pill
                chip
                key={c.id}
                layoutId="catalogue-pill-categorie"
                active={active}
                onClick={() => apply({ category: active ? null : c.slug })}
              >
                <Icon name={c.icon ?? "sparkles"} size={14} />
                {c.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-bold leading-4",
                    active ? "bg-white/25 text-white" : "bg-navy/[0.06] text-text-muted",
                  )}
                >
                  {c.courseCount}
                </span>
              </Pill>
            );
          })}
        </div>
      </div>

      {/* Ligne 3 — niveau, prix, compteur + réinitialisation */}
      <div className="mt-4 flex flex-col gap-3 border-t border-navy/[0.06] pt-4 lg:flex-row lg:items-center">
        <div className={cn("-mx-4 flex items-center gap-5 px-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0", scrollRow)}>
          {/* Niveau */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Niveau
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-full border border-navy/[0.08] bg-surface-secondary p-1">
              <Pill
                layoutId="catalogue-pill-niveau"
                active={!level}
                onClick={() => apply({ level: null })}
              >
                Tous
              </Pill>
              {LEVELS.map((l) => (
                <Pill
                  key={l}
                  layoutId="catalogue-pill-niveau"
                  active={level === l}
                  onClick={() => apply({ level: level === l ? null : l })}
                >
                  {levelLabel(l)}
                </Pill>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Prix
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-full border border-navy/[0.08] bg-surface-secondary p-1">
              <Pill
                layoutId="catalogue-pill-prix"
                active={!price}
                onClick={() => apply({ price: null })}
              >
                Tous
              </Pill>
              {PRICES.map((p) => (
                <Pill
                  key={p.value}
                  layoutId="catalogue-pill-prix"
                  active={price === p.value}
                  onClick={() => apply({ price: price === p.value ? null : p.value })}
                >
                  {p.label}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 lg:ml-auto">
          <p className="text-sm font-medium text-text-secondary" aria-live="polite">
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue-vif opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-da" />
                </span>
                Recherche…
              </span>
            ) : total === 0 ? (
              "Aucun résultat"
            ) : (
              `${total} formation${total > 1 ? "s" : ""}`
            )}
          </p>

          {activeCount > 0 && (
            <motion.button
              type="button"
              onClick={reset}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/60"
            >
              <RotateCcw size={13} aria-hidden />
              Réinitialiser
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-da px-1 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

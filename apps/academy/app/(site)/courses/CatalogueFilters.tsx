"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
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

/* ─────────────────────── Segment compact (niveau / prix) ────────────────────── */

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50",
        active
          ? "bg-gradient-da text-white shadow-brand"
          : "border border-navy/10 bg-surface-primary text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
      )}
    >
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
      {children}
    </span>
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
 * Desktop : barre de filtres horizontale EN HAUT (recherche, tri, catégories,
 * niveau, prix). Mobile : recherche + bouton « Filtres » ouvrant un tiroir dédié.
 */
export function CatalogueFilters({ categories, total }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  /* État actif — lu depuis l'URL */
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const level = searchParams.get("level") ?? "";
  const price = searchParams.get("price") ?? "";
  const sort = searchParams.get("sort") ?? "popular";

  const [search, setSearch] = React.useState(q);
  const lastPushed = React.useRef(q);
  const pendingParams = React.useRef<URLSearchParams | null>(null);

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

  /* Verrouille le défilement de l'arrière-plan quand le tiroir est ouvert */
  React.useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const activeCount = [q, category, level, price].filter(Boolean).length;

  const reset = React.useCallback(() => {
    lastPushed.current = "";
    pendingParams.current = new URLSearchParams();
    setSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  /* ── Champ de recherche (réutilisé desktop + mobile) ── */
  const searchField = (
    <div className="relative">
      <Search
        size={18}
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <Input
        type="text"
        enterKeyHint="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une formation, un sujet, un outil…"
        aria-label="Rechercher une formation"
        className="h-11 pl-10 pr-10"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          aria-label="Effacer la recherche"
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );

  /* ── Sélecteur de tri (réutilisé) ── */
  const sortControl = (
    <div className="relative">
      <ArrowUpDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <select
        value={SORTS.some((s) => s.value === sort) ? sort : "popular"}
        onChange={(e) => apply({ sort: e.target.value === "popular" ? null : e.target.value })}
        aria-label="Trier les formations"
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-navy/15 bg-surface-primary pl-10 pr-9 text-sm font-medium text-navy transition-colors focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
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
  );

  const resetChip = (
    <button
      type="button"
      onClick={reset}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50"
    >
      <RotateCcw size={13} aria-hidden />
      Réinitialiser
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-da px-1 text-[11px] font-bold text-white">
        {activeCount}
      </span>
    </button>
  );

  const resultCount = (
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
  );

  /* ── Niveau + prix (réutilisés) ── */
  const levelGroup = (
    <div className="flex flex-wrap items-center gap-2.5">
      <GroupLabel>Niveau</GroupLabel>
      <div className="flex flex-wrap gap-2">
        <Segment active={!level} onClick={() => apply({ level: null })}>
          Tous
        </Segment>
        {LEVELS.map((l) => (
          <Segment key={l} active={level === l} onClick={() => apply({ level: level === l ? null : l })}>
            {levelLabel(l)}
          </Segment>
        ))}
      </div>
    </div>
  );

  const priceGroup = (
    <div className="flex flex-wrap items-center gap-2.5">
      <GroupLabel>Prix</GroupLabel>
      <div className="flex flex-wrap gap-2">
        <Segment active={!price} onClick={() => apply({ price: null })}>
          Tous
        </Segment>
        {PRICES.map((p) => (
          <Segment
            key={p.value}
            active={price === p.value}
            onClick={() => apply({ price: price === p.value ? null : p.value })}
          >
            {p.label}
          </Segment>
        ))}
      </div>
    </div>
  );

  /* ── Sections verticales (tiroir mobile uniquement) ── */
  const mobileSections = (
    <div className="space-y-5">
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Trier par
        </p>
        {sortControl}
      </div>
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Catégories
        </p>
        <div className="space-y-1">
          <CategoryRow active={!category} label="Toutes les formations" count={total} onClick={() => apply({ category: null })} />
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              active={category === c.slug}
              label={c.name}
              count={c.courseCount}
              icon={c.icon ?? "sparkles"}
              onClick={() => apply({ category: category === c.slug ? null : c.slug })}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Niveau</p>
        <div className="flex flex-wrap gap-2">
          <Segment active={!level} onClick={() => apply({ level: null })}>
            Tous
          </Segment>
          {LEVELS.map((l) => (
            <Segment key={l} active={level === l} onClick={() => apply({ level: level === l ? null : l })}>
              {levelLabel(l)}
            </Segment>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Prix</p>
        <div className="flex flex-wrap gap-2">
          <Segment active={!price} onClick={() => apply({ price: null })}>
            Tous
          </Segment>
          {PRICES.map((p) => (
            <Segment
              key={p.value}
              active={price === p.value}
              onClick={() => apply({ price: price === p.value ? null : p.value })}
            >
              {p.label}
            </Segment>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ═══════════════ Desktop : barre horizontale EN HAUT ═══════════════ */}
      <div className="mb-8 hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 lg:block">
        {/* Recherche + tri */}
        <div className="flex items-center gap-3">
          <div className="flex-1">{searchField}</div>
          <div className="w-56 shrink-0">{sortControl}</div>
        </div>

        {/* Catégories (chips, retour à la ligne) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <CategoryChip active={!category} label="Toutes" count={total} onClick={() => apply({ category: null })} />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={category === c.slug}
              label={c.name}
              count={c.courseCount}
              icon={c.icon ?? "sparkles"}
              onClick={() => apply({ category: category === c.slug ? null : c.slug })}
            />
          ))}
        </div>

        {/* Niveau + prix + compteur + reset */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-navy/[0.06] pt-4">
          {levelGroup}
          {priceGroup}
          <div className="ml-auto flex items-center gap-4">
            {resultCount}
            {activeCount > 0 && resetChip}
          </div>
        </div>
      </div>

      {/* ═══════════════ Mobile : recherche + bouton Filtres ═══════════════ */}
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <div className="flex-1">{searchField}</div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-navy/15 bg-surface-primary px-4 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/50"
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filtres
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-da px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════ Mobile : tiroir de filtres ═══════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              key="filter-scrim"
              type="button"
              aria-label="Fermer les filtres"
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[90] bg-navy/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="filter-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="fixed inset-y-0 left-0 z-[95] flex w-[86%] max-w-sm flex-col bg-surface-primary shadow-2xl lg:hidden"
              role="dialog"
              aria-label="Filtres du catalogue"
            >
              <div className="flex items-center justify-between border-b border-navy/[0.08] px-5 py-4">
                <div className="flex items-center gap-2 text-navy">
                  <SlidersHorizontal size={18} className="text-brand-blue-royal" aria-hidden />
                  <h2 className="font-display text-base font-bold">Filtrer</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer"
                  className="grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">{mobileSections}</div>

              <div className="flex items-center gap-3 border-t border-navy/[0.08] px-5 py-4">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/50"
                  >
                    <RotateCcw size={15} aria-hidden />
                    Réinitialiser
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-da px-4 py-2.5 text-center text-sm font-bold text-white shadow-brand"
                >
                  {total === 0 ? "Aucun résultat" : `Voir ${total} formation${total > 1 ? "s" : ""}`}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────── Chip catégorie (desktop, horizontal) ───────────────── */

function CategoryChip({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50",
        active
          ? "border-transparent bg-gradient-da text-white shadow-brand"
          : "border-navy/10 bg-surface-primary text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-px text-[10px] font-bold leading-4",
          active ? "bg-white/25 text-white" : "bg-navy/[0.06] text-text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────── Ligne catégorie (tiroir mobile) ────────────────────── */

function CategoryRow({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/50",
        active
          ? "bg-gradient-da text-white shadow-brand"
          : "text-text-secondary hover:bg-navy/[0.04] hover:text-navy",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-white/20 text-white" : "bg-navy/[0.05] text-brand-blue-royal group-hover:bg-navy/[0.08]",
        )}
      >
        {icon ? <Icon name={icon} size={15} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-4",
          active ? "bg-white/25 text-white" : "bg-navy/[0.06] text-text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

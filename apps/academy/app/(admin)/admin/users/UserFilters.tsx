"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, type SelectOption } from "@/components/Select";
import { toneColor, USER_ROLE } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Recherche avancée des utilisateurs : champ texte (nom/email, debounce → URL,
   consommé par getAdminUsers côté serveur) + filtres <Select> rôle / statut de
   compte / vérification email. 100 % piloté par l'URL (searchParams) ; ce
   composant n'affiche jamais de liste — il pilote seulement les paramètres.
   ══════════════════════════════════════════════════════════════════════════ */

const ROLE_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les rôles" },
  ...(["LEARNER", "CLIENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const).map((r) => ({
    value: r,
    label: USER_ROLE[r].label,
    dotColor: toneColor(USER_ROLE[r].tone),
  })),
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les comptes" },
  { value: "active", label: "Actifs", dotColor: "#059669" },
  { value: "suspended", label: "Suspendus", dotColor: "#dc2626" },
];

const VERIFIED_OPTIONS: SelectOption[] = [
  { value: "", label: "Vérification : tous" },
  { value: "yes", label: "Email vérifié", dotColor: "#059669" },
  { value: "no", label: "Non vérifié", dotColor: "#9ca3af" },
];

export type UserFilterState = {
  q: string;
  role: string;
  status: string;
  verified: string;
};

export function UserFilters({
  filters,
  resultCount,
}: {
  filters: UserFilterState;
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const [q, setQ] = React.useState(filters.q);
  const firstRender = React.useRef(true);

  // Pousse une valeur de filtre dans l'URL (searchParams), sans scroll.
  const pushParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `/admin/users?${qs}` : "/admin/users", { scroll: false });
    },
    [router, searchParams],
  );

  // Recherche texte : debounce 300 ms → URL.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if (q.trim() !== filters.q) pushParam("q", q.trim());
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Resynchronise le champ si l'URL change (ex. clic KPI, reset).
  React.useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  const hasActiveFilter =
    !!filters.q || !!filters.role || !!filters.status || !!filters.verified;

  function resetAll() {
    setQ("");
    router.replace("/admin/users", { scroll: false });
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            aria-label="Rechercher un utilisateur par nom ou email"
            className="h-11 w-full rounded-xl border border-navy/[0.1] bg-surface-primary pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/25"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
          <Select
            value={filters.role || ""}
            onChange={(v) => pushParam("role", v)}
            options={ROLE_OPTIONS}
            placeholder="Rôle"
            ariaLabel="Filtrer par rôle"
            className="lg:w-44"
          />
          <Select
            value={filters.status || ""}
            onChange={(v) => pushParam("status", v)}
            options={STATUS_OPTIONS}
            placeholder="Statut du compte"
            ariaLabel="Filtrer par statut du compte"
            className="lg:w-44"
          />
          <Select
            value={filters.verified || ""}
            onChange={(v) => pushParam("verified", v)}
            options={VERIFIED_OPTIONS}
            placeholder="Vérification email"
            ariaLabel="Filtrer par vérification email"
            className="lg:w-48"
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
            className="mt-4 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <SlidersHorizontal size={14} className="text-brand-blue-royal" />
              <span className="font-medium">
                {resultCount} utilisateur{resultCount > 1 ? "s" : ""} correspondant
                {resultCount > 1 ? "s" : ""}
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
    </div>
  );
}

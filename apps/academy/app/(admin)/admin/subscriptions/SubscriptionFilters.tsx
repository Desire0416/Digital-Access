"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, type SelectOption } from "@/components/Select";
import { toneColor, SUBSCRIPTION_STATUS, SUBSCRIPTION_PLAN } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Filtres des abonnements : recherche par abonné (nom/email, debounce → URL) +
   <Select> statut / formule. 100 % piloté par l'URL (searchParams), consommé
   côté serveur. N'affiche jamais la liste — pilote seulement les paramètres.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les statuts" },
  ...(["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const).map((s) => ({
    value: s,
    label: SUBSCRIPTION_STATUS[s].label,
    dotColor: toneColor(SUBSCRIPTION_STATUS[s].tone),
  })),
];

const PLAN_OPTIONS: SelectOption[] = [
  { value: "", label: "Toutes les formules" },
  ...(["MONTHLY", "YEARLY"] as const).map((p) => ({
    value: p,
    label: SUBSCRIPTION_PLAN[p],
    dotColor: p === "YEARLY" ? "#5b3fa8" : "#2b5cc6",
  })),
];

export type SubscriptionFilterState = {
  q: string;
  status: string;
  plan: string;
};

export function SubscriptionFilters({
  filters,
  resultCount,
}: {
  filters: SubscriptionFilterState;
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
      router.replace(qs ? `/admin/subscriptions?${qs}` : "/admin/subscriptions", {
        scroll: false,
      });
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

  const hasActiveFilter = !!filters.q || !!filters.status || !!filters.plan;

  function resetAll() {
    setQ("");
    router.replace("/admin/subscriptions", { scroll: false });
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
            placeholder="Rechercher un abonné (nom ou email)…"
            aria-label="Rechercher un abonné par nom ou email"
            className="h-11 w-full rounded-xl border border-navy/[0.1] bg-surface-primary pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/25"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:items-center">
          <Select
            value={filters.status || ""}
            onChange={(v) => pushParam("status", v)}
            options={STATUS_OPTIONS}
            placeholder="Statut"
            ariaLabel="Filtrer par statut d'abonnement"
            className="lg:w-48"
          />
          <Select
            value={filters.plan || ""}
            onChange={(v) => pushParam("plan", v)}
            options={PLAN_OPTIONS}
            placeholder="Formule"
            ariaLabel="Filtrer par formule d'abonnement"
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
                {resultCount} abonnement{resultCount > 1 ? "s" : ""} correspondant
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
